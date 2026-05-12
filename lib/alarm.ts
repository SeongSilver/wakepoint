import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alarm } from '@/types';
import { supabase } from '@/lib/supabase';
import { formatDistance } from '@/lib/location';

const ALARM_CHANNEL_ID = 'wakepoint-alarm';

/** 앱 최상단(RootLayout)에서 한 번 호출 */
export async function initNotifications() {
  // Android 알림 채널 생성
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'WakePoint 알람',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/** 반경 진입 시 즉시 알림 발송 */
export async function triggerAlarm(alarm: Alarm) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📍 목적지 근처입니다!',
      body: `"${alarm.label}" — ${formatDistance(alarm.radius_km)} 이내 도착했어요. 준비하세요!`,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: ALARM_CHANNEL_ID }),
    },
    trigger: null,
  });
}

/** FCM 푸시 토큰 발급 후 Supabase에 저장 */
export async function registerPushToken(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.error('[registerPushToken] EAS projectId가 app.json에 설정되지 않았습니다.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await supabase
    .from('user_profiles')
    .update({ push_token: token })
    .eq('id', userId);
}
