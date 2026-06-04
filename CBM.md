# CBM — Codebase Map (다왔어)
> 파일 직접 읽기 대신 이 파일로 탐색. 변경 시 갱신 필요.

---

## 파일 색인

### app/ — 화면 라우팅

| 파일 | 주요 Export | 역할 |
|------|-------------|------|
| `_layout.tsx` | `RootLayout`, `TrackingSync`, `FriendAlarmSync` | 루트 스택·인증 감시·딥링크·FCM 초기화 |
| `(auth)/login.tsx` | `LoginScreen` | 이메일·Google·카카오 로그인 |
| `(auth)/signup.tsx` | `SignupScreen` | 회원가입 + 유효성 검사 |
| `(tabs)/_layout.tsx` | `TabsLayout` | 탭 네비게이션 (지도·알람·친구·마이페이지) |
| `(tabs)/index.tsx` | `HomeScreen` | 지도 홈·카카오 검색·알람 설정 패널 |
| `(tabs)/alarms.tsx` | `AlarmsScreen`, `AlarmCard` | 알람 목록·울림 배너·권한 요청 수락 |
| `(tabs)/friends.tsx` | `FriendsScreen` | 친구 추가·권한 요청·카카오 초대 |
| `(tabs)/profile.tsx` | `ProfileScreen` | 프로필·약관·로그아웃 |
| `invite.tsx` | `InviteScreen` | 딥링크 초대 자동 친구 추가 |
| `privacy.tsx` | — | 개인정보처리방침 표시 |
| `terms.tsx` | — | 이용약관 표시 |

---

### components/

