// ============================================================
// Week1App.jsx — Intro to Heat & Mass Transfer
// 화공열및물질전달 (Heat & Mass Transfer for Chemical Engineering)
// SKKU School of Chemical Engineering — SPMDL
// Prof. S. Joon Kwon
// ------------------------------------------------------------
// Based on: Wk01_HeatMassTransport_SJKWON_SKKU_NEW_VER.pdf
//   • What is Transport Phenomena? (momentum / energy / mass)
//   • Shared mathematical framework & molecular mechanisms
//   • Three levels of study (macroscopic / microscopic / molecular)
//   • Heat transfer: conduction · convection · radiation
//   • Mass transfer: diffusion (+ variants) · convection
// Extended interactive content:
//   • Unified gradient-law explorer (Newton · Fourier · Fick)
//   • One-PDE-three-physics live simulation (ν, α, D + Pr/Sc/Le)
//   • Random-walk → Gaussian diffusion demo
//   • Advection–diffusion & Peclet number
// ============================================================
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  PY_ANALOGY, ML_ANALOGY, JL_ANALOGY, CPP_ANALOGY,
  PY_WALK, ML_WALK, JL_WALK, CPP_WALK,
  PY_UNIFIED, ML_UNIFIED, JL_UNIFIED, CPP_UNIFIED,
  PY_MODES, ML_MODES, JL_MODES, CPP_MODES,
} from "./Week1Codes";

// ── i18n ─────────────────────────────────────────────────────
const i18n = {
  ko: {
    weekTitle: "Week 1 — 열 및 물질전달 입문",
    subtitle: "전달현상: 하나의 수학적 구조, 세 가지 물리 (운동량 · 에너지 · 질량)",
    tabs: {
      overview: "개요",
      analogy: "전달의 유사성",
      unified: "통일된 지배방정식",
      walk: "분자적 기원",
      heatmodes: "열전달 3모드",
      massmodes: "물질전달 모드",
      practice: "연습문제",
      codes: "Raw 코드",
    },
    run: "▶ 실행", stop: "■ 정지", reset: "↺ 초기화",
    show: "보기", hide: "숨기기",
  },
  en: {
    weekTitle: "Week 1 — Intro to Heat & Mass Transfer",
    subtitle: "Transport phenomena: one mathematical structure, three physics (momentum · energy · mass)",
    tabs: {
      overview: "Overview",
      analogy: "Transport Analogy",
      unified: "Unified Equation",
      walk: "Molecular Origin",
      heatmodes: "3 Modes of Heat",
      massmodes: "Mass Transfer Modes",
      practice: "Practice",
      codes: "Raw Codes",
    },
    run: "▶ Run", stop: "■ Stop", reset: "↺ Reset",
    show: "Show", hide: "Hide",
  },
};

// ── Common style tokens (matching fluid-mechanics repo) ──────
const C = {
  bg: "#0b0f17",
  panel: "#111827",
  card: "#1f2937",
  border: "#374151",
  text: "#e5e7eb",
  textDim: "#9ca3af",
  accent: "#3b82f6",
  accentSoft: "#60a5fa",
  warn: "#f59e0b",
  ok: "#10b981",
  err: "#ef4444",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  pink: "#f472b6",
};

