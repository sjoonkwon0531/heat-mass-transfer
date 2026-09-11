# Week 3 통합 가이드 (App.jsx 3-point update)

새 파일 2개를 `src/`에 추가한 뒤, `App.jsx`에서 아래 세 곳만 수정하면 됩니다.

## 0. 파일 배치
```
src/Week3App.jsx
src/Week3Codes.js
```
(참고용 독립 실행 코드 16개는 `codes/` 폴더 — repo에는 `public/codes/` 또는 별도 보관, 앱 빌드에는 불필요)

## 1. import 추가 (파일 상단, Week2App import 아래)
```jsx
import Week3App from './Week3App';
```

## 2. 주차 카드 엔트리 활성화 (KR/EN 두 배열 모두)
Week 3 카드를 `ready: true`로 바꾸고 제목/설명을 채웁니다.

KR 배열:
```jsx
{
  week: 3,
  title: '정상상태 열전도',
  desc: '전도·대류 결합, 열저항 회로, 지배방정식과 경계조건, 1D 해석해와 핀, 2D 변수분리법, FDM',
  ready: true,
},
```

EN 배열:
```jsx
{
  week: 3,
  title: 'Steady-State Heat Conduction',
  desc: 'Combined conduction & convection, thermal circuits, governing equations & BCs, 1D solutions & fins, 2D separation of variables, FDM',
  ready: true,
},
```

## 3. 컴포넌트 레지스트리 등록
주차 → 컴포넌트 매핑 객체(comps)에 추가:
```jsx
const comps = { 1: Week1App, 2: Week2App, 3: Week3App };
```

`Week3App`은 `language`("kr"/"en")와 `onBack` props를 받으며, 내부에 KR/EN 토글도 자체 탑재되어 있습니다(Week 1·2와 동일 인터페이스).

## 빌드 확인
```
npm run build
```
이 패키지는 Vite 8 + React 환경에서 프로덕션 빌드 통과를 확인했습니다(외부 라이브러리 의존성 없음 — React만 사용).
