import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { FcmPayload } from '@/types';

// 에뮬레이터/시뮬레이터는 executionEnvironment가 'storeClient'(Expo Go) 또는 'standalone'
// isDevice가 없으므로 getExpoPushTokenAsync의 에러로 gracefully 처리
async function persistToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ push_token: token })
    .eq('id', userId);
  if (error) console.error('[persistToken]', error.message);
}

/**
 * Expo Push Token 발급 후 user_profiles.push_token에 저장.
 * 시뮬레이터·에뮬레이터에서 getExpoPushTokenAsync가 실패해도 catch로 처리된다.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const { status: current } = await Notifications.getPermissionsAsync();
    const finalStatus =
      current === 'granted'
        ? current
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) {
      console.error('[registerPushToken] EAS projectId가 app.config.js에 없습니다.');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await persistToken(userId, token);
  } catch (err) {
    // 시뮬레이터·에뮬레이터에서는 정상적으로 실패 — 무시
    console.error('[registerPushToken]', err);
  }
}

/**
 * 푸시 알림 리스너를 등록한다.
 * - FCM 디바이스 토큰 갱신 시 Expo Push Token 재발급 후 DB 반영
 * - 알림 탭 시 홈 탭으로 이동
 * RootLayout useEffect에서 호출하고 반환값을 cleanup으로 사용한다.
 */
export function setupPushListeners(userId: string): () => void {
  // FCM 네이티브 토큰 갱신(재설치·토큰 만료) 시 Expo Push Token 재발급
  const tokenSub = Notifications.addPushTokenListener(() => {
    registerPushToken(userId).catch(() => {});
  });

  // 백그라운드·종료 상태에서 알림을 탭하면 홈 탭으로 이동
  const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
    router.push('/(tabs)');
  });

  return () => {
    tokenSub.remove();
    responseSub.remove();
  };
}

/**
 * Supabase Edge Function을 경유해 대상 기기에 FCM 푸시 알림을 발송한다.
 * FCM 서버 키는 Edge Function에만 보관되어 클라이언트에 노출되지 않는다.
 */
export async function sendFcmToUser(targetPushToken: string, payload: FcmPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-push', {
      body: {
        token: targetPushToken,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
    });
    if (error) console.error('[sendFcmToUser]', error.message);
  } catch (err) {
    console.error('[sendFcmToUser]', err);
  }
}