// Colors for the three transport modes — used consistently everywhere
const MOM = "#60a5fa";   // momentum  (blue)
const HEAT = "#f87171";  // energy    (red)
const MASS = "#34d399";  // mass      (green)

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function Week1App({ onBack }) {
  const [lang, setLang] = useState("ko");
  const [tab, setTab] = useState("overview");
  const t = i18n[lang];
  const handleBack = onBack || (() => { if (typeof window !== "undefined" && window.__backToHome) window.__backToHome(); });

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0a0e15 100%)`,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px",
    }}>
      {/* Header */}
      <header style={{
        maxWidth: 1400, margin: "0 auto 16px auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px",
        background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(59,130,246,0.05))",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.textDim, letterSpacing: 2 }}>
            SKKU · CHEM. ENG. · SPMDL
          </div>
          <h1 style={{ margin: "6px 0 2px 0", fontSize: 24, fontWeight: 700, color: C.text }}>
            {t.weekTitle}
          </h1>
          <div style={{ fontSize: 13, color: C.textDim }}>{t.subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleBack} style={btnStyle(false)}>← {lang === "ko" ? "홈" : "Home"}</button>
          <button onClick={() => setLang("ko")} style={btnStyle(lang === "ko")}>한국어</button>
          <button onClick={() => setLang("en")} style={btnStyle(lang === "en")}>English</button>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{
        maxWidth: 1400, margin: "0 auto 16px auto",
        display: "flex", flexWrap: "wrap", gap: 6,
        padding: 8,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        {Object.entries(t.tabs).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={tabBtnStyle(tab === k)}>{label}</button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 1400, margin: "0 auto" }}>
        {tab === "overview" && <Overview lang={lang} />}
        {tab === "analogy" && <Analogy lang={lang} />}
        {tab === "unified" && <UnifiedPDE lang={lang} t={t} />}
        {tab === "walk" && <RandomWalk lang={lang} t={t} />}
        {tab === "heatmodes" && <HeatModes lang={lang} />}
        {tab === "massmodes" && <MassModes lang={lang} t={t} />}
        {tab === "practice" && <Practice lang={lang} />}
        {tab === "codes" && <RawCodes lang={lang} />}
      </main>

      <footer style={{
        maxWidth: 1400, margin: "24px auto 0 auto",
        padding: "16px 24px", textAlign: "center",
        fontSize: 12, color: C.textDim,
        borderTop: `1px solid ${C.border}`,
      }}>
        © Prof. S. Joon Kwon · SPMDL · SKKU. {lang === "ko"
          ? "교육 목적의 인터랙티브 학습 자료입니다."
          : "Interactive learning material for educational use."}
      </footer>
    </div>
  );
}

// =============================================================
// SHARED STYLE HELPERS
// =============================================================
function btnStyle(active = false) {
  return {
    padding: "7px 14px",
    borderRadius: 8,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? "rgba(59,130,246,0.15)" : "transparent",
    color: active ? "#93c5fd" : C.textDim,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
function tabBtnStyle(active) {
  return {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    background: active ? C.accent : "transparent",
    color: active ? "#fff" : C.textDim,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 600,
  };
}
function Card({ children, style }) {
  return (
    <section style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      marginBottom: 16,
      ...style,
    }}>{children}</section>
  );
}
function Eq({ children, style }) {
  return (
    <div style={{
      background: "#0d1220",
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "12px 16px",
      fontFamily: "'Cambria Math', 'STIX Two Math', 'Times New Roman', serif",
      fontSize: 17,
      textAlign: "center",
      margin: "10px 0",
      overflowX: "auto",
      ...style,
    }}>{children}</div>
  );
}
function Slider({ label, value, min, max, step, onChange, unit, color }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, color: C.textDim, minWidth: 180 }}>
      <span style={{ color: color || C.text }}>{label}</span>
      {" — "}
      <b style={{ color: color || C.accentSoft }}>{typeof value === "number" ? value : ""}{unit || ""}</b>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || C.accent }}
      />
    </label>
  );
}
function H2({ children }) {
  return <h2 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 700, color: C.text }}>{children}</h2>;
}
function H3({ children, color }) {
  return <h3 style={{ margin: "14px 0 8px 0", fontSize: 15, fontWeight: 700, color: color || C.accentSoft }}>{children}</h3>;
}
function P({ children }) {
  return <p style={{ fontSize: 13.5, lineHeight: 1.85, color: C.text, margin: "8px 0" }}>{children}</p>;
}

// =============================================================
// TAB 1 — OVERVIEW
// =============================================================
function Overview({ lang }) {
  const isKo = lang === "ko";

  const pillars = [
    {
      color: MOM,
      name: isKo ? "유체역학 (운동량 전달)" : "Fluid Dynamics (Momentum)",
      law: "Newton",
      eq: "τ = −μ (dv/dy)",
      coeff: isKo ? "점도 μ" : "Viscosity μ",
      profile: isKo ? "속도 · 압력 분포, 운동량 flux" : "Velocity / pressure profiles, momentum flux",
    },
    {
      color: HEAT,
      name: isKo ? "열전달 (에너지 전달)" : "Heat Transfer (Energy)",
      law: "Fourier",
      eq: "q = −k (dT/dx)",
      coeff: isKo ? "열전도도 k" : "Thermal conductivity k",
      profile: isKo ? "온도 분포, 에너지 flux" : "Temperature profiles, energy flux",
    },
    {
      color: MASS,
      name: isKo ? "물질전달 (질량 전달)" : "Mass Transfer (Mass)",
      law: "Fick",
      eq: "J = −D (dC/dx)",
      coeff: isKo ? "확산계수 D" : "Diffusivity D",
      profile: isKo ? "농도 분포, 질량 flux" : "Concentration profiles, mass flux",
    },
  ];

  const levels = [
    {
      name: isKo ? "거시적 수준 (Macroscopic)" : "Macroscopic Level",
      scale: "~ cm – m",
      tool: isKo ? "적분 해석 (Integral analysis)" : "Integral analysis",
      desc: isKo
        ? "제어부피 내부의 세부는 보지 않고, 입·출입만으로 질량·운동량·에너지 수지를 세움. 공정 전체의 전역적 평가에 사용."
        : "Balance mass, momentum, and energy from inputs & outputs only, without resolving details inside the control volume. Used for global assessment.",
    },
    {
      name: isKo ? "미시적 수준 (Microscopic)" : "Microscopic Level",
      scale: "~ μm – cm",
      tool: isKo ? "미분 해석 (Differential analysis)" : "Differential analysis",
      desc: isKo
        ? "제어부피 내부에서 일어나는 일을 미분 수지로 기술 → 속도·온도·농도 분포를 얻어 공정을 이해하고 최적화. 이 과목의 주 무대."
        : "Differential balances resolve what happens inside the control volume → velocity, temperature, concentration profiles. The main stage of this course.",
    },
    {
      name: isKo ? "분자적 수준 (Molecular)" : "Molecular Level",
      scale: "1 – 1000 nm",
      tool: isKo ? "분자 구조 · 분자간 힘" : "Molecular structure & forces",
      desc: isKo
        ? "질량·운동량·에너지 전달을 분자 구조와 분자간 힘으로 근본 이해. 복잡 분자, 극한 온도/압력, 반응성 유동에서 공학자도 관여."
        : "Fundamental understanding via molecular structure & intermolecular forces. Engineers get involved for complex molecules, extreme T/P, reacting flows.",
    },
  ];

  const apps = [
    { icon: "🔥", name: isKo ? "반도체 열관리" : "Semiconductor thermal mgmt.", desc: isKo ? "소자 → DBC → heat spreader → 열교환기로 이어지는 방열 경로 설계" : "Device → DBC → heat spreader → heat exchanger cooling path" },
    { icon: "⚗️", name: isKo ? "반응기 설계" : "Reactor design", desc: isKo ? "반응열 제거, 촉매 표면으로의 물질전달이 전환율을 결정" : "Heat removal & mass transfer to catalyst surfaces set conversion" },
    { icon: "🧪", name: isKo ? "분리공정" : "Separation processes", desc: isKo ? "증류·흡수·건조는 결국 상간(interphase) 열·물질전달 문제" : "Distillation, absorption, drying are interphase heat/mass transfer" },
    { icon: "💧", name: isKo ? "박막 · 코팅 공정" : "Thin films & coating", desc: isKo ? "CVD/ALD의 증착 균일도는 확산과 대류의 경쟁 (Peclet 수)" : "CVD/ALD uniformity = competition of diffusion vs. advection (Pe)" },
    { icon: "🔋", name: isKo ? "배터리 · 연료전지" : "Batteries & fuel cells", desc: isKo ? "이온 확산 + 전기화학 반응 + 발열의 연성 문제" : "Coupled ion diffusion + electrochemistry + heat generation" },
    { icon: "🌡️", name: isKo ? "전자기기 냉각" : "Electronics cooling", desc: isKo ? "전도·대류·복사 세 모드가 동시에 작동하는 실제 시스템" : "All three heat-transfer modes operating simultaneously" },
  ];

  return (
    <>
      <Card>
        <H2>{isKo ? "전달현상(Transport Phenomena)이란?" : "What is Transport Phenomena?"}</H2>
        <P>
          {isKo
            ? "화학공학의 뼈대를 이루는 세 과목 — 유체역학, 열전달, 물질전달 — 은 각각 운동량, 에너지, 질량이라는 서로 다른 물리량을 다루지만, 놀랍게도 같은 수학적 도구와 프레임워크, 그리고 같은 분자적 메커니즘을 공유합니다. 이번 학기의 첫 번째 목표는 이 '공유 구조'를 눈으로 확인하는 것입니다."
            : "The three pillars of chemical engineering — fluid dynamics, heat transfer, and mass transfer — carry different physical quantities (momentum, energy, mass), yet they share the same mathematical tools & frameworks and the same molecular mechanisms. Our first goal this semester: see this shared structure with your own eyes."}
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${p.color}44`,
              borderTop: `3px solid ${p.color}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: p.color }}>{p.name}</div>
              <Eq style={{ fontSize: 16, margin: "10px 0" }}>{p.eq}</Eq>
              <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.7 }}>
                <b style={{ color: C.text }}>{p.law}{isKo ? "의 법칙" : "'s law"}</b> · {p.coeff}<br />
                {p.profile}
              </div>
            </div>
          ))}
        </div>
        <P>
          {isKo
            ? "세 법칙 모두 「flux = −(수송계수) × (구배)」 라는 동일한 형태입니다. 구배(gradient)가 구동력이고, 물질의 고유 성질인 수송계수가 반응 속도를 정합니다. 다음 탭에서 이를 직접 조작해 봅니다."
            : "All three laws take the identical form: flux = −(transport coefficient) × (gradient). The gradient is the driving force; a material property sets how fast the system responds. Play with this in the next tab."}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "왜 화학공학에서 배우는가?" : "Why do chemical engineers learn this?"}</H2>
        <P>
          {isKo
            ? "화학공학의 거의 모든 장치 — 반응기, 증류탑, 열교환기, 건조기, 반도체 공정 챔버 — 는 '무언가를 원하는 곳으로, 원하는 속도로 옮기는' 문제입니다. 열이 얼마나 빨리 빠지는가, 반응물이 촉매 표면에 얼마나 빨리 도달하는가가 곧 장치의 크기와 비용, 제품의 품질을 결정합니다."
            : "Nearly every device in chemical engineering — reactors, distillation columns, heat exchangers, dryers, semiconductor process chambers — is a problem of moving something to the right place at the right rate. How fast heat escapes, how fast reactants reach a catalyst surface: these set equipment size, cost, and product quality."}
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10, marginTop: 10 }}>
          {apps.map((a, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{a.icon} {a.name}</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 6, lineHeight: 1.7 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <H2>{isKo ? "전달현상 연구의 세 가지 수준" : "Three Levels of Study"}</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {levels.map((L, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{L.name}</div>
                <div style={{ fontSize: 12, color: C.warn, fontFamily: "monospace" }}>{L.scale}</div>
              </div>
              <div style={{ fontSize: 12.5, color: C.accentSoft, margin: "6px 0" }}>{L.tool}</div>
              <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.75 }}>{L.desc}</div>
            </div>
          ))}
        </div>
        <P>
          {isKo
            ? "이 과목의 성공 요건: ① 수학 (미분방정식, 벡터, 미적분) ② 수학적 결과의 물리적 해석 습관 ③ 직관과 계산 결과의 비교 ④ 차원해석(dimensional analysis)의 이해."
            : "Requirements for mastering this subject: ① mathematics (ODEs/PDEs, vectors, calculus), ② the habit of physically interpreting mathematical results, ③ comparing intuition against computed results, ④ dimensional analysis."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 2 — TRANSPORT ANALOGY (interactive gradient law)
// =============================================================
function Analogy({ lang }) {
  const isKo = lang === "ko";
  const [grad, setGrad] = useState(1.0);     // dimensionless driving gradient (0–2)
  const [material, setMaterial] = useState("air");

  // Real property sets (room temperature, order-of-magnitude teaching values)
  const materials = {
    air:      { label: isKo ? "공기 (25°C)" : "Air (25°C)",       mu: 1.8e-5, k: 0.026, D: 2.5e-5, rho: 1.18, cp: 1005 },
    water:    { label: isKo ? "물 (25°C)" : "Water (25°C)",       mu: 8.9e-4, k: 0.61,  D: 2.0e-9, rho: 997,  cp: 4180 },
    glycerin: { label: isKo ? "글리세린" : "Glycerin",            mu: 0.95,   k: 0.29,  D: 1.0e-11, rho: 1260, cp: 2430 },
    copper:   { label: isKo ? "구리 (고체)" : "Copper (solid)",   mu: null,   k: 401,   D: null,    rho: 8960, cp: 385 },
  };
  const m = materials[material];
  const nu = m.mu != null ? m.mu / m.rho : null;
  const alpha = m.k / (m.rho * m.cp);
  const Dm = m.D;
  const Pr = nu != null ? nu / alpha : null;
  const Sc = nu != null && Dm != null ? nu / Dm : null;
  const Le = Dm != null ? alpha / Dm : null;

  const fmt = (v) => v == null ? "—" : v.toExponential(2).replace("e-", "×10⁻").replace("e+", "×10⁺");

  const laws = [
    { color: MOM, title: isKo ? "운동량 — Newton" : "Momentum — Newton", flux: "τ", phi: "v", coeffSym: "μ", coeffVal: m.mu, unit: "Pa·s", diff: nu, diffSym: "ν = μ/ρ" },
    { color: HEAT, title: isKo ? "에너지 — Fourier" : "Energy — Fourier", flux: "q", phi: "T", coeffSym: "k", coeffVal: m.k, unit: "W/m·K", diff: alpha, diffSym: "α = k/ρc\u209A" },
    { color: MASS, title: isKo ? "질량 — Fick" : "Mass — Fick", flux: "J", phi: "C", coeffSym: "D", coeffVal: m.D, unit: "m²/s", diff: Dm, diffSym: "D" },
  ];

  return (
    <>
      <Card>
        <H2>{isKo ? "하나의 법칙, 세 개의 이름" : "One Law, Three Names"}</H2>
        <Eq style={{ fontSize: 20 }}>
          <span style={{ color: C.warn }}>flux</span> = − <span style={{ color: C.accentSoft }}>(수송계수)</span> × <span style={{ color: C.ok }}>∂φ/∂x</span>
          {"   "}⇢{"   "}
          <span style={{ color: MOM }}>τ = −μ ∂v/∂y</span> · <span style={{ color: HEAT }}>q = −k ∂T/∂x</span> · <span style={{ color: MASS }}>J = −D ∂C/∂x</span>
        </Eq>
        <P>
          {isKo
            ? "구배(gradient)를 슬라이더로 바꿔 보세요. 세 flux가 모두 같은 방식으로 — 구배에 정비례해서 — 반응합니다. 부호 (−)는 flux가 항상 '높은 곳 → 낮은 곳'으로 흐른다는 열역학 제2법칙의 표현입니다. 물질을 바꾸면 수송계수만 달라질 뿐, 법칙의 형태는 그대로입니다."
            : "Drag the gradient slider. All three fluxes respond identically — in direct proportion to the gradient. The minus sign is the 2nd law of thermodynamics in disguise: flux always runs from high to low. Switching material changes only the coefficient, never the form of the law."}
        </P>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", margin: "10px 0" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Slider label={isKo ? "구배 |∂φ/∂x| (무차원)" : "Gradient |∂φ/∂x| (dimensionless)"}
              value={grad} min={0} max={2} step={0.05} onChange={setGrad} color={C.ok} />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(materials).map(([k, v]) => (
              <button key={k} onClick={() => setMaterial(k)} style={btnStyle(material === k)}>{v.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {laws.map((L, i) => <FluxPanel key={i} L={L} grad={grad} isKo={isKo} />)}
        </div>
      </Card>

      <Card>
        <H2>{isKo ? "확산능(diffusivity)으로 비교하면 — 모두 m²/s" : "Compare as diffusivities — all in m²/s"}</H2>
        <P>
          {isKo
            ? "ν(운동량 확산능), α(열 확산능), D(질량 확산능)는 전부 같은 단위 [m²/s]를 갖습니다. 즉 세 가지 전달은 물리량만 다를 뿐 '퍼지는 속도'라는 같은 언어로 비교할 수 있고, 그 비율이 바로 무차원수 Pr, Sc, Le입니다."
            : "ν (momentum diffusivity), α (thermal diffusivity), and D (mass diffusivity) all carry the same units, m²/s. The three transports speak one common language — 'spreading rate' — and their ratios are the dimensionless groups Pr, Sc, Le."}
        </P>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {[isKo ? "물질" : "Material", "ν = μ/ρ [m²/s]", "α = k/ρc\u209A [m²/s]", "D [m²/s]", "Pr = ν/α", "Sc = ν/D", "Le = α/D"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "8px 10px", borderBottom: `2px solid ${C.border}`, color: C.accentSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: "rgba(59,130,246,0.06)" }}>
                <td style={tdS()}>{m.label}</td>
                <td style={{ ...tdS(), color: MOM }}>{fmt(nu)}</td>
                <td style={{ ...tdS(), color: HEAT }}>{fmt(alpha)}</td>
                <td style={{ ...tdS(), color: MASS }}>{fmt(Dm)}</td>
                <td style={tdS()}>{Pr == null ? "—" : Pr.toPrecision(3)}</td>
                <td style={tdS()}>{Sc == null ? "—" : Sc.toPrecision(3)}</td>
                <td style={tdS()}>{Le == null ? "—" : Le.toPrecision(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          {isKo
            ? "공기는 Pr ≈ 0.7, Sc ≈ 0.6 — 세 확산능이 비슷해서 운동량·열·질량이 거의 같은 속도로 퍼집니다 (경계층 두께도 비슷!). 반면 물은 Sc ≈ 450: 질량 확산이 운동량보다 수백 배 느려 농도 경계층이 극히 얇아집니다. 이 차이가 이후 대류 상관식(Nu, Sh)의 지수에 그대로 등장합니다."
            : "For air, Pr ≈ 0.7 and Sc ≈ 0.6 — all three diffusivities are comparable, so momentum, heat, and mass spread at similar rates (similar boundary-layer thicknesses!). For water, Sc ≈ 450: mass diffuses hundreds of times slower than momentum, so concentration boundary layers are razor-thin. These ratios reappear as exponents in convection correlations (Nu, Sh) later."}
        </P>
      </Card>
    </>
  );
}

function tdS() {
  return { padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 12.5 };
}

// One panel: linear profile + flux arrow, length ∝ gradient
function FluxPanel({ L, grad, isKo }) {
  const W = 260, H = 170, pad = 26;
  const na = L.coeffVal == null;
  // profile line from top-left(high) to bottom-right controlled by grad slope
  const slope = grad / 2; // 0..1
  const x1 = pad, x2 = W - pad;
  const yTop = pad + (1 - slope) * 40;
  const yBot = H - pad - (1 - slope) * 40;
  const arrowLen = 30 + grad * 60;
  return (
    <div style={{ background: C.card, border: `1px solid ${L.color}44`, borderTop: `3px solid ${L.color}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: L.color }}>{L.title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6 }}>
        {/* axes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={C.border} strokeWidth="1.5" />
        <line x1={pad} y1={pad - 6} x2={pad} y2={H - pad} stroke={C.border} strokeWidth="1.5" />
        <text x={W - pad} y={H - pad + 14} fontSize="11" fill={C.textDim} textAnchor="end">x</text>
        <text x={pad - 6} y={pad - 10} fontSize="11" fill={C.textDim}>φ = {L.phi}</text>
        {/* profile */}
        {na ? (
          <text x={W / 2} y={H / 2} fontSize="12" fill={C.textDim} textAnchor="middle">
            {isKo ? "(고체 — 해당 없음)" : "(solid — N/A)"}
          </text>
        ) : (
          <>
            <line x1={x1} y1={yTop} x2={x2} y2={yBot} stroke={L.color} strokeWidth="3" strokeLinecap="round" />
            {/* flux arrow */}
            <defs>
              <marker id={`ah-${L.flux}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill={C.warn} />
              </marker>
            </defs>
            <line x1={W / 2 - arrowLen / 2} y1={H - pad - 18} x2={W / 2 + arrowLen / 2} y2={H - pad - 18}
              stroke={C.warn} strokeWidth="3.5" markerEnd={`url(#ah-${L.flux})`} />
            <text x={W / 2} y={H - pad - 26} fontSize="11.5" fill={C.warn} textAnchor="middle">
              {L.flux} ∝ {grad.toFixed(2)}
            </text>
          </>
        )}
      </svg>
      <div style={{ fontSize: 12, color: C.textDim, fontFamily: "monospace", lineHeight: 1.8 }}>
        {L.coeffSym} = {L.coeffVal == null ? "—" : L.coeffVal.toExponential(1)} {L.coeffVal == null ? "" : L.unit}<br />
        {L.diffSym} = {L.diff == null ? "—" : L.diff.toExponential(2)} m²/s
      </div>
    </div>
  );
}

