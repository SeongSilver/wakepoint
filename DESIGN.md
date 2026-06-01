# DESIGN.md — 다왔어 디자인 시스템
> Apple 디자인 언어 기반. UI는 뒤로 물러나고 콘텐츠가 앞으로. 단일 액센트 컬러. 여백이 곧 구조.

---

## 서비스 정보
- **앱 이름**: 다왔어
- **슬로건**: 목적지에 다 왔을 때 알려드려요
- **톤**: 조용하고 신뢰감 있는, 과하지 않게 깔끔

---

## 컬러

### 액센트 (단 하나)
| 토큰 | Hex | NativeWind | 용도 |
|------|-----|-----------|------|
| `primary` | `#4F46E5` | `indigo-600` | 모든 인터랙티브 요소 — 버튼, 링크, 포커스. **유일한 액센트** |
| `primary-focus` | `#6366f1` | `indigo-500` | 포커스 링 (`outline: 2px solid`) |
| `primary-on-dark` | `#818cf8` | `indigo-400` | 다크 타일 위 링크 전용 |

### 상태
| 토큰 | Hex | NativeWind | 용도 |
|------|-----|-----------|------|
| `success` | `#10B981` | `emerald-500` | 활성 알람, 수락된 권한 |
| `danger` | `#ef4444` | `red-500` | 삭제, 오류 |

### 서피스
| 토큰 | Hex | NativeWind | 용도 |
|------|-----|-----------|------|
| `canvas` | `#ffffff` | `white` | 기본 배경 |
| `canvas-parchment` | `#f5f5f7` | `gray-50` | 섹션 구분, 카드 배경, 하단 탭바 |
| `surface-pearl` | `#fafafc` | — | 고스트 버튼 fill |
| `surface-tile-dark` | `#272729` | — | 다크 섹션 배경 |
| `surface-black` | `#000000` | `black` | 탭바 배경, 네비게이션 바 전용 |
| `surface-chip` | `rgba(210,210,215,0.64)` | — | 지도 위 플로팅 버튼 |

### 텍스트
| 토큰 | Hex | NativeWind | 용도 |
|------|-----|-----------|------|
| `ink` | `#1d1d1f` | `gray-900` | 제목, 본문 전체 |
| `ink-muted` | `#6b7280` | `gray-500` | 보조 텍스트, 플레이스홀더 |
| `ink-disabled` | `#7a7a7a` | `gray-400` | 비활성 텍스트, 파인프린트 |
| `on-dark` | `#ffffff` | `white` | 다크 타일 위 텍스트 전체 |
| `on-dark-muted` | `#cccccc` | `gray-300` | 다크 타일 위 보조 텍스트 |

### 보더
| 토큰 | Value | 용도 |
|------|-------|------|
| `hairline` | `#e0e0e0` | 카드 테두리, 구분선 |
| `divider-soft` | `rgba(0,0,0,0.04)` | 고스트 버튼 링 |

