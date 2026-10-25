// Week9App.jsx — Heat & Mass Transfer, Week 9: Fundamentals of mass transfer
// Part 1 — Fluxes and reference velocities (c, x, y, w; v vs V; J, N, n; Fick's 1st law;
// N_A = −cD∇y_A + y_A ΣN), chemical potential & Nernst–Einstein, diffusion coefficients:
// gases (kinetic theory, Lennard-Jones, Chapman–Enskog with Ω_D, Fuller), liquids
// (Stokes–Einstein, Wilke–Chang), pores (Knudsen, transition, ε²), solids (Arrhenius),
// random walk & Langevin equation (⟨x²⟩, D = k_BT/mγ, velocity autocorrelation).
// Part 2 — Species continuity equation and its special cases; boundary conditions:
// Raoult & Henry's laws, gas–solid solubility, reacting surface, impermeable wall,
// convective BC; W chemical vapor deposition (N_A(1 + 2y_A) = −cD dy_A/dz).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import WEEK9_CODES from "./Week9Codes";

/* ---------------------------------- design tokens ---------------------------------- */
const C = {
  ink: "#20304f",
  inkSoft: "#4a5a78",
  paper: "#faf7f2",
  panel: "#ffffff",
  line: "#e3ddd2",
  copper: "#b06a3b",
  copperDeep: "#7c4520",
  copperPale: "#f3e4d5",
  cool: "#3a6ea5",
  coolPale: "#e3edf6",
  good: "#3e7d4f",
  warn: "#a04024",
  violet: "#6b4fa0",
};

const font = "'Pretendard', 'Noto Sans KR', -apple-system, 'Segoe UI', sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/* ---------------------------------- physics helpers ---------------------------------- */
const KB = 1.380649e-23;
const RG = 8.314462618;
const ATM = 101325;

/* Lennard-Jones σ (Å), ε/k_B (K), M (g/mol), Fuller diffusion volume (lecture table) */
const GAS = {
  H2: { s: 2.968, e: 33.3, M: 2.016, v: 7.07 },
  He: { s: 2.576, e: 10.2, M: 4.003, v: 2.88 },
  N2: { s: 3.681, e: 91.5, M: 28.01, v: 17.9 },
  O2: { s: 3.433, e: 113.0, M: 32.0, v: 16.6 },
  Air: { s: 3.617, e: 97.0, M: 28.97, v: 20.1 },
  Ar: { s: 3.418, e: 124.0, M: 39.95, v: 16.1 },
  CO2: { s: 3.996, e: 190.0, M: 44.01, v: 26.9 },
  CH4: { s: 3.822, e: 137.0, M: 16.04, v: 16.5 + 4 * 1.98 },
};
const GAS_KEYS = Object.keys(GAS);

/* collision integral for diffusion — Neufeld, Janzen & Aziz (1972) fit */
function omegaD(ts) {
  return 1.06036 / Math.pow(ts, 0.1561) + 0.193 / Math.exp(0.47635 * ts) +
    1.03587 / Math.exp(1.52996 * ts) + 1.76474 / Math.exp(3.89411 * ts);
}
function chapmanEnskog(a, b, T, P) {
  const A = GAS[a], B = GAS[b];
  const sab = 0.5 * (A.s + B.s), eab = Math.sqrt(A.e * B.e);
  const om = omegaD(T / eab);
  const D = (1.858e-3 * Math.pow(T, 1.5) * Math.sqrt(1 / A.M + 1 / B.M)) / (P * sab * sab * om);
  return { D, sab, eab, ts: T / eab, om };
}
function fuller(a, b, T, P) {
  const A = GAS[a], B = GAS[b];
  const den = Math.pow(Math.cbrt(A.v) + Math.cbrt(B.v), 2);
  return (1.011e-3 * Math.pow(T, 1.75) * Math.sqrt(1 / A.M + 1 / B.M)) / (P * den);
}
function kinetic(gas, T, P) {
  const g = GAS[gas];
  const sig = g.s * 1e-10;
  const lam = (KB * T) / (Math.SQRT2 * Math.PI * sig * sig * P * ATM);
  const u = Math.sqrt((8 * RG * T) / (Math.PI * g.M * 1e-3));
  return { lam, u, D: (lam * u) / 3 };
}
function wilkeChang(T, muCP, MB, VA, phi) {
  return (7.4e-8 * Math.sqrt(phi * MB) * T) / (muCP * Math.pow(VA, 0.6));
}
function knudsen(dcm, T, M) {
  return 4850 * dcm * Math.sqrt(T / M);
}
function arrhenius(D0mm2, QkJ, T) {
  return D0mm2 * 1e-6 * Math.exp((-QkJ * 1e3) / (RG * T));
}

/* error function (Abramowitz & Stegun 7.1.26, |ε| < 1.5e-7) */
function erf(x) {
  const s = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return s * y;
}

/* small seeded RNG (mulberry32) + Gaussian (Box–Muller) */
function makeRng(seed) {
  let a = seed >>> 0;
  const uni = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  const gauss = () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0, v = 0;
    while (u < 1e-12) u = uni();
    v = uni();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  return { uni, gauss };
}

/* number formatting */
function sci(x, d = 2) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return x.toFixed(Math.max(0, d + 1 - Math.max(e, 0)));
  const m = x / Math.pow(10, e);
  const sup = String(e).replace(/-/g, "⁻").replace(/[0-9]/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]);
  return `${m.toFixed(d)}×10${sup}`;
}

