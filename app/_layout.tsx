// 백그라운드 태스크 정의는 반드시 앱 진입점 최상단에서 import해야 한다.
// React 컴포넌트보다 먼저 TaskManager.defineTask()가 실행되어야 등록된다.
import '@/tasks/locationTask';

import '../global.css';
import { initializeKakaoSDK } from '@react-native-kakao/core';

initializeKakaoSDK(process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '');
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { initNotifications } from '@/lib/alarm';
import { registerPushToken, setupPushListeners } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useTrackingSync } from '@/hooks/useTrackingSync';
import { useFriendAlarmListener } from '@/hooks/useFriendAlarmListener';

// Kakao SDK의 androidExecutionParams는 경로 없는 dawasseo://?from=xxx 형태를 생성한다.
// Expo Router는 이를 root로 라우팅하므로, /invite 로 수동 전달하기 위해 직접 파싱한다.
function parseInviteFrom(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const from = parsed.queryParams?.from;
    if (from && typeof from === 'string' && !parsed.path) return from;
  } catch {}
  return null;
}

// 로그인 전에 도착한 초대 딥링크를 보관해 SIGNED_IN 이벤트 후 /invite로 이동
let pendingInviteFrom: string | null = null;

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

    // Warm-start: 앱 실행 중에 Kakao 초대 링크 수신
    const urlSub = Linking.addEventListener('url', ({ url }) => {
      const from = parseInviteFrom(url);
      if (from) router.push({ pathname: '/invite', params: { from } });
    });

    const timeout = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 5000);

    // Cold-start: 앱 실행 시 초기 URL 확인 후 세션 체크
    Linking.getInitialURL()
      .then((initialUrl) => {
        const inviteFrom = initialUrl ? parseInviteFrom(initialUrl) : null;

        return supabase.auth.getSession().then(({ data: { session } }) => {
          clearTimeout(timeout);
          if (session) {
            registerPushToken(session.user.id);
            cleanupPushListeners = setupPushListeners(session.user.id);
            if (inviteFrom) {
              router.replace({ pathname: '/invite', params: { from: inviteFrom } });
            } else {
              router.replace('/(tabs)');
            }
          } else {
            if (inviteFrom) pendingInviteFrom = inviteFrom; // 로그인 완료 후 처리
            router.replace('/(auth)/login');
          }
        });
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
          if (pendingInviteFrom) {
            const from = pendingInviteFrom;
            pendingInviteFrom = null;
            router.replace({ pathname: '/invite', params: { from } });
            return;
          }
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
      urlSub.remove();
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
        <Stack.Screen name="terms" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