**규칙:**
- `primary` (#4F46E5)는 **유일한 액센트** — 두 번째 강조색 절대 금지
- `surface-black`은 탭바와 네비게이션 바에만 사용
- `primary-on-dark`는 다크 타일 전용 — 라이트 서피스에 사용 금지
- 그라데이션 배경 금지 — 분위기는 여백과 컬러 대비로

---

## 타이포그래피

### 폰트
```
React Native 기본: System font (iOS: SF Pro, Android: Roboto)
대체: Inter (Google Fonts)
```

### 스케일 (NativeWind 기준)
| 토큰 | Size | Weight | 용도 |
|------|------|--------|------|
| `hero` | `text-4xl` (36px) | `font-semibold` (600) | 앱 타이틀, 온보딩 |
| `display` | `text-3xl` (30px) | `font-semibold` (600) | 화면 제목 |
| `title` | `text-2xl` (24px) | `font-semibold` (600) | 섹션 헤더 |
| `headline` | `text-lg` (18px) | `font-semibold` (600) | 카드 제목, 강조 항목 |
| `body` | `text-base` (16px) | `font-normal` (400) | 본문 — 기본 텍스트 |
| `caption` | `text-sm` (14px) | `font-normal` (400) | 보조 설명, 버튼 레이블 |
| `micro` | `text-xs` (12px) | `font-normal` (400) | 배지, 파인프린트 |

**규칙:**
- 웨이트 사다리: **300 / 400 / 600** — 500 사용 금지
- 헤드라인은 항상 600, 본문은 항상 400
- 300은 큰 사이즈의 airy 모멘트에만 (예: 지도 위 플로팅 레이블)

---

## 스페이싱 (8px 기준)
| 토큰 | Value | NativeWind |
|------|-------|-----------|
| `xxs` | 4px | `p-1` |
| `xs` | 8px | `p-2` |
| `sm` | 12px | `p-3` |
| `md` | 16px | `p-4` |
| `lg` | 24px | `p-6` |
| `xl` | 32px | `p-8` |
| `xxl` | 48px | `p-12` |
| `section` | 64px | `py-16` |

---

## Border Radius
| 토큰 | Value | NativeWind | 용도 |
|------|-------|-----------|------|
| `none` | 0px | `rounded-none` | 풀블리드 타일, 지도 |
| `sm` | 8px | `rounded-lg` | 유틸리티 버튼, 인라인 이미지 |
| `md` | 12px | `rounded-xl` | 입력 필드, 보조 버튼 |
| `lg` | 16px | `rounded-2xl` | 카드, 알람 아이템 |
| `pill` | 9999px | `rounded-full` | Primary CTA, 검색창, 칩 — **액션 신호** |
| `full` | 50% | `rounded-full` | 아바타, 지도 위 플로팅 버튼 |

**규칙:**
- `pill`은 "이건 액션이다" 신호 — Primary 버튼, 검색창, 칩에만
- 카드는 `lg` (rounded-2xl)
- 입력 필드는 `md` (rounded-xl)
- 풀블리드 섹션은 항상 `none`

---

## 엘리베이션 & 섀도우
| 레벨 | 처리 | 용도 |
|------|------|------|
| Flat | 없음 | 타일, 탭바, 섹션 배경 |
| Hairline | `1px solid rgba(0,0,0,0.08)` | 카드 테두리, 구분선 |
| Backdrop blur | `blur(20px)` + parchment 80% | 지도 위 플로팅 패널, 검색바 |
| 마커 섀도우 | `rgba(0,0,0,0.22) 3px 5px 30px` | 지도 위 핀 마커 전용 |

**규칙:**
- 섀도우는 지도 마커에만 — 카드·버튼·텍스트에 절대 금지
- 엘리베이션은 컬러 대비(라이트↔다크)와 backdrop-blur로만 표현

---

## 컴포넌트

### 버튼

**Primary (메인 액션)**
```
bg-indigo-600 text-white rounded-full
px-6 py-3 text-base font-normal
active:scale-95
focus: outline-2 outline-indigo-500
```

**Secondary Ghost (보조)**
```
border border-indigo-600 text-indigo-600
rounded-full px-6 py-3 text-base
bg-transparent active:scale-95
```

**Dark Utility (탭바, 네비 액션)**
```
bg-gray-900 text-white rounded-lg
px-4 py-2 text-sm active:scale-95
```

**Danger (삭제)**
```
bg-red-500 text-white rounded-full
px-6 py-3 text-base active:scale-95
```

**Icon Circular (지도 위 플로팅)**
```
w-11 h-11 rounded-full
bg-[rgba(210,210,215,0.64)]
items-center justify-center
```

### 카드 (알람 아이템)
```
bg-white rounded-2xl p-4
border border-[#e0e0e0]
(섀도우 금지 — 보더로만)

왼쪽 상태 인디케이터:
- 활성: w-1 h-full bg-indigo-600 rounded-full
- 비활성: w-1 h-full bg-gray-300 rounded-full
- 트리거됨: w-1 h-full bg-emerald-500 rounded-full
```

### 입력 필드
```
bg-gray-50 border border-[rgba(0,0,0,0.08)]
rounded-xl px-4 py-3 text-base text-gray-900
placeholder:text-gray-400
focus:border-indigo-500 focus:border-2
```

### 검색창 (지도 위)
```
bg-white border border-[rgba(0,0,0,0.08)]
rounded-full px-5 py-3 h-11 text-base
backdrop-filter: blur(20px)
leading icon: 14px gray-400
```

### FAB (알람 추가)
```
absolute bottom-6 right-6
w-14 h-14 bg-indigo-600 rounded-full
items-center justify-center
shadowColor: #4F46E5
shadowOffset: 0,4 shadowOpacity: 0.3 shadowRadius: 12
```

### 탭바
```
배경: #000000 (surface-black)
높이: 64px (+ safe area)
아이콘 활성: text-indigo-400 (primary-on-dark)
아이콘 비활성: text-gray-500
레이블: text-xs font-normal
```

### 알람 상태 배지
```
활성:   bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs
비활성: bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs
울림중: bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs
```

### 지도 마커 (반경 Circle)
```
strokeColor: 'rgba(79,70,229,0.9)'
strokeWidth: 2.5
fillColor: 'rgba(79,70,229,0.15)'
마커 이미지: assets/images/icon-point.png
마커 anchor: {x: 0.5, y: 1.0}
```

### 섹션 구조 (라이트 ↔ 다크)
```
라이트 타일: bg-white 또는 bg-gray-50
다크 타일:  bg-[#272729] text-white
전환 자체가 구분선 — 보더/선 불필요
```

---

## 화면별 가이드

### 인증 화면 (login, signup)
```
배경: bg-white
상단 로고: 다왔어 (hero 36px semibold indigo-600)
슬로건: caption gray-500
소셜 버튼: 각 브랜드 컬러 (카카오 #FEE500, 구글 white+border)
하단 약관: micro gray-400
```

### 지도 홈 (index)
```
지도: 풀스크린 (rounded-none)
검색바: 지도 위 absolute, backdrop-blur, rounded-full
알람 마커: icon-point.png + 인디고 반경 Circle
FAB: 우하단 고정 indigo-600
알람 울림 배너: 상단 absolute, bg-indigo-600 text-white
```

### 알람 목록 (alarms)
```
배경: bg-gray-50
헤더: display 30px semibold
알람 카드: bg-white rounded-2xl border hairline
빈 상태: Lottie 중앙, caption gray-500
```

### 친구 (friends)
```
배경: bg-white
권한 요청 배너: bg-indigo-50 border-indigo-200 rounded-2xl
친구 목록: 카드 스타일
초대 버튼: 카카오 #FEE500 rounded-full
```

### 마이페이지 (profile)
```
상단: bg-[#272729] (다크 타일)
아바타: w-20 h-20 rounded-full bg-indigo-600
닉네임: on-dark headline
이메일: on-dark-muted caption
메뉴 섹션: bg-gray-50 rounded-2xl
로그아웃: danger 버튼
```

---

## 규칙 요약

| ✅ 해야 할 것 | ❌ 하지 말 것 |
|-------------|-------------|
| `#4F46E5` 단일 액센트 | 두 번째 강조색 추가 |
| 버튼 `active:scale-95` | 카드/버튼에 그림자 |
| 카드 `rounded-2xl + border` | 그라데이션 배경 |
| 검색창 `rounded-full` | weight 500 사용 |
| 마커 섀도우만 허용 | 풀블리드 타일 radius |
| 라이트↔다크 섹션 교차 | primary-on-dark를 라이트 서피스에 |
| 탭바 `surface-black` | inline 스타일 |
