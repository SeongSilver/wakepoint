# WakePoint — Claude Code 프로젝트 설정

## 프로젝트 개요
위치 기반 알람 앱. 목적지에 가까워지면 알람이 울리며, 친구가 대신 알람을 설정해줄 수 있다.

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | React Native + Expo | SDK 51+ |
| 언어 | TypeScript | 5.x |
| 백엔드/BaaS | Supabase | latest |
| 인증 | Supabase Auth | — |
| DB | PostgreSQL (via Supabase) | — |
| 실시간 | Supabase Realtime | — |
| Push 알림 | Firebase Cloud Messaging (FCM) | — |
| 위치 | expo-location + expo-task-manager | — |
| 상태관리 | Zustand | — |
| 네비게이션 | Expo Router (file-based) | — |
| 스타일 | NativeWind (Tailwind for RN) | — |
| 테스트 | Jest + React Native Testing Library | — |

## 디렉토리 구조

```
wakepoint/
├── app/                        # Expo Router 페이지
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx           # 홈 (알람 목록)
│   │   ├── map.tsx             # 지도 & 알람 설정
│   │   └── friends.tsx         # 친구 관리
│   └── _layout.tsx
├── components/                 # 재사용 컴포넌트
│   ├── alarm/
│   ├── map/
│   └── ui/
├── lib/                        # 유틸 & 설정
│   ├── supabase.ts             # Supabase 클라이언트
│   ├── firebase.ts             # FCM 설정
│   └── location.ts             # 위치 유틸
├── hooks/                      # 커스텀 훅
│   ├── useLocation.ts
│   ├── useAlarm.ts
│   └── useFriends.ts
├── store/                      # Zustand 스토어
│   ├── alarmStore.ts
│   └── userStore.ts
├── tasks/                      # 백그라운드 태스크
│   └── locationTask.ts
├── types/                      # TypeScript 타입
│   └── index.ts
├── supabase/                   # DB 마이그레이션
│   └── migrations/
├── CLAUDE.md
├── SKILL.md
├── SCHEMA.md
├── API.md
└── app.json
```

## 개발 규칙

### 코드 스타일
- TypeScript strict 모드 사용
- 함수형 컴포넌트 + Hooks만 사용 (클래스 컴포넌트 금지)
- 컴포넌트 파일명: PascalCase (`AlarmCard.tsx`)
- 훅 파일명: camelCase with `use` prefix (`useLocation.ts`)
- 상수는 UPPER_SNAKE_CASE

### 네이밍 규칙
```
컴포넌트   → PascalCase       AlarmCard, MapView
훅         → useCamelCase     useAlarm, useLocation
스토어     → camelCase Store  alarmStore, userStore
타입/인터페이스 → PascalCase  Alarm, UserProfile
```

### 금지 사항
- `any` 타입 사용 금지
- `console.log` 프로덕션 코드에 남기지 않기 (console.error는 허용)
- 인라인 스타일 금지 (NativeWind 클래스 사용)
- 직접 Supabase 쿼리를 컴포넌트에서 쓰지 않기 → 훅으로 분리

### 위치/알람 관련 규칙
- 백그라운드 위치 태스크는 반드시 `tasks/locationTask.ts`에서만 관리
- 거리 계산은 `lib/location.ts`의 `calculateDistance()` 함수만 사용
- 알람 트리거 반경 최솟값: 100m, 최댓값: 50km

## 환경 변수 (.env)

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
FIREBASE_PROJECT_ID=
```

## 주요 명령어

```bash
# 개발 서버 시작
npx expo start

# iOS 시뮬레이터
npx expo run:ios

# Android 에뮬레이터
npx expo run:android

# 타입 체크
npx tsc --noEmit

# 테스트
npm test

# Supabase 마이그레이션
npx supabase db push
```

## Phase 별 개발 범위

### Phase 1 - MVP (현재)
- [ ] 프로젝트 초기 세팅
- [ ] 인증 (이메일/소셜 로그인)
- [ ] 지도 UI + 위치 선택
- [ ] 알람 생성/삭제
- [ ] 백그라운드 위치 추적
- [ ] 반경 진입 시 알람 트리거

### Phase 2 - 소셜
- [ ] 친구 추가 (전화번호/이메일)
- [ ] 대리 알람 설정 권한 요청/수락
- [ ] 친구 대신 알람 설정
- [ ] 실시간 알람 동기화 (Supabase Realtime)

### Phase 3 - 완성
- [ ] 배터리 최적화
- [ ] 알람 히스토리
- [ ] 반복 알람 설정
- [ ] 앱스토어/플레이스토어 배포

## 참고 문서
- [SKILL.md](./SKILL.md) — 핵심 구현 패턴 & 코드 스니펫
- [SCHEMA.md](./SCHEMA.md) — DB 스키마 정의
- [API.md](./API.md) — Supabase / FCM API 명세
