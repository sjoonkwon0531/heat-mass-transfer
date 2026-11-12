// ============================================================
// App.jsx — Heat & Mass Transfer (화공열및물질전달) Hub
// SKKU School of Chemical Engineering — SPMDL
// Prof. S. Joon Kwon — Fall 2026
// ------------------------------------------------------------
// Same "hub + weekly module" pattern as
// Fluid-Mechanics-ChE-Undergrad:
//   ① import WeekNApp  ② weeks.KR / weeks.EN entry  ③ comps registry
// ============================================================
import { useState } from "react";
import Week1App from "./Week1App.jsx";
import Week2App from "./Week2App.jsx";
import Week3App from "./Week3App.jsx";
import Week4App from "./Week4App.jsx";
import Week5App from "./Week5App.jsx";
import Week6App from "./Week6App.jsx";
import Week7App from "./Week7App.jsx";
import Week8App from "./Week8App.jsx";
import Week9App from "./Week9App.jsx";
import Week10App from "./Week10App.jsx";
import Week11App from "./Week11App.jsx";
import Week12App from "./Week12App.jsx";

const C = {
  bg: "#0b0f17",
  panel: "#111827",
  card: "#1f2937",
  border: "#374151",
  text: "#e5e7eb",
  textDim: "#9ca3af",
  accent: "#3b82f6",
};

