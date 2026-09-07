# Heat & Mass Transfer (화공열및물질전달) — Interactive Study Companion

SKKU School of Chemical Engineering · Smart Process & Materials Design Lab (SPMDL)
**Prof. S. Joon Kwon** (sjoonkwon@skku.edu)

수업 슬라이드와 함께 사용하는 **인터랙티브 웹 학습 자료**입니다.
1학기 [유체역학 컴패니언](https://fluid-mechanics-ch-e-undergrad.vercel.app/)과 동일한
"허브 + 주차별 모듈" 구조(Vite + React SPA)를 사용합니다.

## 현재 구성

| 주차 | 내용 | 상태 |
|---|---|---|
| **Week 1** | 열 및 물질전달 입문 — 전달현상의 유사성, 통일된 지배방정식, random walk, 열전달 3모드, 물질전달 모드 | ✅ |
| **Week 2** | 열전도의 물리학 — Drude 자유전자 모형, 산란·Matthiessen 법칙, Wiedemann–Franz, 포논 분산관계, 기체 열전도·Knudsen, 대류·복사 맛보기 | ✅ |
| Week 3–16 | 강의계획서 순서대로 카드 생성됨 (준비 중) | ⬜ |

## Week 1 모듈 (탭 구성)

1. **개요** — 전달현상 3분야(운동량·에너지·질량), 화학공학 응용 6종, 연구의 3수준(거시/미시/분자)
2. **전달의 유사성** — Newton·Fourier·Fick 법칙을 구배 슬라이더로 동시 조작, 물질 4종 프리셋, ν·α·D 비교표 + Pr/Sc/Le
3. **통일된 지배방정식** — ∂φ/∂t = δ ∂²φ/∂x² 를 동일한 FDM 솔버로 세 물리량에 대해 라이브 시뮬레이션 (공기/물/엔진오일)
4. **분자적 기원** — 4,000 입자 1D random walk → Gaussian 수렴, σ = ℓ√n 스케일링
5. **열전달 3모드** — 전도·대류·복사 열유속을 슬라이더(Tₛ, h, k, L, ε)로 실시간 비교
6. **물질전달 모드** — 이류–확산 펄스 시뮬레이션 + Peclet 수, 확산의 5가지 유형 카드
7. **연습문제** — 8문항 (한/영, 풀이 토글)
8. **Raw 코드** — 4주제 × 4언어(Python/MATLAB/Julia/C++) 열람·복사·다운로드

## Week 2 모듈 (탭 구성)

1. **개요** — 열의 세 운반자(전자·포논·기체 분자)와 열관리 응용
2. **Drude 모형** — 전자 400개 Monte-Carlo 라이브 시뮬레이션: 혼돈 속 표류속도 v_d = aτ 수렴
3. **산란과 온도** — 고전 √T 실패 vs 양자 보정, Matthiessen 법칙 인터랙티브 ρ(T)
4. **Wiedemann–Franz** — 실측 금속 10종으로 κ/σ = LT 검증 (산점도 + 표)
5. **포논 전도** — 이원자 사슬 분산관계(질량비·스프링 슬라이더), k(T) 봉우리
6. **기체 열전도** — 압력 무관성 계산기(기체 6종), Knudsen 영역·에어로젤
7. **대류·복사 맛보기** — h 범위 시각화, Planck 스펙트럼 인터랙티브(Wien·σT⁴)
8. **연습문제** — 풀이 토글형 8문항
9. **Raw 코드** — Drude MC · 포논 분산 · W–F 검증 · Planck→Stefan-Boltzmann (Python/MATLAB/Julia/C++)

## 로컬 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 프로덕션 빌드 → dist/
```

## 폴더 구조

```
├── index.html                # Pretendard / Noto Sans KR 폰트 로드
├── src/
│   ├── main.jsx
│   ├── App.jsx               # 허브 (16주 카드, 언어 토글, 주차 라우팅)
│   ├── Week1App.jsx          # Week 1 모듈 (자기완결형 단일 파일)
│   └── Week1Codes.js         # Raw 코드 문자열 (웹 열람/다운로드용)
├── codes/                    # 학생 배포용 standalone 코드
│   ├── python/  wk01_*.py
│   ├── matlab/  wk01_*.m
│   ├── julia/   wk01_*.jl
│   └── cpp/     wk01_*.cpp
└── integration/
    └── DEPLOY_GUIDE.md       # GitHub push + Vercel 배포 절차
```

## 새 주차 추가 방법 (3단계)

1. `src/Week2App.jsx` 작성 (Week1App.jsx를 템플릿으로)
2. `src/App.jsx`에서 ① `import Week2App` ② `weeks.KR/EN`의 해당 항목에 `topics` 채우고 `ready: true` ③ `comps` 객체에 `2: Week2App` 등록
3. `git push` → Vercel이 자동 재배포

## 학습 목표 (Week 1)

- 운동량·열·질량 전달이 **flux = −(수송계수)×(구배)** 라는 동일한 수학적 구조를 공유함을 설명할 수 있다.
- ν, α, D가 모두 m²/s 단위임을 차원해석으로 보이고 Pr, Sc, Le를 계산할 수 있다.
- 확산의 분자적 기원(random walk)과 √t 스케일링, D = ℓ²/2Δt 관계를 유도할 수 있다.
- 전도·대류·복사의 지배 영역을 조건(온도, h, k, ε)에 따라 판단할 수 있다.
- Peclet 수로 이류와 확산의 상대적 중요도를 평가할 수 있다.

## 교재

- **주교재**: Welty, Rorrer & Foster, *Fundamentals of Momentum, Heat, and Mass Transfer*, 7th ed., Wiley (2020)
- 부교재: Deen, *Analysis of Transport Phenomena*, 2nd ed. (2011) · Holman, *Heat Transfer*, 10th ed. (2009)

---
© Prof. S. Joon Kwon · SPMDL · SKKU — 교육 목적의 자료입니다.
