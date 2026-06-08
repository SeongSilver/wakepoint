import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDistance } from '@/lib/location';
import { triggerAlarm } from '@/lib/alarm';
import { useAlarmStore } from '@/store/alarmStore';
import { supabase } from '@/lib/supabase';
import { AlarmRingState } from '@/types';

const RINGING_KEY = 'wakepoint-ringing';

export const LOCATION_TASK_NAME = 'background-location-task';

// 한 세션에서 이미 트리거된 알람 ID — 중복 알림 방지
const triggeredInSession = new Set<string>();

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTask] error:', error.message);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  const current = locations[0];
  if (!current) return;

  // Zustand persist는 AsyncStorage에서 비동기 로드 — hydration 완료까지 최대 2초 대기.
  // 직전 수정의 AsyncStorage fallback 방식은 clearTriggered 호출 시 빈 배열([])을
  // AsyncStorage에 저장해 나머지 알람 전체를 삭제하는 데이터 손상 버그를 유발함.
  if (!useAlarmStore.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      const unsub = useAlarmStore.persist.onFinishHydration(() => {
        clearTimeout(timeout);
        unsub();
        resolve();
      });
    });
  }

  const { activeAlarms, clearTriggered } = useAlarmStore.getState();

  // 활성 알람이 없으면 즉시 추적 중단
  if (activeAlarms.length === 0) {
    await safeStop();
    return;
  }

  // 반경 진입한 알람 필터링 (이미 트리거된 건 제외)
  const inRange = activeAlarms.filter((alarm) => {
    if (triggeredInSession.has(alarm.id)) return false;
    const distanceKm = calculateDistance(
      current.coords.latitude,
      current.coords.longitude,
      alarm.target_lat,
      alarm.target_lng
    );
    return distanceKm <= alarm.radius_km;
  });

  for (const alarm of inRange) {
    triggeredInSession.add(alarm.id);

    // 1. 알림 발송
    await triggerAlarm(alarm);

    // 2. ringing 상태 저장 (포그라운드 감지 + 백그라운드→포그라운드 전환 시 복원)
    const ringState: AlarmRingState = {
      id: alarm.id,
      label: alarm.label,
      soundType: alarm.sound_type ?? 'default',
      soundUri: alarm.sound_uri,
    };
    await AsyncStorage.setItem(RINGING_KEY, JSON.stringify(ringState));
    // 포그라운드 컨텍스트인 경우 스토어 직접 업데이트 (즉시 UI 반영)
    useAlarmStore.getState().setRingingAlarm(ringState);

    // 3. 로컬 스토어에서 제거
    clearTriggered(alarm.id);

    // 4. Supabase 기록 업데이트 (로컬 전용 알람 제외)
    if (!alarm.id.startsWith('local-')) {
      supabase
        .from('alarms')
        .update({
          is_active: false,
          triggered_at: new Date().toISOString(),
        })
        .eq('id', alarm.id)
        .then(({ error: dbErr }) => {
          if (dbErr) console.error('[LocationTask] DB update failed:', dbErr.message);
        })
        .catch((err: unknown) => {
          console.error('[LocationTask] Supabase network error:', err);
        });
    }
  }

  // 남은 활성 알람이 없으면 추적 중단 + 세션 초기화
  const remaining = useAlarmStore.getState().activeAlarms;
  if (remaining.length === 0) {
    triggeredInSession.clear();
    await safeStop();
  }
});

async function safeStop() {
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (running) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (e) {
    console.error('[LocationTask] safeStop error:', e);
  }
}
