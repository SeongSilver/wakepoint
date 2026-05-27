import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm } from '@/types';

type RealtimeChannel = ReturnType<typeof supabase.channel>;

export function useFriendAlarmListener() {
  const profile = useUserStore((s) => s.profile);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const userId = profile.id;

    const startSubscription = () => {
      if (channelRef.current) return;

      channelRef.current = supabase
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
            const alarm = payload.new as Alarm;
            // 친구가 대신 설정한 알람만 추가 (내가 직접 저장하면 store에 이미 있음)
            if (alarm.created_by !== userId) {
              addAlarm(alarm);
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'alarms',
            filter: `owner_id=eq.${userId}`,
          },
          (payload) => {
            const alarm = payload.new as Alarm;
            updateAlarm(alarm.id, alarm);
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'alarms',
            filter: `owner_id=eq.${userId}`,
          },
          (payload) => {
            const id = (payload.old as Record<string, string>).id;
            if (id) removeAlarm(id);
          },
        )
        .subscribe();
    };

    const stopSubscription = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    // 포그라운드 상태면 즉시 구독
    if (AppState.currentState === 'active') {
      startSubscription();
    }

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        startSubscription();
      } else {
        stopSubscription();
      }
    });

    return () => {
      appStateSub.remove();
      stopSubscription();
    };
  }, [profile?.id, addAlarm, updateAlarm, removeAlarm]);
}