// =============================================================
// TAB 3 — UNIFIED PDE (one solver, three physics, live)
// =============================================================
function UnifiedPDE({ lang, t }) {
  const isKo = lang === "ko";
  const N = 81;
  const [material, setMaterial] = useState("air");
  const [running, setRunning] = useState(false);
  const [tau, setTau] = useState(0);
  const fieldsRef = useRef(null);
  const canvasRef = useRef(null);

  const presets = {
    air:   { label: isKo ? "공기" : "Air",   nu: 1.57e-5, alpha: 2.22e-5, D: 2.5e-5 },
    water: { label: isKo ? "물" : "Water",   nu: 8.9e-7,  alpha: 1.43e-7, D: 2.0e-9 },
    oil:   { label: isKo ? "엔진오일" : "Engine oil", nu: 9.0e-4, alpha: 8.0e-8, D: 1.0e-10 },
  };
  const p = presets[material];
  // normalize by ν so momentum evolves at rate 1
  const ratios = useMemo(() => ({
    mom: 1,
    heat: p.alpha / p.nu,   // = 1/Pr
    mass: p.D / p.nu,       // = 1/Sc
  }), [material]);
  const Pr = p.nu / p.alpha, Sc = p.nu / p.D, Le = p.alpha / p.D;

  const init = useCallback(() => {
    const mk = () => {
      const a = new Float64Array(N);
      a[0] = 1; // wall value = 1, interior = 0
      return a;
    };
    fieldsRef.current = { mom: mk(), heat: mk(), mass: mk() };
    setTau(0);
  }, []);

  useEffect(() => { init(); }, [init, material]);

  // draw
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !fieldsRef.current) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 46;
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(0, 0, W, H);
    // axes
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pad, 16); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 16, H - pad);
    ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText("\u03c6 (v*/T*/C*)", pad + 4, 16);
    ctx.fillText(isKo ? "x (벽으로부터 거리)" : "x (distance from wall)", W - 200, H - pad + 26);
    ctx.fillText("1", pad - 14, 24);
    ctx.fillText("0", pad - 14, H - pad + 4);
    // grid guide lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let g = 1; g <= 4; g++) {
      const y = 20 + (H - pad - 20) * g / 5;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 16, y); ctx.stroke();
    }
    const plot = (arr, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.6;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = pad + (W - 16 - pad) * i / (N - 1);
        const y = (H - pad) - (H - pad - 20) * arr[i];
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    const f = fieldsRef.current;
    plot(f.mom, MOM);
    plot(f.heat, HEAT);
    plot(f.mass, MASS);
  }, [isKo]);

  useEffect(() => { draw(); }, [draw, tau, material]);

  // integrate
  useEffect(() => {
    if (!running) return;
    const dx = 1 / (N - 1);
    const rmax = Math.max(1, ratios.heat, ratios.mass);
    const dt = 0.35 * dx * dx / rmax;
    const sub = 240;
    const id = setInterval(() => {
      const f = fieldsRef.current;
      if (!f) return;
      const stepField = (arr, r) => {
        const nw = new Float64Array(arr);
        const c = r * dt / (dx * dx);
        for (let i = 1; i < N - 1; i++) {
          nw[i] = arr[i] + c * (arr[i + 1] - 2 * arr[i] + arr[i - 1]);
        }
        nw[0] = 1; nw[N - 1] = 0;
        return nw;
      };
      for (let s = 0; s < sub; s++) {
        f.mom = stepField(f.mom, ratios.mom);
        f.heat = stepField(f.heat, ratios.heat);
        f.mass = stepField(f.mass, ratios.mass);
      }
      setTau((v) => v + sub * dt);
    }, 33);
    return () => clearInterval(id);
  }, [running, ratios]);

  const fmtR = (v) => v >= 100 ? v.toFixed(0) : v >= 1 ? v.toPrecision(3) : v.toPrecision(2);

  return (
    <>
      <Card>
        <H2>{isKo ? "하나의 방정식이 세 가지 물리를 지배한다" : "One Equation Governs Three Physics"}</H2>
        <Eq style={{ fontSize: 19 }}>
          ∂φ/∂t = δ ∂²φ/∂x²{"    "}
          <span style={{ color: MOM }}>(φ=v, δ=ν)</span>{"  "}
          <span style={{ color: HEAT }}>(φ=T, δ=α)</span>{"  "}
          <span style={{ color: MASS }}>(φ=C, δ=D)</span>
        </Eq>
        <P>
          {isKo
            ? "벽(x=0)의 값이 갑자기 1로 올라간 뒤의 확산 과정을 세 물리량에 대해 동시에 풉니다 — 사용하는 수치 솔버(FDM)는 완전히 동일한 코드이고, 오직 확산능 δ만 다릅니다. 갑자기 움직이기 시작한 평판 위의 유체(운동량), 갑자기 가열된 벽(열), 갑자기 용질에 노출된 계면(질량)이 전부 이 하나의 그림입니다."
            : "A wall at x=0 suddenly jumps to φ=1; we solve the ensuing diffusion for all three quantities at once — with the exact same FDM solver code, only the diffusivity δ differs. A suddenly-moving plate (momentum), a suddenly-heated wall (heat), and an interface suddenly exposed to solute (mass) are all this one picture."}
        </P>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          {Object.entries(presets).map(([k, v]) => (
            <button key={k} onClick={() => { setRunning(false); setMaterial(k); }} style={btnStyle(material === k)}>{v.label}</button>
          ))}
          <span style={{ width: 12 }} />
          <button onClick={() => setRunning(!running)} style={btnStyle(running)}>{running ? t.stop : t.run}</button>
          <button onClick={() => { setRunning(false); init(); }} style={btnStyle(false)}>{t.reset}</button>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: C.textDim }}>
            τ = {tau.toFixed(3)} {isKo ? "(무차원 시간, ν 기준)" : "(dimensionless time, scaled by ν)"}
          </span>
        </div>
        <canvas ref={canvasRef} width={900} height={380}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 10, fontSize: 13, fontFamily: "monospace" }}>
          <span style={{ color: MOM }}>■ v* ({isKo ? "운동량" : "momentum"}, δ/ν = 1)</span>
          <span style={{ color: HEAT }}>■ T* ({isKo ? "열" : "heat"}, δ/ν = 1/Pr = {fmtR(1 / Pr)})</span>
          <span style={{ color: MASS }}>■ C* ({isKo ? "질량" : "mass"}, δ/ν = 1/Sc = {fmtR(1 / Sc)})</span>
        </div>
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12,
        }}>
          {[
            ["Pr = ν/α", Pr], ["Sc = ν/D", Sc], ["Le = α/D", Le],
          ].map(([label, v], i) => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: "10px 16px", fontFamily: "monospace", fontSize: 14,
            }}>
              {label} = <b style={{ color: C.warn }}>{fmtR(v)}</b>
            </div>
          ))}
        </div>
        <P>
          {isKo
            ? "공기에서는 세 곡선이 거의 겹칩니다 (Pr ≈ 0.7, Sc ≈ 0.6) — '전달의 유사성'이 가장 극적으로 보이는 경우입니다. 물이나 엔진오일로 바꿔 보세요: 같은 방정식이지만 확산능 비가 커서 C* 곡선은 벽 근처에 갇혀 거의 움직이지 않습니다. 이 '누가 더 빨리 퍼지는가'의 경쟁이 2주차부터 배울 경계층·상관식의 물리적 뿌리입니다."
            : "In air the three curves nearly coincide (Pr ≈ 0.7, Sc ≈ 0.6) — the transport analogy at its most dramatic. Switch to water or engine oil: the equation is the same, but the diffusivity ratios are huge and C* stays pinned near the wall. This race of spreading rates is the physical root of the boundary layers and correlations you will meet from Week 2 on."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 4 — RANDOM WALK (molecular origin of diffusion)
// =============================================================
function RandomWalk({ lang, t }) {
  const isKo = lang === "ko";
  const NP = 4000;
  const [running, setRunning] = useState(false);
  const [nStep, setNStep] = useState(0);
  const posRef = useRef(null);
  const canvasRef = useRef(null);
  const stepSize = 1; // lattice units

  const init = useCallback(() => {
    posRef.current = new Float64Array(NP); // all at 0
    setNStep(0);
  }, []);
  useEffect(() => { init(); }, [init]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !posRef.current) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 40;
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(0, 0, W, H);
    const xmax = Math.max(30, 3.5 * Math.sqrt(Math.max(nStep, 1)) * stepSize);
    const nb = 61;
    const hist = new Float64Array(nb);
    const pos = posRef.current;
    for (let i = 0; i < NP; i++) {
      const b = Math.floor((pos[i] + xmax) / (2 * xmax) * nb);
      if (b >= 0 && b < nb) hist[b]++;
    }
    const binW = 2 * xmax / nb;
    let hmax = 0; for (let b = 0; b < nb; b++) hmax = Math.max(hmax, hist[b]);
    hmax = Math.max(hmax, 1);
    // bars
    for (let b = 0; b < nb; b++) {
      const x = pad + (W - 2 * pad) * b / nb;
      const bw = (W - 2 * pad) / nb;
      const h = (H - 2 * pad) * hist[b] / hmax;
      ctx.fillStyle = "rgba(52,211,153,0.55)";
      ctx.fillRect(x, H - pad - h, bw - 1, h);
    }
    // Gaussian overlay: sigma = step*sqrt(n)
    if (nStep > 0) {
      const sigma = stepSize * Math.sqrt(nStep);
      const norm = NP * binW / (sigma * Math.sqrt(2 * Math.PI));
      ctx.strokeStyle = C.warn; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= W - 2 * pad; px++) {
        const xv = -xmax + 2 * xmax * px / (W - 2 * pad);
        const g = norm * Math.exp(-xv * xv / (2 * sigma * sigma));
        const y = H - pad - (H - 2 * pad) * g / hmax;
        if (px === 0) ctx.moveTo(pad + px, y); else ctx.lineTo(pad + px, y);
      }
      ctx.stroke();
    }
    // axis
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText("x", W - pad + 8, H - pad + 4);
    ctx.fillText("0", W / 2 - 4, H - pad + 16);
  }, [nStep]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const pos = posRef.current;
      for (let i = 0; i < NP; i++) {
        pos[i] += Math.random() < 0.5 ? -stepSize : stepSize;
      }
      setNStep((v) => v + 1);
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  const sigma = stepSize * Math.sqrt(Math.max(nStep, 0));

  return (
    <>
      <Card>
        <H2>{isKo ? "확산은 '술취한 걸음'이다 — 공통의 분자적 메커니즘" : "Diffusion is a Drunkard's Walk — the Shared Molecular Mechanism"}</H2>
        <P>
          {isKo
            ? "분자 4,000개가 원점에서 출발해, 매 스텝 50% 확률로 왼쪽/오른쪽으로 한 칸씩 무작위로 움직입니다. 어떤 분자도 목적지가 없지만, 집단의 분포는 정확히 Gaussian(주황 곡선)으로 퍼지고 그 폭은 σ = ℓ√n ∝ √t 로 자랍니다. 이 √t 스케일링이 확산의 지문입니다 — 그리고 운동량, 열, 질량 전달 모두 근본적으로 이 같은 무작위 분자 운동(충돌)에서 나오기 때문에 같은 수학을 공유하는 것입니다."
            : "4,000 molecules start at the origin; each step they hop left or right with 50/50 probability. No molecule has a destination, yet the population spreads as a perfect Gaussian (orange) whose width grows as σ = ℓ√n ∝ √t. This √t scaling is the fingerprint of diffusion — and because momentum, heat, and mass transport all emerge from the same random molecular motion (collisions), they share the same mathematics."}
        </P>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <button onClick={() => setRunning(!running)} style={btnStyle(running)}>{running ? t.stop : t.run}</button>
          <button onClick={() => { setRunning(false); init(); }} style={btnStyle(false)}>{t.reset}</button>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: C.textDim }}>
            n = {nStep} {isKo ? "스텝" : "steps"} · σ = ℓ√n = {sigma.toFixed(1)} · ⟨x²⟩ = 2Dt (D = ℓ²/2Δt)
          </span>
        </div>
        <canvas ref={canvasRef} width={900} height={340}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <P>
          {isKo
            ? "관찰 포인트: ① 분포의 폭이 스텝 수의 제곱근으로만 자란다 (100스텝 → 10칸). 확산으로 2배 멀리 가려면 4배의 시간이 필요합니다. ② 개별 분자의 궤적은 예측 불가능하지만 확률 분포는 완벽히 결정론적 — 이것이 미시적 무작위성에서 거시적 법칙(Fick의 법칙)이 태어나는 과정입니다."
            : "Watch for: ① the width grows only as the square root of step count (100 steps → 10 lattice units); to diffuse twice as far takes four times as long. ② Individual trajectories are unpredictable, but the probability distribution is perfectly deterministic — this is how a macroscopic law (Fick's law) is born from microscopic randomness."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 5 — THREE MODES OF HEAT TRANSFER
// =============================================================
function HeatModes({ lang }) {
  const isKo = lang === "ko";
  const [Ts, setTs] = useState(150);   // hot surface °C
  const [Tinf, setTinf] = useState(25);
  const [h, setH] = useState(25);      // W/m²K
  const [k, setK] = useState(0.6);     // W/mK  (through slab)
  const [L, setL] = useState(0.02);    // m
  const [eps, setEps] = useState(0.85);

  const sigma = 5.670e-8;
  const dT = Ts - Tinf;
  const qCond = k * dT / L;
  const qConv = h * dT;
  const qRad = eps * sigma * (Math.pow(Ts + 273.15, 4) - Math.pow(Tinf + 273.15, 4));
  const qmax = Math.max(qCond, qConv, qRad, 1);

  const modes = [
    {
      color: HEAT, name: isKo ? "전도 (Conduction)" : "Conduction", q: qCond,
      eq: "q = k ΔT / L",
      desc: isKo ? "응축상(고체/액체)의 직접 접촉을 통한 전달. 분자 진동·자유전자가 에너지를 릴레이." : "Through direct contact in condensed matter (solid/liquid); molecular vibration & free electrons relay energy.",
    },
    {
      color: C.cyan, name: isKo ? "대류 (Convection)" : "Convection", q: qConv,
      eq: "q = h ΔT",
      desc: isKo ? "유체(액체/기체)의 분자 운동 + 벌크 이동이 함께 나르는 전달. h는 유동에 좌우되는 '공학적' 계수." : "Carried by fluid molecular motion + bulk movement; h is an 'engineering' coefficient set by the flow.",
    },
    {
      color: C.purple, name: isKo ? "복사 (Radiation)" : "Radiation", q: qRad,
      eq: "q = εσ(T\u209B⁴ − T\u221E⁴)",
      desc: isKo ? "전자기파에 의한 전달 — 매질이 없어도 진행. T⁴ 의존성 때문에 고온에서 지배적." : "By electromagnetic waves — needs no medium. The T⁴ dependence makes it dominate at high temperature.",
    },
  ];

  return (
    <>
      <Card>
        <H2>{isKo ? "열전달: 공간적 온도차가 만드는 '이동 중인 열에너지'" : "Heat Transfer: Thermal Energy in Transit, Driven by a Spatial ΔT"}</H2>
        <P>
          {isKo
            ? "냄비 하나에도 세 모드가 동시에 삽니다: 손잡이를 타고 오는 전도, 물속의 대류, 화구가 내뿜는 복사. 아래에서 조건을 바꿔가며 어떤 모드가 지배하는지 비교해 보세요."
            : "A single pot on a stove hosts all three modes at once: conduction up the handle, convection in the water, radiation off the burner. Adjust the conditions below and see which mode dominates."}
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 8 }}>
          <Slider label={isKo ? "고온면 온도 T\u209B" : "Hot surface T\u209B"} value={Ts} min={30} max={800} step={5} onChange={setTs} unit=" °C" color={HEAT} />
          <Slider label={isKo ? "주위 온도 T\u221E" : "Ambient T\u221E"} value={Tinf} min={0} max={100} step={1} onChange={setTinf} unit=" °C" />
          <Slider label={isKo ? "대류계수 h" : "Convection h"} value={h} min={2} max={500} step={1} onChange={setH} unit=" W/m²K" color={C.cyan} />
          <Slider label={isKo ? "열전도도 k" : "Conductivity k"} value={k} min={0.02} max={50} step={0.02} onChange={setK} unit=" W/mK" color={HEAT} />
          <Slider label={isKo ? "판 두께 L" : "Slab thickness L"} value={L} min={0.002} max={0.1} step={0.001} onChange={setL} unit=" m" />
          <Slider label={isKo ? "방사율 ε" : "Emissivity ε"} value={eps} min={0.05} max={1} step={0.01} onChange={setEps} color={C.purple} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {modes.map((mo, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${mo.color}44`, borderTop: `3px solid ${mo.color}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: mo.color }}>{mo.name}</div>
              <Eq style={{ fontSize: 15, margin: "8px 0" }}>{mo.eq}</Eq>
              <div style={{ height: 18, background: "#0d1220", borderRadius: 6, overflow: "hidden", margin: "8px 0" }}>
                <div style={{ height: "100%", width: `${100 * mo.q / qmax}%`, background: mo.color, transition: "width 0.2s" }} />
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 15, color: C.text }}>
                q″ = <b style={{ color: mo.color }}>{mo.q >= 10000 ? (mo.q / 1000).toFixed(1) + " kW" : mo.q.toFixed(0) + " W"}</b>/m²
              </div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 8, lineHeight: 1.7 }}>{mo.desc}</div>
            </div>
          ))}
        </div>
        <P>
          {isKo
            ? "실험해 보세요: T\u209B를 600 °C 이상으로 올리면 복사가 T⁴ 스케일링 덕분에 급격히 커지며 지배 모드가 됩니다. 반대로 h를 크게 하면(강제 대류/물속) 대류가 압도합니다. k를 금속 수준(≈50)으로 올리고 L을 얇게 하면 전도가 가장 큽니다 — 히트싱크가 금속인 이유."
            : "Try it: push T\u209B above 600 °C and radiation, with its T⁴ scaling, rapidly takes over. Crank h (forced convection / liquid) and convection dominates. Set k to metal-like values (≈50) with a thin L and conduction wins — why heat sinks are metal."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 6 — MASS TRANSFER MODES (advection–diffusion + Pe)
// =============================================================
function MassModes({ lang, t }) {
  const isKo = lang === "ko";
  const N = 200;
  const [u, setU] = useState(0.6);
  const [D, setD] = useState(0.004);
  const [running, setRunning] = useState(false);
  const [tm, setTm] = useState(0);
  const cRef = useRef(null);
  const canvasRef = useRef(null);

  const init = useCallback(() => {
    const a = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      a[i] = Math.exp(-Math.pow((x - 0.15) / 0.03, 2));
    }
    cRef.current = a;
    setTm(0);
  }, []);
  useEffect(() => { init(); }, [init]);

  const Pe = u > 0 ? (u * 1.0 / Math.max(D, 1e-9)) : 0;

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !cRef.current) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 40;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 14); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText("C", pad + 6, 18);
    ctx.fillText("x", W - 24, H - pad + 16);
    const arr = cRef.current;
    let cmax = 0; for (let i = 0; i < N; i++) cmax = Math.max(cmax, arr[i]);
    cmax = Math.max(cmax, 0.05);
    ctx.strokeStyle = MASS; ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = pad + (W - 14 - pad) * i / (N - 1);
      const y = (H - pad) - (H - pad - 22) * arr[i] / cmax;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // velocity arrow
    if (u > 0.01) {
      ctx.strokeStyle = MOM; ctx.fillStyle = MOM; ctx.lineWidth = 3;
      const y0 = 30, x0 = pad + 16, len = 30 + u * 60;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + len, y0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + len, y0); ctx.lineTo(x0 + len - 8, y0 - 4); ctx.lineTo(x0 + len - 8, y0 + 4); ctx.fill();
      ctx.font = "12px monospace";
      ctx.fillText("u (advection)", x0, y0 - 8);
    }
  }, [u]);
  useEffect(() => { draw(); }, [draw, tm]);

  useEffect(() => {
    if (!running) return;
    const dx = 1 / (N - 1);
    const id = setInterval(() => {
      const arr = cRef.current;
      const dt = Math.min(0.3 * dx * dx / Math.max(D, 1e-9), 0.4 * dx / Math.max(u, 1e-9), 5e-4);
      const sub = 40;
      for (let s = 0; s < sub; s++) {
        const nw = new Float64Array(arr.length);
        for (let i = 1; i < N - 1; i++) {
          const adv = -u * (arr[i] - arr[i - 1]) / dx;                 // upwind
          const dif = D * (arr[i + 1] - 2 * arr[i] + arr[i - 1]) / (dx * dx);
          nw[i] = arr[i] + dt * (adv + dif);
        }
        nw[0] = 0; nw[N - 1] = nw[N - 2];
        cRef.current = nw;
      }
      setTm((v) => v + sub * dt);
    }, 33);
    return () => clearInterval(id);
  }, [running, u, D]);

  const diffTypes = [
    { name: isKo ? "농도 확산 (Fickian)" : "Concentration diffusion (Fickian)", desc: isKo ? "농도 구배가 구동력 — 이 과목의 기본" : "Driven by concentration gradient — the default" },
    { name: isKo ? "열 확산 (Soret)" : "Thermal diffusion (Soret)", desc: isKo ? "온도 구배가 물질을 이동시킴" : "Temperature gradient drives species migration" },
    { name: isKo ? "압력 확산" : "Pressure diffusion", desc: isKo ? "압력 구배에 의한 확산 (원심분리)" : "Driven by pressure gradients (centrifuges)" },
    { name: isKo ? "힘 확산" : "Forced diffusion", desc: isKo ? "외부 힘장(전기장 등)이 분자에 작용" : "External force fields (e.g., electric) act on molecules" },
    { name: isKo ? "Knudsen 확산" : "Knudsen diffusion", desc: isKo ? "다공성 고체 내 비등방 확산 — 세공 벽과의 충돌 지배" : "Anisotropic diffusion in porous solids — wall collisions dominate" },
  ];

  return (
    <>
      <Card>
        <H2>{isKo ? "물질전달 = 확산 + 이류(advection)" : "Mass Transfer = Diffusion + Advection"}</H2>
        <Eq style={{ fontSize: 18 }}>
          ∂C/∂t + <span style={{ color: MOM }}>u ∂C/∂x</span> = <span style={{ color: MASS }}>D ∂²C/∂x²</span>
          {"      "}Pe = uL/D = <b style={{ color: C.warn }}>{Pe >= 1000 ? Pe.toFixed(0) : Pe.toPrecision(3)}</b>
        </Eq>
        <P>
          {isKo
            ? "염료 한 방울(펄스)이 흐르는 채널에 주입되었습니다. 확산(D)은 펄스를 퍼뜨리고, 이류(u)는 펄스를 실어 나릅니다. 두 효과의 세기 비가 Peclet 수 Pe = uL/D 입니다. u = 0으로 두면 순수 확산(√t 로 퍼짐), D를 아주 작게 하면 모양을 유지한 채 이동만 합니다."
            : "A drop of dye (a pulse) is injected into a flowing channel. Diffusion (D) spreads the pulse; advection (u) carries it along. Their strength ratio is the Peclet number Pe = uL/D. Set u = 0 for pure diffusion (√t spreading); shrink D and the pulse rides along nearly frozen in shape."}
        </P>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "유속 u" : "Velocity u"} value={u} min={0} max={2} step={0.05} onChange={setU} color={MOM} />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "확산계수 D" : "Diffusivity D"} value={D} min={0.0005} max={0.02} step={0.0005} onChange={setD} color={MASS} />
          </div>
          <button onClick={() => setRunning(!running)} style={btnStyle(running)}>{running ? t.stop : t.run}</button>
          <button onClick={() => { setRunning(false); init(); }} style={btnStyle(false)}>{t.reset}</button>
        </div>
        <canvas ref={canvasRef} width={900} height={300}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <P>
          {isKo
            ? "실제 마이크로채널 반응기(강의 슬라이드의 100 nm 채널)에서는 이류가 반응물을 공급하고, 확산이 벽(촉매/전극)까지 데려가며, 표면에서는 흡착·산화·환원이 일어납니다 — 물질전달과 반응이 직렬로 연결된 이 구조가 화학공학 문제의 전형입니다."
            : "In a real microchannel reactor (the 100 nm channel from the lecture slide), advection supplies reactant, diffusion delivers it to the walls (catalyst/electrode), and adsorption/oxidation/reduction occur at the surface — mass transfer and reaction in series, the archetype of chemical engineering problems."}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "확산의 여러 얼굴" : "The Many Faces of Diffusion"}</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {diffTypes.map((d, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: MASS }}>{d.name}</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 6, lineHeight: 1.7 }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// =============================================================
