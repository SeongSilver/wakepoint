# 다왔어 — Claude Code 프로젝트 설정

## 프로젝트 개요
위치 기반 알람 앱. 목적지에 가까워지면 알람이 울리며, 가족/친구가 대신 알람을 설정해줄 수 있다.
- **앱 이름**: 다왔어
- **슬로건**: 목적지에 다 왔을 때 알려드려요

## 핵심 페르소나
1. 술 취한 친구 — 지하철에서 잠든 친구 대신 동행이 알람 설정
2. 가족 케어 — 부모가 어린 자녀 귀가 알람 설정 / 자녀가 노부모 이동 알람 설정

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | React Native + Expo | SDK 54 |
| 언어 | TypeScript | 5.x (strict 모드) |
| 백엔드/BaaS | Supabase | latest |
| 인증 | Supabase Auth (이메일 + Google OAuth + 카카오) | — |
| DB | PostgreSQL (via Supabase) | — |
| 실시간 | Supabase Realtime | — |
| Push 알림 | FCM + expo-notifications | — |
| 위치 | expo-location + expo-task-manager | — |
| 지도 | react-native-maps | — |
| 장소 검색 | 카카오 로컬 API | — |
| 카카오 SDK | @react-native-kakao/core, user, share, social | — |
| 녹음/재생 | expo-av | — |
| 파일 저장 | expo-file-system | — |
| 진동 | expo-haptics | — |
| 폰트 | expo-font | — |
| 상태관리 | Zustand + AsyncStorage | — |
| 네비게이션 | Expo Router (file-based) | — |
| 스타일 | NativeWind v4 (Tailwind for RN) | — |
| 빌드 | EAS Build | — |
| 빌드 설정 | expo-build-properties (카카오 Maven 저장소) | — |

---

## 디렉토리 구조

```
dawasseo/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx               # ✅ 완료 — 이메일 + Google + 카카오 로그인
│   │   └── signup.tsx              # ✅ 완료 — 닉네임 + 이메일 + 약관 동의
│   ├── (tabs)/
│   │   ├── index.tsx               # ✅ 완료 — 지도 홈 (풀스크린 지도 + 알람 마커)
│   │   ├── alarms.tsx              # ✅ 완료 — 알람 목록 + 빈 상태 Lottie
│   │   ├── friends.tsx             # ✅ 완료 — 친구 관리 + 카카오 초대 + 권한 요청
│   │   └── profile.tsx             # ✅ 완료 — 마이페이지 + 프로필 + 로그아웃
│   ├── invite.tsx                  # ✅ 완료 — 카카오 초대 딥링크 수락
│   ├── privacy.tsx                 # ✅ 완료 — 개인정보처리방침
│   ├── terms.tsx                   # ✅ 완료 — 이용약관
│   └── _layout.tsx                 # ✅ 완료 — 탭 구조 + 딥링크 + auth 라우팅
├── components/
│   ├── alarm/
│   ├── map/
│   └── ui/
├── lib/
│   ├── supabase.ts                 # ✅ 완료
│   ├── firebase.ts                 # ✅ 완료 — FCM 토큰 발급 + sendFcmToUser()
│   ├── location.ts                 # ✅ 완료 — Haversine 거리 계산
│   └── alarm.ts                    # ✅ 완료 — 알람 트리거 + 사운드 재생
├── hooks/
│   ├── useLocation.ts              # ✅ 완료
│   ├── useAlarm.ts                 # ✅ 완료
│   ├── useFriends.ts               # ✅ 완료 — 이메일 검색, 친구 추가/삭제
│   ├── useAlarmPermissions.ts      # ✅ 완료 — 권한 요청/수락/거절
│   ├── useFriendAlarmListener.ts   # ✅ 완료 — Supabase Realtime 구독
│   ├── useRecording.ts             # ✅ 완료 — 녹음 + Supabase Storage 업로드
│   └── useTrackingSync.ts          # ✅ 완료 — 위치 추적 상태 동기화
├── store/
│   ├── alarmStore.ts               # ✅ 완료
│   └── userStore.ts                # ✅ 완료
├── tasks/
│   └── locationTask.ts             # ✅ 완료 — 백그라운드 위치추적 (Balanced 모드)
├── types/
│   └── index.ts                    # ✅ 완료
├── assets/
│   └── images/
│       ├── logo-square.png         # 앱 아이콘
│       ├── logo-horizontal.png     # 가로 로고
│       └── icon-point.png          # 지도 핀 마커
├── supabase/
│   └── migrations/
├── CLAUDE.md
├── SKILL.md
├── SCHEMA.md
├── API.md
├── DESIGN.md
├── SETUP.md
└── eas.json                        # ✅ 완료 — preview APK + production AAB
```

