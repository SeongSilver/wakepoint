import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useAlarmStore } from '@/store/alarmStore';
import { Alarm } from '@/types';

export function useFriendAlarmListener() {
  const profile = useUserStore((s) => s.profile);
  const addAlarm = useAlarmStore((s) => s.addAlarm);
  const updateAlarm = useAlarmStore((s) => s.updateAlarm);
  const removeAlarm = useAlarmStore((s) => s.removeAlarm);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`friend-alarms-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarms',
          filter: `owner_id=eq.${profile.id}`,
        },
        (payload) => {
          const alarm = payload.new as Alarm;
          // 친구가 대신 설정한 알람만 추가 (내가 직접 저장하면 store에 이미 추가됨)
          if (alarm.created_by !== profile.id) {
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
          filter: `owner_id=eq.${profile.id}`,
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
          filter: `owner_id=eq.${profile.id}`,
        },
        (payload) => {
          const id = (payload.old as Record<string, string>).id;
          if (id) removeAlarm(id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, addAlarm, updateAlarm, removeAlarm]);
}
