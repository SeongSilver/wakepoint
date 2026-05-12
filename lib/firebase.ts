// Firebase / FCM 설정 (google-services.json, GoogleService-Info.plist 배치 후 사용)
// expo-notifications로 Expo Push Token을 사용하므로 direct FCM SDK는 선택사항입니다.

export const FCM_SENDER_ID = process.env.FIREBASE_PROJECT_ID ?? '';
