DESIGN.md — 다왔어 디자인 시스템
> Apple 디자인 언어 기반. UI는 뒤로 물러나고 콘텐츠가 앞으로. 단일 액센트 컬러. 여백이 곧 구조.
---
서비스 정보
앱 이름: 다왔어
슬로건: 목적지에 다 왔을 때 알려드려요
톤: 조용하고 신뢰감 있는, 과하지 않게 깔끔
---
컬러
액센트 (단 하나)
토큰	Hex	용도
`primary`	`#0066cc`	모든 인터랙티브 요소 — 버튼, 링크, 포커스. 유일한 액센트
`primary-focus`	`#0071e3`	포커스 링 (`outline: 2px solid`)
`primary-on-dark`	`#2997ff`	다크 타일 위 링크 전용
상태
토큰	Hex	용도
`success`	`#10B981`	활성 알람, 수락된 권한
`danger`	`#ef4444`	삭제, 오류
서피스
토큰	Hex	용도
`canvas`	`#ffffff`	기본 배경 — 카드, 콘텐츠
`canvas-parchment`	`#f5f5f7`	섹션 배경, 교차 타일, 입력 필드 배경
`surface-pearl`	`#fafafc`	고스트 버튼 fill
`surface-tile-1`	`#272729`	다크 섹션 (마이페이지 상단 등)
`surface-tile-2`	`#2a2a2c`	다크 타일 인접 시 미세 구분
`surface-tile-3`	`#252527`	다크 스택 하단, 영상 프레임
`surface-black`	`#000000`	탭바, 네비게이션 바 전용
`surface-chip`	`rgba(210,210,215,0.64)`	지도 위 플로팅 버튼
텍스트
토큰	Hex	용도
`ink`	`#1d1d1f`	모든 제목, 본문
`ink-muted-80`	`#333333`	Pearl 버튼 위 텍스트
`ink-muted-48`	`#7a7a7a`	비활성, 파인프린트, 플레이스홀더
`body-on-dark`	`#ffffff`	다크 타일 위 텍스트 전체
`body-muted`	`#cccccc`	다크 타일 위 보조 텍스트
보더
토큰	Value	용도
`hairline`	`#e0e0e0`	카드 테두리, 구분선
`divider-soft`	`rgba(0,0,0,0.04)`	고스트 버튼 링
`border-input`	`rgba(0,0,0,0.08)`	입력 필드, 검색창 테두리
컬러 규칙:
`primary` (#0066cc)는 유일한 액센트 — 두 번째 강조색 절대 금지
`primary-on-dark` (#2997ff)는 다크 타일 전용 — 라이트 서피스 사용 금지
`surface-black`은 탭바와 네비게이션 바에만
그라데이션 배경 금지
---
타이포그래피
폰트
```
React Native: System font (iOS → SF Pro, Android → Roboto)
대체: Inter (Google Fonts)
Inter 사용 시: letter-spacing -0.01em (display), line-height 1.44 (body)
```
스케일
토큰	Size	Weight	Line Height	용도
`hero`	36px	600	1.07	앱 타이틀, 온보딩
`display`	30px	600	1.10	화면 제목
`title`	24px	600	1.19	섹션 헤더
`headline`	18px	600	1.24	카드 제목, 강조 항목
`body`	17px	400	1.47	본문 — 기본 텍스트
`caption`	14px	400	1.43	보조 설명, 버튼 레이블
`micro`	12px	400	1.0	배지, 파인프린트
타이포 규칙:
웨이트 사다리: 300 / 400 / 600 / 700 — 500 사용 금지
헤드라인 600, 본문 400
본문은 반드시 17px (16px 금지)
17px 이상 헤드라인에 negative letter-spacing 적용
---
스페이싱 (8px 기준)
토큰	Value	용도
`xxs`	4px	미세 조정
`xs`	8px	아이콘-텍스트 간격
`sm`	12px	인라인 요소
`md`	17px	기본 패딩
`lg`	24px	카드 패딩
`xl`	32px	섹션 간격
`xxl`	48px	큰 섹션
`section`	80px	타일 상하 패딩
---
Border Radius
토큰	Value	용도
`none`	0px	풀블리드 타일, 지도
`xs`	5px	인라인 칩 (드물게)
`sm`	8px	유틸리티 버튼, 인라인 이미지
`md`	11px	Pearl 버튼 캡슐
`lg`	18px	카드, 알람 아이템
`pill`	9999px	Primary CTA, 검색창, 칩 — 액션 신호
`full`	50%	아바타, 지도 위 플로팅 버튼
Radius 규칙:
`pill`은 "이건 액션이다" 신호 — Primary 버튼·검색창·칩에만
카드는 `lg` (18px)
Pearl 버튼은 `md` (11px)
풀블리드 타일/지도는 `none`
---
엘리베이션 & 섀도우
레벨	처리	용도
Flat	없음	타일, 탭바, 섹션
Hairline	`1px solid rgba(0,0,0,0.08)`	카드, 구분선
Backdrop blur	`saturate(180%) blur(20px)` + parchment 80%	지도 위 플로팅 패널, 검색바
마커 섀도우	`rgba(0,0,0,0.22) 3px 5px 30px`	지도 핀 마커 전용
섀도우 규칙:
섀도우는 지도 마커에만 — 카드·버튼·텍스트 절대 금지
엘리베이션 = 컬러 대비(라이트↔다크) + backdrop-blur
---
컴포넌트
버튼
Primary (메인 액션)
```
background: #0066cc
color: #ffffff
border-radius: 9999px (pill)
padding: 11px 22px
font: 17px / 400
active: scale(0.95)
focus: outline 2px solid #0071e3
```
Secondary Ghost (보조)
```
background: transparent
color: #0066cc
border: 1px solid #0066cc
border-radius: 9999px
padding: 11px 22px
active: scale(0.95)
```
Dark Utility (탭바, 네비 액션)
```
background: #1d1d1f
color: #ffffff
border-radius: 8px
padding: 8px 15px
font: 14px / 400
active: scale(0.95)
```
Pearl Capsule (카드 보조)
```
background: #fafafc
color: #333333
border: 3px solid rgba(0,0,0,0.04)
border-radius: 11px
padding: 8px 14px
font: 14px / 400
```
Danger (삭제)
```
background: #ef4444
color: #ffffff
border-radius: 9999px
padding: 11px 22px
active: scale(0.95)
```
Icon Circular (지도 위 플로팅)
```
width: 44px / height: 44px
background: rgba(210,210,215,0.64)
border-radius: 50%
```
카드 (알람 아이템)
```
background: #ffffff
border-radius: 18px
padding: 24px
border: 1px solid #e0e0e0
(섀도우 금지)

왼쪽 상태 인디케이터:
- 활성:    width 4px, background #0066cc, border-radius full
- 비활성:  width 4px, background #e0e0e0, border-radius full
- 트리거됨: width 4px, background #10B981, border-radius full
```
입력 필드
```
background: #f5f5f7
border: 1px solid rgba(0,0,0,0.08)
border-radius: 11px
padding: 12px 20px
font: 17px / 400
color: #1d1d1f
placeholder: #7a7a7a
focus: border 2px solid #0066cc
```
검색창 (지도 위 플로팅)
```
background: rgba(255,255,255,0.8)
border: 1px solid rgba(0,0,0,0.08)
border-radius: 9999px
padding: 12px 20px
height: 44px
font: 17px / 400
backdrop-filter: saturate(180%) blur(20px)
leading icon: 14px #7a7a7a
```
FAB (알람 추가)
```
position: absolute, bottom: 24px, right: 24px
width: 56px / height: 56px
background: #0066cc
border-radius: 50%
shadowColor: #0066cc
shadowOffset: 0,4 / shadowOpacity: 0.3 / shadowRadius: 12
```
탭바
```
background: #000000 (surface-black)
height: 64px + safe area
아이콘 활성: #2997ff (primary-on-dark)
아이콘 비활성: #7a7a7a
레이블: 12px / 400
```
알람 상태 배지
```
활성:   background rgba(0,102,204,0.1), color #0066cc, border-radius full, padding 2px 8px, font 12px
비활성: background #f5f5f7, color #7a7a7a, border-radius full, padding 2px 8px, font 12px
울림중: background rgba(0,102,204,0.08), color #0066cc, border-radius full, font 12px
```
지도 마커 (반경 Circle)
```
strokeColor: 'rgba(0,102,204,0.9)'
strokeWidth: 2.5
fillColor: 'rgba(0,102,204,0.15)'
마커 이미지: assets/images/icon-point.png
마커 anchor: {x: 0.5, y: 1.0}
```
섹션 구조 (라이트 ↔ 다크 교차)
```
라이트 타일: background #ffffff 또는 #f5f5f7
다크 타일:  background #272729, color #ffffff
전환 자체가 구분선 — 별도 보더/선 불필요
```
---
화면별 가이드
인증 화면 (login, signup)
```
배경: #ffffff
상단 로고: "다왔어" 36px / 600 / color #0066cc
슬로건: 14px / 400 / color #7a7a7a
입력 필드: background #f5f5f7, border rgba(0,0,0,0.08), radius 11px
Primary 버튼: background #0066cc, radius pill
소셜 버튼: 각 브랜드 컬러 유지 (카카오 #FEE500, 구글 white+border)
하단 약관: 12px / color #7a7a7a
```
지도 홈
```
지도: 풀스크린, radius none
검색바: absolute 상단, backdrop-blur, radius pill
알람 마커: icon-point.png + rgba(0,102,204) 반경 Circle
FAB: 우하단, background #0066cc
알람 울림 배너: absolute 상단, background #0066cc, color white
```
알람 목록
```
배경: #f5f5f7
헤더: 30px / 600 / color #1d1d1f
알람 카드: background white, radius 18px, border #e0e0e0, padding 24px
빈 상태: Lottie 중앙 + 14px / color #7a7a7a
```
친구
```
배경: #ffffff
권한 요청 배너: background rgba(0,102,204,0.06), border rgba(0,102,204,0.2), radius 18px
친구 카드: background white, radius 18px, border #e0e0e0
카카오 초대 버튼: background #FEE500, color #1d1d1f, radius pill
```
마이페이지
```
상단 다크 타일: background #272729
아바타: 80px, radius 50%, background #0066cc
닉네임: color white, 18px / 600
이메일: color #cccccc, 14px / 400
메뉴 섹션: background #f5f5f7, radius 18px
로그아웃: background #ef4444, color white, radius pill
```
---
규칙 요약
✅ 해야 할 것	❌ 하지 말 것
`#0066cc` 단일 액센트	두 번째 강조색 추가
버튼 `active: scale(0.95)`	카드/버튼/텍스트에 그림자
카드 radius 18px + hairline border	그라데이션 배경
검색창 radius pill	weight 500 사용
지도 마커 섀도우만 허용	풀블리드 타일 radius
라이트↔다크 섹션 교차	primary-on-dark를 라이트 서피스에
탭바 surface-black (#000000)	inline 스타일
본문 17px / 400	본문 16px
