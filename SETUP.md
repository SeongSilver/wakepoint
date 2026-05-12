# SETUP.md — WakePoint 초기 세팅 가이드

Claude Code에서 프로젝트를 처음 시작할 때 이 순서대로 진행한다.

---

## 1. Expo 프로젝트 생성

```bash
npx create-expo-app wakepoint --template blank-typescript
cd wakepoint
```

---

## 2. 필수 패키지 설치

```bash
# 위치 추적
npx expo install expo-location expo-task-manager

# 알림
npx expo install expo-notifications

# 지도
npx expo install react-native-maps

# Supabase
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 상태관리
npm install zustand

# 네비게이션 (Expo Router)
npx expo install expo-router expo-linking expo-constants expo-status-bar

# 스타일 (NativeWind)
npm install nativewind
npm install --save-dev tailwindcss

# 기타 유틸
npm install date-fns
```

---

## 3. app.json 설정

```json
{
  "expo": {
    "name": "WakePoint",
    "slug": "wakepoint",
    "scheme": "wakepoint",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourname.wakepoint",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "목적지 알람을 위해 위치가 필요합니다",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다",
        "NSLocationAlwaysUsageDescription": "앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다",
        "UIBackgroundModes": ["location", "fetch", "remote-notification"]
      }
    },
    "android": {
      "package": "com.yourname.wakepoint",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "앱이 백그라운드에서도 위치를 추적하여 목적지 도착 알람을 울립니다."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4F46E5"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

---

## 4. Tailwind 설정 (NativeWind)

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',    // 인디고
        secondary: '#10B981',  // 에메랄드
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};
```

---

## 5. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. `SCHEMA.md`의 SQL을 Supabase SQL Editor에서 순서대로 실행
3. Authentication → Providers → Google 활성화
4. `.env` 파일 생성:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

---

## 6. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com) 에서 새 프로젝트 생성
2. iOS / Android 앱 추가
3. `google-services.json` (Android), `GoogleService-Info.plist` (iOS) 다운로드 후 루트에 배치
4. FCM 서버 키 → Supabase Edge Function 환경변수에 등록

---

## 7. 디렉토리 초기 구조 생성

```bash
mkdir -p app/{(auth),(tabs)} components/{alarm,map,ui} lib hooks store tasks types supabase/migrations
touch lib/supabase.ts lib/location.ts lib/alarm.ts
touch hooks/useLocation.ts hooks/useAlarm.ts hooks/useFriends.ts
touch store/alarmStore.ts store/userStore.ts
touch tasks/locationTask.ts
touch types/index.ts
```

---

## 8. TypeScript 경로 별칭 설정

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 9. 개발 시작

```bash
# Expo Go로 빠른 테스트
npx expo start

# 실제 위치 기능 테스트는 개발 빌드 필요
npx expo run:ios   # 또는
npx expo run:android
```

> ⚠️ 백그라운드 위치 추적, 알림은 **Expo Go에서 동작하지 않음**.
> 반드시 `expo run:ios` 또는 `expo run:android` 개발 빌드로 테스트.

---

## 체크리스트

- [ ] Expo 프로젝트 생성 완료
- [ ] 모든 패키지 설치 완료
- [ ] app.json 권한 설정 완료
- [ ] Supabase 프로젝트 생성 & 스키마 적용 완료
- [ ] Firebase 프로젝트 생성 완료
- [ ] .env 파일 설정 완료
- [ ] 개발 빌드 실행 확인
