import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '@/tasks/locationTask';

export type LocationPermission = 'unknown' | 'granted' | 'denied';

export function useLocation() {
  const [isTracking, setIsTracking] = useState(false);
  const [permission, setPermission] = useState<LocationPermission>('unknown');

  // 5초 간격으로 추적 상태 동기화 (다른 곳에서 stop됐을 때 반영)
  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      try {
        const tracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (mounted) setIsTracking(tracking);
      } catch {
        if (mounted) setIsTracking(false);
      }
    };

    sync();
    const interval = setInterval(sync, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /** 포그라운드 + 백그라운드 권한 동시 요청 */
  const requestPermissions = useCallback(async (): Promise<LocationPermission> => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') {
      setPermission('denied');
      return 'denied';
    }

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    const result: LocationPermission = bg === 'granted' ? 'granted' : 'denied';
    setPermission(result);
    return result;
  }, []);

  /** 백그라운드 위치 추적 시작 — 이미 실행 중이면 no-op */
  const startTracking = useCallback(async () => {
    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (already) {
      setIsTracking(true);
      return;
    }

    const perm = await requestPermissions();
    if (perm !== 'granted') {
      throw new Error('백그라운드 위치 권한이 필요합니다.\n설정 > 앱 > WakePoint > 위치에서 "항상 허용"을 선택해주세요.');
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30_000,      // 30초마다
      distanceInterval: 50,      // 50m 이동 시
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'WakePoint 실행 중',
        notificationBody: '목적지 도착 알림을 모니터링 중입니다',
        notificationColor: '#4F46E5',
      },
    });

    setIsTracking(true);
  }, [requestPermissions]);

  /** 백그라운드 위치 추적 중단 */
  const stopTracking = useCallback(async () => {
    try {
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
