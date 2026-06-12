# 다왔어 - Claude Code 프로젝트 설정

위치 기반 알람 앱. 목적지 도착 시 알람, 친구/가족 대리 설정 가능.
페르소나: ① 지하철 잠든 친구 알람 대리 ② 부모-자녀 귀가·이동 케어

---

## 개발 방향

기존 최초 기획은 React Native + Expo 기준이었으나, 신규 구현은 **Android 단일 타겟**으로 전환한다.
개발 환경은 **Android Studio + Kotlin**을 기준으로 하며, Android 네이티브 기능을 우선 사용한다.

- iOS/Web 대응은 현재 범위에서 제외
- UI는 Jetpack Compose 기준
- 백그라운드 위치 추적, 알림, FCM, 카카오 SDK 등은 Android 네이티브 API와 공식 SDK 우선
- 기존 Supabase DB 스키마와 RLS 정책은 최대한 유지

---

## 기술 스택

| 레이어 | 기술 | 기준 |
|--------|------|------|
| 플랫폼 | Android Native | Android Studio |
| 언어 | Kotlin | strict null-safety |
| UI | Jetpack Compose + Material 3 | 단일 Activity |
| 아키텍처 | MVVM + Repository | ViewModel + StateFlow |
| 비동기 | Kotlin Coroutines + Flow | structured concurrency |
| DI | Hilt | Android 공식 권장 |
| 로컬 저장소 | DataStore + Room | 설정/세션은 DataStore, 캐시는 Room |
| 백엔드 | Supabase | Auth·DB·Realtime·Storage |
| 인증 | 이메일 + Google Sign-In + Kakao Login | Supabase Auth 연동 |
| Push | Firebase Cloud Messaging | Android 알림 채널 |
| 위치 | Fused Location Provider + WorkManager/Foreground Service | Balanced Priority |
| 지도/검색 | Google Maps SDK + Kakao Local API | 지도 표시·장소 검색 |
| 카카오 SDK | Kakao Android SDK | 로그인·공유 |
| 녹음/재생 | MediaRecorder + Media3/ExoPlayer | 커스텀 알람음 |
| 네비게이션 | Navigation Compose | typed route 권장 |
| 빌드 | Gradle Kotlin DSL | APK/AAB |

---

## 디렉토리 구조

```text
app/
  build.gradle.kts
  src/main/
    AndroidManifest.xml
    java/com/wakepoint/app/
      MainActivity.kt
      WakepointApplication.kt
      core/
        data/                 # DataStore, Room, common repository helpers
        design/               # Compose theme, colors, typography, components
        location/             # distance calculation, location policy
        notification/         # alarm channel, FCM notification helpers
        supabase/             # Supabase client setup
      feature/
        auth/                 # login, signup
        home/                 # map home, place search, alarm marker
        alarms/               # alarm list, ringing UI
        friends/              # friend management, invite, permission request
        profile/              # profile, terms, privacy
        invite/               # deep link invite handling
      data/
        alarm/                # alarm repository, dto, mapper
        friend/               # friend repository, permission repository
        user/                 # profile repository
        recording/            # recording/upload repository
      domain/
        model/                # Alarm, UserProfile, Friend, AlarmPermission
        usecase/              # create alarm, trigger alarm, request permission
      service/
        LocationTrackingService.kt
        AlarmWorker.kt
        WakepointFirebaseMessagingService.kt
      navigation/
        WakepointNavGraph.kt
supabase/migrations/
docs/
  SCHEMA.md · API.md · DESIGN.md · SETUP.md
```

---

## 개발 현황

✅ **기획 완료** - 위치 기반 알람, 친구/가족 대리 설정, 권한 요청, 커스텀 알람음, 법적 문서, Supabase 스키마 방향 확정.

