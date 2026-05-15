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
| 프레임워크 | React Native + Expo | SDK 51+ |
| 언어 | TypeScript | 5.x (strict 모드) |
| 백엔드/BaaS | Supabase | latest |
| 인증 | Supabase Auth (이메일 + Google OAuth) | — |
| DB | PostgreSQL (via Supabase) | — |
| 실시간 | Supabase Realtime | — |
| Push 알림 | FCM + expo-notifications | — |
| 위치 | expo-location + expo-task-manager | — |
| 녹음/재생 | expo-av | — |
| 파일 저장 | expo-file-system | — |
| 진동 | expo-haptics | — |
| 상태관리 | Zustand + AsyncStorage | — |
| 네비게이션 | Expo Router (file-based) | — |
| 스타일 | NativeWind v4 (Tailwind for RN) | — |
| 빌드 | EAS Build | — |

---

## 디렉토리 구조

```
dawasseo/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx               # ✅ 완료
│   │   └── signup.tsx              # ✅ 완료
│   ├── (tabs)/
│   │   ├── index.tsx               # ✅ 완료 — 알람 목록 + 빈 상태 Lottie
│   │   ├── map.tsx                 # ✅ 완료 — 지도, 반경 설정, 알람 저장
│   │   └── friends.tsx             # 🔄 구현 예정
│   └── _layout.tsx
├── components/
│   ├── alarm/
│   ├── map/
│   └── ui/
├── lib/
│   ├── supabase.ts                 # ✅ 완료
│   ├── firebase.ts                 # ✅ 완료 — FCM 토큰 발급 + Supabase 저장
│   ├── location.ts                 # ✅ 완료 — Haversine 거리 계산
│   └── alarm.ts                    # ✅ 완료 — 알람 트리거
├── hooks/
│   ├── useLocation.ts              # ✅ 완료
│   ├── useAlarm.ts                 # ✅ 완료
│   ├── useFriends.ts               # 🔄 구현 예정
│   └── useFriendAlarmListener.ts   # 🔄 구현 예정 — Realtime 구독
├── store/
│   ├── alarmStore.ts               # ✅ 완료
│   └── userStore.ts                # ✅ 완료
├── tasks/
│   └── locationTask.ts             # ✅ 완료 — 백그라운드 위치추적
├── types/
│   └── index.ts                    # ✅ 완료
├── supabase/
│   └── migrations/
├── CLAUDE.md
├── SKILL.md
├── SCHEMA.md
├── API.md
├── DESIGN.md
├── SETUP.md
└── eas.json                        # ✅ 완료 — preview APK 프로필
```

---

## 개발 현황

### ✅ 완료
- 프로젝트 초기 세팅 (Expo + TypeScript + NativeWind)
- 이메일 / Google OAuth 로그인
- 회원가입 (닉네임 + Supabase signUp + user_profiles 자동 생성)
- 지도 UI + 위치 선택 + 역지오코딩
- 알람 생성 / 삭제 (Supabase DB + 로컬 스토어)
- 반경 프리셋 8단계 (300m ~ 50km)
- 백그라운드 위치 추적 (expo-task-manager)
- 반경 진입 시 알람 트리거 + 중복 방지
- FCM 토큰 발급 + user_profiles push_token 저장
- EAS Build preview APK 프로필 설정

### 🔄 진행 예정 (순서 중요)
1. APK 빌드 & 실기기 테스트
2. 디자인 시스템 적용 (DESIGN.md 기준, 앱 이름 "다왔어" 전체 반영)
3. 친구 추가 화면 (friends.tsx)
4. 대리 알람 권한 요청/수락 (alarm_permissions)
5. 친구 대신 알람 설정 + FCM 푸시 발송
6. Supabase Realtime 동기화 (useFriendAlarmListener.ts)
7. 녹음 커스텀 알람음 (expo-av)
8. 위치정보 사업자 신고 (방통위 — 출시 전 법적 의무)
9. 개인정보처리방침 + 이용약관
10. 앱스토어 배포 (production AAB)

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

> sound_type / sound_uri 는 녹음 알람 기능(7번) 구현 시 아래 SQL로 추가
> ALTER TABLE public.alarms ADD COLUMN sound_type text DEFAULT 'default';
> ALTER TABLE public.alarms ADD COLUMN sound_uri text;

전체 스키마 및 RLS 정책 → SCHEMA.md 참고

---

## 디자인 시스템 핵심 (DESIGN.md 요약)

```
Primary   #4F46E5   인디고 — 메인 액션 (버튼, 링크, 활성 아이콘)
Success   #10B981   알람 활성 상태
Danger    #EF4444   삭제 / 오류
Canvas    #FFFFFF   기본 배경
Surface   #F5F5F7   카드 / 섹션 배경
Ink       #1D1D1F   제목, 본문

버튼  → rounded-full + active:scale-95
카드  → rounded-2xl + border border-gray-100
입력  → rounded-xl + bg-gray-50
FAB   → bg-indigo-600 w-14 h-14 rounded-full (absolute bottom-6 right-6)
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
```

---

## 참고 문서
- [SKILL.md](./SKILL.md) — 핵심 구현 패턴 & 코드 스니펫
- [SCHEMA.md](./SCHEMA.md) — DB 스키마 전체 정의 + RLS 정책
- [API.md](./API.md) — Supabase / FCM API 명세
- [DESIGN.md](./DESIGN.md) — 디자인 시스템 (컬러, 타이포, 컴포넌트)
- [SETUP.md](./SETUP.md) — 초기 세팅 가이드