// ── Week registry ────────────────────────────────────────────
const weeks = {
  KR: [
    {
      id: 1,
      title: "Week 1",
      subtitle: "열 및 물질전달 입문",
      topics: [
        "전달현상(Transport Phenomena)이란?",
        "운동량·열·물질 전달의 유사성 (Newton · Fourier · Fick)",
        "통일된 지배방정식 — 하나의 수학, 세 가지 물리",
        "Random walk — 확산의 분자적 기원",
        "열전달 3모드 (전도·대류·복사)",
        "물질전달 모드 · Peclet 수",
      ],
      color: "#f59e0b",
      ready: true,
    },
    {
      id: 2,
      title: "Week 2",
      subtitle: "열전도의 물리학 — 전자·포논·기체",
      topics: [
        "열관리 응용 (전자기기 방열 · 반도체 패키징)",
        "Drude 자유전자 모형 — v_d = −eEτ/m, σ = ne²τ/m",
        "산란·평균자유시간 τ · Matthiessen 법칙",
        "Wiedemann–Franz 법칙 (κ/σ = LT)",
        "포논 전도 · 이원자 격자의 분산관계",
        "기체 열전도의 압력 무관성 · Knudsen 영역",
        "대류(Newton 냉각) · 복사(Planck → σT⁴) 맛보기",
      ],
      color: "#ef4444",
      ready: true,
    },
    {
      id: 3,
      title: "Week 3",
      subtitle: "정상상태 열전도",
      topics: [
        "전도·대류 결합과 열저항 회로",
        "지배방정식과 경계조건",
        "1D 해석해와 핀(fin)",
        "2D 변수분리법",
        "FDM (유한차분법)",
      ],
      color: "#f97316",
      ready: true,
    },
    {
      id: 4,
      title: "Week 4",
      subtitle: "비정상 열전도 — 열방정식 (PSET #1)",
      topics: [
        "열방정식 유도와 무차원화 (r, τ, U · Fo)",
        "PDE 분류 — 열방정식은 포물선형",
        "발열 와이어와 Biot 수의 물리적 의미",
        "집중용량법: θ/θ₀ = exp(−Bi·Fo)",
        "변수분리법 · 1항 근사 · Heisler 차트",
        "반무한체: 자기유사 erf 해 · Laplace · 적분법",
        "명시적 FDM 행렬법 U(n+1) = D·U(n) + Δτ·q",
      ],
      color: "#eab308",
      ready: true,
    },
    {
      id: 5,
      title: "Week 5",
      subtitle: "대류 열전달",
      topics: [
        "운동량·열 경계층과 Prandtl 수 (δ/δt ~ Pr^⅓)",
        "차원해석: Nu = f(Re, Pr) · 자연대류 Nu = f(Gr, Pr)",
        "Nu와 Bi의 구분 — 분모의 k가 다르다",
        "Blasius 자기유사 해와 슈팅법 (f″(0) = 0.332)",
        "층류 평판: Nu_x = 0.332 Pr^⅓ √Re_x · 적분법 비교",
        "난류 천이 (Re_crit = 5×10⁵)와 결합 상관식",
        "관내 대류: Graetz·Nu_∞ = 3.66/4.364·Gnielinski·LMTD",
      ],
      color: "#84cc16",
      ready: true,
    },
    {
      id: 6,
      title: "Week 6",
      subtitle: "해법·상변화·밀폐유동 이론",
      topics: [
        "유한 푸리에 변환(FFT): 기저함수·일반화 급수·Gibbs",
        "과도 문제: 정상상태 도달 t ≈ 0.3 L²/D · 정상상태가 없는 경우",
        "비등 곡선: Rohsenow · CHF · Leidenfrost · 막비등",
        "Nusselt 응축막: 0.943 공식 · 원통 0.725 · n-튜브 뱅크",
        "혼합컵 평균과 중공사 투석기 (⟨k⟩)",
        "입구영역 Lévêque Nu ~ z^(−1/3) · 입구길이 0.1 Pe·R",
        "Graetz 고유값 λ₁ = 2.7044 → Nu∞ = λ₁²/2 = 3.656",
      ],
      color: "#10b981",
      ready: true,
    },
    {
      id: 7,
      title: "Week 7",
      subtitle: "중간고사 리뷰 & 시험",
      topics: [
        "1–6주차 개념 지도 · 무차원수 총정리 (Bi·Fo·Re·Pr·Nu·Pe·Gr·St)",
        "공식 시트 — 공식마다 '사용 조건'까지",
        "개념 체크 퀴즈 16문항 (즉시 해설)",
        "2024 기출 3문제 단계별 워크스루",
        "자주 하는 실수 8가지 · 시험 전 체크리스트",
      ],
      color: "#14b8a6",
      ready: true,
    },
    {
      id: 8,
      title: "Week 8",
      subtitle: "열교환기 제어 & 복사 열전달",
      topics: [
        "교반조 에너지 수지 → 1차계 전달함수 K/(τs+1)",
        "FOPDT 2점 피팅: τₚ = 21.3 s, θₚ = 14.7 s",
        "P·PI·PID 피드백 — ITAE 튜닝 (Kc = 1.234) · 피드포워드",
        "플랑크 법칙 → σT⁴ · Wien λ_C T = 2898 μm·K",
        "형상계수 F₁₂: 상호성·합산 법칙·차트와 공식",
        "회색체 라디오시티 네트워크: 3표면 예제 (328 → 131 kW)",
      ],
      color: "#22d3ee",
      ready: true,
    },
    {
      id: 9,
      title: "Week 9",
      subtitle: "물질전달의 기초",
      topics: [
        "농도·기준속도와 플럭스: N_A = −cD∇y_A + y_A(N_A + N_B)",
        "화학 퍼텐셜과 Nernst–Einstein — 확산의 진짜 구동력",
        "기체 D: Lennard-Jones · Chapman–Enskog(Ω_D) · Fuller",
        "액체 D: Stokes–Einstein · Wilke–Chang",
        "세공 확산: Knudsen D_K ∝ T^½ · 전이 영역 · Monte Carlo 다공체",
        "고체 확산: D = D₀exp(−Q/RT) · erf 확산쌍 · 도핑",
        "Langevin 방정식: ⟨x²⟩ 탄도→확산, D = k_BT/(mγ)",
        "화학종 연속방정식 · Raoult/Henry 경계조건 · W CVD 막",
      ],
      color: "#3b82f6",
      ready: true,
    },
    { id: 10, title: "Week 10", subtitle: "정상상태 분자확산",           topics: ["Stefan 관·로그 평균", "Si 산화·탄소 연소 (유사 정상)", "반응 액막 Hatta·CVD Grove 모델", "도펀트 확산·2D Laplace·TEOS 웨이퍼", "비응축 기체 속 응축"], color: "#6366f1", ready: true },
    { id: 11, title: "Week 11", subtitle: "비정상상태 분자확산 (PSET #2)", topics: ["반무한 매질·erfc·Si 도핑 깊이", "평판·구의 고유함수 전개 (약물 방출)", "Sturm–Liouville 이론과 직교성", "Bessel 함수·전열선 유한 Fourier 변환", "반응 구(촉매 유효 인자)·Legendre·Maxwell"], color: "#8b5cf6", ready: true },
    { id: 12, title: "Week 12", subtitle: "대류 물질전달",               topics: ["무차원수·Sherwood 수·Blasius 해", "농도 경계층 (Pohlhausen)·적분 방법", "난류·혼합 길이·와확산", "Reynolds·Prandtl·von Kármán·Chilton–Colburn 유사성", "k_c 모델·습구 온도·Lewis 수"], color: "#a78bfa", ready: true },
    { id: 13, title: "Week 13", subtitle: "전도·확산 문제의 해법",        topics: [], color: "#d946ef", ready: false },
    { id: 14, title: "Week 14", subtitle: "심화 1 — 다상 전달 · 반도체 공정", topics: [], color: "#f472b6", ready: false },
    { id: 15, title: "Week 15", subtitle: "심화 2 — 패턴 형성 · 상분리",  topics: [], color: "#fb7185", ready: false },
    { id: 16, title: "Week 16", subtitle: "기말 리뷰 & 시험 (Term Paper)", topics: [], color: "#94a3b8", ready: false },
  ],
  EN: [
    {
      id: 1,
      title: "Week 1",
      subtitle: "Intro to Heat & Mass Transfer",
      topics: [
        "What is Transport Phenomena?",
        "Analogy of momentum · heat · mass transfer (Newton · Fourier · Fick)",
        "One unified governing equation — one math, three physics",
        "Random walk — molecular origin of diffusion",
        "Three modes of heat transfer (conduction · convection · radiation)",
        "Mass transfer modes · Peclet number",
      ],
      color: "#f59e0b",
      ready: true,
    },
    {
      id: 2,
      title: "Week 2",
      subtitle: "Physics of Heat Conduction — Electrons · Phonons · Gases",
      topics: [
        "Thermal-management applications (electronics · packaging)",
        "Drude free-electron model — v_d = −eEτ/m, σ = ne²τ/m",
        "Scattering & mean free time τ · Matthiessen's rule",
        "Wiedemann–Franz law (κ/σ = LT)",
        "Phonon conduction · diatomic-lattice dispersion",
        "Pressure-independent gas conduction · Knudsen regime",
        "First look at convection (Newton) & radiation (Planck → σT⁴)",
      ],
      color: "#ef4444",
      ready: true,
    },
    {
      id: 3,
      title: "Week 3",
      subtitle: "Steady-State Heat Conduction",
      topics: [
        "Combined conduction & convection, thermal circuits",
        "Governing equations & boundary conditions",
        "1D analytical solutions & fins",
        "2D separation of variables",
        "FDM (finite differences)",
      ],
      color: "#f97316",
      ready: true,
    },
    {
      id: 4,
      title: "Week 4",
      subtitle: "Unsteady Heat Conduction — The Heat Equation (PSET #1)",
      topics: [
        "Deriving & nondimensionalizing the heat equation (r, τ, U · Fo)",
        "PDE classification — the heat equation is parabolic",
        "Heat-generating wire & the physics of the Biot number",
        "Lumped capacitance: θ/θ₀ = exp(−Bi·Fo)",
        "Separation of variables · one-term approximation · Heisler charts",
        "Semi-infinite solids: self-similar erf · Laplace · integral method",
        "Explicit FDM matrix method U(n+1) = D·U(n) + Δτ·q",
      ],
      color: "#eab308",
      ready: true,
    },
    {
      id: 5,
      title: "Week 5",
      subtitle: "Convective Heat Transfer",
      topics: [
        "Momentum & thermal boundary layers, the Prandtl number (δ/δt ~ Pr^⅓)",
        "Dimensional analysis: Nu = f(Re, Pr) · natural convection Nu = f(Gr, Pr)",
        "Nu vs Bi — different k in the denominator",
        "Blasius similarity solution & the shooting method (f″(0) = 0.332)",
        "Laminar plate: Nu_x = 0.332 Pr^⅓ √Re_x · integral method",
        "Turbulent transition (Re_crit = 5×10⁵) & the combined correlation",
        "Pipe convection: Graetz · Nu_∞ = 3.66/4.364 · Gnielinski · LMTD",
      ],
      color: "#84cc16",
      ready: true,
    },
    {
      id: 6,
      title: "Week 6",
      subtitle: "Solution Methods · Phase Change · Confined-Flow Theory",
      topics: [
        "Finite Fourier transform: basis functions · generalized series · Gibbs",
        "Transients: steady state at t ≈ 0.3 L²/D · when none exists",
        "Boiling curve: Rohsenow · CHF · Leidenfrost · film boiling",
        "Nusselt film condensation: 0.943 · cylinders 0.725 · n-tube banks",
        "Mixing-cup averages & the hollow-fiber dialyzer (⟨k⟩)",
        "Entrance region: Lévêque Nu ~ z^(−1/3) · length 0.1 Pe·R",
        "Graetz eigenvalues λ₁ = 2.7044 → Nu∞ = λ₁²/2 = 3.656",
      ],
      color: "#10b981",
      ready: true,
    },
    {
      id: 7,
      title: "Week 7",
      subtitle: "Midterm Review & Exam",
      topics: [
        "Weeks 1–6 concept map · all dimensionless groups (Bi·Fo·Re·Pr·Nu·Pe·Gr·St)",
        "Formula sheet — every formula with its validity condition",
        "16-question concept quiz with instant explanations",
        "Step-by-step walkthrough of the three 2024 exam problems",
        "Eight common pitfalls · final pre-exam checklist",
      ],
      color: "#14b8a6",
      ready: true,
    },
    {
      id: 8,
      title: "Week 8",
      subtitle: "Heat-Exchanger Control & Radiative Heat Transfer",
      topics: [
        "Stirred-tank energy balance → first-order transfer function K/(τs+1)",
        "FOPDT two-point fit: τₚ = 21.3 s, θₚ = 14.7 s",
        "P · PI · PID feedback — ITAE tuning (Kc = 1.234) · feedforward",
        "Planck's law → σT⁴ · Wien λ_C T = 2898 μm·K",
        "View factor F₁₂: reciprocity · summation rule · charts & formulas",
        "Gray-surface radiosity networks: 3-surface example (328 → 131 kW)",
      ],
      color: "#22d3ee",
      ready: true,
    },
    {
      id: 9,
      title: "Week 9",
      subtitle: "Fundamentals of mass transfer",
      topics: [
        "Concentrations, reference velocities & fluxes: N_A = −cD∇y_A + y_A(N_A + N_B)",
        "Chemical potential & Nernst–Einstein — the true driving force",
        "Gas D: Lennard-Jones · Chapman–Enskog (Ω_D) · Fuller",
        "Liquid D: Stokes–Einstein · Wilke–Chang",
        "Pore diffusion: Knudsen D_K ∝ T^½ · transition · Monte Carlo porous solid",
        "Solid diffusion: D = D₀exp(−Q/RT) · erf diffusion couple · doping",
        "Langevin equation: ⟨x²⟩ ballistic→diffusive, D = k_BT/(mγ)",
        "Species continuity · Raoult/Henry boundary conditions · W CVD film",
      ],
      color: "#3b82f6",
      ready: true,
    },
    { id: 10, title: "Week 10", subtitle: "Steady-state molecular diffusion",     topics: ["Stefan tube & log mean", "Si oxidation & carbon burnout (pseudo-steady)", "Reacting film (Hatta) & Grove CVD model", "Dopant diffusion, 2D Laplace & TEOS wafers", "Condensation with a noncondensable gas"], color: "#6366f1", ready: true },
    { id: 11, title: "Week 11", subtitle: "Unsteady molecular diffusion (PSET #2)", topics: ["Semi-infinite media, erfc & Si doping depth", "Eigenfunction expansions in slabs & spheres (drug release)", "Sturm–Liouville theory & orthogonality", "Bessel functions & the heated wire (finite Fourier transform)", "Reacting sphere (effectiveness factor), Legendre & Maxwell"], color: "#8b5cf6", ready: true },
    { id: 12, title: "Week 12", subtitle: "Convective mass transfer",             topics: ["Dimensionless groups, Sherwood number & Blasius", "Concentration boundary layer (Pohlhausen) & integral method", "Turbulence, mixing length & eddy diffusivity", "Reynolds, Prandtl, von Kármán & Chilton–Colburn analogies", "k_c models, wet-bulb temperature & Lewis number"], color: "#a78bfa", ready: true },
    { id: 13, title: "Week 13", subtitle: "Solution methods for conduction & diffusion", topics: [], color: "#d946ef", ready: false },
    { id: 14, title: "Week 14", subtitle: "Advanced 1 — Multiphase · semiconductor processes", topics: [], color: "#f472b6", ready: false },
    { id: 15, title: "Week 15", subtitle: "Advanced 2 — Pattern formation · phase separation", topics: [], color: "#fb7185", ready: false },
    { id: 16, title: "Week 16", subtitle: "Final review & exam (Term Paper due)", topics: [], color: "#94a3b8", ready: false },
  ],
};