---

## 개발 현황

### ✅ 완료
**인프라**
- Expo SDK 54 + TypeScript + NativeWind v4
- Supabase (Auth + DB + Realtime + Storage)
- FCM 토큰 발급 + push_token 저장 + sendFcmToUser()
- EAS Build preview APK / production AAB 설정
- expo-build-properties + 카카오 Maven 저장소
- expo-font, babel-preset-expo SDK 54 호환

**인증**
- 이메일/비밀번호 로그인 + 회원가입
- Google OAuth 로그인
- 카카오 로그인 (OIDC idToken → Supabase)
- 이용약관 동의 체크박스
- onAuthStateChange 이중 네비게이션 버그 수정

**지도 & 알람**
- 지도 풀스크린 홈 화면
- 카카오 로컬 API 장소 검색
- 역지오코딩 주소 변환
- 알람 생성/삭제 (Supabase DB + Zustand)
- 반경 프리셋 8단계 (300m ~ 50km)
- 지도 위 알람 마커 (icon-point.png) + 반경 Circle
- 백그라운드 위치 추적 (Accuracy.Balanced)
- 반경 진입 시 알람 트리거 + 중복 방지
- 알람 울림 배너 + 중지 버튼

**친구 & 권한**
- 이메일로 친구 검색/추가/삭제
- 카카오톡 초대 링크 (딥링크 수락)
- 대리 알람 권한 요청/수락/거절
- 친구 대신 알람 설정 (owner_id ≠ created_by)
- FCM 푸시 발송 (권한 요청 시 + 알람 설정 시)
- Supabase Realtime 동기화

**알람음**
- expo-av 녹음 + Supabase Storage 업로드
- 반경 진입 시 커스텀 사운드 루프 재생
- expo-haptics 진동 병행
- 백그라운드 ringing 상태 AsyncStorage 복원

**법적 문서**
- 개인정보처리방침 (privacy.tsx)
- 이용약관 (terms.tsx)

**버그 수정**
- APK 백그라운드 발열 문제 (Accuracy.Balanced + 알람 없을 때 추적 중단)
- 상태바 깜빡임 / 렌더링 루프 수정
- useTrackingSync 리렌더링 최적화

### 🔄 진행 예정 (순서 중요)
1. **지도 마커 개선** — icon-point.png + 반경 Circle 뚜렷하게
3. **발열 최적화 검증** — 실기기 재테스트
4. **디자인 시스템 전면 적용** — DESIGN.md 기준, 화면별 순서대로
5. **커밋 + push + APK 재빌드**
6. **위치정보 사업자 신고** — 방통위 (출시 전 법적 의무)
7. **앱스토어 배포** — production AAB

---

## DB 스키마 요약

```
user_profiles     — id, email, nickname, avatar_url, push_token
alarms            — id, owner_id, created_by, label,
                    target_lat, target_lng, target_address,
                    radius_km, is_active, triggered_at,
                    sound_type('default'|'custom'), sound_uri
friends           — id, user_id, friend_id
alarm_permissions — id, requester_id, target_id,
                    status('pending'|'accepted'|'rejected')
```

전체 스키마 및 RLS 정책 → SCHEMA.md 참고

---

## 디자인 시스템 핵심 (DESIGN.md 요약)
> Apple 디자인 언어 기반. 단일 액센트. 여백이 곧 구조.

