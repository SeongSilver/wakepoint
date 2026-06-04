# 다왔어 — Claude Code 프로젝트 설정

위치 기반 알람 앱. 목적지 도착 시 알람, 친구/가족 대리 설정 가능.
페르소나: ① 지하철 잠든 친구 알람 대리 ② 부모-자녀 귀가·이동 케어

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | React Native + Expo | SDK 54 |
| 언어 | TypeScript | 5.x strict |
| 백엔드 | Supabase (Auth·DB·Realtime·Storage) | latest |
| 인증 | 이메일 + Google OAuth + 카카오 OIDC | — |
| Push | FCM + expo-notifications | — |
| 위치 | expo-location + expo-task-manager | — |
| 지도/검색 | react-native-maps + 카카오 로컬 API | — |
| 카카오 SDK | @react-native-kakao/core·user·share·social | — |
| 녹음/재생 | expo-av | — |
| 상태관리 | Zustand + AsyncStorage | — |
| 네비게이션 | Expo Router (file-based) | — |
| 스타일 | NativeWind v4 | — |
| 빌드 | EAS Build + expo-build-properties | — |

---

## 디렉토리 구조

```
app/
  (auth)/login.tsx            # 이메일·Google·카카오 로그인
  (auth)/signup.tsx           # 닉네임·이메일·약관 동의
  (tabs)/index.tsx            # 지도 홈 (풀스크린 + 알람 마커)
  (tabs)/alarms.tsx           # 알람 목록
  (tabs)/friends.tsx          # 친구 관리·초대·권한 요청
  (tabs)/profile.tsx          # 마이페이지
  invite.tsx · privacy.tsx · terms.tsx · _layout.tsx
components/alarm/ · map/ · ui/
lib/
  supabase.ts · alarm.ts
  firebase.ts                 # FCM 토큰·sendFcmToUser()
  location.ts                 # Haversine 거리 계산
hooks/
  useLocation · useAlarm · useFriends · useAlarmPermissions
  useFriendAlarmListener · useRecording · useTrackingSync
store/alarmStore.ts · userStore.ts
tasks/locationTask.ts         # 백그라운드 위치추적 (Balanced)
types/index.ts
assets/images/logo-square.png · logo-horizontal.png · icon-point.png
supabase/migrations/
SKILL.md · SCHEMA.md · API.md · DESIGN.md · SETUP.md · eas.json
```

---

## 개발 현황

✅ **완료** — 인프라·인증(이메일/Google/카카오)·지도&알람(마커·반경·트리거)·친구&권한(FCM·Realtime)·알람음(녹음·재생·진동)·법적문서 구현 완료. 발열·렌더링·추적 동기화 버그 수정 완료. 전체 화면 디자인 시스템 적용 완료.

🔄 **진행 예정**
1. **커밋 + push + APK 재빌드**
2. **위치정보 사업자 신고** — 방통위 (출시 전 법적 의무)
3. **앱스토어 배포** — production AAB

---

## DB 스키마

```
user_profiles     — id, email, nickname, avatar_url, push_token
alarms            — id, owner_id, created_by, label, target_lat, target_lng,
                    target_address, radius_km, is_active, triggered_at,
                    sound_type('default'|'custom'), sound_uri
friends           — id, user_id, friend_id
alarm_permissions — id, requester_id, target_id, status('pending'|'accepted'|'rejected')
```

전체 스키마·RLS → SCHEMA.md

---

## 디자인 시스템 (DESIGN.md 요약)

```
Primary    #0066cc   모든 인터랙티브 요소 (유일한 액센트)
Success    #10B981   활성 알람, 수락
Danger     #ef4444   삭제, 오류
Canvas     #ffffff   기본 배경
Parchment  #f5f5f7   섹션 배경, 카드 배경, 입력 필드
Dark Tile  #272729   다크 섹션 (마이페이지 상단 등)
Ink        #1d1d1f   제목, 본문
Tab Bar    #000000   탭바 배경

버튼    → rounded-full + active:scale-95
카드    → rounded-2xl + border border-[#e0e0e0]
입력    → rounded-xl + bg-[#f5f5f7]
검색창  → rounded-full + backdrop-blur
FAB     → bg-[#0066cc] w-14 h-14 rounded-full absolute bottom-6 right-6
탭바    → bg-black, 활성 #2997ff, 비활성 #7a7a7a
마커    → strokeColor rgba(0,102,204,0.9), fillColor rgba(0,102,204,0.15)
```

---

## 개발 규칙

### 코드 스타일
- TypeScript strict — `any` 금지
- 함수형 컴포넌트 + Hooks 전용 (클래스 금지)
- 인라인 스타일 금지 — NativeWind 클래스만
- Supabase 쿼리 → 반드시 훅으로 분리
- `console.log` 금지 (`console.error` 허용)

### 네이밍

| 대상 | 규칙 | 예 |
|------|------|----|
| 컴포넌트 | PascalCase | AlarmCard |
| 훅 | useCamelCase | useAlarm |
| 스토어 | camelCase Store | alarmStore |
| 타입 | PascalCase | Alarm |
| 상수 | UPPER_SNAKE_CASE | LOCATION_TASK_NAME |

### 위치/알람
- 백그라운드 태스크 → `tasks/locationTask.ts` 에서만
- 거리 계산 → `lib/location.ts`의 `calculateDistance()` 만
- 반경 최솟값 100m / 최댓값 50km
- accuracy: **Accuracy.Balanced** (HIGH 금지 — 발열 원인)
- 활성 알람 0개 → 즉시 추적 중단
- 트리거 후 해당 알람 제거 + 남은 알람 0개 → 추적 중단

### 디자인
- `#0066cc` 단일 액센트 — 두 번째 강조색 절대 금지
- 그림자: 지도 마커만 허용 (카드·버튼·텍스트 금지)
- 그라데이션 배경 금지
- font-weight 500 금지 (300/400/600 허용)
- 탭바 항상 surface-black (#000000)

---

## 환경 변수

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
FIREBASE_PROJECT_ID=
EAS_PROJECT_ID=
EXPO_TOKEN=
EXPO_PUBLIC_KAKAO_REST_API_KEY=
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=
```

## 명령어

```bash
npx expo start                                      # 개발 서버
npx expo run:android                                # Android 개발 빌드
eas build --profile preview --platform android      # APK (테스트)
eas build --profile production --platform android   # AAB (스토어)
npx tsc --noEmit                                    # 타입 체크
npx supabase db push                                # DB 마이그레이션
git add . && git commit -m "feat: ..." && git push  # 커밋·push
```

## 주의사항
- 백그라운드 발열: Accuracy.Balanced + killServiceOnDestroy 적용 완료, 실기기 재검증 필요
- Windows EAS Build: PowerShell + metro.config.js pathToFileURL 적용 완료

## 참고 문서
CBM.md · SKILL.md · SCHEMA.md · API.md · DESIGN.md · SETUP.md

> **탐색 규칙**: 파일 직접 읽기 전에 CBM.md 먼저 확인. Export·의존성·데이터 흐름은 CBM에서 조회.
