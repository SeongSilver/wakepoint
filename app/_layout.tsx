// 백그라운드 태스크 정의는 반드시 앱 진입점 최상단에서 import해야 한다.
// React 컴포넌트보다 먼저 TaskManager.defineTask()가 실행되어야 등록된다.
import '@/tasks/locationTask';

import '../global.css';
import { initializeKakaoSDK } from '@react-native-kakao/core';

initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '');
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { initNotifications } from '@/lib/alarm';
import { registerPushToken, setupPushListeners } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useTrackingSync } from '@/hooks/useTrackingSync';
import { useFriendAlarmListener } from '@/hooks/useFriendAlarmListener';

function TrackingSync() {
  useTrackingSync();
  return null;
}

function FriendAlarmSync() {
  useFriendAlarmListener();
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initNotifications();

    let cleanupPushListeners: (() => void) | undefined;

    const timeout = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        if (session) {
          registerPushToken(session.user.id);
          cleanupPushListeners = setupPushListeners(session.user.id);
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        router.replace('/(auth)/login');
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (_event === 'SIGNED_IN') {
          registerPushToken(session.user.id);
          cleanupPushListeners?.();
          cleanupPushListeners = setupPushListeners(session.user.id);
        }
        router.replace('/(tabs)');
      } else {
        cleanupPushListeners?.();
        cleanupPushListeners = undefined;
        router.replace('/(auth)/login');
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
      cleanupPushListeners?.();
    };
  }, []);

  return (
    <>
      <TrackingSync />
      <FriendAlarmSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="invite" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}