```
Primary       #0066cc   —            모든 인터랙티브 요소 (유일한 액센트, Apple blue)
Success       #10B981   emerald-500  활성 알람, 수락
Danger        #ef4444   red-500      삭제, 오류
Canvas        #ffffff   white        기본 배경
Parchment     #f5f5f7   —            섹션 배경, 카드
Dark Tile     #272729   —            다크 섹션 (마이페이지 상단 등)
Ink           #1d1d1f   —            제목, 본문
Tab Bar BG    #000000   black        탭바 배경 (surface-black)

버튼    → rounded-full + active:scale-95
카드    → rounded-[18px] + border border-[#e0e0e0]
입력    → rounded-[11px] + bg-[#f5f5f7]
검색창  → rounded-full + backdrop-blur
FAB     → bg-[#0066cc] w-14 h-14 rounded-full (absolute bottom-6 right-6)
탭바    → bg-black, 활성 #2997ff, 비활성 #7a7a7a
마커    → strokeColor rgba(0,102,204,0.9), fillColor rgba(0,102,204,0.15)
```

---

## 개발 규칙

### 코드 스타일
- TypeScript strict 모드 — `any` 타입 사용 금지
- 함수형 컴포넌트 + Hooks만 사용 (클래스 컴포넌트 금지)
- 인라인 스타일 금지 — NativeWind 클래스만 사용
- Supabase 쿼리는 컴포넌트에서 직접 쓰지 않고 반드시 훅으로 분리
- `console.log` 프로덕션 코드 금지 (`console.error`는 허용)

### 네이밍 규칙
```
컴포넌트        → PascalCase       AlarmCard, MapView
훅              → useCamelCase     useAlarm, useLocation
스토어          → camelCase Store  alarmStore, userStore
타입/인터페이스 → PascalCase       Alarm, UserProfile
상수            → UPPER_SNAKE_CASE LOCATION_TASK_NAME
```

### 위치/알람 규칙
- 백그라운드 위치 태스크는 `tasks/locationTask.ts` 에서만 관리
- 거리 계산은 `lib/location.ts`의 `calculateDistance()` 만 사용
- 알람 반경 최솟값 100m / 최댓값 50km
- 위치 추적 accuracy: **Accuracy.Balanced** (HIGH 금지 — 발열 원인)
- 활성 알람 0개 시 즉시 추적 중단
- 트리거 후 즉시 해당 알람 제거 + 남은 알람 없으면 추적 중단

### 디자인 규칙
- Primary #4F46E5가 유일한 액센트 — 두 번째 강조색 절대 금지
- 카드/버튼/텍스트에 그림자 금지 — 지도 마커만 허용
- 그라데이션 배경 금지
- weight 500 사용 금지 (300 / 400 / 600만 허용)
- 탭바는 항상 surface-black (#000000)

---

## 환경 변수 (.env)

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

---

## 주요 명령어

```bash
npx expo start                                        # 개발 서버
npx expo run:android                                  # Android 개발 빌드
eas build --profile preview --platform android        # APK 빌드 (테스트)
eas build --profile production --platform android     # 스토어용 AAB
npx tsc --noEmit                                      # 타입 체크
npx supabase db push                                  # DB 마이그레이션
git add . && git commit -m "feat: ..." && git push    # 커밋 + push
```

---

## 알려진 이슈 & 주의사항

| 이슈 | 상태 | 비고 |
|------|------|------|
| Windows EAS Build | 해결 | PowerShell 사용, metro.config.js pathToFileURL 적용 |
| 카카오 Maven 저장소 | 해결 | expo-build-properties extraMavenRepos 추가 |
| expo-font 누락 | 해결 | npx expo install expo-font 완료 |
| 백그라운드 발열 | 부분해결 | Accuracy.Balanced 적용, 실기기 재검증 필요 |
| map 탭 → profile 탭 교체 | 해결 | map.tsx 삭제, profile.tsx 구현 완료 |

---

## 참고 문서
- [SKILL.md](./SKILL.md) — 핵심 구현 패턴 & 코드 스니펫
- [SCHEMA.md](./SCHEMA.md) — DB 스키마 전체 정의 + RLS 정책
- [API.md](./API.md) — Supabase / FCM API 명세
- [DESIGN.md](./DESIGN.md) — 디자인 시스템 (Apple 언어 기반)
- [SETUP.md](./SETUP.md) — 초기 세팅 가이드
