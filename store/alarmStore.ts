import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmRingState } from '@/types';

interface AlarmStore {
  activeAlarms: Alarm[];
  ringingAlarm: AlarmRingState | null;
  addAlarm: (alarm: Alarm) => void;
  removeAlarm: (id: string) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  clearTriggered: (id: string) => void;
  setRingingAlarm: (alarm: AlarmRingState | null) => void;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set) => ({
      activeAlarms: [],
      ringingAlarm: null,
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
      setRingingAlarm: (alarm) => set({ ringingAlarm: alarm }),
    }),
    {
      name: 'alarm-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeAlarms: state.activeAlarms }),
    }
  )
);