🔄 **진행 예정**
1. **Android Native 프로젝트 재구성** - Android Studio + Kotlin + Compose 기준으로 패키지 생성
2. **Supabase 연동 이관** - Auth, DB, Realtime, Storage 클라이언트 구성
3. **지도/위치/알람 핵심 플로우 구현** - 지도 홈, 반경 설정, 백그라운드 위치 추적, 알람 트리거
4. **친구/권한/FCM 구현** - 대리 알람 설정, 권한 요청, Realtime 동기화, Push
5. **커스텀 알람음 구현** - 녹음, 기기 파일 선택, Storage 업로드, 반복 재생
6. **실기기 검증** - 발열, 배터리, 백그라운드 제한, Android 권한 정책 확인
7. **위치정보 사업자 신고** - 방송통신위원회/관련 기관 확인 후 출시 전 처리
8. **스토어 배포** - production AAB 생성 및 Google Play 배포

---

## DB 스키마

```text
user_profiles     - id, email, nickname, avatar_url, push_token
alarms            - id, owner_id, created_by, label, target_lat, target_lng,
                    target_address, radius_km, is_active, triggered_at,
                    sound_type('default'|'custom'), sound_uri
friends           - id, user_id, friend_id
alarm_permissions - id, requester_id, target_id, status('pending'|'accepted'|'rejected')
```

전체 스키마·RLS는 `SCHEMA.md` 기준으로 유지한다.

---

## 핵심 데이터 흐름

```text
알람 생성
  HomeScreen
  -> AlarmViewModel.createAlarm()
  -> AlarmRepository.insertAlarm()
  -> Supabase alarms INSERT
  -> local state / Room cache 갱신
  -> 필요 시 FCM 발송

위치 추적
  활성 알람 1개 이상
  -> LocationTrackingService 또는 WorkManager 시작
  -> FusedLocationProviderClient Balanced Priority
  -> calculateDistance()로 반경 진입 확인
  -> AlarmNotificationManager.triggerAlarm()
  -> alarms.is_active=false 업데이트
  -> 남은 활성 알람 0개면 추적 중단

친구 권한 요청
  FriendsScreen
  -> AlarmPermissionRepository.requestPermission()
  -> Supabase alarm_permissions INSERT
  -> FCM 발송
  -> 상대방 수락 시 Realtime 구독으로 상태 갱신

커스텀 알람음
  RecordingScreen / AlarmEditor
  -> MediaRecorder 녹음 또는 Android Photo Picker/SAF 파일 선택
  -> Supabase Storage alarm-sounds 업로드
  -> alarms.sound_type='custom', sound_uri 저장
  -> 알람 트리거 시 Media3/ExoPlayer 반복 재생
```

---

## 디자인 시스템 (DESIGN.md 요약)

```text
Primary    #0066cc   모든 인터랙티브 요소 (유일한 액센트)
Success    #10B981   활성 알람, 수락
Danger     #ef4444   삭제, 오류
Canvas     #ffffff   기본 배경
Parchment  #f5f5f7   섹션 배경, 카드 배경, 입력 필드
Dark Tile  #272729   다크 섹션 (마이페이지 상단 등)
Ink        #1d1d1f   제목, 본문
Tab Bar    #000000   탭바 배경

버튼    -> full rounded shape + pressed scale/alpha
카드    -> 16dp radius + #e0e0e0 border
입력    -> 12dp radius + #f5f5f7 background
검색창  -> full rounded shape
FAB     -> #0066cc, 56dp
탭바    -> #000000, 활성 #2997ff, 비활성 #7a7a7a
마커    -> stroke rgba(0,102,204,0.9), fill rgba(0,102,204,0.15)
```

Compose 구현 시 `core/design`에 색상, 타이포그래피, 공통 컴포넌트를 모은다.

---

## 개발 규칙

### 코드 스타일

- Kotlin null-safety 준수, 불필요한 `!!` 금지
- `Any` 남용 금지, DTO와 Domain Model 분리
- UI는 Compose 함수형 컴포넌트만 사용
- 화면 상태는 `StateFlow` 또는 Compose state로 단방향 관리
- Supabase 쿼리는 Repository에서만 수행
- ViewModel은 UI state와 user action 조율만 담당
- `println`/`Log.d` 남용 금지, 오류는 `Log.e` 또는 Crashlytics 연동
- 문자열은 `strings.xml`로 분리
- 민감 키는 코드에 하드코딩 금지

### 네이밍

