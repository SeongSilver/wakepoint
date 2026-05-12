import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types';

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...updates } : null,
        })),
    }),
    { name: 'user-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