/* ---------------------------------- tiny UI atoms ---------------------------------- */
function Slider({ label, value, min, max, step, onChange, unit = "", fmt }) {
  const shown = fmt ? fmt(value) : value;
  return (
    <label style={{ display: "block", margin: "10px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.inkSoft, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: mono, color: C.ink }}>{shown}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: C.copper }}
      />
    </label>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden", flexWrap: "wrap" }}>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{
            padding: "6px 14px", fontSize: 13, fontFamily: font, cursor: "pointer", border: "none",
            background: value === o.v ? C.ink : "transparent",
            color: value === o.v ? "#fff" : C.inkSoft,
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, label }) {
  return (
    <label style={{ fontSize: 13, color: C.inkSoft, display: "inline-flex", alignItems: "center", gap: 6, margin: "4px 12px 4px 0" }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: font, fontSize: 13, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.line}`, color: C.ink, background: "#fff" }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Panel({ title, children, accent }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
      {title && (
        <h3 style={{ margin: "0 0 12px", fontSize: 16, color: accent || C.ink, borderBottom: `2px solid ${accent || C.copper}`, display: "inline-block", paddingBottom: 3 }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function Eq({ children, block }) {
  return (
    <span style={{
      fontFamily: "'STIX Two Text', 'Times New Roman', serif", fontStyle: "italic",
      background: block ? C.copperPale : "transparent",
      display: block ? "block" : "inline",
      padding: block ? "10px 14px" : 0, borderRadius: block ? 8 : 0,
      margin: block ? "8px 0" : 0, fontSize: block ? 16 : "inherit", color: C.ink,
      overflowX: block ? "auto" : "visible",
    }}>
      {children}
    </span>
  );
}

function Note({ children }) {
  return (
    <div style={{ borderLeft: `3px solid ${C.cool}`, background: C.coolPale, padding: "8px 12px", borderRadius: "0 8px 8px 0", fontSize: 13.5, color: C.inkSoft, margin: "10px 0" }}>
      {children}
    </div>
  );
}

function Readout({ children }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 13.2, background: C.copperPale, borderRadius: 8, padding: "8px 14px", lineHeight: 1.7, margin: "8px 0" }}>
      {children}
    </div>
  );
}

function P({ children }) {
  return <p style={{ fontSize: 14, lineHeight: 1.75, margin: "6px 0" }}>{children}</p>;
}

function btnStyle(active) {
  return {
    padding: "7px 16px", fontSize: 13.5, fontFamily: font, cursor: "pointer",
    borderRadius: 8, border: `1px solid ${active ? C.copperDeep : C.line}`,
    background: active ? C.copper : "#fff", color: active ? "#fff" : C.ink,
  };
}

function AxisBox({ W: Wd, H, pad, children }) {
  return (
    <svg viewBox={`0 0 ${Wd} ${H}`} style={{ width: "100%", maxWidth: Wd, display: "block", margin: "6px auto" }}>
      <rect x={pad.l} y={pad.t} width={Wd - pad.l - pad.r} height={H - pad.t - pad.b} fill="#fff" stroke={C.line} />
      {children}
    </svg>
  );
}

function polyline(points, color, width = 2, dash) {
  return (
    <polyline
      points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
      fill="none" stroke={color} strokeWidth={width}
      strokeDasharray={dash || "none"}
    />
  );
}

function axisLabels(Wd, H, pad, xl, yl) {
  return (
    <>
      <text x={(pad.l + Wd - pad.r) / 2} y={H - 6} fontSize="12" fill={C.inkSoft} textAnchor="middle">{xl}</text>
      <text x={14} y={(pad.t + H - pad.b) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`} textAnchor="middle">{yl}</text>
    </>
  );
}

/* log-axis ticks (decades) */
function logTicks(lo, hi, axis, map, Wd, H, pad) {
  const out = [];
  for (let e = Math.ceil(lo); e <= Math.floor(hi); e++) {
    if (axis === "x") {
      const x = map(e);
      out.push(<g key={"x" + e}><line x1={x} x2={x} y1={pad.t} y2={H - pad.b} stroke="#f0ebe2" /><text x={x} y={H - pad.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">10{sup(e)}</text></g>);
    } else {
      const y = map(e);
      out.push(<g key={"y" + e}><line x1={pad.l} x2={Wd - pad.r} y1={y} y2={y} stroke="#f0ebe2" /><text x={pad.l - 4} y={y + 4} fontSize="10.5" fill={C.inkSoft} textAnchor="end">10{sup(e)}</text></g>);
    }
  }
  return out;
}
function sup(e) {
  return String(e).replace(/-/g, "⁻").replace(/[0-9]/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c]);
}

function Table({ head, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13.2, minWidth: 420 }}>
        <thead>
          <tr style={{ background: C.copperPale }}>
            {head.map((h, i) => <th key={i} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: j > 0 ? mono : font, fontSize: j > 0 ? 12.8 : 13.2 }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  /* order-of-magnitude bands of D (m²/s), computed from this week's formulas */
  const bands = [
    { k: t("기체 (1 atm)", "Gases (1 atm)"), lo: chapmanEnskog("CO2", "N2", 300, 1).D * 1e-4, hi: chapmanEnskog("H2", "N2", 300, 1).D * 1e-4, col: C.cool },
    { k: t("액체 (저분자)", "Liquids (small solutes)"), lo: 0.5e-9, hi: 4e-9, col: C.good },
    { k: t("액체 속 나노입자 (10–100 nm)", "Nanoparticles in water (10–100 nm)"), lo: 4.9e-12, hi: 4.9e-11, col: C.violet },
    { k: t("고체 (1000 K, 침입형 C·N)", "Solids (1000 K, interstitial C, N)"), lo: arrhenius(0.3, 76.1, 1000) * 0.6, hi: arrhenius(2.0, 84.1, 1000) * 1.5, col: C.copper },
    { k: t("고체 (1000 K, 자기확산)", "Solids (1000 K, self-diffusion)"), lo: arrhenius(49, 284.1, 1000), hi: arrhenius(10.7, 176.9, 1000), col: C.warn },
  ];
  const Wd = 640, H = 240, pad = { l: 190, r: 18, t: 14, b: 34 };
  const lx = (D) => pad.l + ((Wd - pad.l - pad.r) * (Math.log10(D) + 21)) / 18; // 1e-21 .. 1e-3
  return (
    <div>
      <Panel title={t("이번 주: 열에서 물질로", "This week: from heat to mass")}>
        <P>
          {t(
            "9주차부터 물질전달을 시작합니다. 수학은 이미 익숙합니다. 열에서 온도 T가 하던 역할을 농도 c_A가, 열확산계수 α가 하던 역할을 확산계수 D_AB가 맡습니다. 그러나 물질전달에는 열에 없던 문제가 두 가지 있습니다. 첫째, 성분이 움직이면 혼합물 전체도 함께 움직입니다. 그래서 '무엇을 기준으로 한 속도인가'를 먼저 정해야 합니다. 둘째, D는 기체·액체·고체에서 10¹⁵배 이상 차이가 납니다. 따라서 상황에 맞는 D 추정식을 골라 쓸 줄 알아야 합니다.",
            "Week 9 starts mass transfer. The mathematics is already familiar: the concentration c_A plays the role temperature T played, and the diffusivity D_AB plays the role of the thermal diffusivity α. Mass transfer, however, brings two problems heat never had. First, when a species moves, the mixture moves with it, so we must first decide 'velocity relative to what'. Second, D spans more than 15 orders of magnitude across gases, liquids and solids, so we must know which estimation formula fits which situation."
          )}
        </P>
      </Panel>

      <Panel title={t("9주차 로드맵", "Week 9 roadmap")}>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("농도의 언어: c, x_i(액체), y_i(기체), ρ_i = c_iM_i, w_i", "The language of concentration: c, x_i (liquids), y_i (gases), ρ_i = c_iM_i, w_i")}</li>
          <li>{t("기준 속도: 질량평균 v와 몰평균 V → 확산 플럭스 J_A와 총 플럭스 N_A = −cD_AB∇y_A + y_A(N_A + N_B)", "Reference velocities: mass-average v and molar-average V → diffusive flux J_A and total flux N_A = −cD_AB∇y_A + y_A(N_A + N_B)")}</li>
          <li>{t("화학 퍼텐셜과 Nernst–Einstein: 확산의 진짜 구동력은 ∇μ", "Chemical potential & Nernst–Einstein: the true driving force is ∇μ")}</li>
          <li>{t("기체 확산계수: 운동론 → Lennard-Jones → Chapman–Enskog(Ω_D) → Fuller", "Gas diffusivity: kinetic theory → Lennard-Jones → Chapman–Enskog (Ω_D) → Fuller")}</li>
          <li>{t("액체 확산계수: Stokes–Einstein, Wilke–Chang", "Liquid diffusivity: Stokes–Einstein, Wilke–Chang")}</li>
          <li>{t("세공 확산: Knudsen D_K ∝ T^½(압력 무관), 전이 영역, 다공체 ε²", "Pore diffusion: Knudsen D_K ∝ T^½ (pressure-independent), transition regime, porous ε²")}</li>
          <li>{t("고체 확산: 공공·침입형 기구, D = D₀exp(−Q/RT), 도핑과 이온 주입", "Solid diffusion: vacancy and interstitial hops, D = D₀exp(−Q/RT), doping and implantation")}</li>
          <li>{t("랜덤워크와 Langevin 방정식: ⟨x²⟩ → 2Dt, D = k_BT/(mγ)", "Random walk & the Langevin equation: ⟨x²⟩ → 2Dt, D = k_BT/(mγ)")}</li>
          <li>{t("지배방정식 ∂c_A/∂t + v·∇c_A = D∇²c_A + R_A와 경계조건(Raoult·Henry·반응면·CVD)", "Governing equation ∂c_A/∂t + v·∇c_A = D∇²c_A + R_A and boundary conditions (Raoult, Henry, reacting surface, CVD)")}</li>
        </ol>
      </Panel>

      <Panel title={t("열과 물질: 같은 수학, 다른 물리", "Heat and mass: same math, different physics")}>
        <Table
          head={[t("항목", "Item"), t("열전달", "Heat transfer"), t("물질전달", "Mass transfer")]}
          rows={[
            [t("퍼텐셜", "Potential"), "T", "c_A, y_A, w_A  (μ_A)"],
            [t("플럭스 법칙", "Flux law"), "q = −k∇T", "J_A = −D_AB∇c_A"],
            [t("확산도", "Diffusivity"), "α = k/(ρc_p)", "D_AB"],
            [t("지배방정식", "Governing eq."), "∂T/∂t + v·∇T = α∇²T + q̇/(ρc_p)", "∂c_A/∂t + v·∇c_A = D_AB∇²c_A + R_A"],
            [t("계면 조건", "Interface"), t("온도 연속", "T continuous"), t("농도 불연속 (Henry·Raoult)", "c jumps (Henry, Raoult)")],
            [t("매질의 움직임", "Medium motion"), t("열은 매질을 밀지 않음", "heat does not push the medium"), t("확산 자체가 벌크 흐름을 만듦", "diffusion itself drives bulk flow")],
          ]}
        />
        <Note>
          {t(
            "마지막 두 줄이 이번 주의 핵심입니다. 온도는 계면에서 연속이지만, 농도는 물–공기 계면에서 수만 배 뛸 수 있습니다(Henry 법칙). 또 확산하는 분자는 질량을 가지고 움직이므로 혼합물의 평균 속도를 바꿉니다. 그 결과가 N_A 식의 y_A(N_A + N_B) 항입니다.",
            "The last two rows are the heart of this week. Temperature is continuous at an interface, but concentration can jump by orders of magnitude across a water–air interface (Henry's law). And diffusing molecules carry mass, so they change the mixture's average velocity. That is where the y_A(N_A + N_B) term in N_A comes from."
          )}
        </Note>
      </Panel>

      <Panel title={t("확산계수의 자릿수 지도", "An order-of-magnitude map of D")}>
        <svg viewBox={`0 0 ${Wd} ${H}`} style={{ width: "100%", maxWidth: Wd, display: "block", margin: "6px auto" }}>
          {[-21, -18, -15, -12, -9, -6, -3].map((e) => (
            <g key={e}>
              <line x1={lx(Math.pow(10, e))} x2={lx(Math.pow(10, e))} y1={pad.t} y2={H - pad.b} stroke="#efe9df" />
              <text x={lx(Math.pow(10, e))} y={H - pad.b + 15} fontSize="11" fill={C.inkSoft} textAnchor="middle">10{sup(e)}</text>
            </g>
          ))}
          {bands.map((b, i) => {
            const y = pad.t + 8 + i * 37;
            return (
              <g key={i}>
                <text x={pad.l - 8} y={y + 14} fontSize="12" fill={C.ink} textAnchor="end">{b.k}</text>
                <rect x={lx(b.lo)} y={y} width={Math.max(4, lx(b.hi) - lx(b.lo))} height={20} rx={5} fill={b.col} opacity={0.85} />
              </g>
            );
          })}
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 4} fontSize="12" fill={C.inkSoft} textAnchor="middle">D (m²/s)</text>
        </svg>
        <Note>
          {t(
            "기체 D ≈ 10⁻⁵ m²/s, 액체 ≈ 10⁻⁹, 고체는 10⁻¹¹ 이하입니다. 확산 거리는 L ~ √(Dt)이므로, 1 mm를 가는 데 기체는 약 0.1초, 물속 저분자는 약 10분, 1000 K 철 속 철 원자는 수백 년에서 수십만 년이 걸립니다. 막대는 이 모듈의 식(Chapman–Enskog, Stokes–Einstein, 강의 Arrhenius 표)으로 직접 계산했습니다.",
            "Gases D ≈ 10⁻⁵ m²/s, liquids ≈ 10⁻⁹, solids 10⁻¹¹ and below. Since the diffusion length is L ~ √(Dt), covering 1 mm takes about 0.1 s in a gas, about 10 min for a small solute in water, and hundreds to hundreds of thousands of years for Fe atoms in iron at 1000 K. The bars are computed with this module's formulas (Chapman–Enskog, Stokes–Einstein, the lecture's Arrhenius table)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Fluxes & reference frames ---------------------------------- */
function TabFlux({ t }) {
  const [yA, setYA] = useState(0.3);
  const [grad, setGrad] = useState(1.0);     // −c D dy/dz scale (J_A), mol/m²s
  const [mode, setMode] = useState("stagnant");
  const [rCustom, setRCustom] = useState(0.5);
  const [MA, setMA] = useState(2.0);        // g/mol (H2 default)
  const [MB, setMB] = useState(28.0);       // N2
  const r = mode === "equimolar" ? -1 : mode === "stagnant" ? 0 : rCustom;  // r = N_B/N_A
  const JA = grad;
  const denom = 1 - yA * (1 + r);
  const NA = Math.abs(denom) < 1e-6 ? NaN : JA / denom;
  const NB = r * NA;
  const bulk = yA * (NA + NB);
  /* velocities for c = 1 mol/m³ (so N = c v) */
  const c = 1, cA = yA * c, cB = (1 - yA) * c;
  const vA = NA / cA, vB = NB / cB;
  const Vmol = (NA + NB) / c;
  const rho = cA * MA + cB * MB;
  const vmass = (MA * NA + MB * NB) / rho;

  const bars = [
    { k: "J_A", v: JA, col: C.cool },
    { k: "y_A(N_A+N_B)", v: bulk, col: C.violet },
    { k: "N_A", v: NA, col: C.copper },
    { k: "N_B", v: NB, col: C.good },
  ];
  const vmax = Math.max(1, ...bars.map((b) => (isFinite(b.v) ? Math.abs(b.v) : 0))) * 1.1;
  const Wd = 620, H = 210, pad = { l: 110, r: 20, t: 10, b: 20 };
  const x0 = pad.l + (Wd - pad.l - pad.r) / 2;
  const sx = (v) => ((Wd - pad.l - pad.r) / 2) * (v / vmax);

  return (
    <div>
      <Panel title={t("농도의 여러 얼굴", "The many faces of concentration")}>
        <Eq block>c = n/V_T, &nbsp; x_i = c_i/c ({t("액체·고체", "liquids, solids")}), &nbsp; y_i = c_i/c ({t("기체", "gases")}), &nbsp; ρ_i = c_iM_i, &nbsp; w_i = ρ_i/ρ</Eq>
        <P>
          {t(
            "몰 기준(c, x, y)과 질량 기준(ρ, w)을 구분하는 이유는 기준 속도가 둘이기 때문입니다. 성분 i의 절대 속도를 v_i라 하면, 질량으로 가중한 평균이 질량평균 속도 v이고, 몰수로 가중한 평균이 몰평균 속도 V입니다.",
            "We keep molar measures (c, x, y) separate from mass measures (ρ, w) because there are two reference velocities. With v_i the absolute velocity of species i, the mass-weighted average is the mass-average velocity v, and the mole-weighted average is the molar-average velocity V."
          )}
        </P>
        <Eq block>v = Σρ_iv_i/ρ, &nbsp;&nbsp; V = Σc_iv_i/c, &nbsp;&nbsp; J_A = c_A(v_A − V) = −cD_AB∇y_A &nbsp;({t("Fick 1법칙", "Fick's 1st law")})</Eq>
        <P>
          {t(
            "실험실에 고정된 좌표에서 본 총 몰 플럭스 N_A = c_Av_A는 '확산'과 '벌크 흐름에 실려 가는 몫'의 합입니다. 강의의 유도를 한 줄로 쓰면:",
            "The total molar flux seen from lab-fixed axes, N_A = c_Av_A, is the sum of 'diffusion' and 'the share carried by bulk flow'. The lecture's derivation in one line:"
          )}
        </P>
        <Eq block>N_A = −cD_AB ∇y_A + y_A(N_A + N_B) &nbsp; → &nbsp; n_A = −ρD_AB∇w_A + w_A(n_A + n_B)</Eq>
      </Panel>

      <Panel title={t("인터랙티브: 플럭스 분해기", "Interactive: the flux decomposer")}>
        <P>{t("이원계에서 N_B = rN_A 관계를 정하면 N_A = J_A / [1 − y_A(1 + r)]가 됩니다. 시나리오를 바꿔 보세요.", "In a binary, fixing N_B = rN_A gives N_A = J_A / [1 − y_A(1 + r)]. Switch the scenario.")}</P>
        <div style={{ marginBottom: 6 }}>
          <Seg value={mode} onChange={setMode} options={[
            { v: "equimolar", label: t("등몰 역확산 (r = −1)", "Equimolar counter-diffusion (r = −1)") },
            { v: "stagnant", label: t("정체 B (r = 0)", "Stagnant B (r = 0)") },
            { v: "custom", label: t("직접 지정", "Custom r") },
          ]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("몰분율 y_A", "Mole fraction y_A")} value={yA} min={0.01} max={0.95} step={0.01} onChange={setYA} fmt={(v) => v.toFixed(2)} />
          <Slider label={t("확산 플럭스 J_A = −cD dy_A/dz", "Diffusive flux J_A = −cD dy_A/dz")} value={grad} min={0.1} max={2} step={0.05} onChange={setGrad} unit=" mol/m²s" fmt={(v) => v.toFixed(2)} />
          {mode === "custom" && <Slider label="r = N_B/N_A" value={rCustom} min={-3} max={3} step={0.05} onChange={setRCustom} fmt={(v) => v.toFixed(2)} />}
          <Slider label="M_A" value={MA} min={2} max={200} step={1} onChange={setMA} unit=" g/mol" />
          <Slider label="M_B" value={MB} min={2} max={200} step={1} onChange={setMB} unit=" g/mol" />
        </div>
        <svg viewBox={`0 0 ${Wd} ${H}`} style={{ width: "100%", maxWidth: Wd, display: "block", margin: "6px auto" }}>
          <line x1={x0} x2={x0} y1={pad.t} y2={H - pad.b} stroke={C.inkSoft} />
          {bars.map((b, i) => {
            const y = pad.t + 10 + i * 46;
            const w = isFinite(b.v) ? sx(b.v) : 0;
            return (
              <g key={b.k}>
                <text x={pad.l - 8} y={y + 17} fontSize="13" fill={C.ink} textAnchor="end" fontFamily={mono}>{b.k}</text>
                <rect x={w >= 0 ? x0 : x0 + w} y={y} width={Math.abs(w)} height={26} rx={4} fill={b.col} opacity={0.85} />
                <text x={w >= 0 ? x0 + w + 6 : x0 + w - 6} y={y + 17} fontSize="12" fill={C.ink} textAnchor={w >= 0 ? "start" : "end"} fontFamily={mono}>
                  {isFinite(b.v) ? b.v.toFixed(3) : "∞"}
                </text>
              </g>
            );
          })}
        </svg>
        <Readout>
          N_A = {isFinite(NA) ? NA.toFixed(3) : "∞"} = J_A {JA.toFixed(3)} + {t("벌크", "bulk")} {isFinite(bulk) ? bulk.toFixed(3) : "∞"} mol/m²s<br />
          v_A = {isFinite(vA) ? vA.toFixed(3) : "∞"}, v_B = {isFinite(vB) ? vB.toFixed(3) : "∞"}, V({t("몰평균", "molar")}) = {isFinite(Vmol) ? Vmol.toFixed(3) : "∞"}, v({t("질량평균", "mass")}) = {isFinite(vmass) ? vmass.toFixed(3) : "∞"} m/s &nbsp;(c = 1 mol/m³)
        </Readout>
        <Note>
          {mode === "equimolar"
            ? t("등몰 역확산에서는 N_A + N_B = 0이므로 벌크 항이 사라지고 N_A = J_A입니다. 몰평균 속도 V = 0입니다. 그러나 M_A ≠ M_B이면 질량평균 속도 v는 0이 아닙니다. 가벼운 H₂가 오른쪽으로, 무거운 N₂가 왼쪽으로 같은 몰수만큼 가면 질량 중심은 왼쪽으로 움직입니다. 그래서 '정지한 혼합물'이라는 말은 기준 속도를 밝혀야 의미가 있습니다.",
                "In equimolar counter-diffusion N_A + N_B = 0, so the bulk term vanishes and N_A = J_A; the molar-average velocity V = 0. Yet if M_A ≠ M_B the mass-average velocity v is not zero: light H₂ moving right and heavy N₂ moving left in equal moles shifts the center of mass to the left. 'A stationary mixture' only means something once you name the reference velocity.")
            : mode === "stagnant"
            ? t("정체 B(r = 0)에서는 N_A = J_A/(1 − y_A)입니다. y_A가 커질수록 벌크 흐름이 A를 실어 날라 확산을 증폭합니다. y_A → 1이면 발산합니다. 증발하는 액면 위의 증기(Stefan 확산)가 대표적인 예이며, 10주차에서 본격적으로 다룹니다.",
                "With stagnant B (r = 0), N_A = J_A/(1 − y_A). As y_A grows, bulk flow carries extra A and amplifies diffusion; at y_A → 1 it diverges. Vapor above an evaporating liquid (Stefan diffusion) is the classic case, treated fully in Week 10.")
            : t("r < −1이면 B가 반대 방향으로 더 많이 가서 벌크 흐름이 A를 거슬러 갑니다. 따라서 N_A < J_A입니다. 2부의 W CVD에서는 WF₆ 1몰이 들어갈 때 HF 6몰이 나오고 H₂ 3몰이 들어갑니다. 그래서 ΣN = −2N_A가 되고 N_A(1 + 2y_A) = −cD dy_A/dz가 됩니다.",
                "For r < −1, B moves more strongly the other way, so bulk flow runs against A and N_A < J_A. In Part 2's W CVD, each mole of WF₆ going in sends 6 mol HF out while 3 mol H₂ come in, so ΣN = −2N_A and N_A(1 + 2y_A) = −cD dy_A/dz.")}
        </Note>
      </Panel>

      <Panel title={t("확산의 진짜 구동력: 화학 퍼텐셜", "The real driving force: chemical potential")}>
        <P>
          {t(
            "Nernst–Einstein 관계는 확산 속도를 화학 퍼텐셜의 기울기에 비례하게 둡니다. 이상 혼합물의 μ_A = μ⁰ + RT ln c_A를 넣으면 Fick 법칙이 그대로 나옵니다.",
            "The Nernst–Einstein relation makes the diffusion velocity proportional to the gradient of chemical potential. Inserting the ideal-mixture μ_A = μ⁰ + RT ln c_A recovers Fick's law exactly."
          )}
        </P>
        <Eq block>v_A − V = −(D_AB/RT) dμ_A/dz &nbsp;→&nbsp; J_A = −c_A(D_AB/RT)(RT/c_A) dc_A/dz = −D_AB dc_A/dz</Eq>
        <P>
          {t(
            "따라서 Fick 법칙은 '이상 혼합물'이라는 근사 위에 서 있습니다. 농도가 아니라 μ의 기울기를 만드는 다른 방법도 있습니다. ① 온도 기울기(Soret 효과, 열확산), ② 외부장 기울기(중력·자기장·전기장), ③ 압력 기울기(원심분리, 압력 확산). 우라늄 동위원소 분리용 원심분리기는 ③을 이용합니다.",
            "So Fick's law stands on the 'ideal mixture' approximation. There are other ways to create a gradient in μ besides concentration: ① temperature gradients (Soret effect, thermal diffusion), ② external-field gradients (gravity, magnetic or electric fields), and ③ pressure gradients (centrifugation, pressure diffusion). Gas centrifuges for uranium isotope separation exploit ③."
          )}
        </P>
        <Note>
          {t(
            "강의의 이상기체 유도: 일정 T에서 dμ = v dP, v = k_BT/P를 적분하면 μ = μ⁰ + k_BT ln(P/P⁰) = μ⁰ + k_BT ln(c/c_T)입니다. Gibbs–Duhem 관계 Σ N_i dμ_i = 0은 이원계에서 두 성분의 구동력이 서로 독립이 아님을 뜻합니다.",
            "The lecture's ideal-gas derivation: at constant T, integrate dμ = v dP with v = k_BT/P to get μ = μ⁰ + k_BT ln(P/P⁰) = μ⁰ + k_BT ln(c/c_T). The Gibbs–Duhem relation Σ N_i dμ_i = 0 means that, in a binary, the two species' driving forces are not independent."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Gas diffusivity ---------------------------------- */
function TabGas({ t }) {
  const [a, setA] = useState("CO2");
  const [b, setB] = useState("Air");
  const [T, setT] = useState(293.15);
  const [Patm, setPatm] = useState(1.0);
  const ce = chapmanEnskog(a, b, T, Patm);
  const fu = fuller(a, b, T, Patm);
  const kin = kinetic(a, T, Patm);
  const same = a === b;

  /* LJ potential plot */
  const W1 = 520, H1 = 250, p1 = { l: 50, r: 14, t: 12, b: 36 };
  const lx = (r) => p1.l + ((W1 - p1.l - p1.r) * (r - 0.9)) / 1.1;
  const ly = (v) => p1.t + ((H1 - p1.t - p1.b) * (2 - v)) / 2.5;
  const lj = [];
  for (let i = 0; i <= 300; i++) {
    const r = 0.9 + (1.1 * i) / 300;
    const v = Math.pow(1 / r, 12) - Math.pow(1 / r, 6);
    if (v <= 2) lj.push([lx(r), ly(v)]);
  }
  const rmin = Math.pow(2, 1 / 6);

  /* D vs T plot */
  const W2 = 620, H2 = 270, p2 = { l: 60, r: 16, t: 12, b: 38 };
  const Tlo = 200, Thi = 1500;
  const Ds = [], Df = [];
  for (let i = 0; i <= 120; i++) {
    const TT = Tlo * Math.pow(Thi / Tlo, i / 120);
    Ds.push([TT, chapmanEnskog(a, b, TT, Patm).D]);
    Df.push([TT, fuller(a, b, TT, Patm)]);
  }
  const allD = Ds.concat(Df).map((d) => d[1]);
  const yLo = Math.floor(Math.log10(Math.min(...allD))), yHi = Math.ceil(Math.log10(Math.max(...allD)));
  const px = (TT) => p2.l + ((W2 - p2.l - p2.r) * Math.log(TT / Tlo)) / Math.log(Thi / Tlo);
  const py = (D) => H2 - p2.b - ((H2 - p2.t - p2.b) * (Math.log10(D) - yLo)) / (yHi - yLo || 1);

  const opts = GAS_KEYS.map((k) => ({ v: k, label: k }));
  return (
    <div>
      <Panel title={t("운동론에서 출발하기", "Starting from kinetic theory")}>
        <P>
          {t(
            "기체 분자는 평균 속력 u로 날아가다가 평균자유행로 λ마다 충돌해 방향을 바꿉니다. 이것은 한 걸음이 λ인 랜덤워크입니다. 따라서 D ~ λu/3입니다.",
            "A gas molecule flies at mean speed u and changes direction after each collision, every mean free path λ. That is a random walk with step λ, so D ~ λu/3."
          )}
        </P>
        <Eq block>λ = k_BT/(√2 πσ²P), &nbsp; u = √(8k_BN_AT/(πM)), &nbsp; D_AA* = λu/3 ∝ T<sup>3/2</sup>/(Pσ²√M)</Eq>
        <P>
          {t(
            "강체구 모형은 분자를 딱딱한 공으로 봅니다. 실제 분자는 멀리서 서로 끌고(반데르발스), 가까이서 강하게 밀어냅니다. 이를 Lennard-Jones 퍼텐셜로 나타냅니다.",
            "The hard-sphere model treats molecules as billiard balls. Real molecules attract at a distance (van der Waals) and repel strongly up close, which the Lennard-Jones potential captures."
          )}
        </P>
        <Eq block>V(r) = 4ε[(σ/r)¹² − (σ/r)⁶], &nbsp; ε: {t("우물 깊이", "well depth")}, &nbsp; σ: {t("분자 크기", "molecular size")}</Eq>
        <svg viewBox={`0 0 ${W1} ${H1}`} style={{ width: "100%", maxWidth: W1, display: "block", margin: "6px auto" }}>
          <rect x={p1.l} y={p1.t} width={W1 - p1.l - p1.r} height={H1 - p1.t - p1.b} fill="#fff" stroke={C.line} />
          <rect x={lx(0.9)} y={ly(2)} width={lx(1) - lx(0.9)} height={ly(0) - ly(2)} fill={C.coolPale} />
          <rect x={lx(1)} y={ly(0)} width={lx(1.5) - lx(1)} height={ly(-0.3) - ly(0)} fill="#f7dcd2" />
          <line x1={p1.l} x2={W1 - p1.r} y1={ly(0)} y2={ly(0)} stroke={C.inkSoft} strokeDasharray="4 3" />
          {polyline(lj, C.cool, 2.5)}
          <circle cx={lx(rmin)} cy={ly(-0.25)} r={4} fill={C.warn} />
          <text x={lx(rmin) - 4} y={ly(-0.25) + 20} fontSize="11.5" fill={C.warn}>r = 2^(1/6)σ, V = −ε</text>
          <text x={lx(0.93)} y={ly(1.8)} fontSize="11.5" fill={C.cool}>Z &gt; 1 ({t("척력", "repulsive")})</text>
          <text x={lx(1.33)} y={ly(0) + 13} fontSize="11.5" fill={C.warn}>Z &lt; 1 ({t("인력", "attractive")})</text>
          <text x={lx(1.82)} y={ly(0.12)} fontSize="11.5" fill={C.inkSoft}>Z ~ 1</text>
          {[1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((r) => <text key={r} x={lx(r)} y={H1 - p1.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{r.toFixed(1)}</text>)}
          {[-0.5, 0, 0.5, 1, 1.5, 2].map((v) => <text key={v} x={p1.l - 5} y={ly(v) + 4} fontSize="10.5" fill={C.inkSoft} textAnchor="end">{v}</text>)}
          {axisLabels(W1, H1, p1, "r/σ", "V/4ε")}
        </svg>
      </Panel>

      <Panel title={t("Chapman–Enskog 식과 충돌적분 Ω_D", "The Chapman–Enskog equation and the collision integral Ω_D")}>
        <Eq block>D_AB = 1.858×10⁻³ T<sup>3/2</sup> (1/M_A + 1/M_B)<sup>1/2</sup> / (P σ_AB² Ω_D) &nbsp; [cm²/s; T K, P atm, σ Å]</Eq>
        <P>
          {t(
            "혼합 규칙은 σ_AB = (σ_A + σ_B)/2, ε_AB = (ε_Aε_B)^½입니다. Ω_D는 k_BT/ε_AB만의 함수입니다. 온도가 우물 깊이에 비해 낮으면 분자가 서로 붙잡혀 충돌이 '효과적으로' 커지므로 Ω_D > 1이 됩니다. 이 모듈은 Neufeld 등(1972)의 맞춤식으로 Ω_D를 계산합니다(T* = 1에서 1.440, 표값 1.439). 실험값이 없을 때는 원자 부피를 더하는 Fuller 식이 간편합니다.",
            "Mixing rules: σ_AB = (σ_A + σ_B)/2, ε_AB = (ε_Aε_B)^½. Ω_D depends only on k_BT/ε_AB. When the temperature is low compared with the well depth, molecules hang on to each other and the collision is 'effectively' larger, so Ω_D > 1. This module evaluates Ω_D with the Neufeld et al. (1972) fit (1.440 at T* = 1; table 1.439). Without LJ data, the Fuller equation, which sums atomic diffusion volumes, is the handy alternative."
          )}
        </P>
        <Eq block>D_AB = 1.011×10⁻³ T<sup>1.75</sup> (1/M_A + 1/M_B)<sup>1/2</sup> / (P[(Σv_A)<sup>1/3</sup> + (Σv_B)<sup>1/3</sup>]²)</Eq>
      </Panel>

      <Panel title={t("인터랙티브: 기체 확산계수 계산기", "Interactive: gas-diffusivity calculator")}>
        <div>
          <Select label="A" value={a} onChange={setA} options={opts} />
          <Select label="B" value={b} onChange={setB} options={opts} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("온도 T", "Temperature T")} value={T} min={200} max={1500} step={5} onChange={setT} unit=" K" fmt={(v) => v.toFixed(0)} />
          <Slider label={t("압력 P", "Pressure P")} value={Patm} min={0.1} max={10} step={0.1} onChange={setPatm} unit=" atm" fmt={(v) => v.toFixed(1)} />
        </div>
        <Readout>
          σ_AB = {ce.sab.toFixed(3)} Å · ε_AB/k_B = {ce.eab.toFixed(1)} K · T* = {ce.ts.toFixed(3)} · Ω_D = {ce.om.toFixed(4)}<br />
          D_AB (Chapman–Enskog) = <b>{ce.D.toFixed(4)}</b> cm²/s · D_AB (Fuller) = <b>{fu.toFixed(4)}</b> cm²/s ({((fu / ce.D - 1) * 100).toFixed(1)}%)<br />
          {t("운동론", "Kinetic theory")} ({a}): λ = {(kin.lam * 1e9).toFixed(1)} nm, u = {kin.u.toFixed(0)} m/s{same ? `, D_AA* = λu/3 = ${(kin.D * 1e4).toFixed(3)} cm²/s` : ""}
        </Readout>
        <AxisBox W={W2} H={H2} pad={p2}>
          {logTicks(yLo, yHi, "y", (e) => py(Math.pow(10, e)), W2, H2, p2)}
          {[200, 300, 500, 700, 1000, 1500].map((TT) => (
            <g key={TT}><line x1={px(TT)} x2={px(TT)} y1={p2.t} y2={H2 - p2.b} stroke="#f0ebe2" /><text x={px(TT)} y={H2 - p2.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{TT}</text></g>
          ))}
          {polyline(Ds.map(([x, y]) => [px(x), py(y)]), C.copper, 2.5)}
          {polyline(Df.map(([x, y]) => [px(x), py(y)]), C.cool, 2, "6 4")}
          <circle cx={px(T)} cy={py(ce.D)} r={4.5} fill={C.warn} />
          <text x={W2 - p2.r - 8} y={p2.t + 16} fontSize="11.5" fill={C.copper} textAnchor="end">Chapman–Enskog</text>
          <text x={W2 - p2.r - 8} y={p2.t + 32} fontSize="11.5" fill={C.cool} textAnchor="end">Fuller</text>
          {axisLabels(W2, H2, p2, "T (K)", "D_AB (cm²/s)")}
        </AxisBox>
        <Note>
          {t(
            "기본값(CO₂–공기, 20 °C, 1 atm)에서 D ≈ 0.147 cm²/s(Chapman–Enskog), 0.154 cm²/s(Fuller)입니다. 확인해 볼 것: P를 2배로 하면 D는 정확히 절반이 됩니다(D ∝ 1/P). 로그 그래프의 기울기는 1.5보다 조금 큽니다. Ω_D가 온도에 따라 줄어들기 때문이며, Fuller는 이를 지수 1.75로 흡수했습니다. 강의의 환산식 D(T₂,P₂) = D(T₁,P₁)(P₁/P₂)(T₂/T₁)^(3/2) Ω_D(T₁)/Ω_D(T₂)는 이 계산기에서 그대로 성립합니다.",
            "At the default (CO₂–air, 20 °C, 1 atm), D ≈ 0.147 cm²/s (Chapman–Enskog) and 0.154 cm²/s (Fuller). Things to check: doubling P halves D exactly (D ∝ 1/P). The log-log slope is a bit above 1.5 because Ω_D falls with temperature; Fuller absorbs that into the exponent 1.75. The lecture's scaling D(T₂,P₂) = D(T₁,P₁)(P₁/P₂)(T₂/T₁)^(3/2) Ω_D(T₁)/Ω_D(T₂) holds exactly in this calculator."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Liquid diffusivity ---------------------------------- */
const SOLVENTS = {
  water: { kr: "물", en: "Water", phi: 2.26, M: 18.02, mu: 0.890 },
  methanol: { kr: "메탄올", en: "Methanol", phi: 1.9, M: 32.04, mu: 0.544 },
  ethanol: { kr: "에탄올", en: "Ethanol", phi: 1.5, M: 46.07, mu: 1.074 },
  benzene: { kr: "벤젠", en: "Benzene", phi: 1.0, M: 78.11, mu: 0.604 },
};
const SOLUTES = {
  H2: 14.3, O2: 25.6, N2: 31.2, Air: 29.9, CO: 30.7, CO2: 34.0, NH3: 25.8, H2O: 18.9, H2S: 32.9, Cl2: 48.4, NO: 23.6, SO2: 44.8,
};

function TabLiquid({ t }) {
  const [solv, setSolv] = useState("water");
  const [solute, setSolute] = useState("O2");
  const [useAtoms, setUseAtoms] = useState(false);
  const [nC, setNC] = useState(2);
  const [nH, setNH] = useState(6);
  const [nO, setNO] = useState(1);
  const [T, setT] = useState(298.15);
  const [mu, setMu] = useState(0.89);
  const [rnm, setRnm] = useState(10);
  const sv = SOLVENTS[solv];
  const VA = useAtoms ? 14.8 * nC + 3.7 * nH + 7.4 * nO : SOLUTES[solute];
  const Dwc = wilkeChang(T, mu, sv.M, VA, sv.phi);
  const Dse = (KB * T) / (6 * Math.PI * rnm * 0.5e-9 * mu * 1e-3); // m²/s, r = d/2

  const pickSolvent = (v) => { setSolv(v); setMu(SOLVENTS[v].mu); };

  /* Stokes–Einstein curve vs diameter */
  const Wd = 600, H = 250, pad = { l: 60, r: 16, t: 12, b: 38 };
  const dlo = 0, dhi = 4; // log10 nm
  const Dhi = Math.log10((KB * T) / (6 * Math.PI * 0.5e-9 * mu * 1e-3));
  const px = (ld) => pad.l + ((Wd - pad.l - pad.r) * (ld - dlo)) / (dhi - dlo);
  const yTop = Math.ceil(Dhi), yBot = yTop - 5;
  const py = (lD) => pad.t + ((H - pad.t - pad.b) * (yTop - lD)) / (yTop - yBot);
  const curve = [];
  for (let i = 0; i <= 100; i++) {
    const ld = dlo + ((dhi - dlo) * i) / 100;
    const D = (KB * T) / (6 * Math.PI * Math.pow(10, ld) * 0.5e-9 * mu * 1e-3);
    curve.push([px(ld), py(Math.log10(D))]);
  }

  return (
    <div>
      <Panel title={t("액체 속 확산: 마찰이 지배한다", "Diffusion in liquids: friction rules")}>
        <P>
          {t(
            "액체에서는 분자가 이웃에 둘러싸여 있어 '자유 비행'이 없습니다. 큰 입자 A가 연속체 용매 B 속을 움직인다고 보면, 열적 요동(k_BT)과 Stokes 항력(6πμ_Br)의 균형에서 Stokes–Einstein 식이 나옵니다. 7탭의 Langevin 방정식이 같은 결과를 줍니다.",
            "In a liquid a molecule is caged by neighbors, so there is no 'free flight'. Treating a large particle A in a continuum solvent B, the balance of thermal agitation (k_BT) against Stokes drag (6πμ_Br) gives the Stokes–Einstein equation; the Langevin equation in tab 7 gives the same result."
          )}
        </P>
        <Eq block>D_AB = k_BT/(6πrμ_B) &nbsp;&nbsp;|&nbsp;&nbsp; D_ABμ_B/T = 7.4×10⁻⁸(Φ_BM_B)<sup>1/2</sup>/V_A<sup>0.6</sup> &nbsp; (Wilke–Chang)</Eq>
        <P>
          {t(
            "Wilke–Chang 식은 저분자~중간 크기 용질에 쓰는 경험식입니다(D cm²/s, μ cP, V_A는 끓는점에서의 몰부피 cm³/mol). Φ_B는 용매의 '회합' 정도입니다. 물은 수소결합으로 회합하므로 2.26, 비회합 용매는 1.0입니다. 두 식 모두 Dμ/T가 거의 일정하다고 말합니다. 그래서 온도를 올리면 D는 T뿐 아니라 점도 감소 덕분에 더 크게 늘어납니다.",
            "Wilke–Chang is an empirical correlation for small-to-moderate solutes (D in cm²/s, μ in cP, V_A the molar volume at the normal boiling point in cm³/mol). Φ_B measures solvent 'association': hydrogen-bonded water gets 2.26, unassociated solvents 1.0. Both equations say Dμ/T is nearly constant, so heating raises D through both T and the falling viscosity."
          )}
        </P>
      </Panel>

      <Panel title={t("인터랙티브: Wilke–Chang 계산기", "Interactive: Wilke–Chang calculator")}>
        <div>
          <Select label={t("용매 B", "Solvent B")} value={solv} onChange={pickSolvent}
            options={Object.keys(SOLVENTS).map((k) => ({ v: k, label: `${t(SOLVENTS[k].kr, SOLVENTS[k].en)} (Φ = ${SOLVENTS[k].phi})` }))} />
          {!useAtoms && <Select label={t("용질 A", "Solute A")} value={solute} onChange={setSolute}
            options={Object.keys(SOLUTES).map((k) => ({ v: k, label: `${k} (V = ${SOLUTES[k]})` }))} />}
          <label style={{ fontSize: 13, color: C.inkSoft }}>
            <input type="checkbox" checked={useAtoms} onChange={(e) => setUseAtoms(e.target.checked)} style={{ accentColor: C.copper, marginRight: 6 }} />
            {t("원자 부피로 V_A 만들기 (C·H·O)", "Build V_A from atomic volumes (C, H, O)")}
          </label>
        </div>
        {useAtoms && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0 18px" }}>
            <Slider label="C (14.8)" value={nC} min={0} max={12} step={1} onChange={setNC} />
            <Slider label="H (3.7)" value={nH} min={0} max={26} step={1} onChange={setNH} />
            <Slider label="O (7.4)" value={nO} min={0} max={6} step={1} onChange={setNO} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("온도 T", "Temperature T")} value={T} min={273.15} max={363.15} step={1} onChange={setT} unit=" K" fmt={(v) => v.toFixed(0)} />
          <Slider label={t("용매 점도 μ_B (온도에 맞게 조정)", "Solvent viscosity μ_B (adjust with T)")} value={mu} min={0.2} max={2} step={0.01} onChange={setMu} unit=" cP" fmt={(v) => v.toFixed(2)} />
        </div>
        <Readout>
          V_A = {VA.toFixed(1)} cm³/mol · Φ_B M_B = {(sv.phi * sv.M).toFixed(1)} → D_AB = <b>{sci(Dwc, 3)}</b> cm²/s = {sci(Dwc * 1e-4, 3)} m²/s
        </Readout>
        <Note>
          {t(
            "기본값(O₂, 물, 25 °C)에서 2.26×10⁻⁵ cm²/s입니다. 원자 부피로 에탄올(C₂H₆O)을 만들면 V_A = 59.2, D ≈ 1.37×10⁻⁵ cm²/s가 나옵니다. 이 식의 전형적 오차는 10–20%입니다. 물의 점도는 25 °C에서 0.89 cP, 80 °C에서 약 0.35 cP입니다. T만 올리고 μ를 그대로 두면 온도 효과를 크게 과소평가합니다.",
            "The default (O₂ in water, 25 °C) gives 2.26×10⁻⁵ cm²/s. Building ethanol (C₂H₆O) from atomic volumes gives V_A = 59.2 and D ≈ 1.37×10⁻⁵ cm²/s. Typical error of the correlation is 10–20%. Water's viscosity is 0.89 cP at 25 °C and about 0.35 cP at 80 °C; raising T without lowering μ badly underestimates the temperature effect."
          )}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: Stokes–Einstein — 입자가 클수록 느리다", "Interactive: Stokes–Einstein — bigger is slower")}>
        <Slider label={t("입자 지름 d", "Particle diameter d")} value={rnm} min={1} max={5000} step={1} onChange={setRnm} unit=" nm" />
        <AxisBox W={Wd} H={H} pad={pad}>
          {logTicks(yBot, yTop, "y", py, Wd, H, pad)}
          {logTicks(dlo, dhi, "x", px, Wd, H, pad)}
          {polyline(curve, C.violet, 2.5)}
          <circle cx={px(Math.log10(rnm))} cy={py(Math.log10(Dse))} r={4.5} fill={C.warn} />
          {axisLabels(Wd, H, pad, t("지름 d (nm)", "diameter d (nm)"), "D (m²/s)")}
        </AxisBox>
        <Readout>
          D = k_BT/(3πμd) = <b>{sci(Dse, 3)}</b> m²/s · {t("1 μm 이동 시간", "time to move 1 μm")} t ≈ L²/(2D) = {sci(1e-12 / (2 * Dse), 2)} s
        </Readout>
        <Note>
          {t(
            "D ∝ 1/d이므로 로그 그래프에서 기울기 −1의 직선입니다. 10 nm 나노입자는 물속에서 D ≈ 4.9×10⁻¹¹ m²/s로, 저분자보다 약 40배 느립니다. 이 관계를 거꾸로 쓰면 동적광산란(DLS)이 됩니다. 확산계수를 측정해 입자 크기를 구하는 방법입니다.",
            "D ∝ 1/d, a slope −1 line on the log plot. A 10 nm nanoparticle in water has D ≈ 4.9×10⁻¹¹ m²/s, about 40 times slower than a small molecule. Run the relation backwards and you get dynamic light scattering (DLS): measure the diffusivity, infer the particle size."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Pore diffusion ---------------------------------- */
function porousLattice(L, eps, seed) {
  const rng = makeRng(seed);
  const open = new Uint8Array(L * L);
  for (let s = 0; s < L * L; s++) open[s] = rng.uni() < eps ? 1 : 0;
  return open;
}
function runPorousWalk(open, L, nw, ns, seed, keepPaths = 0) {
  const rng = makeRng(seed);
  const voids = [];
  for (let s = 0; s < L * L; s++) if (open[s]) voids.push(s);
  if (voids.length === 0) return { ratio: 0, paths: [] };
  const di = [1, -1, 0, 0], dj = [0, 0, 1, -1];
  let msd = 0;
  const paths = [];
  for (let w = 0; w < nw; w++) {
    const s0 = voids[Math.floor(rng.uni() * voids.length)];
    let i = Math.floor(s0 / L), j = s0 % L, X = 0, Y = 0;
    const path = w < keepPaths ? [[i, j, X, Y]] : null;
    for (let n = 0; n < ns; n++) {
      const d = Math.floor(rng.uni() * 4);
      const ni = (i + di[d] + L) % L, nj = (j + dj[d] + L) % L;
      if (open[ni * L + nj]) { i = ni; j = nj; X += di[d]; Y += dj[d]; }
      if (path && n % 4 === 0) path.push([i, j, X, Y]);
    }
    msd += X * X + Y * Y;
    if (path) paths.push(path);
  }
  return { ratio: msd / nw / ns, paths };
}

function TabPore({ t }) {
  const [gas, setGas] = useState("N2");
  const [T, setT] = useState(300);
  const [DAB, setDAB] = useState(0.2);
  const [ay, setAy] = useState(0);
  const [eps, setEps] = useState(0.4);
  const [dnm, setDnm] = useState(100);
  const M = GAS[gas].M;
  const DK = knudsen(dnm * 1e-7, T, M);
  const De = 1 / ((1 - ay) / DAB + 1 / DK);
  const lam = kinetic(gas, T, 1).lam;
  const Kn = lam / (dnm * 1e-9);

  const Wd = 620, H = 270, pad = { l: 60, r: 16, t: 12, b: 38 };
  const xlo = 0, xhi = 4, ylo = -4, yhi = 1;
  const px = (ld) => pad.l + ((Wd - pad.l - pad.r) * (ld - xlo)) / (xhi - xlo);
  const py = (lD) => H - pad.b - ((H - pad.t - pad.b) * (Math.max(ylo, Math.min(yhi, lD)) - ylo)) / (yhi - ylo);
  const cK = [], cE = [];
  for (let i = 0; i <= 120; i++) {
    const ld = xlo + ((xhi - xlo) * i) / 120;
    const dk = knudsen(Math.pow(10, ld) * 1e-7, T, M);
    if (Math.log10(dk) <= yhi) cK.push([px(ld), py(Math.log10(dk))]);
    cE.push([px(ld), py(Math.log10(1 / ((1 - ay) / DAB + 1 / dk)))]);
  }

  /* Monte Carlo lattice */
  const L = 64;
  const [mcEps, setMcEps] = useState(0.75);
  const [seed, setSeed] = useState(3);
  const [results, setResults] = useState([]);
  const [paths, setPaths] = useState([]);
  const lattice = useMemo(() => porousLattice(L, mcEps, seed), [mcEps, seed]);
  const canvasRef = useRef(null);
  const run = () => {
    const r = runPorousWalk(lattice, L, 400, 3000, seed + 11, 5);
    setPaths(r.paths);
    setResults((old) => [...old.filter((o) => Math.abs(o.eps - mcEps) > 1e-9), { eps: mcEps, ratio: r.ratio }].sort((p, q) => q.eps - p.eps));
  };
  useEffect(() => { setPaths([]); }, [mcEps, seed]);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const s = cv.width / L;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#3a4f78";
    for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) if (!lattice[i * L + j]) ctx.fillRect(j * s, i * s, s, s);
    const cols = ["#e0603a", "#e8b030", "#3e9d5f", "#c04fb0", "#2fa7c8"];
    paths.forEach((p, k) => {
      ctx.strokeStyle = cols[k % cols.length];
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let n = 0; n < p.length; n++) {
        const [i, j] = p[n];
        const x = (j + 0.5) * s, y = (i + 0.5) * s;
        if (n === 0) ctx.moveTo(x, y);
        else {
          const [pi, pj] = p[n - 1];
          if (Math.abs(i - pi) > 2 || Math.abs(j - pj) > 2) ctx.moveTo(x, y); // periodic wrap
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
  }, [lattice, paths]);

  return (
    <div>
      <Panel title={t("세공 속 확산: 벽이 끼어들 때", "Diffusion in pores: when the wall cuts in")}>
        <P>
          {t(
            "세공 지름이 평균자유행로보다 훨씬 작으면(d_pore ≪ λ) 분자는 다른 분자보다 벽과 더 자주 부딪힙니다. 이때 랜덤워크의 걸음 길이는 λ가 아니라 d_pore입니다. 이것이 Knudsen 확산입니다.",
            "When the pore diameter is much smaller than the mean free path (d_pore ≪ λ), molecules hit the wall far more often than each other. The random-walk step is then d_pore, not λ: Knudsen diffusion."
          )}
        </P>
        <Eq block>Kn = λ/d_pore, &nbsp; D_KA = (d_pore/3)√(8k_BN_AT/(πM_A)) = 4850 d_pore √(T/M_A) &nbsp; [cm²/s, d cm]</Eq>
        <P>
          {t(
            "핵심은 두 가지입니다. D_K ∝ T^½이고(분자 확산은 T^(3/2)), 압력과 무관합니다. 걸음 길이 d_pore가 온도·압력과 상관없기 때문입니다. 두 기구가 비슷할 때는 저항을 직렬로 더합니다. 무작위 다공체에서는 기공률 ε로 한 번 더 보정합니다.",
            "Two key points: D_K ∝ T^½ (molecular diffusion goes as T^(3/2)), and it does not depend on pressure, because the step d_pore does not depend on T or P. When the two mechanisms compete, add their resistances in series; in a random porous solid, correct once more with the porosity ε."
          )}
        </P>
        <Eq block>1/D_Ae = (1 − αy_A)/D_AB + 1/D_KA, &nbsp; α = 1 + N_B/N_A; &nbsp;&nbsp; D′_Ae = ε²D_Ae</Eq>
      </Panel>

      <Panel title={t("인터랙티브: 분자 확산 ↔ Knudsen 전이", "Interactive: the molecular ↔ Knudsen transition")}>
        <div><Select label={t("기체", "Gas")} value={gas} onChange={setGas} options={GAS_KEYS.map((k) => ({ v: k, label: `${k} (M = ${GAS[k].M})` }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("세공 지름 d", "Pore diameter d")} value={dnm} min={1} max={10000} step={1} onChange={setDnm} unit=" nm" />
          <Slider label="T" value={T} min={250} max={1000} step={5} onChange={setT} unit=" K" />
          <Slider label="D_AB (1 atm)" value={DAB} min={0.05} max={1.5} step={0.01} onChange={setDAB} unit=" cm²/s" fmt={(v) => v.toFixed(2)} />
          <Slider label="αy_A" value={ay} min={-1} max={0.8} step={0.05} onChange={setAy} fmt={(v) => v.toFixed(2)} />
          <Slider label={t("기공률 ε", "Porosity ε")} value={eps} min={0.1} max={1} step={0.01} onChange={setEps} fmt={(v) => v.toFixed(2)} />
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          {logTicks(ylo, yhi, "y", (e) => py(e), Wd, H, pad)}
          {logTicks(xlo, xhi, "x", px, Wd, H, pad)}
          <line x1={pad.l} x2={Wd - pad.r} y1={py(Math.log10(DAB / (1 - ay)))} y2={py(Math.log10(DAB / (1 - ay)))} stroke={C.good} strokeDasharray="6 4" strokeWidth={1.8} />
          {polyline(cK, C.cool, 2, "3 3")}
          {polyline(cE, C.copper, 2.6)}
          <line x1={px(Math.log10(lam * 1e9))} x2={px(Math.log10(lam * 1e9))} y1={pad.t} y2={H - pad.b} stroke={C.inkSoft} strokeDasharray="2 3" />
          <text x={px(Math.log10(lam * 1e9)) + 4} y={pad.t + 14} fontSize="11" fill={C.inkSoft}>d = λ (1 atm)</text>
          <circle cx={px(Math.log10(dnm))} cy={py(Math.log10(De))} r={4.5} fill={C.warn} />
          <text x={pad.l + 8} y={pad.t + 16} fontSize="11.5" fill={C.cool}>D_K ∝ d</text>
          <text x={Wd - pad.r - 8} y={py(Math.log10(DAB / (1 - ay))) - 6} fontSize="11.5" fill={C.good} textAnchor="end">D_AB/(1 − αy_A)</text>
          {axisLabels(Wd, H, pad, t("세공 지름 (nm)", "pore diameter (nm)"), "D (cm²/s)")}
        </AxisBox>
        <Readout>
          λ({gas}, {T} K, 1 atm) = {(lam * 1e9).toFixed(1)} nm → Kn = {Kn.toFixed(2)} · D_K = {sci(DK, 3)} · D_Ae = {sci(De, 3)} · D′_Ae = ε²D_Ae = {sci(eps * eps * De, 3)} cm²/s
          <br />{Kn > 10 ? t("→ Knudsen 영역: 벽 충돌이 지배", "→ Knudsen regime: wall collisions dominate") : Kn < 0.1 ? t("→ 분자 확산 영역: 분자 간 충돌이 지배", "→ molecular regime: intermolecular collisions dominate") : t("→ 전이 영역: 두 저항을 모두 고려", "→ transition regime: keep both resistances")}
        </Readout>
        <Note>
          {t(
            "촉매 펠릿(세공 수~수십 nm), 연료전지 기체확산층(GDL), 반도체 저유전율(low-k) 다공막이 모두 이 그래프의 왼쪽 절반에 삽니다. 압력을 낮추면 λ가 커지므로 같은 세공도 Knudsen 쪽으로 이동합니다. 그런데 D_K 자체는 압력과 무관합니다. 그래서 저압 공정에서는 세공 내 확산이 압력을 낮춰도 빨라지지 않습니다.",
            "Catalyst pellets (pores of a few to tens of nm), fuel-cell gas-diffusion layers (GDL), and porous low-k dielectric films in semiconductors all live on the left half of this plot. Lowering the pressure raises λ, pushing the same pore toward the Knudsen side. Yet D_K itself is pressure-independent, so in low-pressure processes in-pore diffusion does not speed up as pressure drops."
          )}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: 다공체 속 랜덤워크 (Monte Carlo)", "Interactive: random walks in a porous solid (Monte Carlo)")}>
        <P>
          {t(
            "강의의 Monte Carlo 그림을 직접 돌려 봅니다. 64×64 격자에서 각 칸이 확률 ε로 비어 있습니다. 걷는 입자는 무작위 방향을 고르고, 그 칸이 막혀 있으면 제자리에 머뭅니다. 400개 입자가 3000걸음 걸은 평균제곱변위로 D_eff/D₀를 구해 ε² 규칙과 비교합니다.",
            "Run the lecture's Monte Carlo picture yourself. On a 64×64 lattice each site is open with probability ε. A walker picks a random direction and stays put if that site is blocked. The mean-square displacement of 400 walkers after 3000 steps gives D_eff/D₀, compared with the ε² rule."
          )}
        </P>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
          <canvas ref={canvasRef} width={320} height={320} style={{ width: 320, maxWidth: "100%", border: `1px solid ${C.line}`, borderRadius: 8 }} />
          <div style={{ flex: "1 1 240px" }}>
            <Slider label={t("기공률 ε (빈 칸 비율)", "Porosity ε (open-site fraction)")} value={mcEps} min={0.45} max={1} step={0.01} onChange={setMcEps} fmt={(v) => v.toFixed(2)} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0" }}>
              <button onClick={run} style={btnStyle(true)}>{t("▶ 걷기 실행", "▶ Run walkers")}</button>
              <button onClick={() => setSeed((s) => s + 1)} style={btnStyle(false)}>{t("새 구조", "New structure")}</button>
              <button onClick={() => setResults([])} style={btnStyle(false)}>{t("표 지우기", "Clear table")}</button>
            </div>
            <Table
              head={["ε", "D_eff/D₀ (MC)", "ε²"]}
              rows={results.map((r) => [r.eps.toFixed(2), r.ratio.toFixed(3), (r.eps * r.eps).toFixed(3)])}
            />
          </div>
        </div>
        <Note>
          {t(
            "ε를 0.9 → 0.6으로 내리며 실행해 보세요. ε가 클 때는 ε² 규칙과 비슷하지만, ε ≈ 0.6 근처에서 D_eff가 0으로 곤두박질칩니다. 2D 정사각 격자의 자리 스미기(site percolation) 문턱 ≈ 0.593 아래에서는 빈 공간이 끝에서 끝까지 이어지지 않기 때문입니다. 강의에서 강조한 '기공 연결성'의 정량적 의미가 이것입니다. ε²는 편리한 근사일 뿐, 연결성과 굴곡도(tortuosity)를 담지 못합니다.",
            "Run it while lowering ε from 0.9 to 0.6. At high ε the result tracks the ε² rule, but near ε ≈ 0.6 D_eff plunges to zero: below the 2D square-lattice site-percolation threshold ≈ 0.593, open space no longer spans the sample. That is the quantitative meaning of the 'pore connectivity' stressed in lecture. ε² is a convenient approximation that captures neither connectivity nor tortuosity."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Solid diffusion ---------------------------------- */
const SOLID = [
  { k: "Au (fcc, self)", D0: 10.7, Q: 176.9, col: "#c9a227" },
  { k: "Cu (fcc, self)", D0: 31, Q: 200.3, col: "#b06a3b" },
  { k: "Ni (fcc, self)", D0: 190, Q: 279.7, col: "#6b7a8f" },
  { k: "Fe γ (fcc, self)", D0: 49, Q: 284.1, col: "#7c4520" },
  { k: "Fe α (bcc, self)", D0: 200, Q: 239.7, col: "#a04024" },
  { k: "C in Fe (bcc)", D0: 2.0, Q: 84.1, col: "#20304f" },
  { k: "N in Fe (bcc)", D0: 0.3, Q: 76.1, col: "#3a6ea5" },
  { k: "H in Fe (bcc)", D0: 0.1, Q: 13.4, col: "#3e7d4f" },
  { k: "C in Fe (fcc)", D0: 2.5, Q: 144.2, col: "#6b4fa0" },
];

function TabSolid({ t }) {
  const [T, setT] = useState(1000);
  const [hours, setHours] = useState(1);
  const [sel, setSel] = useState(5);
  const [show, setShow] = useState(() => SOLID.map(() => true));
  const sp = SOLID[sel];
  const D = arrhenius(sp.D0, sp.Q, T);
  const tsec = hours * 3600;
  const Ldiff = Math.sqrt(D * tsec);

  const Wd = 620, H = 300, pad = { l: 62, r: 16, t: 12, b: 38 };
  const xlo = 0.5, xhi = 2.0; // 1000/T
  const ylo = -22, yhi = -6;
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * (x - xlo)) / (xhi - xlo);
  const py = (lD) => H - pad.b - ((H - pad.t - pad.b) * (Math.max(ylo, Math.min(yhi, lD)) - ylo)) / (yhi - ylo);

  /* erfc profile of a diffusion couple (Cu | Ni style), using the selected D */
  const W2 = 620, H2 = 230, p2 = { l: 50, r: 16, t: 12, b: 38 };
  const half = Math.max(4 * Ldiff, 1e-9);
  const qx = (x) => p2.l + ((W2 - p2.l - p2.r) * (x + half)) / (2 * half);
  const qy = (c) => H2 - p2.b - (H2 - p2.t - p2.b) * c;
  const prof = [], prof2 = [];
  for (let i = 0; i <= 200; i++) {
    const x = -half + (2 * half * i) / 200;
    const c = 0.5 * (1 - erf(x / (2 * Ldiff)));
    prof.push([qx(x), qy(c)]);
    prof2.push([qx(x), qy(1 - c)]);
  }
  const unit = Ldiff >= 1e-3 ? ["mm", 1e3] : Ldiff >= 1e-6 ? ["μm", 1e6] : ["nm", 1e9];

  return (
    <div>
      <Panel title={t("고체 속 확산: 에너지 장벽을 넘는 도약", "Diffusion in solids: hops over an energy barrier")}>
        <P>
          {t(
            "고체 원자는 격자 자리에 갇혀 진동합니다. 이웃 빈자리(공공)로 뛰거나(공공 기구), 격자 사이 틈을 따라 뛰어야(침입형 기구) 이동할 수 있습니다. 뛰려면 격자를 비틀어야 하므로 활성화 에너지가 필요합니다. 따라서 D는 Arrhenius 형태를 따릅니다.",
            "Atoms in a solid vibrate in their lattice sites. To move, they must jump into a neighboring vacancy (vacancy mechanism) or hop between interstices (interstitial mechanism). A jump strains the lattice, so it needs an activation energy, and D follows the Arrhenius form."
          )}
        </P>
        <Eq block>D = D₀ exp(−Q/RT) &nbsp;→&nbsp; log D = log D₀ − (Q/2.303R)(1/T)</Eq>
        <P>
          {t(
            "log D 대 1/T 그래프는 직선이고, 기울기에서 Q를 얻습니다. 작은 침입형 원자(C, N, H)는 Q가 작아 금속 자기확산보다 수만 배 이상 빠릅니다. 같은 철이라도 bcc(α)의 C 확산이 fcc(γ)보다 빠릅니다. bcc 격자가 덜 조밀하기 때문입니다.",
            "A plot of log D against 1/T is a straight line whose slope gives Q. Small interstitials (C, N, H) have small Q and diffuse tens of thousands of times faster than metal self-diffusion. Even in iron, C diffuses faster in bcc (α) than in fcc (γ), because the bcc lattice is less densely packed."
          )}
        </P>
      </Panel>

      <Panel title={t("인터랙티브: 강의 표의 Arrhenius 그림", "Interactive: Arrhenius plot of the lecture table")}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginBottom: 4 }}>
          {SOLID.map((s, i) => (
            <label key={s.k} style={{ fontSize: 12.5, color: s.col, cursor: "pointer" }}>
              <input type="checkbox" checked={show[i]} onChange={() => setShow((o) => o.map((v, j) => (j === i ? !v : v)))} style={{ accentColor: s.col, marginRight: 4 }} />
              {s.k}
            </label>
          ))}
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          {logTicks(ylo, yhi, "y", (e) => py(e), Wd, H, pad).filter((_, i) => i % 2 === 0)}
          {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((x) => (
            <g key={x}><line x1={px(x)} x2={px(x)} y1={pad.t} y2={H - pad.b} stroke="#f0ebe2" /><text x={px(x)} y={H - pad.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{x}</text></g>
          ))}
          {SOLID.map((s, i) => show[i] && (
            <g key={s.k}>
              {polyline(
                Array.from({ length: 61 }, (_, k) => xlo + ((xhi - xlo) * k) / 60)
                  .map((x) => [x, Math.log10(arrhenius(s.D0, s.Q, 1000 / x))])
                  .filter(([, lD]) => lD >= ylo && lD <= yhi)
                  .map(([x, lD]) => [px(x), py(lD)]),
                s.col, i === sel ? 3.2 : 1.6)}
            </g>
          ))}
          <line x1={px(1000 / T)} x2={px(1000 / T)} y1={pad.t} y2={H - pad.b} stroke={C.warn} strokeDasharray="4 3" />
          <circle cx={px(1000 / T)} cy={py(Math.log10(D))} r={5} fill={C.warn} />
          {axisLabels(Wd, H, pad, "1000/T (K⁻¹)", "D (m²/s)")}
        </AxisBox>
        <Select label={t("강조할 계", "Highlight")} value={String(sel)} onChange={(v) => setSel(+v)} options={SOLID.map((s, i) => ({ v: String(i), label: `${s.k}: D₀ = ${s.D0} mm²/s, Q = ${s.Q} kJ/mol` }))} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label="T" value={T} min={500} max={1800} step={10} onChange={setT} unit=" K" />
          <Slider label={t("열처리 시간", "Anneal time")} value={hours} min={0.01} max={100} step={0.01} onChange={setHours} unit=" h" fmt={(v) => v.toFixed(2)} />
        </div>
        <Readout>
          {sp.k} @ {T} K: D = <b>{sci(D, 3)}</b> m²/s · {t("확산 길이", "diffusion length")} √(Dt) = <b>{(Ldiff * unit[1]).toPrecision(3)} {unit[0]}</b>
        </Readout>
      </Panel>

      <Panel title={t("인터랙티브: 확산쌍의 erf 프로파일 (Cu | Ni 예시)", "Interactive: erf profile of a diffusion couple (Cu | Ni style)")}>
        <P>
          {t(
            "두 금속을 맞붙여 가열하면 경계가 흐려집니다. 무한 매질의 계단 초기조건에 대한 Fick 2법칙의 해는 4주차 반무한체 해와 같은 erf 함수입니다. 위에서 고른 D와 시간으로 그렸습니다.",
            "Clamp two metals together and heat them: the boundary blurs. Fick's second law with a step initial condition in an infinite medium gives the same erf solution as Week 4's semi-infinite body. Drawn with the D and time chosen above."
          )}
        </P>
        <Eq block>c_A(x, t)/c_A0 = ½ erfc[x/(2√(Dt))]</Eq>
        <AxisBox W={W2} H={H2} pad={p2}>
          {polyline(prof, C.copper, 2.6)}
          {polyline(prof2, "#6b7a8f", 2.6)}
          <line x1={qx(0)} x2={qx(0)} y1={p2.t} y2={H2 - p2.b} stroke={C.inkSoft} strokeDasharray="3 3" />
          {[-4, -2, 0, 2, 4].map((k) => <text key={k} x={qx(k * Ldiff)} y={H2 - p2.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{k === 0 ? "0" : `${k}√(Dt)`}</text>)}
          <text x={qx(-3.4 * Ldiff)} y={qy(0.8)} fontSize="12" fill={C.copper}>A ({t("예: Cu", "e.g., Cu")})</text>
          <text x={qx(2.6 * Ldiff)} y={qy(0.8)} fontSize="12" fill="#6b7a8f">B ({t("예: Ni", "e.g., Ni")})</text>
          {axisLabels(W2, H2, p2, "x", t("몰분율", "mole fraction"))}
        </AxisBox>
        <Note>
          {t(
            "반도체 공정의 두 도핑 방법이 여기서 갈립니다. 기상 확산 도핑은 표면 농도를 고정한 반무한체 문제라 erfc 꼴 프로파일이 생깁니다. 이온 주입은 이온을 정해진 깊이에 쏘아 넣으므로 표면 아래에 봉우리가 있는 프로파일이 생기고, 이후 열처리(annealing) 동안 그 봉우리가 확산으로 퍼집니다. 같은 Bethe–Bloch 정지능 물리가 중입자 암 치료의 Bragg 봉우리를 만듭니다.",
            "This is where the two semiconductor doping routes split. Gas-phase diffusion doping fixes the surface concentration (a semi-infinite problem), giving an erfc-type profile. Ion implantation fires ions to a set depth, giving a peak below the surface that then spreads by diffusion during annealing. The same Bethe–Bloch stopping physics produces the Bragg peak used in heavy-ion cancer therapy."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: Random walk & Langevin ---------------------------------- */
function simulateLangevin(gamma, nw, seed) {
  /* units: m = k_BT = 1, so D = 1/γ; one Cartesian component */
  const rng = makeRng(seed);
  const tEnd = 50;
  const dt = Math.min(0.01, 0.05 / gamma);
  const nsteps = Math.round(tEnd / dt);
  const amp = Math.sqrt(2 * gamma * dt);
  const x = new Float64Array(nw), v = new Float64Array(nw), v0 = new Float64Array(nw);
  for (let i = 0; i < nw; i++) { v[i] = rng.gauss(); v0[i] = v[i]; }
  const sampleT = [];
  for (let k = 0; k <= 60; k++) sampleT.push(0.01 * Math.pow(tEnd / 0.01, k / 60));
  let si = 0;
  const msd = [], vacf = [];
  const ntraj = 6, traj = Array.from({ length: ntraj }, () => []);
  const trajEvery = Math.max(1, Math.round(nsteps / 400));
  for (let k = 1; k <= nsteps; k++) {
    for (let i = 0; i < nw; i++) {
      v[i] += -gamma * v[i] * dt + amp * rng.gauss();
      x[i] += v[i] * dt;
    }
    const t = k * dt;
    if (k % trajEvery === 0) for (let j = 0; j < ntraj; j++) traj[j].push([t, x[j]]);
    while (si < sampleT.length && t >= sampleT[si]) {
      let s = 0, c = 0;
      for (let i = 0; i < nw; i++) { s += x[i] * x[i]; c += v[i] * v0[i]; }
      msd.push([t, s / nw]);
      vacf.push([t, c / nw]);
      si++;
    }
  }
  return { msd, vacf, traj, dt };
}
const msdExact = (t, g) => (2 / g) * (t - (1 - Math.exp(-g * t)) / g);

function TabLangevin({ t }) {
  const [gamma, setGamma] = useState(1.0);
  const [seed, setSeed] = useState(1);
  const sim = useMemo(() => simulateLangevin(gamma, 1000, seed), [gamma, seed]);
  const D = 1 / gamma;
  const nLast = sim.msd.length;
  /* long-time estimate: <x²> → 2D(t − 1/γ), so D ≈ <x²>/[2(t − 1/γ)] at the last sample */
  const lastSlope = nLast > 0 ? sim.msd[nLast - 1][1] / (2 * (sim.msd[nLast - 1][0] - 1 / gamma)) : NaN;

  /* MSD log-log */
  const Wd = 620, H = 280, pad = { l: 60, r: 16, t: 12, b: 38 };
  const xlo = -2, xhi = Math.log10(50), ylo = -4, yhi = 3;
  const px = (lt) => pad.l + ((Wd - pad.l - pad.r) * (lt - xlo)) / (xhi - xlo);
  const py = (ly) => H - pad.b - ((H - pad.t - pad.b) * (Math.max(ylo, Math.min(yhi, ly)) - ylo)) / (yhi - ylo);
  const ex = [], bal = [], dif = [];
  for (let i = 0; i <= 120; i++) {
    const lt = xlo + ((xhi - xlo) * i) / 120, tt = Math.pow(10, lt);
    ex.push([px(lt), py(Math.log10(msdExact(tt, gamma)))]);
    if (Math.log10(tt * tt) <= yhi) bal.push([px(lt), py(Math.log10(tt * tt))]);
    if (Math.log10(2 * D * tt) <= yhi) dif.push([px(lt), py(Math.log10(2 * D * tt))]);
  }

  /* VACF linear */
  const W2 = 300, H2 = 220, p2 = { l: 44, r: 10, t: 10, b: 34 };
  const tv = 5 / gamma;
  const vx = (tt) => p2.l + ((W2 - p2.l - p2.r) * tt) / tv;
  const vy = (c) => H2 - p2.b - ((H2 - p2.t - p2.b) * (c + 0.2)) / 1.3;
  const vexact = [];
  for (let i = 0; i <= 100; i++) { const tt = (tv * i) / 100; vexact.push([vx(tt), vy(Math.exp(-gamma * tt))]); }

  /* trajectories */
  const W3 = 300, H3 = 220, p3 = { l: 40, r: 10, t: 10, b: 34 };
  const xmax = Math.max(4, ...sim.traj.flat().map((p) => Math.abs(p[1])));
  const tx = (tt) => p3.l + ((W3 - p3.l - p3.r) * tt) / 50;
  const ty = (xx) => p3.t + ((H3 - p3.t - p3.b) * (xmax - xx)) / (2 * xmax);
  const cols = ["#e0603a", "#e8b030", "#3e9d5f", "#c04fb0", "#2fa7c8", "#20304f"];

  /* real-world numbers */
  const [rum, setRum] = useState(0.5);
  const [muc, setMuc] = useState(0.89);
  const rr = rum * 1e-6, m = 1050 * (4 / 3) * Math.PI * rr ** 3;
  const g = (6 * Math.PI * muc * 1e-3 * rr) / m;
  const Dr = (KB * 298.15) / (m * g);

  return (
    <div>
      <Panel title={t("랜덤워크에서 Langevin 방정식으로", "From the random walk to the Langevin equation")}>
        <P>
          {t(
            "1주차에서 본 랜덤워크는 ⟨x²⟩ = 2Dt를 줍니다. 그런데 '한 걸음'의 정체는 무엇일까요? Langevin은 입자의 운동방정식에 두 힘을 넣었습니다. 하나는 점성 마찰 −γv이고, 다른 하나는 주변 분자의 무작위 충돌 ξ(t)입니다.",
            "The random walk of Week 1 gives ⟨x²⟩ = 2Dt. But what is 'one step', physically? Langevin put two forces into the particle's equation of motion: viscous friction −γv and the random kicks ξ(t) of the surrounding molecules."
          )}
        </P>
        <Eq block>dv/dt = −γv + √(2κ) ξ(t), &nbsp; γ = 6πμr_p/m, &nbsp; κ = (k_BT/m)γ, &nbsp; ⟨ξ⟩ = 0, &nbsp; ⟨ξ(t)ξ(t′)⟩ = δ(t − t′)</Eq>
        <P>
          {t(
            "강의의 유도를 따라 ⟨x·v⟩를 구하고 한 번 더 적분하면 평균제곱변위가 나옵니다(한 직교 성분 기준).",
            "Following the lecture, solve for ⟨x·v⟩ and integrate once more to get the mean-square displacement (per Cartesian component)."
          )}
        </P>
        <Eq block>⟨x²⟩ = (2k_BT/mγ)[t − (1 − e<sup>−γt</sup>)/γ] &nbsp;→&nbsp; t ≪ 1/γ: ⟨x²⟩ ≈ (k_BT/m)t² ({t("탄도", "ballistic")}), &nbsp; t ≫ 1/γ: ⟨x²⟩ ≈ 2Dt, &nbsp; D = k_BT/(mγ)</Eq>
        <P>
          {t(
            "γ = 6πμr/m를 넣으면 m이 지워지고 D = k_BT/(6πμr), 즉 Stokes–Einstein 식이 됩니다. 속도 자기상관 ⟨v(t)v(0)⟩ = (k_BT/m)e^(−γt)를 적분해도 같은 D가 나옵니다(Green–Kubo 관계). 3차원에서는 ⟨r²⟩ = 6Dt입니다.",
            "Substituting γ = 6πμr/m cancels m and gives D = k_BT/(6πμr), the Stokes–Einstein equation. Integrating the velocity autocorrelation ⟨v(t)v(0)⟩ = (k_BT/m)e^(−γt) yields the same D (the Green–Kubo relation). In 3D, ⟨r²⟩ = 6Dt."
          )}
        </P>
      </Panel>

      <Panel title={t("인터랙티브: Langevin 시뮬레이션 (m = k_BT = 1, 입자 1000개)", "Interactive: Langevin simulation (m = k_BT = 1, 1000 particles)")}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Slider label={t("마찰 계수 γ", "Friction γ")} value={gamma} min={0.2} max={5} step={0.1} onChange={setGamma} fmt={(v) => v.toFixed(1)} />
          </div>
          <button onClick={() => setSeed((s) => s + 1)} style={btnStyle(false)}>{t("새 난수로 다시", "Re-run with new noise")}</button>
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          {logTicks(ylo, yhi, "y", (e) => py(e), Wd, H, pad)}
          {logTicks(Math.ceil(xlo), xhi, "x", (e) => px(e), Wd, H, pad)}
          <line x1={px(Math.log10(1 / gamma))} x2={px(Math.log10(1 / gamma))} y1={pad.t} y2={H - pad.b} stroke={C.inkSoft} strokeDasharray="2 3" />
          <text x={px(Math.log10(1 / gamma)) + 4} y={H - pad.b - 8} fontSize="11" fill={C.inkSoft}>t = 1/γ</text>
          {polyline(bal, C.violet, 1.4, "5 4")}
          {polyline(dif, C.good, 1.4, "5 4")}
          {polyline(ex, C.copper, 2.4)}
          {sim.msd.map(([tt, m2], i) => <circle key={i} cx={px(Math.log10(tt))} cy={py(Math.log10(m2))} r={3} fill={C.cool} />)}
          <text x={pad.l + 8} y={pad.t + 16} fontSize="11.5" fill={C.violet}>(k_BT/m)t² {t("탄도", "ballistic")}</text>
          <text x={pad.l + 8} y={pad.t + 32} fontSize="11.5" fill={C.good}>2Dt {t("확산", "diffusive")}</text>
          <text x={pad.l + 8} y={pad.t + 48} fontSize="11.5" fill={C.copper}>{t("정확해", "exact")} / <tspan fill={C.cool}>● {t("시뮬레이션", "simulation")}</tspan></text>
          {axisLabels(Wd, H, pad, "t", "⟨x²⟩")}
        </AxisBox>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <svg viewBox={`0 0 ${W2} ${H2}`} style={{ width: "100%", maxWidth: W2 }}>
            <rect x={p2.l} y={p2.t} width={W2 - p2.l - p2.r} height={H2 - p2.t - p2.b} fill="#fff" stroke={C.line} />
            <line x1={p2.l} x2={W2 - p2.r} y1={vy(0)} y2={vy(0)} stroke={C.line} />
            {polyline(vexact, C.copper, 2.2)}
            {sim.vacf.filter(([tt]) => tt <= tv).map(([tt, c], i) => <circle key={i} cx={vx(tt)} cy={vy(c)} r={2.8} fill={C.cool} />)}
            <text x={W2 - p2.r - 6} y={p2.t + 16} fontSize="11" fill={C.copper} textAnchor="end">e^(−γt)</text>
            {axisLabels(W2, H2, p2, "t", "⟨v(t)v(0)⟩")}
          </svg>
          <svg viewBox={`0 0 ${W3} ${H3}`} style={{ width: "100%", maxWidth: W3 }}>
            <rect x={p3.l} y={p3.t} width={W3 - p3.l - p3.r} height={H3 - p3.t - p3.b} fill="#fff" stroke={C.line} />
            <line x1={p3.l} x2={W3 - p3.r} y1={ty(0)} y2={ty(0)} stroke={C.line} />
            {sim.traj.map((tr, j) => <g key={j}>{polyline(tr.map(([tt, xx]) => [tx(tt), ty(xx)]), cols[j], 1.3)}</g>)}
            {axisLabels(W3, H3, p3, "t", "x(t)")}
          </svg>
        </div>
        <Readout>
          D_{t("이론", "theory")} = k_BT/(mγ) = {D.toFixed(3)} · D_{t("시뮬", "sim")} = ⟨x²⟩/[2(t − 1/γ)] (t = 50) = {isFinite(lastSlope) ? lastSlope.toFixed(3) : "—"} ({t("통계 오차 약 ±5%", "statistical error about ±5%")}) · Δt = {sim.dt.toFixed(4)}
        </Readout>
        <Note>
          {t(
            "점선 t = 1/γ를 기준으로 기울기가 2(탄도)에서 1(확산)로 꺾입니다. γ를 키우면 꺾이는 시간이 앞당겨지고 D = 1/γ가 작아집니다. 왼쪽 아래 그림은 속도 기억이 e^(−γt)로 사라지는 모습입니다. 이 곡선 아래 넓이가 바로 D입니다.",
            "Around the dotted line t = 1/γ the slope bends from 2 (ballistic) to 1 (diffusive). Raising γ moves the bend earlier and lowers D = 1/γ. The lower-left plot shows velocity memory dying as e^(−γt); the area under that curve is exactly D."
          )}
        </Note>
      </Panel>

      <Panel title={t("실제 숫자로: 물속 비드", "Real numbers: a bead in water")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("비드 반지름 r", "Bead radius r")} value={rum} min={0.01} max={5} step={0.01} onChange={setRum} unit=" μm" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("점도 μ", "Viscosity μ")} value={muc} min={0.3} max={10} step={0.01} onChange={setMuc} unit=" cP" fmt={(v) => v.toFixed(2)} />
        </div>
        <Readout>
          m = {sci(m, 2)} kg (ρ = 1050 kg/m³) · 1/γ = <b>{sci(1 / g, 2)} s</b> · D = <b>{sci(Dr, 3)} m²/s</b> · {t("10 μm (1축) 이동", "10 μm along one axis")}: {sci(1e-10 / (2 * Dr), 2)} s
        </Readout>
        <Note>
          {t(
            "반지름 0.5 μm 비드의 속도 기억 시간은 약 66 ns입니다. 현미경 영상(수 ms 간격)으로는 탄도 구간을 볼 수 없고, 항상 ⟨x²⟩ = 2Dt만 보입니다. Perrin이 1908년 이 방법으로 아보가드로 수를 측정했습니다. 탄도 구간은 2010년에야 광학 포획 실험으로 직접 관측되었습니다.",
            "A bead of radius 0.5 μm forgets its velocity in about 66 ns. Microscope frames (ms apart) never see the ballistic regime, only ⟨x²⟩ = 2Dt. Perrin used exactly this to measure Avogadro's number in 1908; the ballistic regime was observed directly only in 2010, with optical traps."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: Governing equation & boundary conditions ---------------------------------- */
const HENRY_T = [273, 280, 290, 300, 310, 320];
const HENRY = {
  NH3: [21, 23, 26, 30, null, null],
  Cl2: [265, 365, 480, 615, 755, 860],
  H2S: [260, 335, 450, 570, 700, 835],
  SO2: [165, 210, 315, 440, 600, 800],
  CO2: [710, 960, 1300, 1730, 2175, 2650],
  CH4: [22800, 27800, 35200, 42800, 50000, 56300],
  O2: [25500, 30500, 37600, 45700, 52500, 56800],
  H2: [58000, 61500, 66500, 71600, 76000, 78600],
};
const MOLAR = { NH3: 17.03, Cl2: 70.9, H2S: 34.08, SO2: 64.07, CO2: 44.01, CH4: 16.04, O2: 32.0, H2: 2.016 };
function henryAt(gas, T) {
  const tab = HENRY[gas];
  for (let k = 0; k < HENRY_T.length - 1; k++) {
    if (T >= HENRY_T[k] && T <= HENRY_T[k + 1]) {
      if (tab[k] == null || tab[k + 1] == null) return NaN;
      return tab[k] + ((T - HENRY_T[k]) / (HENRY_T[k + 1] - HENRY_T[k])) * (tab[k + 1] - tab[k]);
    }
  }
  return NaN;
}
function cvdFlux(y0, yd) { return 0.5 * Math.log((1 + 2 * y0) / (1 + 2 * yd)); } // N_A δ/(cD)
function cvdSurface(y0, Da) {
  let lo = 0, hi = y0;
  for (let k = 0; k < 80; k++) {
    const mid = 0.5 * (lo + hi);
    if (cvdFlux(y0, mid) - Da * mid > 0) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function TabBC({ t }) {
  /* Raoult / Henry via one-parameter Margules activity model */
  const [A, setA] = useState(1.2);
  const W1 = 420, H1 = 280, p1 = { l: 50, r: 14, t: 12, b: 38 };
  const ymax = Math.max(1.2, Math.exp(A) * 0.35);
  const ax = (x) => p1.l + (W1 - p1.l - p1.r) * x;
  const ay = (p) => H1 - p1.b - ((H1 - p1.t - p1.b) * Math.min(p, ymax)) / ymax;
  const real = [], raoult = [], henryL = [];
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    real.push([ax(x), ay(x * Math.exp(A * (1 - x) * (1 - x)))]);
    raoult.push([ax(x), ay(x)]);
    if (x * Math.exp(A) <= ymax) henryL.push([ax(x), ay(x * Math.exp(A))]);
  }

  /* Henry calculator */
  const [gas, setGas] = useState("O2");
  const [T, setT] = useState(298);
  const [p, setP] = useState(0.21);
  const H = henryAt(gas, T);
  const x = p / H;
  const cmol = x * 55.4e3;         // mol/m³ (dilute, water ≈ 55.4 kmol/m³)
  const mgL = cmol * MOLAR[gas];   // mg/L

  /* CVD */
  const [y0, setY0] = useState(0.1);
  const [lDa, setLDa] = useState(1);
  const Da = Math.pow(10, lDa);
  const yd = cvdSurface(y0, Da);
  const Nlim = cvdFlux(y0, 0);
  const N = cvdFlux(y0, yd);
  const W2 = 620, H2 = 260, p2 = { l: 56, r: 16, t: 12, b: 38 };
  const zx = (s) => p2.l + (W2 - p2.l - p2.r) * s;
  const zy = (y) => H2 - p2.b - ((H2 - p2.t - p2.b) * y) / (y0 * 1.08);
  const prof = (yd_) => Array.from({ length: 101 }, (_, i) => {
    const s = i / 100;
    return [zx(s), zy(0.5 * (Math.pow(1 + 2 * y0, 1 - s) * Math.pow(1 + 2 * yd_, s) - 1))];
  });

  return (
    <div>
      <Panel title={t("화학종 연속방정식", "The species continuity equation")}>
        <P>
          {t(
            "미소 검사체적에 대한 A의 수지(들어온 것 − 나간 것 + 생성 = 축적)를 세우면 열의 에너지 방정식과 같은 모양이 나옵니다.",
            "A balance on species A over a differential control volume (in − out + generation = accumulation) gives the same shape as the thermal energy equation."
          )}
        </P>
        <Eq block>∂ρ_A/∂t = −∇·n_A + r_A &nbsp;&nbsp;|&nbsp;&nbsp; ∂c_A/∂t = −∇·N_A + R_A</Eq>
        <P>
          {t(
            "모든 성분을 더하면 혼합물의 연속방정식 ∂ρ/∂t + ∇·(ρv) = 0이 됩니다. 반응은 질량을 만들거나 없애지 못하므로 Σr_i = 0입니다. 몰 기준에서는 ΣR_i가 0이 아닐 수 있습니다. 예를 들어 A → 2B는 몰수를 늘립니다. N_A = −cD∇y_A + c_AV를 넣고 ρ와 D_AB가 일정하다고 두면:",
            "Summing over species gives the mixture continuity equation ∂ρ/∂t + ∇·(ρv) = 0. Reactions cannot create or destroy mass, so Σr_i = 0; on a molar basis ΣR_i need not vanish (A → 2B adds moles). With N_A = −cD∇y_A + c_AV and constant ρ and D_AB:"
          )}
        </P>
        <Eq block>∂c_A/∂t + v·∇c_A = Dc_A/Dt = D_AB∇²c_A + R_A</Eq>
        <Table
          head={[t("조건", "Condition"), t("남는 식", "What remains"), t("열전달 짝", "Heat-transfer twin")]}
          rows={[
            [t("유동 없음, 반응 없음", "No flow, no reaction"), "∂c_A/∂t = D_AB∇²c_A  (Fick 2)", t("열방정식 (4주차)", "heat equation (Week 4)")],
            [t("정상, 유동 + 반응", "Steady, flow + reaction"), "v·∇c_A = D_AB∇²c_A + R_A", t("발열이 있는 대류 (5주차)", "convection with generation (Week 5)")],
            [t("정상, 유동·반응 없음", "Steady, no flow, no reaction"), "∇²c_A = 0  (Laplace)", t("정상 전도 (3주차)", "steady conduction (Week 3)")],
          ]}
        />
      </Panel>

      <Panel title={t("경계조건 1: 기–액 계면 — Raoult와 Henry", "Boundary condition 1: gas–liquid interface — Raoult and Henry")}>
        <P>
          {t(
            "계면에서는 두 상이 평형이라고 봅니다. 그런데 평형은 '농도가 같다'가 아니라 '화학 퍼텐셜이 같다'입니다. 그래서 농도는 계면에서 불연속입니다. 실제 계는 p_A = ζx_Ap*_A(T)로 쓰고, ζ의 두 극한이 두 법칙입니다.",
            "We assume the two phases are in equilibrium at the interface. Equilibrium means equal chemical potential, not equal concentration, so concentration jumps at the interface. Real systems follow p_A = ζx_Ap*_A(T), and the two limits of ζ are the two laws."
          )}
        </P>
        <Eq block>Raoult: p_A = y_AP = x_Ap*_A(T) &nbsp;(x_A → 1, {t("용매", "solvent")}) &nbsp;&nbsp;|&nbsp;&nbsp; Henry: p_A = x_AH_A(T) &nbsp;(x_A → 0, {t("용질", "solute")})</Eq>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <svg viewBox={`0 0 ${W1} ${H1}`} style={{ width: "100%", maxWidth: W1 }}>
            <rect x={p1.l} y={p1.t} width={W1 - p1.l - p1.r} height={H1 - p1.t - p1.b} fill="#fff" stroke={C.line} />
            {polyline(raoult, C.good, 1.6, "6 4")}
            {polyline(henryL, C.violet, 1.6, "6 4")}
            {polyline(real, C.copper, 2.6)}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => <text key={v} x={ax(v)} y={H1 - p1.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{v}</text>)}
            <text x={ax(0.62)} y={ay(0.62) + 18} fontSize="11.5" fill={C.good}>Raoult</text>
            {henryL.length > 3 && <text x={henryL[Math.min(henryL.length - 1, 12)][0] + 6} y={henryL[Math.min(henryL.length - 1, 12)][1]} fontSize="11.5" fill={C.violet}>Henry</text>}
            {axisLabels(W1, H1, p1, "x_A", "p_A / p*_A")}
          </svg>
          <div style={{ flex: "1 1 200px" }}>
            <Slider label={t("비이상성 A (Margules)", "Non-ideality A (Margules)")} value={A} min={-2} max={2.5} step={0.05} onChange={setA} fmt={(v) => v.toFixed(2)} />
            <Readout>
              γ_A = exp[A(1 − x_A)²]<br />H_A/p*_A = γ_A^∞ = e^A = {Math.exp(A).toFixed(3)}
            </Readout>
            <P>
              {A > 0.05
                ? t("양의 편차(A > 0): A–B 인력이 A–A·B–B보다 약해 A가 쉽게 기체로 빠져나갑니다(예: 물–에탄올).", "Positive deviation (A > 0): A–B attraction is weaker than A–A or B–B, so A escapes easily (e.g., water–ethanol).")
                : A < -0.05
                ? t("음의 편차(A < 0): A–B 인력이 더 강해 A가 액상에 붙잡힙니다(예: 클로로포름–아세톤).", "Negative deviation (A < 0): A–B attraction is stronger, so A is held in the liquid (e.g., chloroform–acetone).")
                : t("A ≈ 0: 이상 용액. Raoult와 Henry가 같은 직선입니다.", "A ≈ 0: ideal solution; Raoult and Henry coincide.")}
            </P>
          </div>
        </div>
        <Note>
          {t(
            "실제 곡선(구리색)은 x_A → 1에서 Raoult 직선에, x_A → 0에서 Henry 직선에 접합니다. 이 그래프는 한 매개변수 Margules 모형으로 그린 예시입니다. 강의의 물–에탄올·클로로포름–아세톤 데이터와 같은 경향을 보이지만 그 데이터를 피팅한 것은 아닙니다.",
            "The real curve (copper) is tangent to the Raoult line as x_A → 1 and to the Henry line as x_A → 0. This plot uses a one-parameter Margules model as an illustration; it shows the same trends as the lecture's water–ethanol and chloroform–acetone data but is not fitted to them."
          )}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: Henry 상수 계산기 (강의 Table 25.1, 수용액)", "Interactive: Henry's-law calculator (lecture Table 25.1, aqueous)")}>
        <div><Select label={t("기체", "Gas")} value={gas} onChange={setGas} options={Object.keys(HENRY).map((k) => ({ v: k, label: k }))} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label="T" value={T} min={273} max={320} step={1} onChange={setT} unit=" K" />
          <Slider label={t("기상 분압 p_A", "Gas partial pressure p_A")} value={p} min={0.0001} max={2} step={0.0001} onChange={setP} unit=" bar" fmt={(v) => v.toFixed(4)} />
        </div>
        <Readout>
          {isFinite(H)
            ? <>H_A({T} K) = {H.toFixed(0)} bar → x_A = p_A/H_A = <b>{sci(x, 3)}</b> → c_A ≈ {sci(cmol, 3)} mol/m³ = <b>{sci(mgL, 3)} mg/L</b></>
            : t("표에 이 온도의 값이 없습니다 (NH₃는 300 K까지).", "No table value at this temperature (NH₃ only up to 300 K).")}
        </Readout>
        <Note>
          {t(
            "공기와 접한 25 °C 물(O₂, p = 0.21 bar)은 x ≈ 4.8×10⁻⁶, 약 8.5 mg/L입니다. 실측 포화 용존산소(약 8.3 mg/L)와 잘 맞습니다. 온도를 올리면 H가 커져 기체가 덜 녹습니다. 여름철 하천의 산소 부족, 탄산음료의 김 빠짐이 같은 이유입니다. H가 작은 NH₃·SO₂는 매우 잘 녹아 흡수탑으로 제거하기 쉽습니다. 거꾸로 H₂·O₂·CH₄는 잘 녹지 않습니다.",
            "Water at 25 °C under air (O₂, p = 0.21 bar) gives x ≈ 4.8×10⁻⁶, about 8.5 mg/L, close to the measured saturation of about 8.3 mg/L. Raising T raises H, so gases dissolve less: the reason for summer oxygen depletion in rivers and for soda going flat. NH₃ and SO₂, with small H, dissolve readily and are easy to scrub in absorbers; H₂, O₂ and CH₄ are poorly soluble."
          )}
        </Note>
      </Panel>

      <Panel title={t("경계조건 2: 고체 계면·반응면·불투과벽·대류", "Boundary condition 2: solid interface, reacting surface, impermeable wall, convection")}>
        <Table
          head={[t("경계 유형", "Boundary type"), t("수식", "Expression"), t("예", "Example")]}
          rows={[
            [t("기–고 용해도", "Gas–solid solubility"), "c_A = S_A(T) p_A", t("O₂/고무 S = 3.12×10⁻³, H₂/Ni(358 K) 9.01×10⁻³ kmol/m³·bar", "O₂/rubber S = 3.12×10⁻³, H₂/Ni (358 K) 9.01×10⁻³ kmol/m³·bar")],
            [t("불투과 벽", "Impermeable wall"), "∂c_A/∂z|₀ = 0", t("단열벽의 짝", "twin of an adiabatic wall")],
            [t("대류 경계", "Convective"), "N_A|₀ = k_c(c_As − c_A∞)", t("Newton 냉각의 짝 (12주차)", "twin of Newton cooling (Week 12)")],
            [t("반응 표면 (A + 2B → 3C)", "Reacting surface (A + 2B → 3C)"), "N_A = −kc_As, N_B = −2kc_As, N_C = 3kc_As", t("촉매 표면, CVD", "catalyst surface, CVD")],
          ]}
        />
      </Panel>

      <Panel title={t("인터랙티브: 텅스텐 CVD 막 위의 확산", "Interactive: diffusion over a tungsten CVD film")}>
        <P>
          {t(
            "3H₂ + WF₆ → W(s) + 6HF. A = WF₆가 막(z = δ)으로 갈 때 B = H₂ 3몰이 함께 오고 C = HF 6몰이 떠납니다. 불활성 He(D)는 움직이지 않습니다. 따라서 ΣN = N_A + 3N_A − 6N_A = −2N_A이고:",
            "3H₂ + WF₆ → W(s) + 6HF. As A = WF₆ heads to the film (z = δ), 3 mol of B = H₂ come along and 6 mol of C = HF leave; inert He (D) does not move. Hence ΣN = N_A + 3N_A − 6N_A = −2N_A and:"
          )}
        </P>
        <Eq block>N_A(1 + 2y_A) = −cD_AM dy_A/dz &nbsp;→&nbsp; N_A = (cD_AM/2δ) ln[(1 + 2y_A0)/(1 + 2y_Aδ)], &nbsp; {t("표면", "surface")}: N_A = k_s c y_Aδ</Eq>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("입구 WF₆ 몰분율 y_A0", "Inlet WF₆ mole fraction y_A0")} value={y0} min={0.01} max={0.45} step={0.01} onChange={setY0} fmt={(v) => v.toFixed(2)} />
          <Slider label={t("Damköhler 수 Da = k_sδ/D", "Damköhler number Da = k_sδ/D")} value={lDa} min={-2} max={3} step={0.05} onChange={setLDa} fmt={(v) => Math.pow(10, v).toPrecision(2)} />
        </div>
        <AxisBox W={W2} H={H2} pad={p2}>
          {polyline([[zx(0), zy(y0)], [zx(1), zy(0)]], C.inkSoft, 1.4, "5 4")}
          {polyline(prof(0), C.cool, 1.8, "3 3")}
          {polyline(prof(yd), C.copper, 2.8)}
          <circle cx={zx(1)} cy={zy(yd)} r={4.5} fill={C.warn} />
          <rect x={zx(1) - 3} y={p2.t} width={6} height={H2 - p2.t - p2.b} fill="#555" opacity={0.5} />
          <text x={zx(1) - 8} y={p2.t + 14} fontSize="11" fill={C.ink} textAnchor="end">W {t("막", "film")} (z = δ)</text>
          {[0, 0.25, 0.5, 0.75, 1].map((s) => <text key={s} x={zx(s)} y={H2 - p2.b + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{s}</text>)}
          {axisLabels(W2, H2, p2, "z/δ", "y_WF6")}
        </AxisBox>
        <Readout>
          y_A(δ) = {yd.toFixed(4)} · N_Aδ/(cD) = {N.toFixed(4)} ({((N / Nlim) * 100).toFixed(1)}% {t("확산 한계", "of the diffusion limit")}) · {t("벌크 흐름 보정", "bulk-flow factor")} ln(1 + 2y_A0)/(2y_A0) = {(Nlim / y0).toFixed(4)}
        </Readout>
        <Note>
          {t(
            "회색 점선은 벌크 흐름을 무시한 직선(순수 Fick), 파란 점선은 확산 한계(y_Aδ = 0), 구리색이 표면반응을 포함한 실제 해입니다. Da ≫ 1이면 표면반응이 빨라 확산이 속도를 정하고, 막 두께가 위치마다 δ에 따라 달라집니다. Da ≪ 1이면 표면반응이 속도를 정하고 y_Aδ ≈ y_A0이 됩니다. 실제 W CVD는 균일한 막을 얻으려고 일부러 Da ≪ 1 쪽(낮은 온도)에서 운전합니다. 이 차이는 1 + 2y_A 때문입니다. HF가 반대로 빠져나가며 WF₆를 밀어내서, y_A0 = 0.1에서 플럭스가 약 9% 줄어듭니다.",
            "Gray dashes: a straight line ignoring bulk flow (pure Fick). Blue dashes: the diffusion limit (y_Aδ = 0). Copper: the actual solution with surface kinetics. For Da ≫ 1 the surface reaction is fast, diffusion sets the rate, and film thickness varies with the local δ. For Da ≪ 1 the surface reaction sets the rate and y_Aδ ≈ y_A0; real W CVD deliberately runs on this side (lower temperature) to get uniform films. The curvature comes from 1 + 2y_A: HF streaming out pushes WF₆ back, cutting the flux by about 9% at y_A0 = 0.1."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. CO₂–N₂ 혼합물의 500 K, 2 atm에서 확산계수를 Chapman–Enskog 식으로 구하라. (σ_CO₂ = 3.996 Å, ε/k = 190 K; σ_N₂ = 3.681 Å, ε/k = 91.5 K) Fuller 식과 비교하라.",
        "P1. Find the CO₂–N₂ diffusivity at 500 K and 2 atm with Chapman–Enskog (σ_CO₂ = 3.996 Å, ε/k = 190 K; σ_N₂ = 3.681 Å, ε/k = 91.5 K). Compare with Fuller."
      ),
      s: t(
        "σ_AB = (3.996 + 3.681)/2 = 3.839 Å, ε_AB/k = √(190·91.5) = 131.9 K, T* = 500/131.9 = 3.79 → Ω_D ≈ 0.896. D = 1.858×10⁻³·500^1.5·√(1/44.01 + 1/28.01)/(2·3.839²·0.896) = 0.190 cm²/s. Fuller(v = 26.9, 17.9): 0.205 cm²/s로 약 8% 큽니다. 압력이 2 atm이므로 1 atm 값의 정확히 절반입니다.",
        "σ_AB = (3.996 + 3.681)/2 = 3.839 Å, ε_AB/k = √(190·91.5) = 131.9 K, T* = 500/131.9 = 3.79 → Ω_D ≈ 0.896. D = 1.858×10⁻³·500^1.5·√(1/44.01 + 1/28.01)/(2·3.839²·0.896) = 0.190 cm²/s. Fuller (v = 26.9, 17.9) gives 0.205 cm²/s, about 8% higher. At 2 atm the value is exactly half the 1 atm value."
      ),
    },
    {
      q: t(
        "P2. 400 K, 1 atm에서 H₂가 지름 20 nm 세공을 가진 촉매(ε = 0.4) 속으로 확산한다. H₂–N₂의 D_AB를 Chapman–Enskog으로 구하고, D_K, D_Ae(등몰 역확산), D′_Ae를 구하라. 어느 기구가 지배하는가?",
        "P2. H₂ diffuses at 400 K, 1 atm into a catalyst with 20 nm pores (ε = 0.4). Get D_AB (H₂–N₂) from Chapman–Enskog, then D_K, D_Ae (equimolar counter-diffusion) and D′_Ae. Which mechanism controls?"
      ),
      s: t(
        "D_AB ≈ 1.25 cm²/s. D_K = 4850·(20×10⁻⁷)·√(400/2.016) = 0.137 cm²/s. 등몰이면 α = 0이므로 1/D_Ae = 1/1.25 + 1/0.137 → D_Ae = 0.123 cm²/s. D′_Ae = 0.4²·0.123 = 0.0197 cm²/s. D_K가 D_AB보다 9배 작아 Knudsen이 지배합니다. 압력을 올려도 거의 변하지 않습니다.",
        "D_AB ≈ 1.25 cm²/s. D_K = 4850·(20×10⁻⁷)·√(400/2.016) = 0.137 cm²/s. Equimolar means α = 0, so 1/D_Ae = 1/1.25 + 1/0.137 → D_Ae = 0.123 cm²/s. D′_Ae = 0.4²·0.123 = 0.0197 cm²/s. D_K is 9 times smaller than D_AB, so Knudsen controls; raising the pressure barely changes it."
      ),
    },
    {
      q: t(
        "P3. 25 °C 물에 녹은 에탄올(C₂H₅OH)의 확산계수를 Wilke–Chang 식으로 구하라. 원자 부피 C 14.8, H 3.7, O 7.4 cm³/mol, 물 Φ = 2.26, μ = 0.89 cP.",
        "P3. Use Wilke–Chang to estimate the diffusivity of ethanol (C₂H₅OH) in water at 25 °C. Atomic volumes C 14.8, H 3.7, O 7.4 cm³/mol; water Φ = 2.26, μ = 0.89 cP."
      ),
      s: t(
        "V_A = 2(14.8) + 6(3.7) + 7.4 = 59.2 cm³/mol. D = 7.4×10⁻⁸·√(2.26·18.02)·298.15/(0.89·59.2^0.6) = 1.37×10⁻⁵ cm²/s. 측정값(약 1.2×10⁻⁵)보다 10% 남짓 큽니다. 이 정도가 Wilke–Chang의 전형적인 정확도입니다.",
        "V_A = 2(14.8) + 6(3.7) + 7.4 = 59.2 cm³/mol. D = 7.4×10⁻⁸·√(2.26·18.02)·298.15/(0.89·59.2^0.6) = 1.37×10⁻⁵ cm²/s, a bit over 10% above the measured value (about 1.2×10⁻⁵), which is typical Wilke–Chang accuracy."
      ),
    },
    {
      q: t(
        "P4. bcc 철의 침탄. 탄소가 √(Dt) = 100 μm 깊이까지 들어가는 데 걸리는 시간을 800 K와 1000 K에서 비교하라. (D₀ = 2.0 mm²/s, Q = 84.1 kJ/mol)",
        "P4. Carburizing bcc iron: compare the time for carbon to reach √(Dt) = 100 μm at 800 K and 1000 K (D₀ = 2.0 mm²/s, Q = 84.1 kJ/mol)."
      ),
      s: t(
        "D(800 K) = 2×10⁻⁶·exp(−84100/(8.314·800)) = 6.46×10⁻¹² m²/s → t = (10⁻⁴)²/D = 1550 s ≈ 26분. D(1000 K) = 8.09×10⁻¹¹ m²/s → t ≈ 124 s ≈ 2분. 200 K를 올렸을 뿐인데 12.5배 빨라집니다. 지수함수의 힘이며, 열처리 공정에서 온도 관리가 중요한 이유입니다.",
        "D(800 K) = 2×10⁻⁶·exp(−84100/(8.314·800)) = 6.46×10⁻¹² m²/s → t = (10⁻⁴)²/D = 1550 s ≈ 26 min. D(1000 K) = 8.09×10⁻¹¹ m²/s → t ≈ 124 s ≈ 2 min. Only 200 K more, yet 12.5 times faster: the power of the exponential, and why temperature control matters in heat treatment."
      ),
    },
    {
      q: t(
        "P5. 반지름 0.5 μm 폴리스티렌 비드(ρ = 1050 kg/m³)가 25 °C 물(μ = 0.89 cP)에 떠 있다. (a) 속도 이완 시간 1/γ, (b) D, (c) 한 축 방향으로 10 μm 움직이는 데 걸리는 평균 시간을 구하라.",
        "P5. A polystyrene bead (radius 0.5 μm, ρ = 1050 kg/m³) floats in water at 25 °C (μ = 0.89 cP). Find (a) the velocity relaxation time 1/γ, (b) D, (c) the mean time to move 10 μm along one axis."
      ),
      s: t(
        "(a) m = ρ(4/3)πr³ = 5.50×10⁻¹⁶ kg, γ = 6πμr/m → 1/γ = 6.6×10⁻⁸ s = 66 ns. (b) D = k_BT/(mγ) = k_BT/(6πμr) = 4.91×10⁻¹³ m²/s. (c) ⟨x²⟩ = 2Dt → t = (10⁻⁵)²/(2·4.91×10⁻¹³) ≈ 102 s. 3차원 거리 r = 10 μm라면 ⟨r²⟩ = 6Dt로 약 34 s입니다.",
        "(a) m = ρ(4/3)πr³ = 5.50×10⁻¹⁶ kg, γ = 6πμr/m → 1/γ = 6.6×10⁻⁸ s = 66 ns. (b) D = k_BT/(mγ) = k_BT/(6πμr) = 4.91×10⁻¹³ m²/s. (c) ⟨x²⟩ = 2Dt → t = (10⁻⁵)²/(2·4.91×10⁻¹³) ≈ 102 s. For a 3D distance r = 10 μm, ⟨r²⟩ = 6Dt gives about 34 s."
      ),
    },
    {
      q: t(
        "P6. W CVD에서 표면반응이 매우 빠르다(y_Aδ ≈ 0). 입구 WF₆ 몰분율이 0.1과 0.2일 때, 벌크 흐름을 무시한 Fick 식은 플럭스를 몇 % 과대평가하는가?",
        "P6. In W CVD the surface reaction is very fast (y_Aδ ≈ 0). For inlet WF₆ mole fractions of 0.1 and 0.2, by what percentage does Fick's law without bulk flow overestimate the flux?"
      ),
      s: t(
        "정확한 해/Fick = ln(1 + 2y_A0)/(2y_A0). y_A0 = 0.1: ln(1.2)/0.2 = 0.912 → Fick이 9.7% 과대. y_A0 = 0.2: ln(1.4)/0.4 = 0.841 → 18.9% 과대. HF 6몰이 반대로 빠져나가며 만드는 벌크 흐름이 WF₆의 공급을 방해하기 때문입니다. 희박할수록(y_A0 → 0) 두 식이 같아집니다.",
        "Exact/Fick = ln(1 + 2y_A0)/(2y_A0). y_A0 = 0.1: ln(1.2)/0.2 = 0.912 → Fick is 9.7% high. y_A0 = 0.2: ln(1.4)/0.4 = 0.841 → 18.9% high. The bulk flow created by 6 mol of HF leaving opposes the WF₆ supply. In the dilute limit (y_A0 → 0) the two agree."
      ),
    },
    {
      q: t(
        "P7. 37 °C(310 K)에서 CO₂ 분압 1 bar로 탄산화한 물에 녹은 CO₂ 농도(g/L)를 Henry 상수 표로 구하라.",
        "P7. Using the Henry's-law table, find the dissolved CO₂ concentration (g/L) in water carbonated at 37 °C (310 K) under 1 bar of CO₂."
      ),
      s: t(
        "H(310 K) = 2175 bar → x = 1/2175 = 4.60×10⁻⁴. c ≈ x·55.4 kmol/m³ = 25.5 mol/m³ → 25.5×44.0 = 1.12 g/L. 0 °C(H = 710 bar)이면 약 3.4 g/L로 3배입니다. 탄산음료를 차갑게 마시는 이유입니다.",
        "H(310 K) = 2175 bar → x = 1/2175 = 4.60×10⁻⁴. c ≈ x·55.4 kmol/m³ = 25.5 mol/m³ → 25.5×44.0 = 1.12 g/L. At 0 °C (H = 710 bar) it is about 3.4 g/L, three times more, which is why soda is served cold."
      ),
    },
  ];
  const [open, setOpen] = useState({});
  return (
    <div>
      {problems.map((p, i) => (
        <Panel key={i}>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: "0 0 10px" }}>{p.q}</p>
          <button onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} style={btnStyle(!!open[i])}>
            {open[i] ? t("풀이 접기", "Hide solution") : t("풀이 보기", "Show solution")}
          </button>
          {open[i] && (
            <div style={{ marginTop: 10, fontSize: 13.8, lineHeight: 1.75, background: C.coolPale, borderRadius: 8, padding: "10px 14px", color: C.ink }}>
              {p.s}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---------------------------------- Tab 10: Code ---------------------------------- */
function TabCode({ t }) {
  const topics = ["topic1", "topic2", "topic3", "topic4"];
  const langs = [
    { key: "python", label: "Python", ext: "py" },
    { key: "matlab", label: "MATLAB", ext: "m" },
    { key: "julia", label: "Julia", ext: "jl" },
    { key: "cpp", label: "C++", ext: "cpp" },
  ];
  const fileStem = {
    topic1: "week9_topic1_gas_diffusivity",
    topic2: "week9_topic2_condensed_pore_diffusivity",
    topic3: "week9_topic3_random_walk_langevin",
    topic4: "week9_topic4_species_balance_bc",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK9_CODES[topic][lang];
  const ext = langs.find((l) => l.key === lang).ext;

  const copy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* clipboard unavailable */ }
  };
  const download = () => {
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileStem[topic]}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { /* download unavailable */ }
  };

  return (
    <div>
      <Panel title={t("실습 코드: 4개 주제 × 4개 언어", "Hands-on code: 4 topics × 4 languages")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {topics.map((tp) => (
            <button key={tp} onClick={() => setTopic(tp)} style={btnStyle(topic === tp)}>
              {WEEK9_CODES[tp].title}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <Seg options={langs.map((l) => ({ v: l.key, label: l.label }))} value={lang} onChange={setLang} />
          <button onClick={copy} style={btnStyle(copied)}>{copied ? t("복사됨 ✓", "Copied ✓") : t("코드 복사", "Copy code")}</button>
          <button onClick={download} style={btnStyle(false)}>{t("파일 받기", "Download")} (.{ext})</button>
        </div>
        <pre style={{
          background: "#232936", color: "#e8e6e1", borderRadius: 10, padding: "16px 18px",
          fontSize: 12.5, lineHeight: 1.55, fontFamily: mono, overflowX: "auto",
          maxHeight: 520, overflowY: "auto", margin: 0,
        }}>
          {code}
        </pre>
        <Note>
          {t(
            "Python·C++ 버전은 실행해 수치를 검증했습니다. Ω_D 맞춤식은 표값(T* = 1에서 1.439, 10에서 0.7424)을 0.1% 안에서 재현합니다. CO₂–공기(20 °C)는 0.147(Chapman–Enskog)·0.154(Fuller) cm²/s, O₂–물(25 °C, Wilke–Chang)은 2.26×10⁻⁵ cm²/s입니다. Langevin 시뮬레이션은 장시간 D = 0.51(이론 0.50)을 줍니다. 다공 격자 MC는 ε ≈ 0.6 아래에서 D_eff가 0으로 떨어지는 스미기 거동을 보입니다. CVD의 유한차분 해는 해석해 N_A = 1.587×10⁻¹ mol/m²s와 유효숫자 5자리까지 일치합니다. MATLAB·Julia는 같은 알고리즘을 옮긴 것입니다.",
            "The Python and C++ versions were run and checked: the Ω_D fit reproduces the table (1.439 at T* = 1, 0.7424 at 10) within 0.1%; CO₂–air at 20 °C gives 0.147 (Chapman–Enskog) and 0.154 (Fuller) cm²/s; O₂ in water at 25 °C (Wilke–Chang) gives 2.26×10⁻⁵ cm²/s. The Langevin run gives a long-time D = 0.51 (theory 0.50). The porous-lattice MC shows D_eff collapsing below ε ≈ 0.6 (percolation). The CVD finite-difference solution matches the analytic N_A = 1.587×10⁻¹ mol/m²s to five significant figures. The MATLAB and Julia versions port the same algorithms."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week9App({ lang: langProp, language, onBack, onLangChange }) {
  const initial = langProp === "en" || language === "en" ? "en" : "kr";
  const [lang, setLangState] = useState(initial);
  const setLang = (l) => {
    setLangState(l);
    if (onLangChange) onLangChange(l === "kr" ? "ko" : "en");
  };
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: t("플럭스·기준속도", "Fluxes & frames"), comp: <TabFlux t={t} /> },
    { label: t("기체 확산계수", "Gas D"), comp: <TabGas t={t} /> },
    { label: t("액체 확산계수", "Liquid D"), comp: <TabLiquid t={t} /> },
    { label: t("세공 확산", "Pore diffusion"), comp: <TabPore t={t} /> },
    { label: t("고체 확산", "Solid diffusion"), comp: <TabSolid t={t} /> },
    { label: t("랜덤워크·Langevin", "Random walk & Langevin"), comp: <TabLangevin t={t} /> },
    { label: t("지배방정식·경계조건", "Governing eq. & BCs"), comp: <TabBC t={t} /> },
    { label: t("연습문제", "Practice"), comp: <TabPractice t={t} /> },
    { label: t("코드", "Code"), comp: <TabCode t={t} /> },
  ];

  return (
    <div style={{ fontFamily: font, background: C.paper, minHeight: "100vh", color: C.ink }}>
      <header style={{ background: C.ink, color: "#fff", padding: "22px 24px 18px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              {onBack && (
                <button onClick={onBack} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 12.5, cursor: "pointer", marginBottom: 10 }}>
                  ← {t("모듈 목록", "All modules")}
                </button>
              )}
              <div style={{ fontSize: 12.5, letterSpacing: 1, opacity: 0.75 }}>
                Heat & Mass Transfer · Week 9
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("물질전달의 기초", "Fundamentals of Mass Transfer")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("플럭스와 기준속도 — 화학 퍼텐셜 — 기체·액체·세공·고체 확산계수 — 랜덤워크와 Langevin — 화학종 연속방정식과 경계조건",
                   "Fluxes & reference velocities — chemical potential — gas, liquid, pore & solid diffusivities — random walk & Langevin — species continuity & boundary conditions")}
              </div>
            </div>
            <Seg
              value={lang} onChange={setLang}
              options={[{ v: "kr", label: "한국어" }, { v: "en", label: "EN" }]}
            />
          </div>
        </div>
      </header>

      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", overflowX: "auto", padding: "0 12px" }}>
          {tabs.map((tb, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{
                padding: "13px 14px", fontSize: 13.5, whiteSpace: "nowrap", cursor: "pointer",
                background: "transparent", border: "none", fontFamily: font,
                color: tab === i ? C.copperDeep : C.inkSoft,
                borderBottom: tab === i ? `3px solid ${C.copper}` : "3px solid transparent",
                fontWeight: tab === i ? 700 : 400,
              }}>
              {tb.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "22px 16px 60px" }}>
        {tabs[tab].comp}
      </main>

      <footer style={{ textAlign: "center", fontSize: 12, color: C.inkSoft, paddingBottom: 28 }}>
        School of Chemical Engineering, SKKU · Smart Process & Materials Design Lab (SPMDL) · Prof. S. Joon Kwon
      </footer>
    </div>
  );
}