| 대상 | 규칙 | 예 |
|------|------|----|
| Compose 화면 | PascalCase + Screen | HomeScreen |
| Compose 컴포넌트 | PascalCase | AlarmCard |
| ViewModel | PascalCase + ViewModel | AlarmViewModel |
| Repository | PascalCase + Repository | AlarmRepository |
| UseCase | Verb/Noun + UseCase | CreateAlarmUseCase |
| Domain Model | PascalCase | Alarm |
| DTO | PascalCase + Dto | AlarmDto |
| 상수 | UPPER_SNAKE_CASE | MIN_RADIUS_KM |

### 위치/알람

- 백그라운드 위치 추적 코드는 `service/LocationTrackingService.kt` 또는 명시된 Worker에서만 관리
- 거리 계산은 `core/location/DistanceCalculator.kt`의 `calculateDistance()`만 사용
- 반경 최솟값 100m / 최댓값 50km
- 위치 정확도는 **Balanced Priority** 기준, High Accuracy 상시 사용 금지
- 활성 알람 0개면 즉시 위치 추적 중단
- 트리거 후 해당 알람 비활성화 + 남은 알람 0개면 추적 중단
- Android 10+ 백그라운드 위치 권한, Android 13+ 알림 권한을 명확히 분리 요청
- 장시간 백그라운드 추적은 Foreground Service 알림을 필수로 표시

### 디자인

- `#0066cc` 단일 액센트 - 두 번째 강조색 금지
- 그림자는 지도 마커 등 기능적 요소에만 제한
- 그라데이션 배경 금지
- font weight 500 금지, 300/400/600만 사용
- 하단 탭바는 항상 surface black `#000000`
- 카드 안에 카드를 중첩하지 않음

---

## 환경 변수 / 로컬 설정

Android Native에서는 Expo 공개 환경 변수 대신 `local.properties`, Gradle BuildConfig, 또는 CI secret을 사용한다.

```properties
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_MAPS_API_KEY=
KAKAO_NATIVE_APP_KEY=
KAKAO_REST_API_KEY=
FIREBASE_PROJECT_ID=
```

주의:
- `google-services.json`은 Firebase 콘솔에서 Android 앱 패키지명 기준으로 발급
- Supabase anon key는 클라이언트 포함 가능하지만 service role key는 절대 앱에 포함 금지
- Google Maps API key는 Android 앱 패키지명 + SHA-1 제한 필수
- Kakao Native App Key는 AndroidManifest 및 Kakao SDK 초기화에 사용

---

## 명령어

```powershell
.\gradlew assembleDebug                     # Debug APK 빌드
.\gradlew installDebug                      # 연결된 기기에 설치
.\gradlew bundleRelease                     # Release AAB 생성
.\gradlew test                              # Unit test
.\gradlew connectedAndroidTest              # Instrumentation test
.\gradlew lint                              # Android lint
npx supabase db push                        # DB 마이그레이션
git add .; git commit -m "feat: ..."; git push
```

Android Studio에서는 Run Configuration을 `app` 모듈로 두고 실기기 우선 검증한다.

---

## 주의사항

- 백그라운드 위치 추적은 발열·배터리 이슈가 크므로 Balanced Priority와 추적 중단 조건을 반드시 지킨다.
- Android 권한 정책상 위치 권한은 단계적으로 요청한다: foreground location -> background location.
- Android 13 이상은 알림 권한 `POST_NOTIFICATIONS`를 별도로 요청한다.
- `alarm-sounds` Storage 버킷 + RLS 마이그레이션이 라이브 DB에 적용돼야 커스텀 알람음 업로드가 동작한다.
- 카카오 로그인/공유는 Android key hash 등록이 필요하다.
- Google Maps는 API key 제한이 없으면 출시 전 보안 이슈가 된다.
- 위치정보 사업자 신고 및 개인정보 처리 문구는 출시 전 법률 기준으로 재확인한다.

---

## 참고 문서

`CBM.md` · `SKILL.md` · `SCHEMA.md` · `API.md` · `DESIGN.md` · `SETUP.md`

> **탐색 규칙**: 파일 직접 읽기 전에 `CBM.md` 먼저 확인. Export·의존성·데이터 흐름은 CBM에서 조회.
