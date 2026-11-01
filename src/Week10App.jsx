// Week10App.jsx — Heat & Mass Transfer, Week 10: Steady-state molecular diffusion
// Part 1 — 1D diffusion through a stagnant gas (Stefan tube / Arnold cell, log-mean, film model),
// pseudo-steady moving boundaries (Arnold-cell D measurement, Si thermal oxidation, carbon-particle
// burnout), heterogeneous vs homogeneous reaction (Damköhler, liquid film with first-order reaction,
// Hatta number / enhancement), semiconductor processes (oxidation, CVD Grove model, step coverage,
// ALD, dopant diffusion and ion implantation).
// Part 2 — Two-dimensional steady diffusion (Laplace series, TEOS between stacked wafers) and
// simultaneous heat and mass transfer (condensation of a vapor with a noncondensable gas).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK10_CODES from "./Week10Codes";

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

/* ---------------------------------- shared helpers ---------------------------------- */
const RG = 8.314462618;
const KB_EV = 8.617333262e-5;
const ATM = 101325;
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

function erf(x) {
  const s = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const tt = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * tt - 1.453152027) * tt) + 1.421413741) * tt - 0.284496736) * tt + 0.254829592) * tt * Math.exp(-ax * ax);
  return s * y;
}
const erfc = (x) => 1 - erf(x);

/* modified Bessel I0 (power series) */
function I0(x) {
  let s = 1, term = 1;
  for (let k = 1; k < 400; k++) {
    term *= (x / (2 * k)) * (x / (2 * k));
    s += term;
    if (term < 1e-16 * s) break;
  }
  return s;
}

/* ---------- liquids for the Stefan tube (Antoine: log10 p[mmHg] = A − B/(C + T[°C])) ---------- */
const LIQS = {
  water: { A: 8.07131, B: 1730.63, C: 233.426, rho: 997, M: 18.015, v: 12.7, kr: "물", en: "Water" },
  ethanol: { A: 8.20417, B: 1642.89, C: 230.3, rho: 789, M: 46.07, v: 2 * 16.5 + 6 * 1.98 + 5.48, kr: "에탄올", en: "Ethanol" },
  acetone: { A: 7.02447, B: 1161.0, C: 224.0, rho: 784, M: 58.08, v: 3 * 16.5 + 6 * 1.98 + 5.48, kr: "아세톤", en: "Acetone" },
};
function psatPa(liq, TC) {
  const q = LIQS[liq];
  return Math.pow(10, q.A - q.B / (q.C + TC)) * 133.322;
}
function fullerAir(liq, TK, Patm = 1) {
  const q = LIQS[liq];
  const den = Math.pow(Math.cbrt(q.v) + Math.cbrt(20.1), 2);
  return (1.011e-3 * Math.pow(TK, 1.75) * Math.sqrt(1 / q.M + 1 / 28.97)) / (Patm * den) * 1e-4; // m²/s
}
function ylm(yA1, yA2) {
  const b1 = 1 - yA1, b2 = 1 - yA2;
  return Math.abs(b2 - b1) > 1e-12 ? (b2 - b1) / Math.log(b2 / b1) : b1;
}

/* ---------- generic chart ---------- */
function niceTicks(lo, hi, n = 5) {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}
function fmtTick(v) {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1e4 || a < 1e-3) return sci(v, 0);
  return String(+v.toPrecision(4));
}

function Chart({ W = 560, H = 300, xr, yr, xlog, ylog, xl, yl, series = [], dots = [], vlines = [], hlines = [], labels = [], legend, legendAt = "tl", pad: padIn }) {
  const pad = padIn || { l: 58, r: 16, t: 14, b: 42 };
  const fx = (x) => (xlog ? Math.log10(x) : x);
  const fy = (y) => (ylog ? Math.log10(y) : y);
  const X0 = fx(xr[0]), X1 = fx(xr[1]), Y0 = fy(yr[0]), Y1 = fy(yr[1]);
  const mx = (x) => pad.l + ((W - pad.l - pad.r) * (fx(x) - X0)) / (X1 - X0);
  const my = (y) => H - pad.b - ((H - pad.t - pad.b) * (fy(y) - Y0)) / (Y1 - Y0);
  const inside = (x, y) => isFinite(x) && isFinite(y) && (!xlog || x > 0) && (!ylog || y > 0);
  const clipY = (v) => Math.max(pad.t - 2, Math.min(H - pad.b + 2, v));
  const xt = xlog ? [] : niceTicks(xr[0], xr[1], 6);
  const yt = ylog ? [] : niceTicks(yr[0], yr[1], 5);
  const cid = useMemo(() => "clip" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <defs>
        <clipPath id={cid}><rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} /></clipPath>
      </defs>
      <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} fill="#fff" stroke={C.line} />
      {xt.map((v) => (
        <g key={"xt" + v}>
          <line x1={mx(v)} x2={mx(v)} y1={pad.t} y2={H - pad.b} stroke="#f0ebe2" />
          <text x={mx(v)} y={H - pad.b + 15} fontSize="11" fill={C.inkSoft} textAnchor="middle">{fmtTick(v)}</text>
        </g>
      ))}
      {yt.map((v) => (
        <g key={"yt" + v}>
          <line x1={pad.l} x2={W - pad.r} y1={my(v)} y2={my(v)} stroke="#f0ebe2" />
          <text x={pad.l - 5} y={my(v) + 4} fontSize="11" fill={C.inkSoft} textAnchor="end">{fmtTick(v)}</text>
        </g>
      ))}
      {xlog && logTicks(X0, X1, "x", (e) => pad.l + ((W - pad.l - pad.r) * (e - X0)) / (X1 - X0), W, H, pad)}
      {ylog && logTicks(Y0, Y1, "y", (e) => H - pad.b - ((H - pad.t - pad.b) * (e - Y0)) / (Y1 - Y0), W, H, pad)}
      <g clipPath={`url(#${cid})`}>
        {hlines.map((h, i) => <line key={"h" + i} x1={pad.l} x2={W - pad.r} y1={my(h.y)} y2={my(h.y)} stroke={h.color || C.inkSoft} strokeDasharray={h.dash || "4 4"} strokeWidth={h.width || 1.2} />)}
        {vlines.map((v, i) => <line key={"v" + i} x1={mx(v.x)} x2={mx(v.x)} y1={pad.t} y2={H - pad.b} stroke={v.color || C.inkSoft} strokeDasharray={v.dash || "4 4"} strokeWidth={v.width || 1.2} />)}
        {series.map((s, i) => {
          const pts = s.pts.filter(([x, y]) => inside(x, y)).map(([x, y]) => [mx(x), clipY(my(y))]);
          return pts.length > 1 ? <g key={"s" + i}>{polyline(pts, s.color, s.width || 2, s.dash)}</g> : null;
        })}
        {dots.filter((d) => inside(d.x, d.y)).map((d, i) => <circle key={"d" + i} cx={mx(d.x)} cy={my(d.y)} r={d.r || 4} fill={d.fill || d.color || C.copper} stroke={d.color || C.copperDeep} strokeWidth={1.2} />)}
      </g>
      {labels.filter((l) => inside(l.x, l.y)).map((l, i) => (
        <text key={"l" + i} x={mx(l.x) + (l.dx || 0)} y={my(l.y) + (l.dy || 0)} fontSize={l.size || 11.5} fill={l.color || C.ink} textAnchor={l.anchor || "start"}>{l.text}</text>
      ))}
      {legend && (
        <g>
          <rect x={legendAt[1] === "r" ? W - pad.r - 16 - legendW(legend) : legendAt[1] === "c" ? (pad.l + W - pad.r) / 2 - legendW(legend) / 2 : pad.l + 4} y={legendAt[0] === "b" ? H - pad.b - 8 - legend.length * 17 + 2 : pad.t + 2} width={legendW(legend) + 12} height={legend.length * 17 + 4} fill="#fff" opacity={0.85} rx={4} />
          {legend.map((g, i) => (
            <g key={"lg" + i} transform={`translate(${legendAt[1] === "r" ? W - pad.r - 10 - legendW(legend) : legendAt[1] === "c" ? (pad.l + W - pad.r) / 2 - legendW(legend) / 2 + 6 : pad.l + 10}, ${legendAt[0] === "b" ? H - pad.b - 8 - (legend.length - 1 - i) * 17 : pad.t + 14 + i * 17})`}>
              <line x1={0} x2={22} y1={-4} y2={-4} stroke={g.color} strokeWidth={2.4} strokeDasharray={g.dash || "none"} />
              <text x={28} y={0} fontSize="11.5" fill={C.ink}>{g.label}</text>
            </g>
          ))}
        </g>
      )}
      {axisLabels(W, H, pad, xl, yl)}
    </svg>
  );
}

const legendW = (lg) => 34 + Math.max(...lg.map((g) => [...String(g.label)].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 11.5 : 6.4), 0)));