// ── Component registry ───────────────────────────────────────
const comps = {
  KR: { 1: Week1App, 2: Week2App, 3: Week3App, 4: Week4App, 5: Week5App, 6: Week6App, 7: Week7App, 8: Week8App, 9: Week9App, 10: Week10App, 11: Week11App, 12: Week12App },
  EN: { 1: Week1App, 2: Week2App, 3: Week3App, 4: Week4App, 5: Week5App, 6: Week6App, 7: Week7App, 8: Week8App, 9: Week9App, 10: Week10App, 11: Week11App, 12: Week12App },
};

export default function App() {
  // Language: null = not chosen yet → show landing select screen.
  // Choice is remembered in localStorage across visits.
  const [lang, setLangState] = useState(() => {
    try {
      const v = localStorage.getItem("hmt_lang");
      return v === "KR" || v === "EN" ? v : null;
    } catch { return null; }
  });
  const [activeWeek, setActiveWeek] = useState(null);
  const setLang = (L) => {
    setLangState(L);
    try { localStorage.setItem("hmt_lang", L); } catch { /* ignore */ }
  };

  if (lang == null) return <LangSelect onSelect={setLang} />;

  const list = weeks[lang];
  const isKo = lang === "KR";

  if (activeWeek != null) {
    const Comp = comps[lang][activeWeek];
    if (Comp) return (
      <Comp
        onBack={() => setActiveWeek(null)}
        lang={isKo ? "ko" : "en"}
        onLangChange={(l) => setLang(l === "ko" ? "KR" : "EN")}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0a0e15 100%)`,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 20px",
    }}>
      {/* Header */}
      <header style={{
        maxWidth: 1200, margin: "0 auto 24px auto",
        padding: "28px 28px",
        background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(59,130,246,0.06))",
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.textDim, letterSpacing: 2 }}>
            SKKU · SCHOOL OF CHEMICAL ENGINEERING · SPMDL
          </div>
          <h1 style={{ margin: "8px 0 4px 0", fontSize: 30, fontWeight: 800 }}>
            Heat &amp; Mass Transfer
          </h1>
          <div style={{ fontSize: 16, color: C.textDim }}>
            {isKo ? "화공열및물질전달 — 인터랙티브 스터디 컴패니언" : "Interactive Study Companion"}
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 10 }}>
            Prof. S. Joon Kwon · Smart Process &amp; Materials Design Lab (SPMDL)
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["KR", "EN"].map((L) => (
            <button key={L} onClick={() => setLang(L)} style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${lang === L ? C.accent : C.border}`,
              background: lang === L ? "rgba(59,130,246,0.15)" : "transparent",
              color: lang === L ? "#93c5fd" : C.textDim,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>{L === "KR" ? "한국어" : "English"}</button>
          ))}
        </div>
      </header>

      {/* Week cards */}
      <main style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {list.map((w) => (
          <div
            key={w.id}
            onClick={() => w.ready && setActiveWeek(w.id)}
            style={{
              background: C.panel,
              border: `1px solid ${w.ready ? w.color + "55" : C.border}`,
              borderRadius: 16,
              padding: "20px 22px",
              cursor: w.ready ? "pointer" : "default",
              opacity: w.ready ? 1 : 0.45,
              transition: "transform 0.15s, border-color 0.15s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => { if (w.ready) e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: w.color,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: w.color, letterSpacing: 1 }}>
                {w.title}
              </div>
              {!w.ready && (
                <span style={{ fontSize: 11, color: C.textDim }}>
                  {isKo ? "준비 중" : "Coming soon"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, margin: "6px 0 10px 0" }}>
              {w.subtitle}
            </div>
            {w.topics.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.textDim, lineHeight: 1.8 }}>
                {w.topics.map((tp, i) => <li key={i}>{tp}</li>)}
              </ul>
            )}
          </div>
        ))}
      </main>

      <footer style={{
        maxWidth: 1200, margin: "28px auto 0 auto",
        padding: "16px 24px", textAlign: "center",
        fontSize: 12, color: C.textDim,
        borderTop: `1px solid ${C.border}`,
      }}>
        © Prof. S. Joon Kwon · SPMDL · SKKU — {isKo
          ? "교육 목적의 인터랙티브 학습 자료입니다. (교재: Welty 7th ed. · Deen 2nd ed. · Holman 10th ed.)"
          : "Interactive learning material for educational use. (Texts: Welty 7th ed. · Deen 2nd ed. · Holman 10th ed.)"}
      </footer>
    </div>
  );
}

