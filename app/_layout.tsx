// 백그라운드 태스크 정의는 반드시 앱 진입점 최상단에서 import해야 한다.
// React 컴포넌트보다 먼저 TaskManager.defineTask()가 실행되어야 등록된다.
import '@/tasks/locationTask';

import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { initNotifications } from '@/lib/alarm';
import { supabase } from '@/lib/supabase';
import { useTrackingSync } from '@/hooks/useTrackingSync';

function TrackingSync() {
  useTrackingSync();
  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initNotifications();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <TrackingSync />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
