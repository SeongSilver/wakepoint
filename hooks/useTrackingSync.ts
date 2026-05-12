import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAlarmStore } from '@/store/alarmStore';
import { useLocation } from '@/hooks/useLocation';

/**
 * 알람 스토어 변화를 감지해 위치 추적을 자동 시작/중단한다.
 * - 첫 번째 알람 추가 → startTracking()
 * - 모든 알람 삭제 → stopTracking()
 * RootLayout에서 한 번만 마운트한다.
 */
export function useTrackingSync() {
  const { startTracking, stopTracking } = useLocation();
  const activeAlarms = useAlarmStore((s) => s.activeAlarms);
  const prevCountRef = useRef(activeAlarms.length);

  // 앱 재시작 시 퍼시스트된 알람이 있으면 즉시 추적 재개
  useEffect(() => {
    if (activeAlarms.length > 0) {
      startTracking().catch((err: Error) => {
        Alert.alert('위치 권한 필요', err.message, [{ text: '확인' }]);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = activeAlarms.length;
    prevCountRef.current = curr;

    if (curr > 0 && prev === 0) {
      // 알람이 0 → 1개 이상: 추적 시작
      startTracking().catch((err: Error) => {
        Alert.alert(
          '위치 권한 필요',
          err.message,
          [{ text: '확인' }]
        );
      });
    } else if (curr === 0 && prev > 0) {
      // 알람이 1개 이상 → 0개: 추적 중단
      stopTracking().catch((err: Error) => {
        console.error('[TrackingSync] stopTracking error:', err.message);
      });
    }
  }, [activeAlarms.length, startTracking, stopTracking]);
}