// ── First-visit language selection screen ────────────────────
function LangSelect({ onSelect }) {
  const btn = (accent) => ({
    padding: "18px 30px",
    minWidth: 220,
    borderRadius: 14,
    border: `1px solid ${accent}66`,
    background: `linear-gradient(135deg, ${accent}22, transparent)`,
    color: C.text,
    cursor: "pointer",
    fontSize: 17,
    fontWeight: 700,
    fontFamily: "inherit",
    transition: "transform 0.15s, border-color 0.15s",
  });
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0a0e15 100%)`,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        maxWidth: 620, width: "100%", textAlign: "center",
        background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "48px 32px",
      }}>
        <div style={{ fontSize: 12, color: C.textDim, letterSpacing: 2 }}>
          SKKU · SCHOOL OF CHEMICAL ENGINEERING · SPMDL
        </div>
        <h1 style={{ margin: "14px 0 6px 0", fontSize: 32, fontWeight: 800 }}>
          Heat &amp; Mass Transfer
        </h1>
        <div style={{ fontSize: 17, color: C.textDim, marginBottom: 6 }}>화공열및물질전달</div>
        <div style={{ fontSize: 13, color: C.textDim, marginBottom: 36 }}>
          Prof. S. Joon Kwon · Interactive Study Companion
        </div>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 18 }}>
          언어를 선택하세요 · Please select your language
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onSelect("KR")}
            style={btn(C.warn)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            🇰🇷 한국어
          </button>
          <button
            onClick={() => onSelect("EN")}
            style={btn(C.accent)}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            🇺🇸 English
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 28 }}>
          나중에 언제든 상단 버튼으로 변경할 수 있습니다 · You can switch anytime from the header.
        </div>
      </div>
    </div>
  );
}