/* color ramp for heat maps: 0 → pale, 1 → deep copper/ink */
function ramp(v) {
  const u = Math.max(0, Math.min(1, v));
  const stops = [[250, 247, 242], [243, 210, 170], [196, 118, 64], [124, 69, 32], [32, 48, 79]];
  const s = u * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(s));
  const f = s - i;
  const c = stops[i].map((a, k) => Math.round(a + (stops[i + 1][k] - a) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>{children}</div>;
}

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 정상상태 분자확산", "This week: steady-state molecular diffusion")}>
        <P>
          {t(
            "9주차에 플럭스와 확산계수, 그리고 지배방정식과 경계조건을 배웠습니다. 10주차에는 이 도구로 실제 문제를 풉니다. 대부분의 문제는 같은 순서를 따릅니다. 먼저 기하와 기준틀을 정합니다. 다음으로 플럭스 비 N_B/N_A를 정합니다. 그 다음 껍질(shell) 수지로 미분방정식을 세우고 경계조건을 넣어 적분합니다.",
            "In Week 9 we built the tools: fluxes, diffusivities, the governing equation and boundary conditions. In Week 10 we use them on real problems. Almost every problem follows the same steps. Fix the geometry and the reference frame. Fix the flux ratio N_B/N_A. Write a shell balance, insert the boundary conditions, and integrate."
          )}
        </P>
        <Eq block>N_A = −cD_AB ∇y_A + y_A (N_A + N_B) &nbsp;&nbsp;→&nbsp;&nbsp; {t("정상·1차원·반응 없음", "steady, 1D, no reaction")}: d(A·N_Az)/dz = 0</Eq>
        <P>
          {t(
            "핵심은 두 번째 단계입니다. 정체된 기체(N_B = 0)를 통과하면 로그 평균이 나옵니다. 화학양론이 플럭스 비를 정하면(예: 3C + 2.5O₂ → 2CO₂ + CO) 그 비가 해에 그대로 들어갑니다. 경계가 천천히 움직이면 '유사 정상상태'로 보고, 순간마다 정상 해를 씁니다.",
            "The second step is the crux. Diffusion through a stagnant gas (N_B = 0) produces the log mean. When stoichiometry fixes the flux ratio (3C + 2.5O₂ → 2CO₂ + CO, say), that ratio enters the solution directly. When a boundary moves slowly, we treat it as pseudo-steady and use the steady solution at each instant."
          )}
        </P>
      </Panel>

      <Panel title={t("10주차 로드맵", "Week 10 roadmap")}>
        <Table
          head={[t("문제", "Problem"), t("기하·조건", "Geometry & condition"), t("핵심 결과", "Key result")]}
          rows={[
            [t("Stefan 관 (Arnold cell)", "Stefan tube (Arnold cell)"), t("1D, N_B = 0", "1D, N_B = 0"), "N_A = cD(y_A1 − y_A2)/(L y_B,lm)"],
            [t("막 모델", "Film model"), t("두께 δ의 정체막", "stagnant film of thickness δ"), "k_c = PD/(δ p_B,lm)"],
            [t("유사 정상: Arnold cell 측정", "Pseudo-steady: Arnold-cell measurement"), t("액면이 천천히 하강", "liquid level falls slowly"), "z² − z₀² ∝ D t"],
            [t("Si 열산화", "Si thermal oxidation"), t("SiO₂ 막 성장", "growing SiO₂ film"), "δ² + Aδ = B t  (Deal–Grove)"],
            [t("탄소 입자 연소", "Carbon-particle burnout"), t("구, 화학양론 플럭스 비", "sphere, stoichiometric flux ratio"), "t_f ∝ R₀² / ln(1.042)"],
            [t("표면 반응과 Da", "Surface reaction and Da"), t("확산과 반응의 직렬 저항", "diffusion and reaction in series"), "W = W_diff /(1 + 1/Da)"],
            [t("액막 내 1차 반응", "First-order reaction in a liquid film"), t("기체 흡수", "gas absorption"), "E = Ha / tanh Ha,  k_c → √(Dk₁)"],
            [t("CVD (Grove 모델)", "CVD (Grove model)"), t("기상 전달 + 표면 반응", "gas-phase transfer + surface reaction"), "G = h_g k_s/(h_g + k_s) · C_g/N"],
            [t("도펀트 확산", "Dopant diffusion"), t("Si 내 고체 확산", "solid-state diffusion in Si"), "erfc, Gaussian, x_j"],
            [t("2차원 확산", "2D diffusion"), t("직사각형, 웨이퍼 사이 기체", "rectangle, gas between wafers"), "Fourier–sinh series, I₀(Φ)"],
            [t("열·물질 동시 전달", "Simultaneous heat & mass"), t("비응축 기체 속 응축", "condensation with a noncondensable gas"), t("계면 온도 T₂ 반복 계산", "iterate for interface T₂")],
          ]}
        />
      </Panel>

      <Panel title={t("왜 '유사 정상상태'가 통하는가", "Why the pseudo-steady assumption works")}>
        <P>
          {t(
            "경계가 움직이는 문제도 많은 경우 정상 해로 충분합니다. 농도장이 자리 잡는 시간은 L²/D입니다. 경계가 L만큼 움직이는 시간은 그보다 훨씬 깁니다. 두 시간의 비가 작으면 농도장은 매 순간 정상 상태에 가깝습니다.",
            "Many moving-boundary problems can still use the steady solution. The concentration field relaxes in a time L²/D. The boundary needs far longer to move a distance L. When the ratio of the two times is small, the field is nearly steady at every instant."
          )}
        </P>
        <Eq block>τ_diff / τ_move ≈ (L²/D) / (ρ_L L /(M_A N_A)) = c Δy_A / (c_L y_B,lm), &nbsp; c_L = ρ_L/M_A &nbsp;≪ 1</Eq>
        <Note>
          {t(
            "25 °C 물 Stefan 관에서 기체 속 물의 몰농도(약 1.3 mol/m³)는 액체(55,000 mol/m³)의 4만분의 1 수준입니다. 그래서 액면 하강은 확산보다 수만 배 느리고, 유사 정상 가정이 매우 잘 맞습니다. Si 산화에서도 SiO₂ 속 O₂ 농도는 고체 SiO₂ 몰농도보다 수십만 배 작습니다.",
            "In a water Stefan tube at 25 °C, the molar concentration of vapor in the gas (about 1.3 mol/m³) is about 1/40,000 of that of the liquid (55,000 mol/m³). The level therefore falls tens of thousands of times more slowly than diffusion relaxes, and the pseudo-steady assumption is excellent. In Si oxidation, the O₂ concentration in SiO₂ is likewise hundreds of thousands of times smaller than the molar density of the solid oxide."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Stefan tube & film model ---------------------------------- */
function TabStefan({ t }) {
  const [liq, setLiq] = useState("acetone");
  const [TC, setTC] = useState(25);
  const [Lcm, setLcm] = useState(10);
  const [yA2, setYA2] = useState(0);
  const T = TC + 273.15;
  const c = ATM / (RG * T);
  const yA1 = Math.min(0.95, psatPa(liq, TC) / ATM);
  const y2 = Math.min(yA2, yA1 * 0.95);
  const D = fullerAir(liq, T);
  const L = Lcm / 100;
  const N = (c * D / L) * Math.log((1 - y2) / (1 - yA1));
  const Nfick = (c * D * (yA1 - y2)) / L;
  const prof = [], lin = [], vz = [];
  for (let i = 0; i <= 100; i++) {
    const s = i / 100;
    prof.push([s, 1 - (1 - yA1) * Math.pow((1 - y2) / (1 - yA1), s)]);
    lin.push([s, yA1 + (y2 - yA1) * s]);
  }
  const ymax = Math.max(0.05, yA1 * 1.1);
  /* film model */
  const [dmm, setDmm] = useState(2);
  const kc = D / (dmm * 1e-3 * ylm(yA1, y2));
  const kcPrime = D / (dmm * 1e-3);
  /* ratio Stefan/Fick vs y_A1 */
  const ratio = [];
  for (let i = 1; i <= 95; i++) {
    const y = i / 100;
    ratio.push([y, -Math.log(1 - y) / y]);
  }
  return (
    <div>
      <Panel title={t("Stefan 관: 정체된 기체를 통과하는 확산", "Stefan tube: diffusion through a stagnant gas")}>
        <P>
          {t(
            "가는 관 바닥에 휘발성 액체 A가 있습니다. 관 위로 공기 B가 흘러 A를 계속 걷어 갑니다. B는 액체에 녹지 않으므로 정상상태에서 N_B = 0입니다. 그러면 플럭스 식이 간단해집니다.",
            "A volatile liquid A sits at the bottom of a narrow tube. Air B sweeps across the top and carries A away. B does not dissolve in the liquid, so N_B = 0 at steady state. The flux equation then simplifies."
          )}
        </P>
        <Eq block>N_Az = −cD_AB dy_A/dz + y_A N_Az &nbsp;⇒&nbsp; N_Az = −(cD_AB/(1 − y_A)) dy_A/dz</Eq>
        <P>
          {t(
            "단면적이 일정하므로 껍질 수지 d(N_Az)/dz = 0에서 N_Az는 상수입니다. z₁에서 y_A1(포화), z₂에서 y_A2로 적분합니다.",
            "The cross-section is constant, so the shell balance d(N_Az)/dz = 0 makes N_Az a constant. Integrate from y_A1 (saturation) at z₁ to y_A2 at z₂."
          )}
        </P>
        <Eq block>
          N_Az = (cD_AB/(z₂ − z₁)) ln[(1 − y_A2)/(1 − y_A1)] = cD_AB(y_A1 − y_A2)/((z₂ − z₁) y_B,lm), &nbsp; y_B,lm = (y_B2 − y_B1)/ln(y_B2/y_B1)
        </Eq>
        <Eq block>(1 − y_A)/(1 − y_A1) = [(1 − y_A2)/(1 − y_A1)]<sup>(z − z₁)/(z₂ − z₁)</sup></Eq>
        <Grid2>
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <Seg value={liq} onChange={setLiq} options={Object.keys(LIQS).map((k) => ({ v: k, label: t(LIQS[k].kr, LIQS[k].en) }))} />
            </div>
            <Slider label={t("온도 T", "Temperature T")} value={TC} min={5} max={50} step={1} onChange={setTC} unit=" °C" />
            <Slider label={t("확산 길이 L = z₂ − z₁", "Diffusion length L = z₂ − z₁")} value={Lcm} min={2} max={30} step={1} onChange={setLcm} unit=" cm" />
            <Slider label={t("관 입구 몰분율 y_A2", "Mole fraction at the top y_A2")} value={yA2} min={0} max={0.3} step={0.005} onChange={setYA2} fmt={(v) => Math.min(v, yA1 * 0.95).toFixed(3)} />
            <Readout>
              p_sat = {(psatPa(liq, TC) / 1000).toFixed(2)} kPa → y_A1 = {yA1.toFixed(4)}<br />
              D_AB (Fuller) = {(D * 1e4).toFixed(4)} cm²/s, &nbsp;c = {c.toFixed(2)} mol/m³<br />
              y_B,lm = {ylm(yA1, y2).toFixed(4)}<br />
              N_A = {sci(N, 3)} mol/m²·s &nbsp;({sci(N * LIQS[liq].M * 1e-3 * 3600 * 1e3, 3)} g/m²·h)<br />
              {t("벌크 흐름 무시(Fick)", "Fick, no bulk flow")}: {sci(Nfick, 3)} → {t("비", "ratio")} N/N_Fick = <b>{(N / Nfick).toFixed(3)}</b>
            </Readout>
          </div>
          <Chart
            W={440} H={300} xr={[0, 1]} yr={[0, ymax]}
            xl={t("(z − z₁)/L", "(z − z₁)/L")} yl="y_A"
            series={[{ pts: prof, color: C.copper, width: 2.6 }, { pts: lin, color: C.cool, dash: "6 4" }]}
            legendAt="tr" legend={[{ label: t("정확한 해 (Stefan)", "exact (Stefan)"), color: C.copper }, { label: t("직선 (Fick, 희박)", "linear (Fick, dilute)"), color: C.cool, dash: "6 4" }]}
          />
        </Grid2>
        <Note>
          {t(
            "아세톤처럼 휘발성이 크면 y_A1 ≈ 0.3이고 정확한 플럭스가 Fick 식보다 약 19% 큽니다. 물은 y_A1 ≈ 0.03이라 차이가 2% 미만입니다. 확산하는 A가 만든 벌크 흐름 y_A N_A가 A를 같은 방향으로 더 실어 나르기 때문입니다. 프로파일이 위로 볼록한 이유도 같습니다. 바닥 근처에서는 벌크 흐름이 크므로, 같은 플럭스를 내는 데 더 작은 기울기로 충분합니다.",
            "For a volatile liquid such as acetone, y_A1 ≈ 0.3 and the exact flux is about 19% above Fick's estimate. For water, y_A1 ≈ 0.03 and the difference is under 2%. The bulk flow y_A N_A created by the diffusing A carries more A in the same direction. That is also why the profile is concave down: near the bottom the bulk flow is large, so a smaller gradient carries the same flux."
          )}
        </Note>
      </Panel>

      <Panel title={t("보정 인자 ln[1/(1 − y_A1)]/y_A1", "Correction factor ln[1/(1 − y_A1)]/y_A1")}>
        <Grid2>
          <Chart
            W={440} H={270} xr={[0, 0.95]} yr={[1, 3.2]}
            xl="y_A1  (y_A2 = 0)" yl="N_A / N_A,Fick"
            series={[{ pts: ratio, color: C.copper, width: 2.4 }]}
            dots={[{ x: yA1, y: -Math.log(1 - yA1) / yA1, color: C.warn, fill: C.warn }]}
          />
          <div>
            <P>
              {t(
                "y_A2 = 0일 때 정확한 플럭스와 Fick 근사의 비는 ln[1/(1 − y_A1)]/y_A1 = 1/y_B,lm입니다. y_A1 → 0이면 1로 수렴합니다. 이 비는 '희박 근사가 언제 깨지는가'를 알려 줍니다. 보통 y_A < 0.1이면 오차가 5% 남짓이므로 Fick 식을 써도 됩니다.",
                "With y_A2 = 0, the ratio of the exact flux to the Fick estimate is ln[1/(1 − y_A1)]/y_A1 = 1/y_B,lm, which tends to 1 as y_A1 → 0. The ratio tells us when the dilute approximation fails. For y_A < 0.1 the error is about 5%, so Fick's law is acceptable."
              )}
            </P>
            <Table
              head={["y_A1", "1/y_B,lm"]}
              rows={[0.05, 0.1, 0.3, 0.5, 0.8].map((y) => [y.toFixed(2), (-Math.log(1 - y) / y).toFixed(3)])}
            />
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("막 모델과 물질전달계수", "Film model and the mass-transfer coefficient")}>
        <P>
          {t(
            "실제 표면 위의 유동은 복잡합니다. 막 모델은 표면에 두께 δ의 정체막이 있다고 가정합니다. 그 막 안에서는 Stefan 관과 똑같이 확산만 일어납니다. 그러면 플럭스를 '계수 × 농도차' 꼴로 쓸 수 있습니다.",
            "The flow over a real surface is complicated. The film model assumes a stagnant film of thickness δ on the surface. Inside the film, only diffusion occurs, exactly as in the Stefan tube. The flux can then be written as a coefficient times a concentration difference."
          )}
        </P>
        <Eq block>N_A = k_c (c_A1 − c_A2), &nbsp;&nbsp; k_c = D_AB P/(δ p_B,lm) = D_AB/(δ y_B,lm)</Eq>
        <Slider label={t("막 두께 δ", "Film thickness δ")} value={dmm} min={0.2} max={10} step={0.1} onChange={setDmm} unit=" mm" />
        <Readout>
          k_c = {(kc * 100).toFixed(3)} cm/s &nbsp;|&nbsp; {t("희박 극한 k′_c = D/δ", "dilute limit k′_c = D/δ")} = {(kcPrime * 100).toFixed(3)} cm/s
        </Readout>
        <Note>
          {t(
            "막 모델은 k_c ∝ D를 예측합니다. 실제 실험은 대개 k_c ∝ D^0.5–0.67입니다. 막 모델은 지수를 틀리지만, 고농도 보정 1/y_B,lm을 어떻게 넣을지는 정확히 알려 줍니다. 6탭의 반응 액막에서 지수 0.5가 다시 나옵니다.",
            "The film model predicts k_c ∝ D, whereas experiments usually give k_c ∝ D^0.5–0.67. The model gets the exponent wrong, but it shows exactly how the high-concentration correction 1/y_B,lm enters. The exponent 0.5 reappears in the reacting liquid film (tab 6)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Arnold cell (pseudo-steady D measurement) ---------------------------------- */
function TabArnold({ t }) {
  const [liq, setLiq] = useState("water");
  const [TC, setTC] = useState(25);
  const [z0cm, setZ0] = useState(2);
  const [noise, setNoise] = useState(20);   // μm reading error
  const [seed, setSeed] = useState(3);
  const T = TC + 273.15;
  const c = ATM / (RG * T);
  const q = LIQS[liq];
  const yA1 = psatPa(liq, TC) / ATM;
  const Dt = fullerAir(liq, T);
  const z0 = z0cm / 100;
  const K = (2 * c * Dt * q.M * 1e-3 * yA1) / (q.rho * ylm(yA1, 0)); // z² − z0² = K t
  const tEnd = (Math.pow(z0 + 0.03, 2) - z0 * z0) / K;                  // time to fall 3 cm
  const days = [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0].map((f) => f * tEnd);
  const data = useMemo(() => {
    const rng = makeRng(seed);
    return days.map((tt) => [tt, Math.sqrt(z0 * z0 + K * tt) + rng.gauss() * noise * 1e-6]);
  }, [seed, noise, K, z0, tEnd]); // eslint-disable-line react-hooks/exhaustive-deps
  const sxy = data.reduce((s, [tt, z]) => s + tt * (z * z - z0 * z0), 0);
  const sxx = data.reduce((s, [tt]) => s + tt * tt, 0);
  const Kfit = sxy / sxx;
  const Dfit = (Kfit * q.rho * ylm(yA1, 0)) / (2 * c * q.M * 1e-3 * yA1);
  const unit = tEnd > 86400 * 3 ? 86400 : 3600;
  const uLab = unit === 86400 ? t("일", "days") : t("시간", "h");
  const curve = [];
  for (let i = 0; i <= 100; i++) {
    const tt = (i / 100) * tEnd * 1.05;
    curve.push([tt / unit, (z0 * z0 + K * tt - z0 * z0) * 1e4]);
  }
  return (
    <div>
      <Panel title={t("유사 정상상태: 액면이 내려가는 Arnold cell", "Pseudo-steady state: the Arnold cell with a falling level")}>
        <P>
          {t(
            "Stefan 관은 확산계수 측정 장치로도 씁니다. 액체가 증발하면 액면에서 관 입구까지의 거리 z가 천천히 늘어납니다. 매 순간 정상 해가 성립한다고 보면, 액체의 물질수지가 액면의 속도를 정합니다.",
            "The Stefan tube doubles as an instrument for measuring diffusivities. As the liquid evaporates, the distance z from the liquid surface to the top slowly grows. If the steady solution holds at each instant, a mass balance on the liquid gives the speed of the level."
          )}
        </P>
        <Eq block>(ρ_A,L/M_A) dz/dt = N_Az|<sub>z</sub> = cD_AB (y_A1 − y_A2)/(z y_B,lm)</Eq>
        <Eq block>⇒ &nbsp; z² − z₀² = [2cD_AB M_A (y_A1 − y_A2)/(ρ_A,L y_B,lm)] t &nbsp;&nbsp;⇒&nbsp;&nbsp; D_AB = slope × ρ_A,L y_B,lm/(2cM_A(y_A1 − y_A2))</Eq>
        <P>
          {t(
            "따라서 z² − z₀²를 시간에 대해 그리면 직선이 되고, 그 기울기에서 D_AB를 얻습니다. 아래는 가상의 실험입니다. 측정 잡음을 넣고 원점을 지나는 직선으로 맞춥니다.",
            "So z² − z₀² plotted against time is a straight line, and its slope gives D_AB. Below is a synthetic experiment: we add reading noise and fit a line through the origin."
          )}
        </P>
        <Grid2>
          <div>
            <Seg value={liq} onChange={setLiq} options={Object.keys(LIQS).map((k) => ({ v: k, label: t(LIQS[k].kr, LIQS[k].en) }))} />
            <Slider label={t("온도 T", "Temperature T")} value={TC} min={5} max={45} step={1} onChange={setTC} unit=" °C" />
            <Slider label={t("초기 거리 z₀", "Initial distance z₀")} value={z0cm} min={1} max={10} step={0.5} onChange={setZ0} unit=" cm" />
            <Slider label={t("액면 판독 오차 (1σ)", "Level-reading error (1σ)")} value={noise} min={0} max={200} step={5} onChange={setNoise} unit=" μm" />
            <button onClick={() => setSeed((s) => s + 1)} style={btnStyle(false)}>{t("새 측정 데이터", "New measurement")}</button>
            <Readout>
              {t("3 cm 하강에 걸리는 시간", "Time for a 3 cm drop")}: {(tEnd / unit).toFixed(1)} {uLab}<br />
              D_true (Fuller) = {(Dt * 1e4).toFixed(4)} cm²/s<br />
              D_fit = <b>{(Dfit * 1e4).toFixed(4)}</b> cm²/s &nbsp;({t("오차", "error")} {((Dfit / Dt - 1) * 100).toFixed(2)}%)
            </Readout>
          </div>
          <Chart
            W={440} H={300} xr={[0, (tEnd * 1.05) / unit]} yr={[0, K * tEnd * 1.15 * 1e4]}
            xl={`t (${uLab})`} yl="z² − z₀²  (cm²)"
            series={[{ pts: curve, color: C.cool, dash: "6 4" }, { pts: curve.map(([x]) => [x, Kfit * x * unit * 1e4]), color: C.copper }]}
            dots={data.map(([tt, z]) => ({ x: tt / unit, y: (z * z - z0 * z0) * 1e4 }))}
            legend={[{ label: t("이론", "theory"), color: C.cool, dash: "6 4" }, { label: t("최소제곱 맞춤", "least-squares fit"), color: C.copper }]}
          />
        </Grid2>
        <Note>
          {t(
            "물은 3 cm 내려가는 데 몇 주가 걸립니다. 반면 확산장이 자리 잡는 시간 z²/D는 몇 분입니다. 그래서 유사 정상 가정이 잘 맞습니다. 아세톤은 훨씬 빨리 증발하지만 그래도 시간 척도의 비는 작습니다. z² − z₀²를 쓰는 이유는 판독 오차가 z에 그대로 들어가도 직선성이 유지되기 때문입니다.",
            "Water needs weeks to drop 3 cm, while the diffusion field relaxes in minutes (z²/D), so the pseudo-steady assumption holds well. Acetone evaporates much faster, yet the ratio of time scales is still small. Plotting z² − z₀² keeps the data on a straight line even when reading errors enter z directly."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Si thermal oxidation ---------------------------------- */
/* Deal–Grove constants for (111) Si (Deal & Grove 1965; as tabulated in standard process texts) */
const DG = {
  dry: { B0: 7.72e2, EB: 1.23, BA0: 6.23e6, EBA: 2.0, kr: "건식 O₂", en: "Dry O₂" },
  wet: { B0: 3.86e2, EB: 0.78, BA0: 1.63e8, EBA: 2.05, kr: "습식 H₂O", en: "Wet H₂O" },
};
function dealGrove(amb, TC) {
  const T = TC + 273.15, d = DG[amb];
  const B = d.B0 * Math.exp(-d.EB / (KB_EV * T));      // μm²/h
  const BA = d.BA0 * Math.exp(-d.EBA / (KB_EV * T));   // μm/h
  return { B, BA, A: B / BA };
}
const dgThick = (A, B, th) => 0.5 * A * (Math.sqrt(1 + (4 * B * th) / (A * A)) - 1); // μm, t in h

function TabOxide({ t }) {
  /* lecture model */
  const M = 60.08e-3, rho = 2270, cs = (5.2e16 * 1e6) / 6.02214076e23;
  const [lD, setLD] = useState(Math.log10(3.4e-13));
  const [lks, setLks] = useState(-5);
  const Dox = Math.pow(10, lD), ks = Math.pow(10, lks);
  const Bp = (2 * M * Dox * cs) / rho;      // m²/s
  const Ap = (2 * Dox) / ks;                // m
  const lin = [], par = [], lp = [];
  for (let i = 0; i <= 120; i++) {
    const h = (i / 120) * 16, s = h * 3600;
    par.push([h, Math.sqrt(Bp * s) * 1e6]);
    lp.push([h, 0.5 * (-Ap + Math.sqrt(Ap * Ap + 4 * Bp * s)) * 1e6]);
    lin.push([h, (Bp / Ap) * s * 1e6]);
  }
  const d16 = 0.5 * (-Ap + Math.sqrt(Ap * Ap + 4 * Bp * 16 * 3600)) * 1e6;
  /* Deal–Grove */
  const [amb, setAmb] = useState("dry");
  const [TC, setTC] = useState(1000);
  const [hours, setHours] = useState(4);
  const dg = dealGrove(amb, TC);
  const xdg = dgThick(dg.A, dg.B, hours);
  const temps = [900, 1000, 1100, 1200];
  const cols = [C.cool, C.good, C.copper, C.warn];
  const tmax = amb === "dry" ? 20 : 4;
  const dgSeries = temps.map((T, k) => {
    const g = dealGrove(amb, T);
    return { pts: Array.from({ length: 101 }, (_, i) => { const th = (i / 100) * tmax; return [th, dgThick(g.A, g.B, th)]; }), color: cols[k], width: 2.2 };
  });
  const ymax = Math.max(...dgSeries.map((s) => s.pts[100][1])) * 1.08;
  return (
    <div>
      <Panel title={t("Si 열산화: 자라는 막을 통과하는 확산", "Si thermal oxidation: diffusion through a growing film")}>
        <P>
          {t(
            "산소 A는 SiO₂ 표면에서 녹아 들어가 막을 통과합니다. Si/SiO₂ 계면에 도달하면 Si + O₂ → SiO₂ 반응으로 소모됩니다. 막 안에서는 반응이 없고, 농도장은 거의 정상입니다(개요 탭 참고). 따라서 막 안의 플럭스는 일정하고, 농도 분포는 직선입니다.",
            "Oxygen A dissolves at the SiO₂ surface and diffuses through the film. At the Si/SiO₂ interface it is consumed by Si + O₂ → SiO₂. There is no reaction inside the film, and the field is nearly steady (see Overview). The flux across the film is therefore constant and the profile is linear."
          )}
        </P>
        <Eq block>N_Az = D_AB c_As/δ(t) &nbsp;({t("계면에서 c_A = 0", "c_A = 0 at the interface")}), &nbsp;&nbsp; (ρ_B/M_B) dδ/dt = N_Az</Eq>
        <Eq block>⇒ &nbsp;δ dδ = (M_B D_AB c_As/ρ_B) dt &nbsp;⇒&nbsp; δ = (2M_B D_AB c_As t/ρ_B)<sup>1/2</sup> &nbsp;&nbsp;({t("포물선 법칙", "parabolic law")})</Eq>
        <P>
          {t(
            "계면 반응이 유한한 속도 N_A = k_s c_Ai로 일어나면, 막 확산과 계면 반응이 직렬 저항이 됩니다. 1/N_A = (δ/D + 1/k_s)/c_As로 쓰고 같은 방법으로 적분하면 선형–포물선 식이 나옵니다. 이것이 Deal–Grove 모델의 뼈대입니다.",
            "If the interface reaction has a finite rate N_A = k_s c_Ai, film diffusion and the interface reaction act as series resistances: 1/N_A = (δ/D + 1/k_s)/c_As. Integrating the same way gives the linear–parabolic law, the skeleton of the Deal–Grove model."
          )}
        </P>
        <Eq block>δ² + (2D/k_s) δ = (2M_B D c_As/ρ_B) t &nbsp;&nbsp;≡&nbsp;&nbsp; δ² + Aδ = B t</Eq>
        <Grid2>
          <div>
            <Slider label={t("SiO₂ 속 O₂ 확산계수 D", "O₂ diffusivity in SiO₂, D")} value={lD} min={-14} max={-12} step={0.02} onChange={setLD} fmt={(v) => sci(Math.pow(10, v), 2)} unit=" m²/s" />
            <Slider label={t("계면 반응 속도상수 k_s", "Interface rate constant k_s")} value={lks} min={-7} max={-3} step={0.05} onChange={setLks} fmt={(v) => sci(Math.pow(10, v), 2)} unit=" m/s" />
            <Readout>
              c_As = 5.2×10¹⁶ cm⁻³ = {sci(cs, 3)} mol/m³<br />
              B = {sci(Bp * 1e12 * 3600, 3)} μm²/h, &nbsp;A = 2D/k_s = {sci(Ap * 1e6, 3)} μm<br />
              δ(16 h) = <b>{d16.toFixed(3)} μm</b> &nbsp;({t("포물선만", "parabolic only")} {(Math.sqrt(Bp * 16 * 3600) * 1e6).toFixed(3)} μm)
            </Readout>
            <Note>
              {t(
                "강의 그림(1000 °C 건식, 16시간에 약 0.3 μm)을 재현하도록 D를 고른 예시값입니다. 얇을 때(δ ≪ A)는 반응 지배로 δ ≈ (B/A)t의 직선, 두꺼울 때(δ ≫ A)는 확산 지배로 δ ≈ √(Bt)입니다.",
                "D is an illustrative value chosen to reproduce the lecture figure (dry, 1000 °C, about 0.3 μm after 16 h). For thin films (δ ≪ A) the reaction controls and δ ≈ (B/A)t is linear; for thick films (δ ≫ A) diffusion controls and δ ≈ √(Bt)."
              )}
            </Note>
          </div>
          <Chart
            W={440} H={300} xr={[0, 16]} yr={[0, Math.max(0.35, par[120][1] * 1.1)]}
            xl={t("시간 (h)", "time (h)")} yl={t("산화막 두께 δ (μm)", "oxide thickness δ (μm)")}
            series={[{ pts: par, color: C.cool, dash: "6 4" }, { pts: lin, color: C.good, dash: "2 4" }, { pts: lp, color: C.copper, width: 2.8 }]}
            legendAt="br" legend={[{ label: t("선형–포물선", "linear–parabolic"), color: C.copper }, { label: t("포물선 (k_s → ∞)", "parabolic (k_s → ∞)"), color: C.cool, dash: "6 4" }, { label: t("선형 극한 (B/A)t", "linear limit (B/A)t"), color: C.good, dash: "2 4" }]}
          />
        </Grid2>
      </Panel>

      <Panel title={t("실제 공정: Deal–Grove 상수", "The real process: Deal–Grove constants")}>
        <P>
          {t(
            "Deal과 Grove(1965)는 B와 B/A를 Arrhenius 식으로 정리했습니다. B는 확산(D·c_As)에서, B/A는 계면 반응(k_s)에서 옵니다. 그래서 B의 활성화 에너지(1.23 eV, 건식)는 SiO₂ 속 O₂ 확산과 비슷하고, B/A의 활성화 에너지(약 2 eV)는 Si–Si 결합 끊기와 비슷합니다. 습식은 H₂O의 용해도가 O₂보다 훨씬 커서 B가 수십 배 큽니다.",
            "Deal and Grove (1965) fitted B and B/A with Arrhenius forms. B comes from diffusion (D·c_As) and B/A from the interface reaction (k_s). The activation energy of B (1.23 eV, dry) is close to that of O₂ diffusion in SiO₂, and that of B/A (about 2 eV) is close to breaking Si–Si bonds. In wet oxidation the solubility of H₂O far exceeds that of O₂, so B is tens of times larger."
          )}
        </P>
        <Grid2>
          <div>
            <Seg value={amb} onChange={setAmb} options={Object.keys(DG).map((k) => ({ v: k, label: t(DG[k].kr, DG[k].en) }))} />
            <Slider label={t("온도", "Temperature")} value={TC} min={800} max={1200} step={10} onChange={setTC} unit=" °C" />
            <Slider label={t("산화 시간", "Oxidation time")} value={hours} min={0.1} max={amb === "dry" ? 20 : 4} step={0.1} onChange={setHours} unit=" h" />
            <Readout>
              B = {sci(dg.B, 3)} μm²/h, &nbsp;B/A = {sci(dg.BA, 3)} μm/h, &nbsp;A = {sci(dg.A, 3)} μm<br />
              x_ox = <b>{(xdg * 1000).toFixed(1)} nm</b> &nbsp;({xdg < 0.3 * dg.A ? t("반응 지배에 가까움", "near reaction control") : xdg > 3 * dg.A ? t("확산 지배에 가까움", "near diffusion control") : t("혼합 영역", "mixed regime")})
            </Readout>
            <Table
              head={[t("분위기", "Ambient"), "B₀ (μm²/h)", "E_B (eV)", "(B/A)₀ (μm/h)", "E_B/A (eV)"]}
              rows={Object.keys(DG).map((k) => [t(DG[k].kr, DG[k].en), sci(DG[k].B0, 2), DG[k].EB.toFixed(2), sci(DG[k].BA0, 2), DG[k].EBA.toFixed(2)])}
            />
          </div>
          <Chart
            W={440} H={300} xr={[0, tmax]} yr={[0, ymax]}
            xl={t("시간 (h)", "time (h)")} yl="x_ox (μm)"
            series={dgSeries}
            dots={[{ x: hours, y: xdg, color: C.ink, fill: C.copper }]}
            legend={temps.map((T, k) => ({ label: `${T} °C`, color: cols[k] }))}
          />
        </Grid2>
        <Note>
          {t(
            "상수는 (111) Si 기준 Deal–Grove 값입니다. (100) Si의 B/A는 (111)의 약 1/1.7입니다. 건식 산화는 약 25 nm 이하에서 모델보다 빨리 자랍니다. 그래서 실무에서는 초기 두께 x_i(τ)를 넣어 보정합니다. 게이트 산화막처럼 얇고 치밀한 막은 건식으로, 소자 분리용 두꺼운 막은 습식으로 기르는 이유가 이 그래프에 있습니다.",
            "The constants are the Deal–Grove values for (111) Si; B/A for (100) Si is about 1.7 times smaller. Dry oxidation grows faster than the model below roughly 25 nm, so practice adds an initial thickness x_i (the τ shift). This plot explains why thin, dense gate oxides are grown dry and thick isolation oxides are grown wet."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Carbon particle burnout ---------------------------------- */
function TabCarbon({ t }) {
  const [R0um, setR0] = useState(50);
  const [T, setT] = useState(1200);
  const [yinf, setYinf] = useState(0.21);
  const [lDa, setLDa] = useState(0.4);
  const Dref = 2.0e-4;                       // m²/s at 1200 K (illustrative)
  const D = Dref * Math.pow(T / 1200, 1.75);
  const c = ATM / (RG * T);
  const rhoC = 2000, MC = 0.012;
  const corr = Math.log(1 + 0.2 * yinf) / 0.2;      // vs yinf without bulk flow
  const K = (2.4 * c * D * corr * MC) / rhoC;    // R² = R0² − K t, from −(ρ_C/M_C)R dR/dt = 1.2 cD·corr
  const R0 = R0um * 1e-6;
  const tf = (R0 * R0) / K;
  const curve = Array.from({ length: 101 }, (_, i) => { const s = (i / 100) * tf; return [s * 1e3, Math.sqrt(Math.max(0, R0 * R0 - K * s)) * 1e6]; });
  /* heterogeneous single reaction */
  const Da = Math.pow(10, lDa);
  const daCurve = Array.from({ length: 121 }, (_, i) => { const x = Math.pow(10, -2 + (i / 120) * 5); return [x, x / (1 + x)]; });
  return (
    <div>
      <Panel title={t("탄소 입자 연소: 화학양론이 정하는 플럭스 비", "Carbon-particle burnout: a flux ratio fixed by stoichiometry")}>
        <P>
          {t(
            "공기 중에서 타는 탄소 구를 생각합니다. 표면 반응이 3C + 2.5O₂ → 2CO₂ + CO라고 합시다. O₂(A) 2.5몰이 들어올 때 CO₂ 2몰과 CO 1몰이 나갑니다. 반지름 방향(바깥이 +)으로 쓰면 N_CO₂ = −0.8N_A, N_CO = −0.4N_A이고, 합은 ΣN = −0.2N_A입니다.",
            "Consider a carbon sphere burning in air with the surface reaction 3C + 2.5O₂ → 2CO₂ + CO. For every 2.5 mol of O₂ (A) coming in, 2 mol CO₂ and 1 mol CO go out. With r pointing outward, N_CO₂ = −0.8N_A and N_CO = −0.4N_A, so ΣN = −0.2N_A."
          )}
        </P>
        <Eq block>N_Ar = −cD dy_A/dr + y_A(−0.2N_Ar) &nbsp;⇒&nbsp; N_Ar = −(cD/(1 + 0.2y_A)) dy_A/dr, &nbsp;&nbsp; r² N_Ar = {t("상수", "const")}</Eq>
        <P>
          {t(
            "구 대칭이므로 껍질 수지에서 W_A = 4πr²N_Ar가 상수입니다. 반응이 매우 빠르다면 표면에서 y_A = 0, 먼 곳에서 y_A = 0.21입니다. r = R부터 ∞까지 적분합니다.",
            "With spherical symmetry the shell balance makes W_A = 4πr²N_Ar constant. For a very fast reaction, y_A = 0 at the surface and 0.21 far away. Integrate from r = R to ∞."
          )}
        </P>
        <Eq block>W_A = −4πR (cD/0.2) ln(1 + 0.2 × 0.21) = −4πR (cD/0.2) ln 1.042</Eq>
        <Eq block>{t("탄소 소모", "Carbon consumption")}: W_C = (3/2.5)|W_A| &nbsp;⇒&nbsp; −(ρ_C/M_C) 4πR² dR/dt = (3/2.5) 4πR (cD/0.2) ln 1.042</Eq>
        <Eq block>⇒ &nbsp; t_f = (ρ_C/M_C)(R₀² − R_f²) / (12 cD ln 1.042) &nbsp;&nbsp;(R² {t("이 시간에 비례해 줄어듦", "decreases linearly in time")})</Eq>
        <Grid2>
          <div>
            <Slider label={t("초기 반지름 R₀", "Initial radius R₀")} value={R0um} min={5} max={500} step={5} onChange={setR0} unit=" μm" />
            <Slider label={t("기체 온도 T", "Gas temperature T")} value={T} min={900} max={2000} step={20} onChange={setT} unit=" K" />
            <Slider label={t("먼 곳 O₂ 몰분율 y_A∞", "Far-field O₂ mole fraction y_A∞")} value={yinf} min={0.05} max={1} step={0.01} onChange={setYinf} />
            <Readout>
              D_O₂ ≈ {sci(D, 3)} m²/s ({t("예시값", "illustrative")}, ∝ T^1.75), c = {c.toFixed(2)} mol/m³<br />
              ln(1 + 0.2y_A∞)/0.2 = {corr.toFixed(4)} &nbsp;vs&nbsp; y_A∞ = {yinf.toFixed(3)} &nbsp;({t("벌크 흐름 보정", "bulk-flow correction")} {((corr / yinf - 1) * 100).toFixed(1)}%)<br />
              {t("연소 완료 시간", "Burnout time")} t_f = <b>{tf < 1 ? (tf * 1e3).toFixed(1) + " ms" : tf.toFixed(2) + " s"}</b>
            </Readout>
          </div>
          <Chart
            W={440} H={290} xr={[0, tf * 1e3]} yr={[0, R0um * 1.05]}
            xl="t (ms)" yl="R (μm)"
            series={[{ pts: curve, color: C.copper, width: 2.6 }]}
          />
        </Grid2>
        <Note>
          {t(
            "보정이 작은 이유를 보십시오. 바깥으로 나가는 기체 몰수(3)가 들어오는 O₂(2.5)보다 많아서, 순 흐름이 바깥을 향하고 O₂ 공급을 약간 방해합니다. 연소 시간은 R₀²에 비례합니다. 그래서 미분탄 보일러는 석탄을 수십 μm로 갈아 넣습니다. 지름을 10배 줄이면 연소 시간이 100배 줄어듭니다.",
            "Note why the correction is small: more moles of gas leave (3) than O₂ arrives (2.5), so the net flow points outward and slightly hinders the O₂ supply. The burnout time scales as R₀². That is why pulverized-coal boilers grind coal to tens of micrometers: a tenfold smaller diameter burns a hundred times faster."
          )}
        </Note>
      </Panel>

      <Panel title={t("느린 표면 반응: 확산과 반응의 직렬 저항", "A slow surface reaction: diffusion and reaction in series")}>
        <P>
          {t(
            "이번에는 C + O₂ → CO₂ 한 가지 반응만 있다고 합시다. 들어오는 O₂와 나가는 CO₂의 몰수가 같으므로 ΣN = 0입니다. 표면 반응은 유한한 속도 N_A|_R = −k_s c_As를 가집니다. 확산 플럭스와 반응 플럭스를 같게 놓고 c_As를 소거합니다.",
            "Now take a single reaction C + O₂ → CO₂. The moles in and out are equal, so ΣN = 0. The surface reaction has a finite rate N_A|_R = −k_s c_As. Set the diffusive flux equal to the reaction flux and eliminate c_As."
          )}
        </P>
        <Eq block>W_A = −4πR cD y_A∞ / (1 + D/(k_s R)) &nbsp;=&nbsp; W_A,diff × Da/(1 + Da), &nbsp;&nbsp; Da = k_s R/D</Eq>
        <Grid2>
          <div>
            <Slider label="log₁₀ Da" value={lDa} min={-2} max={3} step={0.05} onChange={setLDa} fmt={(v) => v.toFixed(2)} />
            <Readout>
              Da = {sci(Da, 3)} → W_A/W_A,diff = <b>{(Da / (1 + Da)).toFixed(3)}</b><br />
              {Da < 0.1 ? t("반응 지배: 표면 농도 ≈ 벌크 농도", "reaction controlled: surface ≈ bulk concentration") : Da > 10 ? t("확산 지배: 표면 농도 ≈ 0", "diffusion controlled: surface concentration ≈ 0") : t("혼합 영역: 두 저항이 비슷", "mixed: the two resistances are comparable")}
            </Readout>
            <P>
              {t(
                "Da는 '반응이 얼마나 빠른가'를 '확산이 얼마나 빠른가'로 나눈 값입니다. 입자가 작을수록 D/R이 커지므로 Da가 작아져 반응 지배가 됩니다. 온도를 올리면 k_s가 지수적으로 커지므로 확산 지배로 넘어갑니다.",
                "Da compares how fast the reaction is with how fast diffusion is. Smaller particles have larger D/R, so Da falls and the reaction controls. Raising the temperature increases k_s exponentially and pushes the system to diffusion control."
              )}
            </P>
          </div>
          <Chart
            W={440} H={280} xr={[0.01, 1000]} yr={[0, 1.05]} xlog
            xl="Da = k_s R / D" yl="W_A / W_A,diff"
            series={[{ pts: daCurve, color: C.copper, width: 2.6 }]}
            vlines={[{ x: 1, color: C.inkSoft }]}
            dots={[{ x: Da, y: Da / (1 + Da), color: C.ink, fill: C.copper }]}
          />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Liquid film with first-order reaction (Hatta) ---------------------------------- */
function TabHatta({ t }) {
  const [Ha, setHa] = useState(2);
  const E = Ha / Math.tanh(Ha);
  const prof = (h) => Array.from({ length: 101 }, (_, i) => { const z = i / 100; return [z, Math.cosh(h * z) - Math.sinh(h * z) / Math.tanh(h)]; });
  const Ecurve = Array.from({ length: 121 }, (_, i) => { const h = Math.pow(10, -1.5 + (i / 120) * 3.5); return [h, h / Math.tanh(h)]; });
  /* CO2 into NaOH */
  const [OH, setOH] = useState(0.5);       // mol/L
  const [dum, setDum] = useState(50);      // film thickness, μm
  const k2 = 8.5e3;                        // L/(mol·s), 25 °C, Pinsent et al. (1956)
  const DCO2 = 1.9e-9;
  const k1 = k2 * OH;
  const delta = dum * 1e-6;
  const HaC = delta * Math.sqrt(k1 / DCO2);
  const EC = HaC / Math.tanh(HaC);
  return (
    <div>
      <Panel title={t("기체 흡수와 액막 내 1차 반응", "Gas absorption with a first-order reaction in the liquid film")}>
        <P>
          {t(
            "기체 A가 액체 B에 녹아 들어가면서 1차 반응 R_A = −k₁c_A로 사라집니다. 액체 쪽에 두께 δ의 막이 있다고 봅니다. 희박 용액이므로 벌크 흐름은 무시합니다. 막 안의 수지는 확산과 반응의 균형입니다.",
            "Gas A dissolves into liquid B and disappears by a first-order reaction R_A = −k₁c_A. Assume a liquid film of thickness δ. The solution is dilute, so bulk flow is negligible. The balance in the film is diffusion against reaction."
          )}
        </P>
        <Eq block>D_AB d²c_A/dz² − k₁ c_A = 0, &nbsp;&nbsp; c_A(0) = c_A0, &nbsp; c_A(δ) = 0</Eq>
        <P>
          {t(
            "ζ = z/δ, Ha = δ√(k₁/D_AB)로 무차원화하면 u″ = Ha²u입니다. 일반해 u = a cosh(Haζ) + b sinh(Haζ)에 경계조건을 넣습니다.",
            "With ζ = z/δ and Ha = δ√(k₁/D_AB), the equation becomes u″ = Ha²u. Insert the boundary conditions into the general solution u = a cosh(Haζ) + b sinh(Haζ)."
          )}
        </P>
        <Eq block>c_A/c_A0 = cosh(Ha ζ) − sinh(Ha ζ)/tanh(Ha), &nbsp;&nbsp; N_Az|<sub>0</sub> = (D_AB c_A0/δ) · Ha/tanh(Ha)</Eq>
        <Grid2>
          <div>
            <Slider label={t("Hatta 수 Ha = δ√(k₁/D)", "Hatta number Ha = δ√(k₁/D)")} value={Ha} min={0.05} max={10} step={0.05} onChange={setHa} />
            <Readout>
              {t("증진 인자", "Enhancement factor")} E = Ha/tanh Ha = <b>{E.toFixed(4)}</b><br />
              {t("물리 흡수 대비 흡수 속도", "Absorption rate relative to physical absorption")}: ×{E.toFixed(2)}<br />
              {Ha < 0.3 ? t("느린 반응: 막 안 반응은 미미, E ≈ 1 + Ha²/3", "slow reaction: little reaction in the film, E ≈ 1 + Ha²/3") : Ha > 3 ? t("빠른 반응: 막 앞부분에서 소진, E ≈ Ha", "fast reaction: A is consumed near the surface, E ≈ Ha") : t("중간 영역", "intermediate regime")}
            </Readout>
            <Note>
              {t(
                "강의 슬라이드는 플럭스 비 Ha/tanh(Ha)를 'Hatta number'로 불렀습니다. 표준 용어로는 Ha = δ√(k₁/D)가 Hatta 수이고, Ha/tanh(Ha)는 증진 인자 E입니다.",
                "The lecture slide calls the flux ratio Ha/tanh(Ha) the 'Hatta number'. In standard usage Ha = δ√(k₁/D) is the Hatta number and Ha/tanh(Ha) is the enhancement factor E."
              )}
            </Note>
          </div>
          <Chart
            W={440} H={290} xr={[0, 1]} yr={[0, 1]}
            xl="ζ = z/δ" yl="c_A / c_A0"
            series={[{ pts: prof(0.05), color: C.cool, dash: "6 4" }, { pts: prof(Ha), color: C.copper, width: 2.8 }, { pts: prof(10), color: C.warn, dash: "2 4" }]}
            legendAt="tr" legend={[{ label: "Ha → 0 (" + t("직선", "linear") + ")", color: C.cool, dash: "6 4" }, { label: `Ha = ${Ha.toFixed(2)}`, color: C.copper }, { label: "Ha = 10", color: C.warn, dash: "2 4" }]}
          />
        </Grid2>
      </Panel>

      <Panel title={t("빠른 반응에서 k_c ∝ D^½", "Fast reaction: k_c ∝ D^½")}>
        <Grid2>
          <Chart
            W={440} H={280} xr={[0.03, 100]} yr={[0.8, 100]} xlog ylog
            xl="Ha" yl="E = Ha / tanh Ha"
            series={[{ pts: Ecurve, color: C.copper, width: 2.6 }, { pts: [[1, 1], [100, 100]], color: C.inkSoft, dash: "4 4" }, { pts: [[0.03, 1], [1, 1]], color: C.inkSoft, dash: "4 4" }]}
            dots={[{ x: Ha, y: E, color: C.ink, fill: C.copper }]}
          />
          <div>
            <P>
              {t(
                "Ha가 크면 tanh(Ha) → 1이므로 N_A = c_A0 √(D_AB k₁)입니다. 막 두께 δ가 식에서 사라집니다. A가 막 깊숙이 들어가기 전에 반응으로 사라지기 때문입니다. 이때 물질전달계수는 k_c = √(D k₁)로, D의 0.5제곱에 비례합니다.",
                "For large Ha, tanh(Ha) → 1 and N_A = c_A0 √(D_AB k₁). The film thickness δ drops out, because A reacts before it penetrates far into the film. The mass-transfer coefficient becomes k_c = √(D k₁), proportional to D to the power 0.5."
              )}
            </P>
            <Table
              head={[t("모델", "Model"), "k_c", t("D 의존성", "D dependence")]}
              rows={[
                [t("막 모델 (반응 없음)", "Film model (no reaction)"), "D/δ", "D¹"],
                [t("빠른 반응 액막", "Film with fast reaction"), "√(Dk₁)", "D^½"],
                [t("침투 이론 (Higbie)", "Penetration theory (Higbie)"), "2√(D/(πt_c))", "D^½"],
                [t("층류 경계층", "Laminar boundary layer"), "∝ D^⅔ (Sc^⅓)", "D^⅔"],
              ]}
            />
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("사례: NaOH 수용액의 CO₂ 흡수", "Case: CO₂ absorption into aqueous NaOH")}>
        <P>
          {t(
            "CO₂ + OH⁻ → HCO₃⁻의 2차 속도상수는 25 °C에서 약 8.5×10³ L/(mol·s)입니다(Pinsent, Pearson, Roughton, 1956). OH⁻가 과량이면 k₁ = k₂[OH⁻]인 유사 1차 반응으로 볼 수 있습니다.",
            "The second-order rate constant of CO₂ + OH⁻ → HCO₃⁻ is about 8.5×10³ L/(mol·s) at 25 °C (Pinsent, Pearson and Roughton, 1956). With OH⁻ in excess, the reaction is pseudo-first-order with k₁ = k₂[OH⁻]."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label="[OH⁻]" value={OH} min={0.001} max={2} step={0.001} onChange={setOH} unit=" mol/L" />
            <Slider label={t("액막 두께 δ", "Liquid film thickness δ")} value={dum} min={10} max={200} step={5} onChange={setDum} unit=" μm" />
          </div>
          <Readout>
            k₁ = k₂[OH⁻] = {sci(k1, 3)} s⁻¹, &nbsp;D_CO₂ = 1.9×10⁻⁹ m²/s<br />
            Ha = {HaC.toFixed(2)} → E = <b>{EC.toFixed(1)}</b><br />
            k_c,{t("물리", "phys")} = D/δ = {sci(DCO2 / delta, 3)} m/s, &nbsp;k_c,{t("반응", "rxn")} = E·D/δ = {sci((EC * DCO2) / delta, 3)} m/s
          </Readout>
        </Grid2>
        <Note>
          {t(
            "[OH⁻]가 0.1 mol/L만 되어도 Ha는 수십이 됩니다. 흡수 속도가 물리 흡수보다 수십 배 빨라지고, 막 두께(즉 교반 정도)에 거의 무관해집니다. 이 성질 덕분에 NaOH 흡수는 충전탑의 유효 계면적을 측정하는 표준 방법으로 쓰입니다. 단, 매우 빠른 흡수에서는 계면 근처 OH⁻가 고갈되어 유사 1차 가정이 깨질 수 있습니다.",
            "Even 0.1 mol/L OH⁻ gives Ha of several tens. Absorption becomes tens of times faster than physical absorption and nearly independent of the film thickness (that is, of agitation). That property makes NaOH absorption a standard method for measuring the effective interfacial area of packed columns. For very fast absorption, however, OH⁻ can be depleted near the interface and the pseudo-first-order assumption breaks down."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: CVD — Grove model, step coverage, ALD ---------------------------------- */
function groveRate(T, Ea, ks0, hg0) {
  const ks = ks0 * Math.exp(-Ea / (KB_EV * T));      // cm/s
  const hg = hg0 * Math.pow(T / 1000, 1.75);           // cm/s
  return { ks, hg, keff: (ks * hg) / (ks + hg) };
}

function TabCVD({ t }) {
  const [Ea, setEa] = useState(1.9);
  const [lks0, setLks0] = useState(9);
  const [hg0, setHg0] = useState(5);
  const [Tc, setTc] = useState(700);
  const [y, setY] = useState(0.01);
  const N = 5.0e22;                         // atoms/cm³ in a Si film
  const ks0 = Math.pow(10, lks0);
  const T = Tc + 273.15;
  const cg = (y * ATM) / (1.380649e-23 * T) * 1e-6;   // molecules/cm³
  const g = groveRate(T, Ea, ks0, hg0);
  const G = (g.keff * cg) / N;                          // cm/s
  const reg = g.ks < 0.1 * g.hg ? t("반응 지배", "reaction-limited") : g.ks > 10 * g.hg ? t("물질전달 지배", "mass-transport-limited") : t("혼합", "mixed");
  const arr = [], ksL = [], hgL = [];
  for (let i = 0; i <= 160; i++) {
    const x = 0.6 + (i / 160) * 0.9;                    // 1000/T
    const TT = 1000 / x;
    const q = groveRate(TT, Ea, ks0, hg0);
    arr.push([x, (q.keff * ((y * ATM) / (1.380649e-23 * TT) * 1e-6)) / N * 1e7 * 60]);   // nm/min
    ksL.push([x, (q.ks * ((y * ATM) / (1.380649e-23 * TT) * 1e-6)) / N * 1e7 * 60]);
    hgL.push([x, (q.hg * ((y * ATM) / (1.380649e-23 * TT) * 1e-6)) / N * 1e7 * 60]);
  }
  /* step coverage (fin analogy) */
  const [AR, setAR] = useState(5);
  const [ls, setLs] = useState(-2);
  const s = Math.pow(10, ls);
  const Phi = AR * Math.sqrt(1.5 * s);
  const cov = 1 / Math.cosh(Phi);
  const covCurve = Array.from({ length: 101 }, (_, i) => { const z = i / 100; return [z, Math.cosh(Phi * (1 - z)) / Math.cosh(Phi)]; });
  /* ALD saturation */
  const [dose, setDose] = useState(1.5);
  const sat = 1 - Math.exp(-dose);
  return (
    <div>
      <Panel title={t("CVD 성장 속도: Grove 모델", "CVD growth rate: the Grove model")}>
        <P>
          {t(
            "CVD에서 반응 기체는 두 단계를 거칩니다. 먼저 기상 경계층을 지나 표면에 도달합니다(F₁ = h_g(C_g − C_s)). 그 다음 표면에서 반응합니다(F₂ = k_s C_s). 정상상태에서는 F₁ = F₂이므로 C_s를 소거할 수 있습니다. 두 저항이 직렬로 연결된 구조이며, 탄소 입자의 Da 문제와 같은 수학입니다.",
            "In CVD the precursor goes through two steps. It first crosses the gas boundary layer to the surface (F₁ = h_g(C_g − C_s)). It then reacts on the surface (F₂ = k_s C_s). At steady state F₁ = F₂, so C_s can be eliminated. The two resistances act in series, exactly the same mathematics as the Da problem for the carbon particle."
          )}
        </P>
        <Eq block>C_s = C_g/(1 + k_s/h_g), &nbsp;&nbsp; G = F/N = (k_s h_g/(k_s + h_g)) · C_g/N</Eq>
        <P>
          {t(
            "k_s = k_s0 exp(−E_a/kT)는 온도에 지수적으로 민감합니다. h_g ≈ D/δ는 D ∝ T^1.5–2 정도로만 변합니다. 그래서 저온에서는 k_s ≪ h_g인 반응 지배가 되어 Arrhenius 직선이 나옵니다. 고온에서는 k_s ≫ h_g인 물질전달 지배가 되어 곡선이 거의 평평해집니다.",
            "k_s = k_s0 exp(−E_a/kT) is exponentially sensitive to temperature, while h_g ≈ D/δ changes only as D ∝ T^1.5–2. At low temperature k_s ≪ h_g and the process is reaction-limited, giving an Arrhenius line. At high temperature k_s ≫ h_g, the process is mass-transport-limited, and the curve flattens."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("활성화 에너지 E_a", "Activation energy E_a")} value={Ea} min={1.0} max={2.5} step={0.05} onChange={setEa} unit=" eV" />
            <Slider label="log₁₀ k_s0 (cm/s)" value={lks0} min={6} max={12} step={0.1} onChange={setLks0} fmt={(v) => v.toFixed(1)} />
            <Slider label={t("h_g (1000 K 기준)", "h_g at 1000 K")} value={hg0} min={0.5} max={20} step={0.5} onChange={setHg0} unit=" cm/s" />
            <Slider label={t("기판 온도", "Substrate temperature")} value={Tc} min={400} max={1300} step={10} onChange={setTc} unit=" °C" />
            <Slider label={t("전구체 몰분율 y", "Precursor mole fraction y")} value={y} min={0.001} max={0.05} step={0.001} onChange={setY} />
            <Readout>
              k_s = {sci(g.ks, 3)} cm/s, &nbsp;h_g = {sci(g.hg, 3)} cm/s → <b>{reg}</b><br />
              C_s/C_g = {(1 / (1 + g.ks / g.hg)).toFixed(3)}<br />
              G = {sci(G * 1e7 * 60, 3)} nm/min
            </Readout>
          </div>
          <Chart
            W={440} H={310} xr={[0.6, 1.5]} yr={[1e-3, 1e5]} ylog
            xl="1000 / T  (K⁻¹)" yl={t("성장 속도 (nm/min)", "growth rate (nm/min)")}
            series={[{ pts: ksL, color: C.good, dash: "6 4" }, { pts: hgL, color: C.cool, dash: "6 4" }, { pts: arr, color: C.copper, width: 2.8 }]}
            vlines={[{ x: 1000 / T, color: C.ink }]}
            legendAt="bl" legend={[{ label: "G (Grove)", color: C.copper }, { label: t("k_s 한계 (반응)", "k_s limit (reaction)"), color: C.good, dash: "6 4" }, { label: t("h_g 한계 (전달)", "h_g limit (transport)"), color: C.cool, dash: "6 4" }]}
          />
        </Grid2>
        <Note>
          {t(
            "상수는 개념 설명용 예시값입니다(E_a는 강의의 1.9 eV). 공정 설계의 교훈은 분명합니다. LPCVD 노(furnace)는 반응 지배 영역에서 운전합니다. 그러면 성장 속도가 기체 흐름과 웨이퍼 위치에 둔감해서 웨이퍼 수백 장을 촘촘히 세워도 균일합니다. 대신 온도는 ±1 °C 이내로 관리해야 합니다. 에피 성장 같은 고온 공정은 물질전달 지배라서 온도에는 둔감하지만, 유동과 반응기 형상이 균일도를 좌우합니다.",
            "The constants are illustrative (E_a is the lecture's 1.9 eV). The design lesson is clear. LPCVD furnaces run in the reaction-limited regime, where the rate is insensitive to gas flow and wafer position, so hundreds of closely stacked wafers come out uniform. The price is temperature control within about ±1 °C. High-temperature processes such as epitaxy are transport-limited: insensitive to temperature, but flow and reactor geometry decide the uniformity."
          )}
        </Note>
      </Panel>

      <Panel title={t("단차 피복성: 트렌치 속 확산과 반응", "Step coverage: diffusion and reaction inside a trench")}>
        <P>
          {t(
            "폭 w, 깊이 L인 트렌치를 핀(fin)처럼 생각합니다. 저압에서는 분자가 벽과 주로 충돌하므로 Knudsen 확산 D_K = w v̄/3을 씁니다. 벽에 부딪힌 분자 중 비율 s(부착 계수)가 반응합니다. 두 벽의 반응 플럭스 2 × s v̄ c/4를 껍질 수지에 넣으면 핀 방정식과 같은 꼴이 됩니다.",
            "Treat a trench of width w and depth L like a fin. At low pressure molecules mostly hit the walls, so use Knudsen diffusion D_K = w v̄/3. A fraction s (the sticking coefficient) of wall collisions reacts. Putting the wall reaction flux 2 × s v̄ c/4 into the shell balance gives the fin equation."
          )}
        </P>
        <Eq block>D_K w d²c/dz² = 2 (s v̄/4) c &nbsp;⇒&nbsp; d²c/dz² = (3s/(2w²)) c, &nbsp;&nbsp; Φ = (L/w)√(1.5 s), &nbsp; c_bottom/c_top = 1/cosh Φ</Eq>
        <Grid2>
          <div>
            <Slider label={t("종횡비 L/w", "Aspect ratio L/w")} value={AR} min={1} max={50} step={1} onChange={setAR} />
            <Slider label={t("부착 계수 s", "Sticking coefficient s")} value={ls} min={-5} max={0} step={0.05} onChange={setLs} fmt={(v) => sci(Math.pow(10, v), 2)} />
            <Readout>
              Φ = {Phi.toFixed(3)} → {t("바닥/입구 성장 비", "bottom/top growth ratio")} = <b>{(cov * 100).toFixed(1)}%</b>
            </Readout>
            <Note>
              {t(
                "이 식은 정성적인 모형입니다(입구 근처 시야각 효과와 막 성장에 따른 형상 변화를 무시합니다). 그래도 핵심은 보여 줍니다. 부착 계수가 매우 작은 전구체(TEOS LPCVD처럼 s ≪ 1)는 깊은 트렌치도 고르게 덮습니다. s가 큰 PVD 원자나 반응성 라디칼은 입구에 몰려 쌓이고 결국 입구가 막혀 공극(void)이 생깁니다.",
                "This is a qualitative model (it ignores view-factor effects near the opening and the change of shape as the film grows). It still captures the key point. Precursors with a very small sticking coefficient (s ≪ 1, as in TEOS LPCVD) coat deep trenches evenly. PVD atoms or reactive radicals with large s pile up at the opening, eventually pinch it off, and leave a void."
              )}
            </Note>
          </div>
          <Chart
            W={440} H={280} xr={[0, 1]} yr={[0, 1.05]}
            xl={t("트렌치 깊이 z/L (0 = 입구)", "trench depth z/L (0 = opening)")} yl={t("국부 성장 / 입구 성장", "local growth / growth at top")}
            series={[{ pts: covCurve, color: C.copper, width: 2.8 }]}
          />
        </Grid2>
      </Panel>

      <Panel title={t("ALD: 자기 제한 반응으로 피복성 문제를 우회", "ALD: sidestepping coverage with self-limiting reactions")}>
        <Grid2>
          <div>
            <P>
              {t(
                "원자층 증착(ALD)은 전구체 A 펄스 → 퍼지 → 반응물 B 펄스 → 퍼지를 반복합니다. 각 펄스는 표면 자리(site)가 다 차면 멈춥니다. 따라서 트렌치 바닥까지 전구체가 도달할 시간만 주면, 입구가 먼저 포화되고 기다리는 동안 바닥도 포화됩니다. 확산 지배를 '시간'으로 해결하는 방식입니다.",
                "Atomic layer deposition (ALD) cycles precursor A pulse → purge → reactant B pulse → purge. Each pulse stops once the surface sites are filled. Given enough time for the precursor to reach the trench bottom, the top saturates first and the bottom catches up while it waits. ALD trades time for conformality."
              )}
            </P>
            <Slider label={t("무차원 노출량 (dose/포화 dose)", "Dimensionless exposure (dose/saturation dose)")} value={dose} min={0} max={6} step={0.1} onChange={setDose} />
            <Readout>{t("표면 피복률", "Surface coverage")} θ = 1 − exp(−dose) = <b>{(sat * 100).toFixed(1)}%</b></Readout>
          </div>
          <Table
            head={[t("방법", "Method"), t("대표 온도", "Typical T"), t("지배 단계", "Controlling step"), t("피복성", "Conformality")]}
            rows={[
              ["APCVD", "350–1200 °C", t("물질전달", "transport"), t("낮음–보통", "low–moderate")],
              ["LPCVD", "550–900 °C", t("표면 반응", "surface reaction"), t("우수", "good")],
              ["PECVD", "200–400 °C", t("플라즈마 라디칼", "plasma radicals"), t("보통", "moderate")],
              ["PVD (sputter)", t("상온–400 °C", "RT–400 °C"), t("직진 비행 (s ≈ 1)", "line of sight (s ≈ 1)"), t("낮음", "poor")],
              ["ALD", "100–350 °C", t("자기 제한 흡착", "self-limiting adsorption"), t("거의 100%", "near 100%")],
            ]}
          />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: Dopant diffusion & implantation ---------------------------------- */
const DOP = {
  P: { D0: 8e-8, Ea: 2.74, kr: "인 (P, n형)", en: "Phosphorus (P, n-type)" },
  B: { D0: 6e-6, Ea: 3.12, kr: "붕소 (B, p형)", en: "Boron (B, p-type)" },
};
const dopD = (k, TC) => DOP[k].D0 * Math.exp(-DOP[k].Ea / (KB_EV * (TC + 273.15))) * 1e4; // cm²/s

function TabDopant({ t }) {
  const [dop, setDop] = useState("B");
  const [T1, setT1] = useState(950);
  const [t1, setT1t] = useState(30);       // min
  const [T2, setT2] = useState(1100);
  const [t2, setT2t] = useState(60);       // min
  const [lCs, setLCs] = useState(20);
  const [lCB, setLCB] = useState(15.5);
  const Cs = Math.pow(10, lCs), CB = Math.pow(10, lCB);
  const D1 = dopD(dop, T1), D2 = dopD(dop, T2);
  const L1 = Math.sqrt(D1 * t1 * 60), L2 = Math.sqrt(D2 * t2 * 60);    // cm
  const Q = (2 * Cs * L1) / Math.sqrt(Math.PI);                        // cm⁻²
  const pre = (x) => Cs * erfc(x / (2 * L1));
  const drv = (x) => (Q / (Math.sqrt(Math.PI) * L2)) * Math.exp(-(x * x) / (4 * L2 * L2));
  const xj = (f) => { let lo = 0, hi = 1e-2; if (f(0) <= CB) return 0; for (let k = 0; k < 80; k++) { const m = 0.5 * (lo + hi); if (f(m) > CB) lo = m; else hi = m; } return lo; };
  const xj1 = xj(pre), xj2 = xj(drv);
  const xmax = Math.max(xj2, xj1) * 1.6 * 1e4 || 1;
  const sPre = [], sDrv = [];
  for (let i = 0; i <= 200; i++) {
    const xu = (i / 200) * xmax, x = xu * 1e-4;
    sPre.push([xu, pre(x)]); sDrv.push([xu, drv(x)]);
  }
  /* Arrhenius of D */
  const arrP = [], arrB = [];
  for (let i = 0; i <= 80; i++) {
    const TC = 800 + (i / 80) * 450;
    arrP.push([TC, dopD("P", TC)]); arrB.push([TC, dopD("B", TC)]);
  }
  /* implantation */
  const [Rp, setRp] = useState(0.1);       // μm
  const [dRp, setDRp] = useState(0.035);   // μm
  const [lQi, setLQi] = useState(14);
  const [Ta, setTa] = useState(0);         // anneal Dt (μm²) as slider in 1e-4 μm²
  const Qi = Math.pow(10, lQi);
  const sig2 = dRp * dRp + 2 * Ta * 1e-4;  // μm²
  const imp = [];
  for (let i = 0; i <= 200; i++) {
    const xu = (i / 200) * 0.5;
    imp.push([xu, (Qi / (Math.sqrt(2 * Math.PI * sig2) * 1e-4)) * Math.exp(-((xu - Rp) * (xu - Rp)) / (2 * sig2))]);
  }
  return (
    <div>
      <Panel title={t("Si 속 도펀트 확산: 고체 확산의 응용", "Dopant diffusion in Si: solid-state diffusion at work")}>
        <P>
          {t(
            "트랜지스터의 p–n 접합은 Si에 B나 P를 확산시켜 만듭니다. Si 결정 속 확산계수는 Arrhenius 식을 따릅니다. 강의 값을 쓰면 1000 °C에서 D ≈ 10⁻¹⁴ cm²/s 수준입니다. 그래서 1시간 확산해도 √(Dt) ≈ 0.06 μm 정도만 들어갑니다.",
            "The p–n junctions of transistors are made by diffusing B or P into Si. Diffusivities in the Si crystal follow Arrhenius laws. With the lecture values, D ≈ 10⁻¹⁴ cm²/s at 1000 °C, so an hour of diffusion reaches only √(Dt) ≈ 0.06 μm."
          )}
        </P>
        <Eq block>D_P = 8×10⁻⁸ exp(−2.74 eV/kT) m²/s, &nbsp;&nbsp; D_B = 6×10⁻⁶ exp(−3.12 eV/kT) m²/s &nbsp;&nbsp;({t("강의 값", "lecture values")})</Eq>
        <Chart
          W={600} H={260} xr={[800, 1250]} yr={[1e-17, 1e-11]} ylog
          xl="T (°C)" yl="D (cm²/s)"
          series={[{ pts: arrP, color: C.cool, width: 2.4 }, { pts: arrB, color: C.copper, width: 2.4 }]}
          legend={[{ label: "P", color: C.cool }, { label: "B", color: C.copper }]}
        />
        <P>
          {t(
            "공정은 보통 두 단계입니다. (1) 선증착(predeposition): 표면 농도를 고용한계 C_s로 고정하고 짧게 확산합니다. 반무한 고체의 Fick 2법칙 해는 erfc입니다(4주차 열전도와 같은 해). (2) 드라이브인(drive-in): 표면 공급을 끊고(∂C/∂x = 0) 고온에서 오래 확산합니다. 총량 Q가 보존되므로 해는 Gaussian입니다.",
            "The process usually has two steps. (1) Predeposition: hold the surface at the solid solubility C_s and diffuse briefly; the Fick's-second-law solution for a semi-infinite solid is erfc (the same as transient conduction in Week 4). (2) Drive-in: cut the supply (∂C/∂x = 0) and diffuse longer at high temperature; the dose Q is conserved and the solution is Gaussian."
          )}
        </P>
        <Eq block>C₁ = C_s erfc(x/(2√(D₁t₁))), &nbsp; Q = 2C_s√(D₁t₁/π) &nbsp;&nbsp;→&nbsp;&nbsp; C₂ = (Q/√(πD₂t₂)) exp(−x²/(4D₂t₂))</Eq>
        <Grid2>
          <div>
            <Seg value={dop} onChange={setDop} options={Object.keys(DOP).map((k) => ({ v: k, label: t(DOP[k].kr, DOP[k].en) }))} />
            <Slider label={t("선증착 온도", "Predeposition T")} value={T1} min={850} max={1100} step={5} onChange={setT1} unit=" °C" />
            <Slider label={t("선증착 시간", "Predeposition time")} value={t1} min={5} max={120} step={5} onChange={setT1t} unit=" min" />
            <Slider label={t("드라이브인 온도", "Drive-in T")} value={T2} min={950} max={1200} step={5} onChange={setT2} unit=" °C" />
            <Slider label={t("드라이브인 시간", "Drive-in time")} value={t2} min={10} max={600} step={10} onChange={setT2t} unit=" min" />
            <Slider label={t("표면 농도 C_s", "Surface concentration C_s")} value={lCs} min={18} max={21} step={0.1} onChange={setLCs} fmt={(v) => sci(Math.pow(10, v), 1)} unit=" cm⁻³" />
            <Slider label={t("기판 농도 C_B", "Background C_B")} value={lCB} min={14} max={17.5} step={0.1} onChange={setLCB} fmt={(v) => sci(Math.pow(10, v), 1)} unit=" cm⁻³" />
            <Readout>
              D₁ = {sci(D1, 2)}, D₂ = {sci(D2, 2)} cm²/s<br />
              Q = {sci(Q, 3)} cm⁻²<br />
              x_j ({t("선증착 후", "after predep")}) = {(xj1 * 1e4).toFixed(3)} μm<br />
              x_j ({t("드라이브인 후", "after drive-in")}) = <b>{(xj2 * 1e4).toFixed(3)} μm</b>
            </Readout>
          </div>
          <Chart
            W={440} H={340} xr={[0, xmax]} yr={[Math.min(CB / 10, 1e14), Cs * 3]} ylog
            xl={t("깊이 x (μm)", "depth x (μm)")} yl="C (cm⁻³)"
            series={[{ pts: sPre, color: C.cool, dash: "6 4", width: 2.2 }, { pts: sDrv, color: C.copper, width: 2.8 }]}
            hlines={[{ y: CB, color: C.warn }]}
            vlines={[{ x: xj2 * 1e4, color: C.copperDeep, dash: "2 3" }]}
            legend={[{ label: t("선증착 (erfc)", "predep (erfc)"), color: C.cool, dash: "6 4" }, { label: t("드라이브인 (Gaussian)", "drive-in (Gaussian)"), color: C.copper }, { label: "C_B", color: C.warn, dash: "4 4" }]}
          />
        </Grid2>
        <Note>
          {t(
            "접합 깊이 x_j는 도펀트 농도가 기판 농도와 같아지는 깊이입니다. 드라이브인 온도를 50 °C 올리면 D가 약 2배 이상 커져 x_j가 크게 깊어집니다. 고농도에서는 D가 농도에 따라 커지고(전하 공공 효과), 산화 중에는 확산이 빨라지는 효과(OED)도 있어 실제 프로파일은 이 단순 해에서 벗어납니다.",
            "The junction depth x_j is where the dopant concentration equals the background. Raising the drive-in temperature by 50 °C more than doubles D and deepens x_j markedly. At high concentration D grows with concentration (charged-vacancy effects), and oxidation enhances diffusion (OED), so real profiles depart from these simple solutions."
          )}
        </Note>
      </Panel>

      <Panel title={t("이온 주입: 확산 없이 넣고, 열처리로 퍼뜨리기", "Ion implantation: insert without diffusion, then anneal")}>
        <P>
          {t(
            "현대 공정은 대부분 이온 주입으로 도펀트를 넣습니다. 가속된 이온은 투사 비정 R_p 근처에서 멈추고, 분포는 표준편차 ΔR_p의 Gaussian에 가깝습니다. 이후 결정 손상 회복을 위한 열처리에서 확산이 일어납니다. 확산은 Gaussian의 분산을 2Dt만큼 넓힙니다.",
            "Modern processes mostly introduce dopants by ion implantation. Accelerated ions stop near the projected range R_p, and the distribution is close to a Gaussian with standard deviation ΔR_p. The anneal that repairs crystal damage then causes diffusion, which widens the Gaussian variance by 2Dt."
          )}
        </P>
        <Eq block>C(x) = (Q/(√(2π) σ)) exp(−(x − R_p)²/(2σ²)), &nbsp;&nbsp; σ² = ΔR_p² + 2Dt</Eq>
        <Grid2>
          <div>
            <Slider label={t("투사 비정 R_p", "Projected range R_p")} value={Rp} min={0.02} max={0.3} step={0.005} onChange={setRp} unit=" μm" />
            <Slider label={t("비정 산포 ΔR_p", "Range straggle ΔR_p")} value={dRp} min={0.005} max={0.1} step={0.001} onChange={setDRp} unit=" μm" />
            <Slider label={t("주입량 Q", "Dose Q")} value={lQi} min={12} max={16} step={0.1} onChange={setLQi} fmt={(v) => sci(Math.pow(10, v), 1)} unit=" cm⁻²" />
            <Slider label={t("열처리 Dt", "Anneal Dt")} value={Ta} min={0} max={50} step={0.5} onChange={setTa} fmt={(v) => sci(v * 1e-4, 1)} unit=" μm²" />
            <Readout>{t("최대 농도", "Peak concentration")} = {sci(Qi / (Math.sqrt(2 * Math.PI * sig2) * 1e-4), 3)} cm⁻³, &nbsp;σ = {(Math.sqrt(sig2) * 1000).toFixed(1)} nm</Readout>
          </div>
          <Chart
            W={440} H={300} xr={[0, 0.5]} yr={[1e15, 1e21]} ylog
            xl={t("깊이 x (μm)", "depth x (μm)")} yl="C (cm⁻³)"
            series={[{ pts: imp, color: C.violet, width: 2.6 }]}
            vlines={[{ x: Rp, color: C.inkSoft }]}
          />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: 2D Laplace in a rectangle ---------------------------------- */
function rectSeries(x, y, AR, nterms) {   // W = 1, H = AR
  let s = 0;
  for (let n = 1; n <= nterms; n += 2) {
    const a = n * Math.PI;
    const ratio = Math.exp(a * (y - AR)) * (1 - Math.exp(-2 * a * y)) / (1 - Math.exp(-2 * a * AR));
    s += (4 / (n * Math.PI)) * Math.sin(a * x) * ratio;
  }
  return s;
}

function TabLaplace({ t }) {
  const [AR, setAR] = useState(1);
  const [nt, setNt] = useState(25);
  const nx = 50, ny = Math.round(50 * AR);
  const cells = useMemo(() => {
    const out = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) / nx, y = ((j + 0.5) / ny) * AR;
      out.push([i, j, rectSeries(x, y, AR, nt)]);
    }
    return out;
  }, [AR, nt, nx, ny]);
  const Wd = 300, Hd = 300 * AR;
  const top = [1, 3, 9, nt].map((n) => Array.from({ length: 201 }, (_, i) => { const x = i / 200; return [x, rectSeries(x, AR, AR, n)]; }));
  const center = rectSeries(0.5, AR / 2, AR, 201);
  const midline = Array.from({ length: 101 }, (_, i) => { const yy = (i / 100) * AR; return [yy / AR, rectSeries(0.5, yy, AR, 201)]; });
  return (
    <div>
      <Panel title={t("2차원 정상 확산: 변수분리", "2D steady diffusion: separation of variables")}>
        <P>
          {t(
            "반응과 유동이 없는 정상 확산은 Laplace 방정식 ∇²c = 0을 따릅니다. 3주차 2차원 정상 전도와 똑같은 문제입니다. 폭 W, 높이 H인 직사각형에서 세 변은 c = 0, 위 변은 c = c₀라고 합시다.",
            "Steady diffusion without reaction or flow obeys Laplace's equation ∇²c = 0, the same problem as 2D steady conduction in Week 3. Take a rectangle of width W and height H with c = 0 on three sides and c = c₀ on the top."
          )}
        </P>
        <Eq block>c = X(x)Y(y) &nbsp;⇒&nbsp; X″/X = −Y″/Y = −λ² &nbsp;⇒&nbsp; X = sin(nπx/W), &nbsp;Y = sinh(nπy/W)</Eq>
        <Eq block>c/c₀ = Σ<sub>n odd</sub> (4/(nπ)) sin(nπx/W) · sinh(nπy/W)/sinh(nπH/W)</Eq>
        <P>
          {t(
            "계수 4/(nπ)는 위 변의 조건 1 = Σ A_n sin(nπx/W)에 sin(mπx/W)를 곱해 0부터 W까지 적분하면 나옵니다(직교성). 짝수 n의 계수는 0입니다.",
            "The coefficients 4/(nπ) follow from multiplying the top condition 1 = Σ A_n sin(nπx/W) by sin(mπx/W) and integrating from 0 to W (orthogonality). The even-n coefficients vanish."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("종횡비 H/W", "Aspect ratio H/W")} value={AR} min={0.4} max={1.6} step={0.1} onChange={setAR} />
            <Slider label={t("급수 항 수 (홀수 n ≤)", "Number of terms (odd n ≤)")} value={nt} min={1} max={101} step={2} onChange={setNt} />
            <svg viewBox={`0 0 ${Wd + 70} ${Hd + 20}`} style={{ width: "100%", maxWidth: Wd + 70, display: "block", margin: "6px auto" }}>
              {cells.map(([i, j, v]) => (
                <rect key={i + "-" + j} x={10 + (i * Wd) / nx} y={10 + Hd - ((j + 1) * Hd) / ny} width={Wd / nx + 0.4} height={Hd / ny + 0.4} fill={ramp(v)} />
              ))}
              <rect x={10} y={10} width={Wd} height={Hd} fill="none" stroke={C.ink} />
              {[0, 0.25, 0.5, 0.75, 1].map((v, k) => (
                <g key={k}>
                  <rect x={Wd + 22} y={10 + Hd - (k + 1) * (Hd / 5)} width={14} height={Hd / 5} fill={ramp(v)} />
                  <text x={Wd + 40} y={14 + Hd - k * (Hd / 5) - Hd / 10} fontSize="10.5" fill={C.inkSoft}>{v.toFixed(2)}</text>
                </g>
              ))}
            </svg>
            <Readout>c/c₀ ({t("중심", "center")}, W = H) {AR === 1 ? "= 0.2500" : `= ${center.toFixed(4)}`}</Readout>
          </div>
          <div>
            <Chart
              W={440} H={260} xr={[0, 1]} yr={[0, 1.25]}
              xl="x/W  (y = H)" yl={t("부분합", "partial sum")}
              series={top.map((s, k) => ({ pts: s, color: [C.cool, C.good, C.violet, C.copper][k], width: k === 3 ? 2.6 : 1.6 }))}
              hlines={[{ y: 1, color: C.inkSoft }]}
              legendAt="bc" legend={[1, 3, 9, nt].map((n, k) => ({ label: `n ≤ ${n}`, color: [C.cool, C.good, C.violet, C.copper][k] }))}
            />
            <Chart
              W={440} H={220} xr={[0, 1]} yr={[0, 1]}
              xl="y/H  (x = W/2)" yl="c/c₀"
              series={[{ pts: midline, color: C.copper, width: 2.4 }]}
            />
          </div>
        </Grid2>
        <Note>
          {t(
            "위 변에서 부분합은 모서리 근처에서 약 9% 넘쳤다가 출렁입니다(Gibbs 현상). 항을 늘려도 넘침의 크기는 줄지 않고 폭만 좁아집니다. 반면 내부에서는 sinh 비가 exp(−nπ(H − y)/W)처럼 빨리 줄어서 몇 항만으로 충분합니다. 정사각형의 중심값이 정확히 0.25인 이유도 생각해 보십시오. 네 변 중 한 변만 c₀인 문제 넷을 더하면 모든 변이 c₀인 문제가 되고, 그 해는 c = c₀입니다(중첩).",
            "On the top edge the partial sums overshoot by about 9% near the corners and ripple (the Gibbs phenomenon). Adding terms narrows the overshoot but does not shrink it. In the interior, however, the sinh ratio decays like exp(−nπ(H − y)/W), so a few terms suffice. Why is the center value of a square exactly 0.25? Adding four problems, each with c₀ on one side, gives the problem with c₀ on all sides, whose solution is c = c₀ (superposition)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 10: TEOS between stacked wafers ---------------------------------- */
function waferSOR(Lhat, Da, Nr = 40, Nz = 6) {
  /* dimensionless: r ∈ [0,1], z ∈ [0, L̂/2]; c = 1 at r = 1; dc/dz = 0 at z = L̂/2;
     wafer (z = 0): dc/dz = (Da/L̂) c  (Robin, from D dc/dz = k_s c with Da = k_s s / D) */
  const dr = 1 / Nr, dz = Lhat / 2 / Nz, ar = 1 / (dr * dr), az = 1 / (dz * dz), beta = (2 * dz * Da) / Lhat;
  const c = Array.from({ length: Nz + 1 }, () => Array.from({ length: Nr + 1 }, (_, i) => (i === Nr ? 1 : 0.5)));
  const omega = 1.9;
  let it = 0;
  for (it = 0; it < 60000; it++) {
    let err = 0;
    for (let j = 1; j <= Nz; j++) {
      for (let i = 0; i < Nr; i++) {
        const up = j < Nz ? c[j + 1][i] : c[j - 1][i], dn = c[j - 1][i];
        let nw;
        if (i === 0) nw = (4 * ar * c[j][1] + az * (up + dn)) / (4 * ar + 2 * az);
        else {
          const r = i * dr, w = (1 - dr / (2 * r)) * ar, e = (1 + dr / (2 * r)) * ar;
          nw = (w * c[j][i - 1] + e * c[j][i + 1] + az * (up + dn)) / (2 * ar + 2 * az);
        }
        const d = omega * (nw - c[j][i]);
        c[j][i] += d;
        if (Math.abs(d) > err) err = Math.abs(d);
      }
    }
    for (let i = 0; i < Nr; i++) {
      const nw = (4 * c[1][i] - c[2][i]) / (3 + beta);
      if (Math.abs(nw - c[0][i]) > err) err = Math.abs(nw - c[0][i]);
      c[0][i] = nw;
    }
    if (err < 1e-9) break;
  }
  return { c, it: it + 1 };
}

function TabWafer({ t }) {
  const [dmm, setDmm] = useState(200);     // wafer diameter
  const [smm, setSmm] = useState(5);       // gap
  const [Ptorr, setPtorr] = useState(0.5);
  const [TC, setTC] = useState(700);
  const R = dmm / 2000, s = smm / 1000, T = TC + 273.15;
  const D = 5.0e-6 * Math.pow(T / 298.15, 1.75) * (760 / Ptorr);   // m²/s, D(1 atm, 298 K) = 0.05 cm²/s (illustrative)
  const ks = 2.6e7 * Math.exp(-1.9 / (KB_EV * T));                  // m/s, illustrative (E_a = 1.9 eV)
  const Phi = R * Math.sqrt((2 * ks) / (D * s));
  const Da = (ks * s) / D;
  const Lhat = s / R;
  const sol = useMemo(() => waferSOR(Lhat, Da), [Lhat, Da]);
  const Nr = 40, Nz = 6;
  const fdm = sol.c[0].map((v, i) => [i / Nr, v]);
  const thin = Array.from({ length: 101 }, (_, i) => { const r = i / 100; return [r, I0(Phi * r) / I0(Phi)]; });
  const cmin = sol.c[0][0];
  const cfloor = sol.c.flat().reduce((a, b) => Math.min(a, b), 1);
  const unif = (1 - cmin) / (1 + cmin) * 100;
  /* map: r horizontal, z vertical (exaggerated) */
  const Wm = 420, Hm = 90;
  return (
    <div>
      <Panel title={t("TEOS LPCVD: 촘촘히 세운 웨이퍼 사이의 확산", "TEOS LPCVD: diffusion between closely stacked wafers")}>
        <P>
          {t(
            "LPCVD 노에서는 웨이퍼 수백 장을 간격 s로 세워 둡니다. TEOS는 웨이퍼 가장자리(r = R)에서 들어와 간격 안으로 확산하면서 두 웨이퍼 표면에서 SiO₂로 증착됩니다. 간격 안에는 유동이 거의 없으므로 원통 좌표의 Laplace 방정식을 풉니다.",
            "An LPCVD furnace stands hundreds of wafers at spacing s. TEOS enters at the wafer edge (r = R), diffuses into the gap, and deposits SiO₂ on both wafer surfaces. There is almost no flow inside the gap, so we solve Laplace's equation in cylindrical coordinates."
          )}
        </P>
        <Eq block>(1/r) ∂/∂r(r ∂c/∂r) + ∂²c/∂z² = 0; &nbsp; c(R, z) = c_A0, &nbsp; ∂c/∂r|<sub>0</sub> = 0, &nbsp; ∂c/∂z|<sub>s/2</sub> = 0, &nbsp; D ∂c/∂z|<sub>0</sub> = k_s c</Eq>
        <P>
          {t(
            "강의는 표면 반응이 매우 빠른 경우(z = 0에서 c = 0)를 풀었습니다. 여기서는 유한한 k_s를 넣습니다. 간격이 얇으면(s ≪ R) z 방향 농도가 거의 균일하므로 z로 평균할 수 있습니다. 그러면 두 웨이퍼 면의 소모가 '부피 반응'처럼 작동하고 수정 Bessel 방정식이 나옵니다.",
            "The lecture solved the fast-reaction case (c = 0 at z = 0). Here we keep a finite k_s. When the gap is thin (s ≪ R), the concentration is nearly uniform across z, so we can average over z. The consumption on the two wafer faces then acts like a volumetric sink, and a modified Bessel equation results."
          )}
        </P>
        <Eq block>(1/r) d/dr(r dc̄/dr) = (2k_s/(D s)) c̄ &nbsp;⇒&nbsp; c̄/c_A0 = I₀(Φ r/R)/I₀(Φ), &nbsp;&nbsp; Φ = R √(2k_s/(D s))</Eq>
        <Grid2>
          <div>
            <Slider label={t("웨이퍼 지름", "Wafer diameter")} value={dmm} min={100} max={450} step={50} onChange={setDmm} unit=" mm" />
            <Slider label={t("웨이퍼 간격 s", "Wafer spacing s")} value={smm} min={2} max={20} step={0.5} onChange={setSmm} unit=" mm" />
            <Slider label={t("압력", "Pressure")} value={Ptorr} min={0.1} max={10} step={0.1} onChange={setPtorr} unit=" Torr" />
            <Slider label={t("온도", "Temperature")} value={TC} min={620} max={800} step={5} onChange={setTC} unit=" °C" />
            <Readout>
              D_TEOS ≈ {sci(D, 3)} m²/s ({t("∝ T^1.75/P", "∝ T^1.75/P")}), &nbsp;k_s = {sci(ks, 3)} m/s<br />
              Da = k_s s/D = {sci(Da, 3)}, &nbsp;Φ = <b>{Phi.toFixed(3)}</b><br />
              {t("중심/가장자리 증착 비", "Center/edge deposition ratio")}: FDM {cmin.toFixed(4)} · {t("얇은 간격 근사", "thin-gap")} {(1 / I0(Phi)).toFixed(4)}<br />
              {t("두께 불균일도", "Non-uniformity")} (max − min)/(max + min) = <b>{unif.toFixed(2)}%</b>
            </Readout>
          </div>
          <div>
            <Chart
              W={440} H={270} xr={[0, 1]} yr={[Math.max(0, Math.floor((cmin - 0.05) * 10) / 10), 1.02]}
              xl="r / R" yl={t("웨이퍼 위 c / c_A0 (∝ 증착 속도)", "c / c_A0 on the wafer (∝ deposition rate)")}
              series={[{ pts: thin, color: C.cool, dash: "6 4", width: 2.2 }, { pts: fdm, color: C.copper, width: 2.8 }]}
              legendAt="br" legend={[{ label: t("2D 유한차분 (SOR)", "2D finite difference (SOR)"), color: C.copper }, { label: "I₀(Φr/R)/I₀(Φ)", color: C.cool, dash: "6 4" }]}
            />
            <svg viewBox={`0 0 ${Wm + 20} ${Hm + 34}`} style={{ width: "100%", maxWidth: Wm + 20, display: "block", margin: "0 auto" }}>
              {sol.c.map((row, j) => row.map((v, i) => (
                <rect key={j + "-" + i} x={10 + (i * Wm) / (Nr + 1)} y={10 + Hm - ((j + 1) * Hm) / (Nz + 1)} width={Wm / (Nr + 1) + 0.5} height={Hm / (Nz + 1) + 0.5} fill={ramp((v - cfloor) / Math.max(1e-6, 1 - cfloor))} />
              )))}
              <rect x={10} y={10 + Hm} width={Wm} height={4} fill={C.ink} />
              <text x={10} y={Hm + 30} fontSize="11" fill={C.inkSoft}>r = 0 ({t("중심", "center")})</text>
              <text x={Wm + 10} y={Hm + 30} fontSize="11" fill={C.inkSoft} textAnchor="end">r = R ({t("가장자리", "edge")})</text>
              <text x={14} y={22} fontSize="10.5" fill={C.inkSoft}>z = s/2 ({t("대칭면", "mid-plane")})</text>
            </svg>
            <div style={{ fontSize: 12, color: C.inkSoft, textAlign: "center" }}>{t("간격 안 농도 c(r, z), 색 범위", "Gap concentration c(r, z), color range")} {sol.c.flat().reduce((a, b) => Math.min(a, b), 1).toFixed(3)}–1 ({t("z 방향 확대, SOR 반복", "z exaggerated, SOR iterations")} {sol.it})</div>
          </div>
        </Grid2>
        <Note>
          {t(
            "D와 k_s는 경향을 보이기 위한 예시값입니다(k_s의 E_a는 강의의 1.9 eV). 균일도의 지배 변수는 Φ 하나입니다. Φ < 0.5 정도면 불균일도가 3% 안쪽입니다. 온도를 올리면 k_s가 지수적으로 커져 Φ가 커집니다. 압력을 올리면 D가 1/P로 작아져 역시 Φ가 커집니다. 그래서 LPCVD는 '저압·저온(반응 지배)'에서 웨이퍼를 촘촘히 세워 처리량과 균일도를 함께 얻습니다. 큰 웨이퍼로 갈수록 R이 커지므로 Φ ∝ R을 유지하려면 간격을 넓혀야 합니다.",
            "D and k_s are illustrative values chosen to show the trends (E_a of k_s is the lecture's 1.9 eV). A single number, Φ, controls uniformity: below about Φ = 0.5 the non-uniformity stays within 3%. Raising T increases k_s exponentially and therefore Φ. Raising P lowers D as 1/P and also increases Φ. That is why LPCVD runs at low pressure and low temperature (reaction-limited) with closely stacked wafers, getting throughput and uniformity together. Larger wafers raise R, so keeping Φ ∝ R fixed requires a wider spacing."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 11: Simultaneous heat & mass transfer (condensation) ---------------------------------- */
function churchillChu(Ra, Pr) {
  return 0.68 + (0.670 * Math.pow(Ra, 0.25)) / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 4 / 9);
}
function condense(T1C, T3C, hliq, Lp, yB1min = 1e-3) {
  const P = ATM, g = 9.81, MA = 18.015e-3, MB = 28.97e-3;
  const yA1 = Math.min(1 - yB1min, psatPa("water", T1C) / P);       // saturated vapor–air mixture
  const T1 = T1C + 273.15;
  const lam = (TC) => 2.501e6 - 2370 * TC;                           // J/kg
  const resid = (T2C) => {
    const T2 = T2C + 273.15, Tf = 0.5 * (T1 + T2);
    const yA2 = Math.min(0.999, psatPa("water", T2C) / P);
    const nu = 1.6e-5 * Math.pow(Tf / 300, 1.75), kg = 0.0263 * Math.pow(Tf / 300, 0.8), Pr = 0.71;
    const D = fullerAir("water", Tf), Sc = nu / D;
    const rho1 = (P * (yA1 * MA + (1 - yA1) * MB)) / (RG * T1), rho2 = (P * (yA2 * MA + (1 - yA2) * MB)) / (RG * T2);
    const Gr = (g * Math.abs(rho2 - rho1) / (0.5 * (rho1 + rho2)) * Lp * Lp * Lp) / (nu * nu);
    const hc = (kg / Lp) * churchillChu(Gr * Pr, Pr);
    const kc = (D / Lp) * churchillChu(Gr * Sc, Sc);
    const c = P / (RG * Tf);
    const NA = kc * c * Math.log((1 - yA2) / (1 - yA1));             // toward the wall (+)
    const qs = hc * (T1C - T2C), ql = NA * MA * (lam(T2C) + 1900 * (T1C - T2C));
    return { f: hliq * (T2C - T3C) - qs - ql, NA, qs, ql, hc, kc, yA2, Gr };
  };
  let lo = T3C, hi = T1C;
  for (let k = 0; k < 80; k++) {
    const m = 0.5 * (lo + hi);
    if (resid(m).f > 0) hi = m; else lo = m;
  }
  const T2C = 0.5 * (lo + hi);
  return { T2C, yA1, ...resid(T2C) };
}

function TabCondense({ t }) {
  const [T1, setT1] = useState(80);
  const [T3, setT3] = useState(30);
  const [hl, setHl] = useState(5000);
  const [Lp, setLp] = useState(0.3);
  const r = condense(T1, T3, hl, Lp);
  const qtot = r.qs + r.ql;
  const sweep = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 60; i++) {
      const TT = 99.96 - 59.96 * Math.pow(1 - i / 60, 3);
      const q = condense(TT, T3, hl, Lp);
      out.push([1 - q.yA1, q.qs + q.ql, q.T2C]);
    }
    return out;
  }, [T3, hl, Lp]);
  const qmax = Math.max(...sweep.map((p) => p[1]));
  return (
    <div>
      <Panel title={t("열과 물질의 동시 전달: 비응축 기체가 있는 응축", "Simultaneous heat and mass transfer: condensation with a noncondensable gas")}>
        <P>
          {t(
            "수증기(A)와 공기(B)의 혼합물이 차가운 수직 벽에서 응축합니다. 수증기는 기체 경계층을 지나 응축막 표면(온도 T₂)에 도달해야 합니다. 공기는 응축하지 않으므로 표면에 쌓여 '공기 담요'를 만듭니다. 그래서 정체된 B를 통과하는 확산, 즉 Stefan 문제가 됩니다.",
            "A mixture of steam (A) and air (B) condenses on a cold vertical wall. The vapor must cross the gas boundary layer to reach the condensate surface at temperature T₂. The air does not condense, so it accumulates at the surface as an 'air blanket'. The problem becomes diffusion through stagnant B, the Stefan problem again."
          )}
        </P>
        <Eq block>N_A = k_c c ln[(1 − y_A2)/(1 − y_A1)], &nbsp;&nbsp; y_A2 = p_A*(T₂)/P &nbsp;({t("Raoult, 계면 포화", "Raoult, interface saturated")})</Eq>
        <Eq block>q = −k∇T + Σ N_i H_i &nbsp;⇒&nbsp; h_liq (T₂ − T₃) = h_c (T₁ − T₂) + N_A M_A (H_A,1 − H_A,2)</Eq>
        <P>
          {t(
            "응축막과 벽을 지나가는 열(왼쪽)은 기체의 현열(오른쪽 첫 항)과 응축 잠열(둘째 항)의 합입니다. h_c와 k_c는 자연대류 상관식(Churchill–Chu)과 열–물질 유사성(Pr → Sc)으로 구합니다. T₂는 미지수이고 y_A2와 N_A가 모두 T₂에 의존합니다. 그래서 계면 에너지 수지를 T₂에 대해 반복(이분법)으로 풉니다.",
            "The heat passing through the condensate and the wall (left) equals the sensible heat from the gas (first term on the right) plus the latent heat of condensation (second term). h_c and k_c come from the natural-convection correlation (Churchill–Chu) and the heat–mass analogy (Pr → Sc). T₂ is unknown, and both y_A2 and N_A depend on it, so the interface energy balance is solved iteratively for T₂ (bisection)."
          )}
        </P>
        <Eq block>Nu = 0.68 + 0.670 Ra<sup>1/4</sup>/[1 + (0.492/Pr)<sup>9/16</sup>]<sup>4/9</sup>, &nbsp; Sh: Pr → Sc, &nbsp; Gr = gΔρL³/(ρν²)</Eq>
        <Grid2>
          <div>
            <Slider label={t("기체 온도 T₁ (포화 혼합물)", "Gas temperature T₁ (saturated mixture)")} value={T1} min={40} max={99.5} step={0.5} onChange={setT1} unit=" °C" />
            <Slider label={t("냉각수 온도 T₃", "Coolant temperature T₃")} value={T3} min={5} max={Math.min(60, T1 - 5)} step={1} onChange={setT3} unit=" °C" />
            <Slider label={t("응축막 + 벽 열전달계수 h_liq", "Condensate film + wall coefficient h_liq")} value={hl} min={500} max={20000} step={100} onChange={setHl} unit=" W/m²K" />
            <Slider label={t("벽 높이 L", "Wall height L")} value={Lp} min={0.05} max={1} step={0.05} onChange={setLp} unit=" m" />
            <Readout>
              y_A1 = {r.yA1.toFixed(4)} ({t("공기", "air")} {((1 - r.yA1) * 100).toFixed(1)}%), &nbsp;y_A2 = {r.yA2.toFixed(4)}<br />
              {t("계면 온도", "Interface temperature")} T₂ = <b>{r.T2C.toFixed(2)} °C</b><br />
              h_c = {r.hc.toFixed(2)} W/m²K, &nbsp;k_c = {sci(r.kc, 3)} m/s<br />
              {t("현열", "sensible")} {r.qs.toFixed(1)} + {t("잠열", "latent")} {r.ql.toFixed(1)} = <b>{qtot.toFixed(0)} W/m²</b><br />
              {t("응축 속도", "Condensation rate")} = {(r.NA * 18.015 * 3.6).toFixed(3)} kg/m²·h
            </Readout>
          </div>
          <div>
            <Chart
              W={440} H={290} xr={[0.001, 1]} yr={[10, qmax * 3]} xlog ylog
              xl={t("벌크 공기 몰분율 y_B1", "bulk air mole fraction y_B1")} yl={t("총 열유속 (W/m²)", "total heat flux (W/m²)")}
              series={[{ pts: sweep.map((p) => [p[0], p[1]]), color: C.copper, width: 2.6 }]}
              dots={[{ x: 1 - r.yA1, y: qtot, color: C.ink, fill: C.copper }]}
            />
            <Chart
              W={440} H={220} xr={[0.001, 1]} yr={[T3, 100]} xlog
              xl={t("벌크 공기 몰분율 y_B1", "bulk air mole fraction y_B1")} yl="T₂ (°C)"
              series={[{ pts: sweep.map((p) => [p[0], p[2]]), color: C.cool, width: 2.4 }]}
            />
          </div>
        </Grid2>
        <Note>
          {t(
            "공기가 섞이면 열유속이 크게 줄어듭니다. 계면에 쌓인 공기 때문에 T₂가 T₃ 쪽으로 떨어지고, 응축의 구동력(포화 증기압 차)이 줄어들기 때문입니다. 이 막 모델에서는 공기가 1%만 있어도 기체 쪽 저항이 지배합니다. y_B1 → 0이면 ln 항이 끝없이 커져 T₂ → T_sat이 되지만, 그 접근은 매우 느립니다. 발전소 복수기와 원자로 격납 건물의 피동 냉각 설계에서 비응축 기체 배출(venting)이 중요한 이유가 여기에 있습니다. 층류 자연대류 상관식과 공기 기준 물성을 썼으므로 절대값은 실험 상관식보다 보수적(낮게)입니다. 경향을 읽는 것이 목적입니다.",
            "Mixing in air cuts the heat flux sharply. The accumulated air pulls T₂ down toward T₃ and shrinks the driving force for condensation (the difference in saturation pressure). In this film model, even 1% air leaves the gas-side resistance in control. As y_B1 → 0 the log term grows without bound and T₂ → T_sat, but the approach is very slow. That is why venting noncondensables matters in power-plant condensers and in the passive cooling of reactor containments. The laminar natural-convection correlation and air-based properties make the absolute numbers conservative (lower than experimental correlations); read the trend, not the third digit."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 12: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. 25 °C, 1 atm에서 길이 8 cm Stefan 관 바닥에 에탄올이 있고, 관 위로 건조 공기가 흐른다. 에탄올의 증기압은 7.83 kPa, D_AB = 0.125 cm²/s이다. N_A를 구하고 Fick 근사와 비교하라. 하루 동안 단위 면적당 몇 g이 증발하는가?",
        "P1. Ethanol sits at the bottom of an 8 cm Stefan tube at 25 °C and 1 atm, with dry air flowing over the top. Its vapor pressure is 7.83 kPa and D_AB = 0.125 cm²/s. Find N_A and compare it with the Fick estimate. How many grams evaporate per unit area in a day?"
      ),
      s: t(
        "c = P/RT = 40.9 mol/m³, y_A1 = 7.83/101.3 = 0.0773, y_A2 = 0. N_A = (cD/L) ln[1/(1 − 0.0773)] = (40.9 × 1.25×10⁻⁵/0.08) × 0.0804 = 5.13×10⁻⁴ mol/m²·s. Fick 근사 cDy_A1/L = 4.93×10⁻⁴로 4% 작습니다. 질량으로는 5.13×10⁻⁴ × 46.07 × 86400 ≈ 2.04 kg/m²·day, 즉 1 cm²당 약 0.20 g입니다.",
        "c = P/RT = 40.9 mol/m³, y_A1 = 7.83/101.3 = 0.0773, y_A2 = 0. N_A = (cD/L) ln[1/(1 − 0.0773)] = (40.9 × 1.25×10⁻⁵/0.08) × 0.0804 = 5.13×10⁻⁴ mol/m²·s. The Fick estimate cDy_A1/L = 4.93×10⁻⁴ is 4% lower. In mass: 5.13×10⁻⁴ × 46.07 × 86400 ≈ 2.04 kg/m²·day, about 0.20 g per cm²."
      ),
    },
    {
      q: t(
        "P2. 25 °C Arnold cell에서 물의 액면이 관 입구로부터 2.00 cm에 있었는데, 10일 뒤 3.78 cm가 되었다. p*_H₂O = 3.17 kPa이다. 수증기–공기의 D_AB를 구하라.",
        "P2. In an Arnold cell at 25 °C, the water level starts 2.00 cm below the top and is 3.78 cm below after 10 days. With p*_H₂O = 3.17 kPa, find D_AB for water vapor–air."
      ),
      s: t(
        "y_A1 = 0.0312, y_B,lm = 0.984, c = 40.9 mol/m³. z² − z₀² = (0.0378² − 0.02²) = 1.03×10⁻³ m², t = 8.64×10⁵ s → 기울기 1.19×10⁻⁹ m²/s. D = 기울기 × ρ_L y_B,lm/(2cM_A y_A1) = 1.19×10⁻⁹ × 997 × 0.984/(2 × 40.9 × 0.018 × 0.0312) = 2.5×10⁻⁵ m²/s = 0.25 cm²/s. Fuller 값 0.254 cm²/s와 잘 맞습니다.",
        "y_A1 = 0.0312, y_B,lm = 0.984, c = 40.9 mol/m³. z² − z₀² = 0.0378² − 0.02² = 1.03×10⁻³ m² over t = 8.64×10⁵ s, a slope of 1.19×10⁻⁹ m²/s. D = slope × ρ_L y_B,lm/(2cM_A y_A1) = 1.19×10⁻⁹ × 997 × 0.984/(2 × 40.9 × 0.018 × 0.0312) = 2.5×10⁻⁵ m²/s = 0.25 cm²/s, in good agreement with Fuller (0.254 cm²/s)."
      ),
    },
    {
      q: t(
        "P3. (111) Si를 1100 °C 건식 O₂로 산화하여 100 nm 막을 얻으려 한다. Deal–Grove 상수(B₀ = 772 μm²/h, 1.23 eV; (B/A)₀ = 6.23×10⁶ μm/h, 2.0 eV)로 필요한 시간을 구하라. 1000 °C라면?",
        "P3. You want a 100 nm oxide on (111) Si by dry O₂ oxidation at 1100 °C. Using the Deal–Grove constants (B₀ = 772 μm²/h, 1.23 eV; (B/A)₀ = 6.23×10⁶ μm/h, 2.0 eV), find the required time. What about 1000 °C?"
      ),
      s: t(
        "1100 °C (1373 K): B = 772 exp(−1.23/(8.617×10⁻⁵ × 1373)) = 0.0236 μm²/h, B/A = 0.284 μm/h, A = 0.083 μm. t = (x² + Ax)/B = (0.01 + 0.0083)/0.0236 = 0.77 h ≈ 46분. 1000 °C에서는 B = 0.0105, A = 0.139 μm로 t ≈ 2.3 h입니다. x ≈ A 수준이라 두 저항이 모두 중요한 혼합 영역입니다.",
        "At 1100 °C (1373 K): B = 772 exp(−1.23/(8.617×10⁻⁵ × 1373)) = 0.0236 μm²/h, B/A = 0.284 μm/h, A = 0.083 μm. t = (x² + Ax)/B = (0.01 + 0.0083)/0.0236 = 0.77 h ≈ 46 min. At 1000 °C, B = 0.0105 and A = 0.139 μm, so t ≈ 2.3 h. Since x is comparable to A, both resistances matter (mixed regime)."
      ),
    },
    {
      q: t(
        "P4. 반지름 100 μm 탄소 입자가 1 atm 공기 중에서 3C + 2.5O₂ → 2CO₂ + CO로 확산 지배 연소한다. 1200 K에서 D = 2.0×10⁻⁴ m²/s, ρ_C = 2000 kg/m³이다. 연소 시간을 구하라. 1500 K(D ∝ T^1.75)에서는 얼마나 빨라지는가?",
        "P4. A carbon particle of radius 100 μm burns in air at 1 atm under diffusion control by 3C + 2.5O₂ → 2CO₂ + CO. At 1200 K, D = 2.0×10⁻⁴ m²/s and ρ_C = 2000 kg/m³. Find the burnout time. How much faster is it at 1500 K (D ∝ T^1.75)?"
      ),
      s: t(
        "c = 101325/(8.314 × 1200) = 10.16 mol/m³. t_f = (ρ_C/M_C)R₀²/(12cD ln 1.042) = (2000/0.012)(10⁻⁴)²/(12 × 10.16 × 2×10⁻⁴ × 0.0411) = 1.66 s. 1500 K에서 c는 1/T로 줄고 D는 T^1.75로 늘어 cD ∝ T^0.75입니다. t_f = 1.66 × (1200/1500)^0.75 = 1.41 s로 15%만 빨라집니다. 확산 지배 연소는 온도에 둔감합니다.",
        "c = 101325/(8.314 × 1200) = 10.16 mol/m³. t_f = (ρ_C/M_C)R₀²/(12cD ln 1.042) = (2000/0.012)(10⁻⁴)²/(12 × 10.16 × 2×10⁻⁴ × 0.0411) = 1.66 s. At 1500 K, c falls as 1/T while D rises as T^1.75, so cD ∝ T^0.75 and t_f = 1.66 × (1200/1500)^0.75 = 1.41 s, only 15% faster. Diffusion-controlled combustion is insensitive to temperature."
      ),
    },
    {
      q: t(
        "P5. 0.2 mol/L NaOH 수용액이 CO₂를 흡수한다. k₂ = 8.5×10³ L/(mol·s), D_CO₂ = 1.9×10⁻⁹ m²/s, 액막 두께 δ = 40 μm이다. Ha와 증진 인자 E를 구하고, 물리 흡수의 k_c와 비교하라.",
        "P5. A 0.2 mol/L NaOH solution absorbs CO₂, with k₂ = 8.5×10³ L/(mol·s), D_CO₂ = 1.9×10⁻⁹ m²/s and a liquid film δ = 40 μm. Find Ha and the enhancement factor E, and compare k_c with physical absorption."
      ),
      s: t(
        "k₁ = k₂[OH⁻] = 1700 s⁻¹. Ha = δ√(k₁/D) = 40×10⁻⁶ × √(1700/1.9×10⁻⁹) = 37.8. tanh(37.8) = 1이므로 E = 37.8. 물리 흡수 k_c = D/δ = 4.75×10⁻⁵ m/s, 반응 흡수 k_c = √(Dk₁) = 1.80×10⁻³ m/s로 38배입니다. 이제 δ는 결과에 영향이 없습니다.",
        "k₁ = k₂[OH⁻] = 1700 s⁻¹. Ha = δ√(k₁/D) = 40×10⁻⁶ × √(1700/1.9×10⁻⁹) = 37.8. Since tanh(37.8) = 1, E = 37.8. Physical absorption gives k_c = D/δ = 4.75×10⁻⁵ m/s; with reaction k_c = √(Dk₁) = 1.80×10⁻³ m/s, 38 times larger, and δ no longer matters."
      ),
    },
    {
      q: t(
        "P6. 반응 지배 LPCVD(E_a = 1.9 eV)를 700 °C에서 운전한다. (a) 650 °C로 낮추면 성장 속도는 몇 배로 줄어드는가? (b) 막 두께를 ±1% 안으로 맞추려면 웨이퍼 간 온도 편차를 얼마 이내로 관리해야 하는가?",
        "P6. A reaction-limited LPCVD process (E_a = 1.9 eV) runs at 700 °C. (a) By what factor does the growth rate drop at 650 °C? (b) To hold the thickness within ±1%, how tightly must the wafer-to-wafer temperature be controlled?"
      ),
      s: t(
        "(a) G ∝ exp(−E_a/kT): G(700)/G(650) = exp[(1.9/8.617×10⁻⁵)(1/923 − 1/973)] = exp(1.23) = 3.4배. (b) d ln G/dT = E_a/(kT²) = 1.9/(8.617×10⁻⁵ × 973²) = 0.023 K⁻¹, 즉 1 °C당 2.3%입니다. ±1%를 지키려면 ±0.4 °C 이내가 필요합니다. 반응 지배의 대가가 이것입니다.",
        "(a) G ∝ exp(−E_a/kT): G(700)/G(650) = exp[(1.9/8.617×10⁻⁵)(1/923 − 1/973)] = exp(1.23) = 3.4. (b) d ln G/dT = E_a/(kT²) = 1.9/(8.617×10⁻⁵ × 973²) = 0.023 K⁻¹, that is, 2.3% per °C. Holding ±1% requires about ±0.4 °C. This is the price of operating in the reaction-limited regime."
      ),
    },
    {
      q: t(
        "P7. n형 기판(C_B = 3×10¹⁵ cm⁻³)에 B를 950 °C에서 30분 선증착(C_s = 10²⁰ cm⁻³)한 뒤, 1100 °C에서 60분 드라이브인한다. 강의의 D_B를 써서 두 단계 후의 접합 깊이를 구하라.",
        "P7. Boron is predeposited into an n-type substrate (C_B = 3×10¹⁵ cm⁻³) at 950 °C for 30 min (C_s = 10²⁰ cm⁻³), then driven in at 1100 °C for 60 min. Using the lecture's D_B, find the junction depth after each step."
      ),
      s: t(
        "D₁ = 6×10⁻² exp(−3.12/(k × 1223)) = 8.4×10⁻¹⁵ cm²/s, D₂ = 2.1×10⁻¹³ cm²/s. Q = 2C_s√(D₁t₁/π) = 4.4×10¹⁴ cm⁻². 선증착 후 erfc(x_j/(2√(D₁t₁))) = 3×10⁻⁵ → x_j ≈ 0.23 μm. 드라이브인 후 표면 농도는 Q/√(πD₂t₂) = 8.9×10¹⁸ cm⁻³이고, x_j = 2√(D₂t₂) √(ln(C(0)/C_B)) = 1.56 μm입니다.",
        "D₁ = 6×10⁻² exp(−3.12/(k × 1223)) = 8.4×10⁻¹⁵ cm²/s and D₂ = 2.1×10⁻¹³ cm²/s. Q = 2C_s√(D₁t₁/π) = 4.4×10¹⁴ cm⁻². After predeposition, erfc(x_j/(2√(D₁t₁))) = 3×10⁻⁵ gives x_j ≈ 0.23 μm. After drive-in the surface concentration is Q/√(πD₂t₂) = 8.9×10¹⁸ cm⁻³ and x_j = 2√(D₂t₂) √(ln(C(0)/C_B)) = 1.56 μm."
      ),
    },
    {
      q: t(
        "P8. 지름 200 mm 웨이퍼를 5 mm 간격으로 세운 TEOS LPCVD 노에서 D = 0.06 m²/s, k_s = 3.75×10⁻³ m/s이다. 얇은 간격 모델로 Φ와 중심/가장자리 두께비를 구하라. 온도를 50 °C 올려 k_s가 3배가 되면?",
        "P8. A TEOS LPCVD furnace stacks 200 mm wafers at 5 mm spacing, with D = 0.06 m²/s and k_s = 3.75×10⁻³ m/s. Use the thin-gap model to find Φ and the center/edge thickness ratio. What if a 50 °C rise triples k_s?"
      ),
      s: t(
        "Φ = R√(2k_s/(Ds)) = 0.1 × √(2 × 3.75×10⁻³/(0.06 × 0.005)) = 0.50. 중심/가장자리 = 1/I₀(0.5) = 0.940, 즉 6% 얇습니다. k_s가 3배(E_a = 1.9 eV에서 700 → 750 °C)면 Φ = 0.87, 비 = 0.835로 균일도가 크게 나빠집니다. 간격을 넓히거나 압력을 낮춰 D를 키워야 합니다.",
        "Φ = R√(2k_s/(Ds)) = 0.1 × √(2 × 3.75×10⁻³/(0.06 × 0.005)) = 0.50. Center/edge = 1/I₀(0.5) = 0.940, about 6% thinner. If k_s triples (700 → 750 °C at E_a = 1.9 eV), Φ = 0.87 and the ratio drops to 0.835, much worse. The cure is a wider spacing or a lower pressure to raise D."
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

/* ---------------------------------- Tab 13: Code ---------------------------------- */
function TabCode({ t }) {
  const topics = ["topic1", "topic2", "topic3", "topic4"];
  const langs = [
    { key: "python", label: "Python", ext: "py" },
    { key: "matlab", label: "MATLAB", ext: "m" },
    { key: "julia", label: "Julia", ext: "jl" },
    { key: "cpp", label: "C++", ext: "cpp" },
  ];
  const fileStem = {
    topic1: "week10_topic1_stefan_tube",
    topic2: "week10_topic2_moving_boundary",
    topic3: "week10_topic3_reaction_film_cvd",
    topic4: "week10_topic4_laplace_2d",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK10_CODES[topic][lang];
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
              {WEEK10_CODES[tp].title}
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
            "Python·C++ 버전은 실행해 결과를 서로 대조했습니다(주제 2–4는 출력이 한 자리도 다르지 않습니다. 주제 1의 가상 실험만 난수 생성기 차이로 끝자리가 다릅니다). Stefan 관: 아세톤 25 °C에서 Stefan/Fick 비 1.19, 경로 평균 y_B가 y_B,lm과 일치합니다. Si 산화: 선형–포물선 해석해와 수치 적분이 일치합니다. 액막 반응: Ha/tanh Ha와 유한차분 해가 5자리까지 맞습니다. 2D: 정사각형 중심값 0.25000, TEOS 간격의 2D SOR 해가 얇은 간격 근사 1/I₀(Φ)와 0.2% 안에서 일치합니다. MATLAB·Julia는 같은 알고리즘을 옮긴 것입니다.",
            "The Python and C++ versions were run and cross-checked (for topics 2–4 the outputs agree digit for digit; only the synthetic experiment in topic 1 differs in the last digits because the random generators differ). Stefan tube: acetone at 25 °C gives a Stefan/Fick ratio of 1.19, and the path-averaged y_B equals y_B,lm. Si oxidation: the linear–parabolic closed form matches numerical integration. Reacting film: Ha/tanh Ha matches the finite-difference solution to five digits. 2D: the square's center value is 0.25000, and the 2D SOR solution for the TEOS gap agrees with the thin-gap result 1/I₀(Φ) within 0.2%. The MATLAB and Julia versions port the same algorithms."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week10App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("Stefan 관·막 모델", "Stefan tube & film"), comp: <TabStefan t={t} /> },
    { label: t("Arnold cell 측정", "Arnold-cell measurement"), comp: <TabArnold t={t} /> },
    { label: t("Si 산화", "Si oxidation"), comp: <TabOxide t={t} /> },
    { label: t("탄소 입자 연소", "Carbon burnout"), comp: <TabCarbon t={t} /> },
    { label: t("반응 액막 (Hatta)", "Reacting film (Hatta)"), comp: <TabHatta t={t} /> },
    { label: t("CVD·ALD", "CVD & ALD"), comp: <TabCVD t={t} /> },
    { label: t("도펀트 확산", "Dopant diffusion"), comp: <TabDopant t={t} /> },
    { label: t("2D Laplace", "2D Laplace"), comp: <TabLaplace t={t} /> },
    { label: t("웨이퍼 간 TEOS", "TEOS wafer gap"), comp: <TabWafer t={t} /> },
    { label: t("열·물질 동시전달", "Heat & mass together"), comp: <TabCondense t={t} /> },
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
                Heat & Mass Transfer · Week 10
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("정상상태 분자확산", "Steady-State Molecular Diffusion")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("Stefan 관과 로그 평균 · 유사 정상 이동 경계 · 반응과 확산(Da, Hatta) · 산화·CVD·도핑 공정 · 2차원 확산 · 열·물질 동시전달",
                   "Stefan tube & log mean · pseudo-steady moving boundaries · reaction with diffusion (Da, Hatta) · oxidation, CVD & doping · 2D diffusion · simultaneous heat & mass transfer")}
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
