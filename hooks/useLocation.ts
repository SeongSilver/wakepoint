import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { LOCATION_TASK_NAME } from '@/tasks/locationTask';
import { calculateDistance } from '@/lib/location';
import { triggerAlarm } from '@/lib/alarm';
import { useAlarmStore } from '@/store/alarmStore';

export type LocationPermission = 'unknown' | 'granted' | 'denied';

// Expo Go는 expo-task-manager 백그라운드 태스크 미지원
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export function useLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [permission, setPermission] = useState<LocationPermission>('unknown');
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  // 5초 간격으로 추적 상태 동기화 (백그라운드 태스크 전용)
  useEffect(() => {
    if (IS_EXPO_GO) return;

    let mounted = true;
    const sync = async () => {
      try {
        const tracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (mounted) setIsTracking((prev) => (prev === tracking ? prev : tracking));
      } catch {
        if (mounted) setIsTracking((prev) => (prev ? false : prev));
      }
    };
    sync();
    const interval = setInterval(sync, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<LocationPermission> => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') {
      setPermission('denied');
      return 'denied';
    }

    if (!IS_EXPO_GO) {
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== 'granted') {
        setPermission('denied');
        return 'denied';
      }
    }

    setPermission('granted');
    return 'granted';
  }, []);

  const startTracking = useCallback(async () => {
    // 포그라운드가 아니면 skip — useTrackingSync의 AppState 리스너가 active 시 재시도
    if (AppState.currentState !== 'active') return;

    if (IS_EXPO_GO) {
      // Expo Go 폴백: foreground-only watchPositionAsync (백그라운드 추적 불가)
      if (watchSubRef.current) {
        setIsTracking(true);
        return;
      }

      const perm = await requestPermissions();
      if (perm !== 'granted') {
        throw new Error('위치 권한이 필요합니다.');
      }

      watchSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 100 },
        async (loc) => {
          const { activeAlarms, clearTriggered } = useAlarmStore.getState();
          if (activeAlarms.length === 0) {
            watchSubRef.current?.remove();
            watchSubRef.current = null;
            setIsTracking(false);
            return;
          }
          for (const alarm of activeAlarms) {
            const dist = calculateDistance(
              loc.coords.latitude,
              loc.coords.longitude,
              alarm.target_lat,
              alarm.target_lng
            );
            if (dist <= alarm.radius_km) {
              clearTriggered(alarm.id);
              await triggerAlarm(alarm);
            }
          }
          if (useAlarmStore.getState().activeAlarms.length === 0) {
            watchSubRef.current?.remove();
            watchSubRef.current = null;
            setIsTracking(false);
          }
        }
      );
      setIsTracking(true);
      return;
    }

    // 프로덕션/개발 빌드: 백그라운드 태스크
    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (already) {
      setIsTracking(true);
      return;
    }

    const perm = await requestPermissions();
    if (perm !== 'granted') {
      throw new Error(
        '백그라운드 위치 권한이 필요합니다.\n설정 > 앱 > WakePoint > 위치에서 "항상 허용"을 선택해주세요.'
      );
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30_000,
      distanceInterval: 100,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: '다왔어 실행 중',
        notificationBody: '목적지 도착 알림을 모니터링 중입니다',
        notificationColor: '#0066cc',
      },
    });
    setIsTracking(true);
  }, [requestPermissions]);

  const stopTracking = useCallback(async () => {
    try {
      if (IS_EXPO_GO) {
        watchSubRef.current?.remove();
        watchSubRef.current = null;
        return;
      }
      const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (running) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } finally {
      setIsTracking(false);
    }
  }, []);

  return { isTracking, permission, requestPermissions, startTracking, stopTracking };
}
