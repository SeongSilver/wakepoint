import { useAlarmStore } from '@/store/alarmStore';
import { supabase } from '@/lib/supabase';
import { Alarm } from '@/types';

export function useAlarm() {
  const { activeAlarms, addAlarm, removeAlarm } = useAlarmStore();

  const createAlarm = async (alarm: Omit<Alarm, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('alarms')
      .insert(alarm)
      .select()
      .single();

    if (error) throw error;
    addAlarm(data as Alarm);
    return data as Alarm;
  };

  const deleteAlarm = async (id: string) => {
    const { error } = await supabase.from('alarms').delete().eq('id', id);
    if (error) throw error;
    removeAlarm(id);
  };

  const fetchAlarms = async (userId: string) => {
    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Alarm[];
  };

  return { activeAlarms, createAlarm, deleteAlarm, fetchAlarms };
}