// TAB 7 — PRACTICE PROBLEMS
// =============================================================
function Practice({ lang }) {
  const isKo = lang === "ko";
  const [open, setOpen] = useState({});
  const toggle = (i) => setOpen((o) => ({ ...o, [i]: !o[i] }));

  const problems = [
    {
      q: isKo
        ? "1. Newton, Fourier, Fick의 법칙을 각각 쓰고, 세 법칙이 공유하는 일반형 「flux = −(계수)×(구배)」로 통합해 보시오. 음(−)의 부호가 갖는 물리적 의미는?"
        : "1. Write Newton's, Fourier's, and Fick's laws, then unify them into the general form flux = −(coefficient)×(gradient). What is the physical meaning of the minus sign?",
      a: isKo
        ? "τ = −μ dv/dy, q = −k dT/dx, J = −D dC/dx. 일반형: (flux) = −(수송계수)(∂φ/∂x). 음의 부호는 flux가 항상 φ가 감소하는 방향(높은 값 → 낮은 값)으로 향함을 의미하며, 이는 열역학 제2법칙(엔트로피 증가)과 부합한다."
        : "τ = −μ dv/dy, q = −k dT/dx, J = −D dC/dx. General form: flux = −(transport coefficient)(∂φ/∂x). The minus sign means flux always points down the gradient (high → low φ), consistent with the 2nd law of thermodynamics.",
    },
    {
      q: isKo
        ? "2. ν, α, D가 모두 [m²/s]의 단위를 가짐을 차원해석으로 보이시오. (μ [Pa·s], k [W/m·K], ρ [kg/m³], c\u209A [J/kg·K])"
        : "2. Show by dimensional analysis that ν, α, and D all carry units of m²/s. (μ [Pa·s], k [W/m·K], ρ [kg/m³], c\u209A [J/kg·K])",
      a: isKo
        ? "ν = μ/ρ = [Pa·s]/[kg/m³] = [kg/(m·s)]/[kg/m³] = m²/s. α = k/(ρc\u209A) = [W/(m·K)]/([kg/m³][J/(kg·K)]) = [J/(s·m·K)]/[J/(m³·K)] = m²/s. D는 정의상 m²/s. 세 확산능이 같은 차원을 가지므로 무차원 비 Pr = ν/α, Sc = ν/D, Le = α/D를 만들 수 있다."
        : "ν = μ/ρ = [Pa·s]/[kg/m³] = [kg/(m·s)]/[kg/m³] = m²/s. α = k/(ρc\u209A) = [W/(m·K)]/([kg/m³][J/(kg·K)]) = m²/s. D is m²/s by definition. Equal dimensions allow the dimensionless ratios Pr = ν/α, Sc = ν/D, Le = α/D.",
    },
    {
      q: isKo
        ? "3. 25 °C 물에서 ν = 8.9×10⁻⁷ m²/s, α = 1.43×10⁻⁷ m²/s, D(소금) ≈ 1.5×10⁻⁹ m²/s이다. Pr, Sc, Le를 계산하고, '물에서는 농도 경계층이 온도 경계층보다 훨씬 얇다'는 주장을 정당화하시오."
        : "3. For water at 25 °C: ν = 8.9×10⁻⁷, α = 1.43×10⁻⁷, D(salt) ≈ 1.5×10⁻⁹ m²/s. Compute Pr, Sc, Le and justify: 'in water, concentration boundary layers are much thinner than thermal ones.'",
      a: isKo
        ? "Pr = ν/α ≈ 6.2, Sc = ν/D ≈ 590, Le = α/D ≈ 95. 경계층 두께는 해당 확산능이 클수록 두껍다(δ ∝ √(확산능·t)). D ≪ α ≪ ν이므로 δ_C ≪ δ_T ≪ δ_v. Le ≈ 95는 열이 소금 확산보다 약 √95 ≈ 10배 두꺼운 층으로 퍼짐을 의미한다."
        : "Pr ≈ 6.2, Sc ≈ 590, Le ≈ 95. Boundary-layer thickness grows with diffusivity (δ ∝ √(diffusivity·t)). Since D ≪ α ≪ ν, we get δ_C ≪ δ_T ≪ δ_v; Le ≈ 95 means heat spreads through a layer ~√95 ≈ 10× thicker than salt.",
    },
    {
      q: isKo
        ? "4. 두께 2 cm, k = 0.6 W/m·K인 벽의 양면 온도가 150 °C / 25 °C이다. 전도 열유속을 구하시오. 같은 ΔT에서 h = 25 W/m²K인 자연대류 열유속과 비교하면?"
        : "4. A 2-cm slab (k = 0.6 W/m·K) has faces at 150 °C and 25 °C. Find the conductive heat flux, and compare with natural convection at h = 25 W/m²K for the same ΔT.",
      a: isKo
        ? "q_cond = kΔT/L = 0.6×125/0.02 = 3,750 W/m². q_conv = hΔT = 25×125 = 3,125 W/m². 이 조건에서는 두 모드가 비슷한 규모다. L을 절반으로 줄이면 전도가 2배가 되지만, 대류는 유동 조건(h)을 바꿔야만 커진다는 점이 대조적이다."
        : "q_cond = kΔT/L = 0.6×125/0.02 = 3,750 W/m²; q_conv = hΔT = 25×125 = 3,125 W/m² — comparable here. Halving L doubles conduction, whereas convection grows only if the flow (h) changes.",
    },
    {
      q: isKo
        ? "5. 표면온도 700 °C, 방사율 ε = 0.9인 물체가 25 °C 환경에 놓여 있다. 복사 열유속을 구하고, 왜 고온 공정(소각로, 반도체 RTP)에서 복사가 지배 모드가 되는지 T⁴ 스케일링으로 설명하시오. (σ = 5.67×10⁻⁸ W/m²K⁴)"
        : "5. A surface at 700 °C with ε = 0.9 faces 25 °C surroundings. Find the radiative flux and explain, via T⁴ scaling, why radiation dominates high-temperature processes (incinerators, semiconductor RTP). (σ = 5.67×10⁻⁸ W/m²K⁴)",
      a: isKo
        ? "q_rad = εσ(T\u209B⁴−T\u221E⁴) = 0.9×5.67×10⁻⁸×(973.15⁴−298.15⁴) ≈ 4.53×10⁴ W/m² ≈ 45 kW/m². T가 2배가 되면 복사는 ~16배가 되므로(전도·대류는 ~ΔT에 선형), 고온에서는 복사가 필연적으로 지배한다."
        : "q_rad = 0.9×5.67×10⁻⁸×(973.15⁴−298.15⁴) ≈ 4.5×10⁴ W/m² ≈ 45 kW/m². Doubling T multiplies radiation ~16× while conduction/convection grow only linearly in ΔT — radiation inevitably dominates at high T.",
    },
    {
      q: isKo
        ? "6. 1차원 random walk에서 스텝 길이 ℓ, 스텝 시간 Δt일 때 n스텝 후 ⟨x²⟩ = nℓ²임을 보이고, ⟨x²⟩ = 2Dt와 비교하여 D = ℓ²/(2Δt)를 유도하시오."
        : "6. For a 1-D random walk of step length ℓ and step time Δt, show ⟨x²⟩ = nℓ² after n steps, and compare with ⟨x²⟩ = 2Dt to derive D = ℓ²/(2Δt).",
      a: isKo
        ? "x = Σsᵢℓ (sᵢ = ±1, 독립). ⟨x²⟩ = ℓ²Σᵢⱼ⟨sᵢsⱼ⟩ = ℓ²·n (i≠j 항은 0). t = nΔt이므로 ⟨x²⟩ = (ℓ²/Δt)t. 확산 이론의 ⟨x²⟩ = 2Dt와 비교하면 D = ℓ²/(2Δt). 분자 규모의 ℓ, Δt가 거시적 D를 만든다 — 미시와 거시의 다리."
        : "x = Σsᵢℓ with independent sᵢ = ±1. ⟨x²⟩ = ℓ²Σ⟨sᵢsⱼ⟩ = nℓ² (cross terms vanish). With t = nΔt, ⟨x²⟩ = (ℓ²/Δt)t; matching ⟨x²⟩ = 2Dt gives D = ℓ²/(2Δt). Molecular-scale ℓ, Δt build the macroscopic D — the micro-macro bridge.",
    },
    {
      q: isKo
        ? "7. 길이 1 mm 마이크로채널에 u = 1 mm/s로 용액이 흐른다. 용질의 D = 10⁻⁹ m²/s일 때 Pe를 구하고, 이 채널에서 용질이 벽에 도달하는 주 메커니즘이 무엇인지 논하시오."
        : "7. Solution flows at u = 1 mm/s through a 1-mm microchannel; solute D = 10⁻⁹ m²/s. Compute Pe and discuss the dominant mechanism bringing solute to the wall.",
      a: isKo
        ? "Pe = uL/D = (10⁻³ × 10⁻³)/10⁻⁹ = 1000 ≫ 1. 축방향 수송은 이류가 지배하지만, 벽에 수직인 방향으로는 유속이 0에 가까우므로 벽 도달은 여전히 확산이 담당한다. 확산 시간 t ~ (L/2)²/D ≈ 250 s로 체류시간(1 s)보다 길어, 벽 반응은 물질전달 율속이 된다."
        : "Pe = uL/D = 1000 ≫ 1: advection dominates axial transport, but the wall-normal velocity is ~0, so reaching the wall is still diffusion's job. Diffusion time t ~ (L/2)²/D ≈ 250 s exceeds residence time (~1 s) — wall reactions become mass-transfer limited.",
    },
    {
      q: isKo
        ? "8. 거시적/미시적/분자적 세 수준 중, 다음 문제는 각각 어느 수준의 해석이 적절한가? (a) 증류탑 전체의 에너지 수지 (b) 관 내 층류의 속도 분포 (c) 고분자 용액에서 CO₂의 확산계수 예측"
        : "8. Which level of analysis (macroscopic / microscopic / molecular) suits each problem? (a) overall energy balance of a distillation column, (b) laminar velocity profile in a pipe, (c) predicting the diffusivity of CO₂ in a polymer solution.",
      a: isKo
        ? "(a) 거시적 — 내부 세부 없이 입·출입 수지로 충분. (b) 미시적 — 미분 수지(Navier–Stokes)로 분포를 구함. (c) 분자적 — 분자 구조와 분자간 힘으로부터 물성을 예측. 실제 공학 문제는 흔히 세 수준을 오가며 푼다."
        : "(a) Macroscopic — input/output balances suffice. (b) Microscopic — differential balances (Navier–Stokes) give the profile. (c) Molecular — properties predicted from molecular structure & forces. Real problems shuttle between all three levels.",
    },
  ];

  return (
    <Card>
      <H2>{isKo ? "연습문제 (풀이 토글)" : "Practice Problems (toggle solutions)"}</H2>
      {problems.map((p, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>{p.q}</div>
          <button onClick={() => toggle(i)} style={{ ...btnStyle(open[i]), marginTop: 10 }}>
            {open[i] ? (isKo ? "풀이 숨기기" : "Hide solution") : (isKo ? "풀이 보기" : "Show solution")}
          </button>
          {open[i] && (
            <div style={{
              marginTop: 10, padding: "12px 14px",
              background: "rgba(16,185,129,0.07)",
              border: `1px solid ${C.ok}44`, borderRadius: 8,
              fontSize: 13, lineHeight: 1.85, color: C.text,
            }}>{p.a}</div>
          )}
        </div>
      ))}
    </Card>
  );
}

