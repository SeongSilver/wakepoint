# DESIGN.md — 다왔어 디자인 시스템

## 서비스 정보
- **앱 이름**: 다왔어
- **슬로건**: 목적지에 다 왔을 때 울리는 알람
- **톤**: 친근하고 실용적, 과하지 않게 깔끔

---

## 컬러

```
Primary       #4F46E5   인디고 — 메인 액션 (버튼, 링크, 활성 아이콘)
Primary Dark  #4338CA   Primary 눌렀을 때
Success       #10B981   알람 활성 상태, 완료
Warning       #F59E0B   반경 근접 경고
Danger        #EF4444   알람 삭제, 오류

Canvas        #FFFFFF   기본 배경
Surface       #F5F5F7   카드/섹션 배경
Border        #E5E7EB   구분선, 카드 테두리

Ink           #1D1D1F   제목, 본문
Ink Muted     #6B7280   보조 텍스트, 플레이스홀더
On Primary    #FFFFFF   Primary 위 텍스트
```

---

## 타이포그래피 (NativeWind 클래스)

```
Hero      text-4xl font-semibold tracking-tight    — 앱 타이틀
Title     text-2xl font-semibold                   — 화면 제목
Section   text-lg font-semibold                    — 섹션 헤더
Body      text-base font-normal                    — 본문 (16px)
Caption   text-sm font-normal text-gray-500        — 보조 설명
Micro     text-xs font-normal text-gray-400        — 태그, 배지
```

---

## 컴포넌트

### 버튼
```
Primary   bg-indigo-600 text-white rounded-full px-6 py-3 active:scale-95
Ghost     border border-indigo-600 text-indigo-600 rounded-full px-6 py-3
Danger    bg-red-500 text-white rounded-full px-6 py-3
```

### 카드 (알람 아이템)
```
bg-white rounded-2xl p-4 border border-gray-100
shadow: shadowColor:#000 shadowOffset:0,1 shadowOpacity:0.06 shadowRadius:8
```

### 입력 필드
```
bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base
focus: border-indigo-500
```

### FAB (알람 추가 버튼)
```
bg-indigo-600 w-14 h-14 rounded-full
position: absolute bottom-6 right-6
shadow: shadowColor:#4F46E5 shadowOffset:0,4 shadowOpacity:0.3 shadowRadius:12
```

### 배지 (알람 반경 표시)
```
활성   bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs
비활성 bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs
```

---

## 아이콘
- 라이브러리: `@expo/vector-icons` → Ionicons
- 주요 아이콘:
```
location-sharp     — 목적지 핀
alarm              — 알람
people             — 친구
checkmark-circle   — 완료
trash              — 삭제
add                — 추가
walk               — 걷기 (빈 상태 일러스트 대체)
```

---

## 스페이싱 (8px 기준)
```
xs  4px    py-0.5 / px-1
sm  8px    p-2
md  16px   p-4
lg  24px   p-6
xl  32px   p-8
section 48px  py-12
```

---

## 화면별 적용 가이드

### 홈 (알람 목록)
- 배경: `bg-gray-50`
- 헤더: "다왔어" — `text-3xl font-semibold text-gray-900`
- 알람 카드: 카드 컴포넌트 사용, 왼쪽에 컬러 인디케이터 (활성=인디고, 비활성=회색)
- 빈 상태: Lottie 워킹 애니메이션 + "아직 알람이 없어요" caption 텍스트

### 지도
- 지도 위 검색바: 입력 필드 스타일 + `shadow-lg`
- 반경 선택 칩: 배지 스타일 (선택 시 bg-indigo-600 text-white)
- 저장 버튼: Primary 버튼, 하단 고정

### 인증
- 로고: "다왔어" hero 텍스트 + `text-indigo-600`
- 서브타이틀: "목적지에 다 왔을 때 알려드려요" caption

---

## 규칙
- 그림자는 카드와 FAB에만 사용 (버튼/텍스트 금지)
- 모서리: 버튼 `rounded-full` / 카드 `rounded-2xl` / 입력 `rounded-xl`
- 애니메이션: 버튼 `active:scale-95` 통일
- Primary 외 두 번째 강조색 사용 금지