| 파일 | 주요 Export | 역할 |
|------|-------------|------|
| `ui/TabBar.tsx` | `TabBar`, `TAB_BAR_HEIGHT=80` | 커스텀 하단 탭바 (bg-black, 활성 #2997ff) |
| `ui/AppHeader.tsx` | `AppHeader` | 로고 헤더 (현재 미사용) |

---

### hooks/

| 파일 | 주요 Export | 반환 핵심값 | 역할 |
|------|-------------|------------|------|
| `useAlarm.ts` | `useAlarm()` | activeAlarms, createAlarm, deleteAlarm, fetchAlarms | 알람 CRUD (Supabase) |
| `useAlarmPermissions.ts` | `useAlarmPermissions()` | sentRequests, receivedPending, acceptedFriends, requestPermission, respondToRequest, getSentStatus | 권한 요청·수락·거절 |
| `useFriends.ts` | `useFriends()` | friends, searchResult, fetchFriends, searchByEmail, addFriend, removeFriend, isAlreadyFriend | 친구 관리 |
| `useLocation.ts` | `useLocation()` | isTracking, permission, startTracking, stopTracking | 위치 추적 시작/중단 |
| `useRecording.ts` | `useRecording()` | isRecording, recordingUri, durationSec, startRecording, stopRecording, playPreview, uploadRecording, clearRecording | 음성 녹음·업로드 |
| `useTrackingSync.ts` | `useTrackingSync()` | — | 알람 수 변화 → 추적 자동 시작/중단 |
| `useFriendAlarmListener.ts` | `useFriendAlarmListener()` | — | Supabase Realtime → 친구 알람 스토어 동기화 |

---

### lib/

| 파일 | 주요 Export | 역할 |
|------|-------------|------|
| `supabase.ts` | `supabase` | Supabase 클라이언트 (AsyncStorage 세션) |
| `firebase.ts` | `registerPushToken(userId)`, `setupPushListeners(userId)`, `sendFcmToUser(token, payload)` | Expo Push Token·FCM 발송 (Edge Function 경유) |
| `location.ts` | `calculateDistance(lat1,lon1,lat2,lon2): number`, `formatDistance(km): string`, `validateRadius(km): boolean`, `MIN_RADIUS_KM=0.1`, `MAX_RADIUS_KM=50` | Haversine 거리·포맷·유효성 |
| `alarm.ts` | `initNotifications()`, `triggerAlarm(alarm)` | Android 알림 채널 초기화·푸시 발송 |

---

### store/

| 파일 | 주요 Export | 상태 | 액션 |
|------|-------------|------|------|
| `alarmStore.ts` | `useAlarmStore()` | `activeAlarms: Alarm[]` (퍼시스트), `ringingAlarm: AlarmRingState\|null` | addAlarm, removeAlarm, updateAlarm, clearTriggered, setRingingAlarm |
| `userStore.ts` | `useUserStore()` | `profile: UserProfile\|null` (퍼시스트) | setProfile, updateProfile |

---

### tasks/

| 파일 | 주요 Export | 역할 |
|------|-------------|------|
| `locationTask.ts` | `LOCATION_TASK_NAME='background-location-task'` | 백그라운드 위치 수신 → 반경 비교 → 알람 트리거·중단 |

---

### types/index.ts — 전역 타입

| 타입 | 주요 필드 |
|------|-----------|
| `Alarm` | id, owner_id, created_by, label, target_lat, target_lng, target_address, radius_km, is_active, triggered_at?, sound_type('default'\|'custom'), sound_uri? |
| `AlarmRingState` | id, label, soundType, soundUri? |
| `UserProfile` | id, email, nickname, avatar_url?, push_token?, created_at? |
| `FcmPayload` | title, body, data? |
| `AlarmPermission` | id, requester_id, target_id, status('pending'\|'accepted'\|'rejected') |

---

## 의존성 맵

```
_layout.tsx
  → lib/alarm (initNotifications)
  → lib/firebase (registerPushToken, setupPushListeners)
  → tasks/locationTask (LOCATION_TASK_NAME)
  → hooks/useTrackingSync
  → hooks/useFriendAlarmListener
  → store/userStore

(tabs)/index.tsx
  → react-native-maps (MapView, Marker, Circle, Callout)
  → expo-location (reverseGeocodeAsync)
  → lib/supabase · lib/firebase · lib/location
  → hooks/useRecording · hooks/useAlarmPermissions
  → store/alarmStore · store/userStore

(tabs)/alarms.tsx
  → expo-av (Audio.Sound — 커스텀 알람음 재생)
  → expo-haptics
  → hooks/useAlarmPermissions
  → store/alarmStore · store/userStore

(tabs)/friends.tsx
  → @react-native-kakao/share (shareTextTemplate)
  → hooks/useFriends · hooks/useAlarmPermissions
  → store/userStore

tasks/locationTask.ts
  → expo-task-manager · expo-location
  → lib/location (calculateDistance)
  → lib/alarm (triggerAlarm)
  → lib/supabase
  → store/alarmStore

hooks/useLocation.ts
  → expo-location
  → tasks/locationTask (LOCATION_TASK_NAME)
  → store/alarmStore (Expo Go 폴백)

hooks/useTrackingSync.ts
  → hooks/useLocation
  → store/alarmStore

hooks/useFriendAlarmListener.ts
  → lib/supabase (Realtime)
  → store/alarmStore
```

---

## 핵심 데이터 흐름

```
알람 생성
  index.tsx → supabase.alarms INSERT → alarmStore.addAlarm()
  친구 알람 시 → lib/firebase.sendFcmToUser()
              → useFriendAlarmListener INSERT 이벤트 → alarmStore.addAlarm()

위치 추적
  alarmStore.activeAlarms 변화
  → useTrackingSync → useLocation.startTracking()
  → startLocationUpdatesAsync (30s·100m·Balanced)
  → locationTask 콜백
      → calculateDistance → 반경 진입 감지
      → triggerAlarm() (푸시 알림)
      → AsyncStorage 'wakepoint-ringing' 저장
      → alarmStore.clearTriggered()
      → supabase.alarms UPDATE (is_active=false)
      → 남은 알람 0 → stopLocationUpdatesAsync()

울리는 알람 복원
  alarms.tsx AppState 'active'
  → AsyncStorage 'wakepoint-ringing' 조회
  → alarmStore.setRingingAlarm()
  → 커스텀 음성 시 Audio.Sound 루프 재생

권한 요청 흐름
  friends.tsx → useAlarmPermissions.requestPermission()
  → supabase.alarm_permissions INSERT
  → lib/firebase.sendFcmToUser (상대방에게 FCM)
  → 상대방 수락 → alarm_permissions UPDATE (accepted)
  → index.tsx 친구 알람 탭에 표시
```

---

## AsyncStorage 키

| 키 | 값 타입 | 관리 위치 |
|----|---------|-----------|
| `wakepoint-ringing` | `AlarmRingState \| null` | locationTask.ts 저장 / alarms.tsx 조회 |
| `alarm-store` | Zustand persist (activeAlarms) | alarmStore.ts |
| `user-store` | Zustand persist (profile) | userStore.ts |

---

## 환경 변수 키

```
EXPO_PUBLIC_SUPABASE_URL · EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
EXPO_PUBLIC_KAKAO_REST_API_KEY · EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
FIREBASE_PROJECT_ID · EAS_PROJECT_ID · EXPO_TOKEN
```
