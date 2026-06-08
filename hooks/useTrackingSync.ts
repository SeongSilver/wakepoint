import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { useAlarmStore } from '@/store/alarmStore';
import { useLocation } from '@/hooks/useLocation';

/**
 * 알람 스토어 변화를 감지해 위치 추적을 자동 시작/중단한다.
 * - 첫 번째 알람 추가 → startTracking()
 * - 모든 알람 삭제 → stopTracking()
 * - 앱이 foreground로 복귀 시 알람이 있으면 추적 재시도 (AppState guard 보완)
 * RootLayout에서 한 번만 마운트한다.
 */
export function useTrackingSync() {
  const { startTracking, stopTracking } = useLocation();
  const alarmsCount = useAlarmStore((s) => s.activeAlarms.length);
  const prevCountRef = useRef(alarmsCount);
  // closure 없이 최신 알람 수를 AppState 핸들러에서 참조
  const alarmsLengthRef = useRef(alarmsCount);
  alarmsLengthRef.current = alarmsCount;

  // 앱 재시작 시 퍼시스트된 알람이 있으면 추적 재개 시도
  useEffect(() => {
    if (alarmsCount > 0) {
      startTracking().catch((err: Error) => {
        Alert.alert('위치 권한 필요', err.message, [
          { text: '닫기', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ]);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // foreground 복귀 시 추적 재시도 (startTracking 내부 AppState guard 보완)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && alarmsLengthRef.current > 0) {
        startTracking().catch((err: Error) => {
          console.error('[TrackingSync] AppState resume:', err.message);
        });
      }
    });
    return () => sub.remove();
  // startTracking은 useCallback으로 안정적 — 재구독 불필요
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 알람 수 변화에 따른 추적 시작/중단
  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = alarmsCount;
    prevCountRef.current = curr;

    if (curr > 0 && prev === 0) {
      startTracking().catch((err: Error) => {
        Alert.alert('위치 권한 필요', err.message, [
          { text: '닫기', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ]);
      });
    } else if (curr === 0 && prev > 0) {
      stopTracking().catch((err: Error) => {
        console.error('[TrackingSync] stopTracking error:', err.message);
      });
    }
  }, [alarmsCount, startTracking, stopTracking]);
}