// =============================================================
// TAB 8 — RAW CODES
// =============================================================
function RawCodes({ lang }) {
  const isKo = lang === "ko";
  const [topic, setTopic] = useState("analogy");
  const [language, setLanguage] = useState("python");

  const codes = useMemo(() => ({
    analogy: {
      python: { filename: "wk01_flux_analogy.py", code: PY_ANALOGY },
      matlab: { filename: "wk01_flux_analogy.m", code: ML_ANALOGY },
      julia: { filename: "wk01_flux_analogy.jl", code: JL_ANALOGY },
      cpp: { filename: "wk01_flux_analogy.cpp", code: CPP_ANALOGY },
    },
    walk: {
      python: { filename: "wk01_random_walk.py", code: PY_WALK },
      matlab: { filename: "wk01_random_walk.m", code: ML_WALK },
      julia: { filename: "wk01_random_walk.jl", code: JL_WALK },
      cpp: { filename: "wk01_random_walk.cpp", code: CPP_WALK },
    },
    unified: {
      python: { filename: "wk01_unified_transport.py", code: PY_UNIFIED },
      matlab: { filename: "wk01_unified_transport.m", code: ML_UNIFIED },
      julia: { filename: "wk01_unified_transport.jl", code: JL_UNIFIED },
      cpp: { filename: "wk01_unified_transport.cpp", code: CPP_UNIFIED },
    },
    modes: {
      python: { filename: "wk01_heat_modes.py", code: PY_MODES },
      matlab: { filename: "wk01_heat_modes.m", code: ML_MODES },
      julia: { filename: "wk01_heat_modes.jl", code: JL_MODES },
      cpp: { filename: "wk01_heat_modes.cpp", code: CPP_MODES },
    },
  }), []);

  const item = codes[topic][language];

  const download = () => {
    const blob = new Blob([item.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = () => { navigator.clipboard?.writeText(item.code); };

  return (
    <>
      <Card>
        <H2>{isKo ? "다운로드 가능한 실습 코드" : "Downloadable Practice Code"}</H2>
        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          {isKo
            ? "동일한 알고리즘을 4가지 언어로 제공합니다. 본인의 환경에 맞춰 다운로드 후 실행해 보세요. 모든 코드는 외부 의존성을 최소화하여 작성되었습니다."
            : "The same algorithms in 4 languages. Download the file matching your environment. External dependencies are minimized."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {Object.entries({
            analogy: isKo ? "수송 유사성 (Pr·Sc·Le)" : "Transport analogy (Pr·Sc·Le)",
            walk: isKo ? "Random Walk → Gaussian" : "Random walk → Gaussian",
            unified: isKo ? "통일 방정식 (1개 솔버, 3개 물리)" : "Unified eq. (1 solver, 3 physics)",
            modes: isKo ? "열전달 3모드 비교" : "3 heat-transfer modes",
          }).map(([k, lbl]) => (
            <button key={k} onClick={() => setTopic(k)} style={btnStyle(topic === k)}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[["python", "Python"], ["matlab", "MATLAB"], ["julia", "Julia"], ["cpp", "C++"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setLanguage(k)} style={btnStyle(language === k)}>{lbl}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "monospace", color: C.accentSoft, fontSize: 13 }}>{item.filename}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={copy} style={btnStyle(false)}>📋 Copy</button>
            <button onClick={download} style={btnStyle(false)}>⬇ {isKo ? "다운로드" : "Download"}</button>
          </div>
        </div>
        <pre style={{
          background: "#0d1220",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 16,
          overflowX: "auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#d1d5db",
          maxHeight: 560,
        }}>{item.code}</pre>
      </Card>
    </>
  );
}
