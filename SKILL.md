# SKILL.md — WakePoint 핵심 구현 패턴

Claude Code가 코드를 생성할 때 이 파일의 패턴을 우선 참고한다.

---

## 1. 위치 추적 (expo-location)

### 백그라운드 위치 태스크 등록
```typescript
// tasks/locationTask.ts
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { calculateDistance } from '@/lib/location';
import { triggerAlarm } from '@/lib/alarm';
import { useAlarmStore } from '@/store/alarmStore';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const current = locations[0];

    // 활성 알람 목록 가져와서 거리 체크
    const activeAlarms = useAlarmStore.getState().activeAlarms;

    for (const alarm of activeAlarms) {
      const distance = calculateDistance(
        current.coords.latitude,
        current.coords.longitude,
        alarm.targetLat,
        alarm.targetLng
      );

      if (distance <= alarm.radiusKm) {
        await triggerAlarm(alarm);
      }
    }
  }
});
```

### 위치 권한 요청 & 태스크 시작
```typescript
// hooks/useLocation.ts
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '@/tasks/locationTask';

export function useLocation() {
  const startTracking = async () => {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') throw new Error('위치 권한이 필요합니다');

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    if (background !== 'granted') throw new Error('백그라운드 위치 권한이 필요합니다');

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,       // 30초마다 업데이트
      distanceInterval: 50,      // 50m 이동 시 업데이트
      showsBackgroundLocationIndicator: true,  // iOS 상태바 표시
      foregroundService: {       // Android 포그라운드 서비스
        notificationTitle: 'WakePoint 실행 중',
        notificationBody: '목적지 도착 알림을 모니터링 중입니다',
      },
    });
  };

  const stopTracking = async () => {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  return { startTracking, stopTracking };
}
```

---

## 2. 거리 계산 (Haversine)

```typescript
// lib/location.ts
const EARTH_RADIUS_KM = 6371;

export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// km → 사람이 읽기 좋은 문자열
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}
```

---

## 3. Supabase 클라이언트 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

---

## 4. 알람 스토어 (Zustand)

```typescript
// store/alarmStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '@/types';

interface AlarmStore {
  activeAlarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  removeAlarm: (id: string) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  clearTriggered: (id: string) => void;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set) => ({
      activeAlarms: [],
      addAlarm: (alarm) =>
        set((s) => ({ activeAlarms: [...s.activeAlarms, alarm] })),
      removeAlarm: (id) =>
        set((s) => ({ activeAlarms: s.activeAlarms.filter((a) => a.id !== id) })),
      updateAlarm: (id, updates) =>
        set((s) => ({
          activeAlarms: s.activeAlarms.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      clearTriggered: (id) =>
        set((s) => ({
          activeAlarms: s.activeAlarms.filter((a) => a.id !== id),
        })),
    }),
    { name: 'alarm-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

---

## 5. FCM Push 알림

```typescript
// lib/alarm.ts
import * as Notifications from 'expo-notifications';
import { Alarm } from '@/types';

// 알림 핸들러 초기화 (App 최상단에서 한번 호출)
export function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// 알람 트리거
export async function triggerAlarm(alarm: Alarm) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📍 목적지 근처입니다!',
      body: `"${alarm.label}"까지 ${alarm.radiusKm}km 이내입니다. 준비하세요!`,
      sound: true,
    },
    trigger: null, // 즉시 발송
  });
}

// FCM 토큰 등록 (Supabase에 저장)
export async function registerPushToken(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await supabase
    .from('user_profiles')
    .update({ push_token: token })
    .eq('id', userId);
}
```

---

## 6. 친구 대리 알람 설정 (Supabase Realtime)

```typescript
// hooks/useFriendAlarm.ts
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useAlarmStore } from '@/store/alarmStore';

// 친구가 내 알람을 설정해주는 실시간 수신
export function useFriendAlarmListener(userId: string) {
  const addAlarm = useAlarmStore((s) => s.addAlarm);

  useEffect(() => {
    const channel = supabase
      .channel(`friend-alarms-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarms',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          // 친구가 설정해준 알람 → 로컬 스토어에 추가
          addAlarm(payload.new as Alarm);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}

// 친구 알람 대리 설정 요청 보내기
export async function requestAlarmPermission(fromUserId: string, toUserId: string) {
  const { error } = await supabase.from('alarm_permissions').insert({
    requester_id: fromUserId,
    target_id: toUserId,
    status: 'pending',
  });
  if (error) throw error;
}

// 권한 수락/거절
export async function respondToPermission(permissionId: string, accept: boolean) {
  const { error } = await supabase
    .from('alarm_permissions')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', permissionId);
  if (error) throw error;
}
```

---

## 7. 타입 정의

```typescript
// types/index.ts
export interface Alarm {
  id: string;
  owner_id: string;
  created_by: string;          // 본인 or 친구 userId
  label: string;
  target_lat: number;
  target_lng: number;
  target_address: string;
  radius_km: number;           // 알람 트리거 반경
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  push_token?: string;
}

export interface AlarmPermission {
  id: string;
  requester_id: string;        // 권한 요청한 친구
  target_id: string;           // 권한 부여 대상 (나)
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FriendRelation {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}
```

---

## 8. 배터리 최적화 팁

- `accuracy: Location.Accuracy.Balanced` 사용 (High는 배터리 소모 큼)
- `distanceInterval: 50` — 50m 이동할 때만 업데이트
- 목적지 반경 2배 이상 멀면 업데이트 간격 늘리기
- 알람 트리거 후 즉시 추적 중단

```typescript
// 트리거 후 추적 중단 패턴
if (distance <= alarm.radiusKm) {
  await triggerAlarm(alarm);
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
```
