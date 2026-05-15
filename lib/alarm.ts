import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Alarm } from '@/types';
import { formatDistance } from '@/lib/location';

const ALARM_CHANNEL_ID = 'wakepoint-alarm';

/** 앱 최상단(RootLayout)에서 한 번 호출 */
export async function initNotifications() {
  // Android 알림 채널 생성
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: '다왔어 알람',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066cc',
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

