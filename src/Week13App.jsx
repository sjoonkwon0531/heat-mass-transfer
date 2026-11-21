// Week13App.jsx — Heat & Mass Transfer, Week 13: Convective mass-transfer correlations and interphase mass transfer
// Part 1 — Flat-plate correlations (laminar/turbulent, j_D), unheated starting length and the CVD example,
// creeping flow past a sphere (Stokes drag, terminal velocity), Sh(Pe) for spheres, pipes and packed beds.
// Part 2 — Equilibrium (Raoult, Henry, distribution law), two-resistance theory, overall coefficients,
// packed-tower design (operating line, minimum L/V, HTU × NTU).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK13_CODES from "./Week13Codes";

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

function Table({ head, rows, plain }) {
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
              {r.map((c, j) => <td key={j} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: j > 0 && !plain ? mono : font, fontSize: j > 0 && !plain ? 12.8 : 13.2 }}>{c}</td>)}
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


/* ---------------------------------- numerics ---------------------------------- */
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const logspace = (a, b, n) => lin(a, b, n).map((e) => Math.pow(10, e));
const PALETTE = [C.copper, C.cool, C.good, C.violet, C.warn, C.copperDeep];

/* ---------------------------------- correlations ---------------------------------- */
const RE_TR = 2e5; // lecture's transition Reynolds number for the plate correlations
const shPlateLam = (Re, Sc) => 0.664 * Math.sqrt(Re) * Math.cbrt(Sc);
const shPlateTurb = (Re, Sc) => 0.0365 * Math.pow(Re, 0.8) * Math.cbrt(Sc);
const shPlate = (Re, Sc) => (Re < RE_TR ? shPlateLam(Re, Sc) : shPlateTurb(Re, Sc));
const entFactor = (r) => Math.pow(1 - Math.pow(r, 0.75), -1 / 3);

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 이론에서 상관식으로, 그리고 두 상 사이로", "This week: from theory to correlations, and across two phases")}>
        <P>
          {t(
            "12주차에는 평판 위 층류 경계층에서 k_c를 엄밀하게 구했습니다. 그러나 실제 장치의 형상은 평판만이 아니고, 흐름도 난류이거나 입자 주위의 느린 흐름입니다. 그래서 공학에서는 이론과 실험을 묶은 상관식 Sh = f(Re, Sc)를 씁니다.",
            "In Week 12 we derived k_c exactly for a laminar boundary layer on a plate. Real equipment, however, is not only flat plates, and the flow may be turbulent or a slow flow around particles. Engineering therefore relies on correlations Sh = f(Re, Sc) that combine theory and experiment."
          )}
        </P>
        <P>
          {t(
            "후반부에서는 물질이 한 상에서 다른 상으로 넘어가는 경우를 다룹니다. 기체 속 성분이 액체에 녹는 흡수가 대표적입니다. 이때 두 상의 저항이 직렬로 연결되고, 계면에서는 상평형이 성립합니다.",
            "The second half treats transfer from one phase into another; gas absorption into a liquid is the standard example. The two phase resistances then act in series, and phase equilibrium holds at the interface."
          )}
        </P>
      </Panel>

      <Panel title={t("물질전달 무차원수", "Dimensionless groups for mass transfer")}>
        <Table
          head={[t("이름", "Name"), t("정의", "Definition"), t("의미", "Meaning")]}
          rows={[
            ["Reynolds, Re", "v L / ν", t("관성력 / 점성력", "inertia / viscous forces")],
            ["Schmidt, Sc", "ν / D_AB", t("운동량 확산 / 물질 확산", "momentum / mass diffusivity")],
            ["Sherwood, Sh", "k_c L / D_AB", t("대류 전달 / 순수 확산", "convective / purely diffusive transfer")],
            ["Péclet, Pe_AB", "v L / D_AB = Re Sc", t("흐름에 실려 감 / 확산", "carried by flow / diffusion")],
            ["Stanton, St_AB", "k_c / v = Sh / (Re Sc)", t("벽으로 전달 / 흐름으로 운반", "transfer to the wall / carried by the flow")],
            ["Grashof, Gr", "g Δρ L³ / (ρ ν²)", t("부력 / 점성력", "buoyancy / viscous forces")],
            [t("물질전달 j 인자, j_D", "mass-transfer j-factor, j_D"), "(k_c / v) Sc^(2/3)", t("평판에서 C_f/2와 같음", "equals C_f/2 on a flat plate")],
            [t("열전달 j 인자, j_H", "heat-transfer j-factor, j_H"), "(h / ρc_p v) Pr^(2/3)", t("j_D와 같다고 봄(Chilton–Colburn)", "taken equal to j_D (Chilton–Colburn)")],
          ]}
        />
      </Panel>

      <Panel title={t("어떤 상관식을 언제 쓰나", "Which correlation, when")}>
        <Table
          head={[t("형상과 흐름", "Geometry and flow"), t("상관식", "Correlation"), t("범위", "Range")]}
          rows={[
            [t("평판, 층류", "flat plate, laminar"), "Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)", "Re_L < 2×10⁵"],
            [t("평판, 난류", "flat plate, turbulent"), "Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3)", "Re_L > 2×10⁵"],
            [t("평판, 늦게 시작하는 전달", "flat plate, transfer starting at X"), "Sh_x = 0.332 Re_x^(1/2) [Sc/(1 − (X/x)^(3/4))]^(1/3)", t("층류", "laminar")],
            [t("구, Pe ≪ 1", "sphere, Pe ≪ 1"), "Sh = 2", t("순수 확산", "pure diffusion")],
            [t("구, 크리핑 흐름", "sphere, creeping flow"), "Sh = (4 + 1.21 Pe_d^(2/3))^(1/2)", "Pe_d < 10⁴"],
            [t("구, 기체 흐름", "sphere, gas stream"), "Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)", "2 < Re < 800, 0.6 < Sc < 2.7"],
            [t("관, 기체 난류", "pipe, gas, turbulent"), "Sh (p_B,lm/P) = 0.023 Re^0.83 Sc^0.44", "2000 < Re < 35000"],
            [t("관, 액체 난류", "pipe, liquid, turbulent"), "Sh = 0.023 Re^0.83 Sc^(1/3)", "1000 < Sc < 2260"],
            [t("관, 층류", "pipe, laminar"), "Sh = 1.86 (Re Sc d/L)^(1/3)", "10 < Re < 2000"],
            [t("충전층", "packed bed"), "j_D = 1.17 Re^(−0.415);  ε j_D = 1.09 Re^(−2/3)", "10–2500;  0.0016–55"],
          ]}
        />
        <Note>
          {t(
            "상관식은 범위 밖에서 쓰면 안 됩니다. 특히 Re, Sc의 범위와 '어떤 길이로 Re와 Sh를 정의했는지'를 먼저 확인하십시오. 같은 법칙도 반지름 기준이냐 지름 기준이냐에 따라 계수가 달라집니다.",
            "Never use a correlation outside its range. Check first the ranges of Re and Sc and which length defines Re and Sh: the same law has different coefficients when based on radius or on diameter."
          )}
        </Note>
      </Panel>

      <Panel title={t("참고문헌 (원 논문)", "References (original papers)")}>
        <Table plain head={[t("상관식", "Correlation"), t("출처", "Source")]}
          rows={[
            [t("구, Pe ≪ 1 전개", "sphere, Pe ≪ 1 expansion"), "A. Acrivos, T. D. Taylor, Phys. Fluids 5, 387–394 (1962)"],
            [t("구, Brian–Hales 식", "sphere, Brian–Hales"), "P. L. T. Brian, H. B. Hales, AIChE J. 15, 419–425 (1969)"],
            [t("충전층, 액체", "packed bed, liquids"), "E. J. Wilson, C. J. Geankoplis, Ind. Eng. Chem. Fundam. 5, 9–14 (1966)"],
          ]} />
      </Panel>

      <Panel title={t("13주차 로드맵", "Week 13 roadmap")}>
        <Table
          head={[t("탭", "Tab"), t("핵심 질문", "Key question")]}
          rows={[
            [t("평판 상관식", "Flat plate"), t("층류와 난류에서 Sh는 어떻게 다르고, 전달이 늦게 시작하면 무엇이 변하나?", "How do laminar and turbulent Sh differ, and what changes when transfer starts downstream?")],
            [t("CVD 예제", "CVD example"), t("웨이퍼 위 기체의 k_c를 경계층 모델과 막 모델로 구하면 왜 37% 차이가 나나?", "Why do the boundary-layer and film models differ by 37% for gas over a wafer?")],
            [t("크리핑 흐름", "Creeping flow"), t("작은 입자는 얼마나 빨리 가라앉고, 항력은 어디서 오나?", "How fast do small particles settle, and where does the drag come from?")],
            [t("구의 물질전달", "Sphere Sh"), t("Pe가 작을 때 Sh = 2, 클 때 Sh ∝ Pe^(1/3)인 이유는?", "Why Sh = 2 at small Pe and Sh ∝ Pe^(1/3) at large Pe?")],
            [t("관·충전층", "Pipes & beds"), t("갇힌 흐름에서는 어떤 상관식을 쓰나?", "Which correlations apply to confined flows?")],
            [t("상평형", "Equilibrium"), t("계면에서 두 상의 조성은 어떻게 연결되나?", "How are the two phase compositions linked at the interface?")],
            [t("이중 경막", "Two-resistance"), t("저항이 어느 상에 모여 있나?", "Which phase holds the resistance?")],
            [t("충전탑", "Packed tower"), t("탑의 높이는 어떻게 정하나?", "How is the tower height set?")],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Flat plate ---------------------------------- */
function TabPlate({ t }) {
  const [logRe, setLogRe] = useState(5);
  const [logSc, setLogSc] = useState(0);
  const Re = Math.pow(10, logRe), Sc = Math.pow(10, logSc);
  const res = logspace(3, 7, 160);
  const lamCurve = res.filter((r) => r < RE_TR).map((r) => [r, shPlateLam(r, Sc)]);
  const turbCurve = res.filter((r) => r >= RE_TR).map((r) => [r, shPlateTurb(r, Sc)]);
  const lamExt = res.filter((r) => r >= RE_TR).map((r) => [r, shPlateLam(r, Sc)]);
  const jD = shPlate(Re, Sc) / (Re * Math.cbrt(Sc));
  // entrance effect
  const [Xr, setXr] = useState(0.4);
  const rs = lin(0, 0.97, 120);
  return (
    <div>
      <Panel title={t("유도: 층류와 난류의 평균 Sherwood 수", "Derivation: mean Sherwood numbers, laminar and turbulent")}>
        <P>
          {t(
            "층류(Re_L < 2×10⁵)는 12주차의 Pohlhausen 결과입니다. 국소값 Sh_x = 0.332 Re_x^(1/2) Sc^(1/3)에서 k_c ∝ x^(−1/2)이므로, 0에서 L까지 평균하면 계수가 2배가 됩니다.",
            "The laminar case (Re_L < 2×10⁵) is the Pohlhausen result of Week 12. Since the local value Sh_x = 0.332 Re_x^(1/2) Sc^(1/3) gives k_c ∝ x^(−1/2), averaging from 0 to L doubles the coefficient."
          )}
        </P>
        <Eq block>k̄_c = (1/L)∫₀ᴸ k_c dx &nbsp;⇒&nbsp; Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)</Eq>
        <P>
          {t(
            "난류에서는 국소값이 Sh_x = 0.0292 Re_x^(4/5) Sc^(1/3)이고 k_c ∝ x^(−1/5)입니다. ∫₀ᴸ x^(−1/5) dx = (5/4)L^(4/5)이므로 평균 계수는 0.0292 × 5/4 = 0.0365입니다. 판 전체를 난류로 본 근사입니다.",
            "In turbulence the local value is Sh_x = 0.0292 Re_x^(4/5) Sc^(1/3), with k_c ∝ x^(−1/5). Since ∫₀ᴸ x^(−1/5) dx = (5/4)L^(4/5), the mean coefficient is 0.0292 × 5/4 = 0.0365. This treats the whole plate as turbulent."
          )}
        </P>
        <Eq block>Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3), &nbsp;&nbsp; j_D = Sh_L / (Re_L Sc^(1/3)) = 0.664 Re_L^(−1/2) {t("(층류)", "(laminar)")}, &nbsp;0.0365 Re_L^(−1/5) {t("(난류)", "(turbulent)")}</Eq>
        <Note>
          {t(
            "j_D가 마찰계수의 절반 C_f/2와 같다는 것이 Chilton–Colburn 유사성입니다(0.6 < Sc < 2500). 압력 손실로 쉽게 재는 C_f에서 k_c를 얻을 수 있다는 뜻입니다.",
            "That j_D equals half the friction factor, C_f/2, is the Chilton–Colburn analogy (0.6 < Sc < 2500): k_c follows from C_f, which a pressure-drop measurement gives easily."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: Re_L과 Sc를 바꿔 보기", "Simulation: vary Re_L and Sc")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Re_L" value={logRe} min={3} max={7} step={0.02} onChange={setLogRe} fmt={(x) => `${x.toFixed(2)} (Re_L = ${sci(Re, 2)})`} />
            <Slider label="log₁₀ Sc" value={logSc} min={-0.3} max={3.4} step={0.02} onChange={setLogSc} fmt={(x) => `${x.toFixed(2)} (Sc = ${sci(Sc, 2)})`} />
            <Readout>
              {t("흐름", "regime")}: {Re < RE_TR ? t("층류", "laminar") : t("난류", "turbulent")}<br />
              Sh_L = {sci(shPlate(Re, Sc), 3)}<br />
              j_D = {jD.toExponential(3)}<br />
              {Re >= RE_TR && <>{t("같은 Re에서 층류 식 대비", "vs the laminar formula at the same Re")}: ×{(shPlateTurb(Re, Sc) / shPlateLam(Re, Sc)).toFixed(2)}</>}
            </Readout>
            <Note>
              {t(
                "Re_L = 2×10⁵에서 곡선이 끊겨 뛰는 것은 '판 전체가 갑자기 난류가 된다'는 단순화 때문입니다. 실제로는 앞부분이 층류로 남아 평균값이 두 곡선 사이를 지나갑니다.",
                "The jump at Re_L = 2×10⁵ comes from the simplification that the whole plate turns turbulent at once. In reality the leading part stays laminar, and the mean value runs between the two curves."
              )}
            </Note>
          </div>
          <Chart xr={[1e3, 1e7]} yr={[5, 3e5]} xlog ylog xl="Re_L" yl="Sh_L"
            series={[
              { pts: lamCurve, color: C.cool, width: 2.4 },
              { pts: lamExt, color: C.cool, width: 1.4, dash: "5 4" },
              { pts: turbCurve, color: C.copper, width: 2.6 },
            ]}
            vlines={[{ x: RE_TR, color: C.inkSoft }]}
            dots={[{ x: Re, y: shPlate(Re, Sc) }]}
            legend={[{ label: t("층류 0.664", "laminar 0.664"), color: C.cool }, { label: t("난류 0.0365", "turbulent 0.0365"), color: C.copper }]} legendAt="tl" />
        </Grid2>
      </Panel>

      <Panel title={t("전달이 늦게 시작할 때: 입구 효과", "When transfer starts downstream: the entrance effect")}>
        <P>
          {t(
            "0 ≤ x ≤ X 구간의 벽은 물질을 내보내지 않고(비활성), x > X부터 표면 농도가 c_As입니다. 속도 경계층은 x = 0부터 자랐지만 농도 경계층은 x = X에서 새로 시작하므로 더 얇고, 그만큼 전달이 큽니다.",
            "For 0 ≤ x ≤ X the wall is inert; from x > X the surface sits at c_As. The velocity layer has grown since x = 0, but the concentration layer starts fresh at x = X, so it is thinner and transfer is stronger."
          )}
        </P>
        <Eq block>Sh_x = 0.332 Re_x^(1/2) [ Sc / (1 − (X/x)^(3/4)) ]^(1/3)</Eq>
        <Grid2>
          <div>
            <Slider label="X / x" value={Xr} min={0} max={0.95} step={0.01} onChange={setXr} fmt={(v) => v.toFixed(2)} />
            <Readout>
              {t("보정 인자", "correction factor")} [1 − (X/x)^(3/4)]^(−1/3) = {entFactor(Xr).toFixed(3)}<br />
              {t("즉 Sh_x가 X = 0일 때보다", "so Sh_x is")} {((entFactor(Xr) - 1) * 100).toFixed(0)}% {t("큽니다.", "larger than for X = 0.")}
            </Readout>
            <Note>
              {t(
                "x → X이면 인자가 무한대로 커집니다. 전달이 막 시작된 곳에서는 농도 경계층 두께가 0이기 때문입니다. CVD 예제(X/x = 4/9)의 인자는 1.30입니다.",
                "As x → X the factor diverges, because the concentration layer has zero thickness where transfer just begins. In the CVD example (X/x = 4/9) the factor is 1.30."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[1, 4]} xl="X / x" yl={t("보정 인자", "correction factor")}
            series={[{ pts: rs.map((r) => [r, entFactor(r)]), color: C.copper, width: 2.6 }]}
            dots={[{ x: Xr, y: entFactor(Xr) }, { x: 4 / 9, y: entFactor(4 / 9), fill: C.cool, color: C.cool }]}
            labels={[{ x: 4 / 9, y: entFactor(4 / 9), text: "CVD (4/9)", dx: 8, dy: 14, color: C.cool }]} />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: CVD example ---------------------------------- */
function CvdSketch({ t, X, x }) {
  const W = 560, H = 150, s = (W - 60) / 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <rect x={30} y={18} width={W - 60} height={H - 50} fill="#fbf8f3" stroke={C.line} />
      {[0.3, 0.5, 0.7].map((f, i) => <line key={i} x1={6} x2={26} y1={18 + (H - 50) * f} y2={18 + (H - 50) * f} stroke={C.copper} strokeWidth={2} markerEnd="url(#ar)" />)}
      <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={C.copper} /></marker></defs>
      <rect x={30} y={H - 36} width={W - 60} height={8} fill="#c9c2b6" />
      <rect x={30 + X * s} y={H - 40} width={(10 - X) * s} height={4} fill={C.ink} />
      <path d={lin(0, 1, 40).map((u, i) => { const xx = X + u * (10 - X); const d = 9 * Math.sqrt(Math.max(xx - X, 0)) / Math.sqrt(10); return `${i ? "L" : "M"}${30 + xx * s},${H - 40 - d}`; }).join(" ")} fill="none" stroke={C.cool} strokeWidth={2} />
      <line x1={30 + x * s} x2={30 + x * s} y1={18} y2={H - 28} stroke={C.warn} strokeDasharray="4 3" />
      <text x={30 + X * s} y={H - 14} fontSize="11.5" textAnchor="middle" fill={C.ink}>X = {X} cm</text>
      <text x={30 + x * s} y={H - 14} fontSize="11.5" textAnchor="middle" fill={C.warn}>x = {x} cm</text>
      <text x={34} y={14} fontSize="11.5" fill={C.inkSoft}>{t("H₂ + 원료 기체 →", "H₂ + precursor gas →")}</text>
      <text x={30 + (X + 0.2) * s} y={H - 46} fontSize="11" fill={C.ink}>{t("웨이퍼", "wafer")}</text>
      <text x={34} y={H - 46} fontSize="11" fill={C.inkSoft}>{t("비활성 서셉터", "inert susceptor")}</text>
    </svg>
  );
}

function TabCVD({ t }) {
  const [v, setV] = useState(100);
  const [X, setX] = useState(4);
  const [x, setXx] = useState(9);
  const nu = 5.686, D = 1.55; // cm²/s (lecture values for the hot carrier gas)
  const xe = Math.max(x, X + 0.2);
  const Re = (v * xe) / nu, Sc = nu / D;
  const ratio = Math.cbrt(Sc / (1 - Math.pow(X / xe, 0.75)));
  const Sh = 0.332 * Math.sqrt(Re) * ratio;
  const kc = (Sh * D) / xe;
  const dM = (4.79 * xe) / Math.sqrt(Re);
  const dc = dM / ratio;
  const kFilm = D / dc;
  const xs = lin(X + 0.05, 10, 120);
  const kFilmAt = (xx) => D / (((4.79 * xx) / Math.sqrt((v * xx) / nu)) / Math.cbrt(Sc / (1 - Math.pow(X / xx, 0.75))));
  const kBL = (xx) => (0.332 * Math.sqrt((v * xx) / nu) * Math.cbrt(Sc / (1 - Math.pow(X / xx, 0.75))) * D) / xx;
  return (
    <div>
      <Panel title={t("상황: 수평 CVD 반응기 속 웨이퍼", "Setting: a wafer in a horizontal CVD reactor")}>
        <P>
          {t(
            "원료 기체가 운반 기체(H₂)와 함께 가열된 서셉터 위를 흐릅니다. 웨이퍼는 x = X에서 시작하고, 그 앞의 서셉터는 반응하지 않습니다. 표면 반응이 빠르면 증착 속도는 기체 경계층을 지나는 물질전달이 정합니다.",
            "A precursor flows with the H₂ carrier over a heated susceptor. The wafer begins at x = X, and the susceptor ahead of it does not react. When the surface reaction is fast, the deposition rate is set by mass transfer across the gas boundary layer."
          )}
        </P>
        <CvdSketch t={t} X={X} x={xe} />
        <Note>
          {t(
            "강의 값: v = 100 cm/s, 고온 기체의 ν = 5.686 cm²/s, D_AB = 1.55 cm²/s, X = 4 cm, x = 9 cm. 고온 저압 기체라 ν와 D가 상온보다 훨씬 큽니다.",
            "Lecture values: v = 100 cm/s, ν = 5.686 cm²/s and D_AB = 1.55 cm²/s for the hot gas, X = 4 cm, x = 9 cm. In a hot, low-pressure gas ν and D are far larger than at room conditions."
          )}
        </Note>
      </Panel>

      <Panel title={t("계산: 경계층 모델과 막 모델", "Calculation: boundary-layer model versus film model")}>
        <Grid2>
          <div>
            <Slider label={t("유속 v", "velocity v")} value={v} min={20} max={300} step={5} onChange={setV} unit=" cm/s" />
            <Slider label={t("웨이퍼 시작 X", "wafer start X")} value={X} min={0} max={8} step={0.5} onChange={setX} unit=" cm" />
            <Slider label={t("계산 위치 x", "position x")} value={x} min={1} max={10} step={0.5} onChange={setXx} unit=" cm" />
            <Readout>
              Re_x = {Re.toFixed(1)} ({t("층류", "laminar")}), &nbsp;Sc = {Sc.toFixed(3)}<br />
              [Sc/(1 − (X/x)^(3/4))]^(1/3) = {ratio.toFixed(3)}<br />
              Sh_x = {Sh.toFixed(3)} → <b>k_c = {kc.toFixed(3)} cm/s</b><br />
              δ_M = 4.79 x/Re_x^(1/2) = {dM.toFixed(2)} cm, &nbsp;δ_c = δ_M/{ratio.toFixed(3)} = {dc.toFixed(2)} cm<br />
              {t("막 모델", "film model")} k_c = D/δ_c = {kFilm.toFixed(3)} cm/s ({((1 - kFilm / kc) * 100).toFixed(0)}% {t("작음", "lower")})<br />
              1.5 D/δ_c = {(1.5 * kFilm).toFixed(3)} cm/s
            </Readout>
          </div>
          <Chart xr={[0, 10]} yr={[0, 4]} xl={t("위치 x (cm)", "position x (cm)")} yl="k_c (cm/s)"
            series={[
              { pts: xs.map((xx) => [xx, kBL(xx)]), color: C.copper, width: 2.6 },
              { pts: xs.map((xx) => [xx, kFilmAt(xx)]), color: C.cool, width: 2, dash: "6 4" },
            ]}
            vlines={[{ x: X, color: C.inkSoft }]}
            dots={[{ x: xe, y: kc }, { x: xe, y: kFilm, fill: C.cool, color: C.cool }]}
            legend={[{ label: t("경계층 모델", "boundary-layer model"), color: C.copper }, { label: t("막 모델 D/δ_c", "film model D/δ_c"), color: C.cool, dash: "6 4" }]} legendAt="tr" />
        </Grid2>
      </Panel>

      <Panel title={t("왜 37% 차이가 나나", "Why the 37% gap?")}>
        <P>
          {t(
            "막 모델은 농도가 δ_c에 걸쳐 직선으로 변한다고 보아 k_c = D/δ_c를 씁니다. 그러나 경계층 안의 실제 분포는 벽 근처가 더 가파릅니다. 3차 분포로 보면 벽 기울기가 직선의 3/2배이므로 k_c = 1.5 D/δ_c가 되고, 차이가 37%에서 약 6%로 줄어듭니다.",
            "The film model assumes a straight profile across δ_c and uses k_c = D/δ_c. The real profile is steeper near the wall. With a cubic profile the wall gradient is 3/2 that of the straight line, so k_c = 1.5 D/δ_c and the gap shrinks from 37% to about 6%."
          )}
        </P>
        <P>
          {t(
            "δ_M의 계수 4.79는 사인 분포 v_x/v∞ = sin(πy/2δ)의 적분 해(4.80)와 같습니다. 3차 분포는 4.64, 엄밀한 99% 두께는 4.91입니다.",
            "The coefficient 4.79 in δ_M matches the integral solution for a sine profile v_x/v∞ = sin(πy/2δ) (4.80). The cubic profile gives 4.64, and the exact 99% thickness is 4.91."
          )}
        </P>
        <Note>
          {t(
            "강의 슬라이드는 막 모델 값을 0.868 cm/s로 적었지만, 같은 숫자로 다시 계산하면 D/δ_c = 1.55/1.71 = 0.906 cm/s입니다. 37%라는 차이는 0.906에서 나옵니다(1 − 0.906/1.44 = 0.37).",
            "The lecture slide gives the film-model value as 0.868 cm/s, but recomputing with the same numbers gives D/δ_c = 1.55/1.71 = 0.906 cm/s. The quoted 37% gap comes from 0.906 (1 − 0.906/1.44 = 0.37)."
          )}
        </Note>
        <P>
          {t(
            "공학적 의미: 증착 속도 ∝ k_c(c_A∞ − c_As)이므로, k_c가 x를 따라 줄면 막 두께도 하류로 얇아집니다. 서셉터를 기울이거나 웨이퍼를 회전시키는 이유입니다.",
            "Engineering meaning: deposition rate ∝ k_c(c_A∞ − c_As), so a k_c that falls along x thins the film downstream. This is why susceptors are tilted and wafers rotated."
          )}
        </P>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Creeping flow past a sphere ---------------------------------- */
function StokesStreamlines({ t }) {
  // ψ/(U R²) = ½ ρ² (1 − 3/(2r) + 1/(2r³)), r = √(z² + ρ²), lengths in units of R
  const W = 420, H = 260, sc = 38, cx = W / 2, cy = H / 2;
  const f = (z, rho) => { const r = Math.hypot(z, rho); return 0.5 * rho * rho * (1 - 1.5 / r + 0.5 / (r * r * r)); };
  const levels = [0.02, 0.1, 0.25, 0.5, 0.9, 1.5, 2.3];
  const zs = lin(-5.2, 5.2, 140);
  const lines = levels.map((psi) =>
    zs.map((z) => {
      let lo = Math.abs(z) < 1 ? Math.sqrt(1 - z * z) + 1e-6 : 1e-6, hi = 4;
      if (f(z, hi) < psi) return null;
      for (let k = 0; k < 50; k++) { const m = 0.5 * (lo + hi); if (f(z, m) < psi) lo = m; else hi = m; }
      return [z, 0.5 * (lo + hi)];
    }).filter(Boolean)
  );
  const P = (z, rho) => `${cx + z * sc},${cy - rho * sc}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <rect x={0} y={0} width={W} height={H} fill="#fff" stroke={C.line} />
      {lines.map((pts, i) => (
        <g key={i}>
          <polyline points={pts.map(([z, r]) => P(z, r)).join(" ")} fill="none" stroke={C.cool} strokeWidth={1.4} />
          <polyline points={pts.map(([z, r]) => P(z, -r)).join(" ")} fill="none" stroke={C.cool} strokeWidth={1.4} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={sc} fill={C.copperPale} stroke={C.copperDeep} strokeWidth={1.6} />
      <text x={cx} y={cy + 4} fontSize="12" textAnchor="middle" fill={C.ink}>R</text>
      <text x={10} y={18} fontSize="12" fill={C.inkSoft}>U →</text>
      <text x={W - 10} y={H - 8} fontSize="11" fill={C.inkSoft} textAnchor="end">{t("크리핑 흐름의 유선 (위아래, 앞뒤가 대칭)", "creeping-flow streamlines (symmetric fore and aft)")}</text>
    </svg>
  );
}

const PARTICLES = {
  silica: { kr: "실리카 입자 / 물 (CMP 슬러리)", en: "silica particle / water (CMP slurry)", rp: 2200, rf: 997, mu: 8.9e-4 },
  droplet: { kr: "물방울 / 공기 (에어로졸)", en: "water droplet / air (aerosol)", rp: 1000, rf: 1.18, mu: 1.8e-5 },
  sand: { kr: "모래 입자 / 물", en: "sand grain / water", rp: 2650, rf: 997, mu: 8.9e-4 },
  cell: { kr: "세포 / 배양액", en: "cell / culture medium", rp: 1050, rf: 1007, mu: 9.5e-4 },
};

function TabStokes({ t, lang }) {
  const [kind, setKind] = useState("silica");
  const [logd, setLogd] = useState(0);
  const p = PARTICLES[kind];
  const d = Math.pow(10, logd) * 1e-6, R = d / 2;
  const UT = (2 * R * R * (p.rp - p.rf) * 9.81) / (9 * p.mu);
  const Re = (p.rf * UT * d) / p.mu;
  const ds = logspace(-1, 2.5, 80);
  const curve = ds.map((dm) => { const r = dm * 0.5e-6; return [dm, (2 * r * r * (p.rp - p.rf) * 9.81) / (9 * p.mu)]; });
  const tFall = 0.01 / UT;
  return (
    <div>
      <Panel title={t("Stokes 방정식: 관성이 사라진 흐름", "The Stokes equation: flow without inertia")}>
        <P>
          {t(
            "Re = UR/ν ≪ 1이면 Navier–Stokes 식의 관성 항을 버릴 수 있습니다. 남는 Stokes 식은 선형이고 시간 미분이 없습니다. 그래서 흐름은 경계 조건의 변화에 거의 즉시 따라갑니다(준정상).",
            "When Re = UR/ν ≪ 1, the inertia terms of the Navier–Stokes equation can be dropped. The remaining Stokes equation is linear and has no time derivative, so the flow follows changes in the boundary conditions almost instantly (pseudo-steady)."
          )}
        </P>
        <Eq block>ρ Dv/Dt = −∇P + μ∇²v &nbsp;⇒&nbsp; 0 ≈ −∇P + μ∇²v</Eq>
        <P>
          {t(
            "축대칭 흐름에서는 유선 함수 ψ로 연속 방정식을 없앱니다. Stokes 식은 E⁴ψ = 0이 되고, 먼 곳 조건 ψ → ½Ur² sin²θ를 보고 ψ = f(r) sin²θ로 둡니다. f를 rⁿ의 합으로 놓고 벽 조건(v_r = v_θ = 0)을 넣으면 다음 해가 나옵니다.",
            "For axisymmetric flow a stream function ψ removes continuity. The Stokes equation becomes E⁴ψ = 0; the far-field condition ψ → ½Ur² sin²θ suggests ψ = f(r) sin²θ. Writing f as a sum of powers rⁿ and imposing no slip (v_r = v_θ = 0) gives"
          )}
        </P>
        <Eq block>ψ = U R² sin²θ [ ½(r/R)² − ¾(r/R) + ¼(R/r) ]</Eq>
        <Eq block>v_r = U cosθ [1 − (3/2)(R/r) + (1/2)(R/r)³], &nbsp; v_θ = −U sinθ [1 − (3/4)(R/r) − (1/4)(R/r)³]</Eq>
        <Grid2>
          <StokesStreamlines t={t} />
          <div>
            <P>
              {t(
                "항력은 표면의 압력과 전단응력을 적분해 얻습니다. 압력 P = −(3μU/2R)(R/r)² cosθ와 전단응력 τ_rθ = −(3μU/2R) sinθ를 구 표면에서 적분하면 Stokes 법칙이 나옵니다.",
                "The drag follows by integrating pressure and shear over the surface. Integrating P = −(3μU/2R)(R/r)² cosθ and τ_rθ = −(3μU/2R) sinθ over the sphere gives Stokes' law:"
              )}
            </P>
            <Eq block>F_D = 6πμUR = 2πμUR ({t("압력", "pressure")}) + 4πμUR ({t("전단", "shear")})</Eq>
            <Note>
              {t(
                "항력의 1/3은 압력, 2/3은 전단응력에서 옵니다. 법선 점성 응력은 표면에서 0입니다.",
                "One third of the drag comes from pressure and two thirds from shear stress; the normal viscous stress vanishes on the surface."
              )}
            </Note>
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("시뮬레이션: 작은 입자는 얼마나 빨리 가라앉나", "Simulation: how fast do small particles settle?")}>
        <P>
          {t(
            "종말 속도에서는 부력을 뺀 무게와 항력이 같습니다: (4/3)πR³(ρ_p − ρ)g = 6πμU_T R. 따라서 U_T = 2R²(ρ_p − ρ)g/(9μ)이고, 입자 지름의 제곱에 비례합니다.",
            "At terminal velocity the weight net of buoyancy equals the drag: (4/3)πR³(ρ_p − ρ)g = 6πμU_T R. Hence U_T = 2R²(ρ_p − ρ)g/(9μ), proportional to the square of the diameter."
          )}
        </P>
        <Grid2>
          <div>
            <Select label={t("계", "system")} value={kind} onChange={setKind}
              options={Object.entries(PARTICLES).map(([k, v]) => ({ v: k, label: lang === "kr" ? v.kr : v.en }))} />
            <Slider label={t("입자 지름 d", "particle diameter d")} value={logd} min={-1} max={2.5} step={0.01} onChange={setLogd} fmt={() => `${sci(d * 1e6, 3)} μm`} />
            <Readout>
              U_T = {sci(UT, 3)} m/s ({sci(UT * 3.6e6, 3)} mm/h)<br />
              Re = ρU_T d/μ = {sci(Re, 2)} {Re < 0.1 ? t("→ Stokes 법칙 유효", "→ Stokes' law valid") : Re < 1 ? t("→ 경계 근처", "→ near the limit") : t("→ Stokes 법칙 벗어남", "→ beyond Stokes' law")}<br />
              {t("1 cm 가라앉는 시간", "time to settle 1 cm")} = {tFall > 3600 ? `${(tFall / 3600).toFixed(2)} h` : `${tFall.toFixed(1)} s`}
            </Readout>
            <Note>
              {t(
                "공학적 의미: 1 μm 실리카는 물속에서 1 cm 가라앉는 데 약 4시간이 걸립니다. CMP 슬러리가 오래 안정한 이유이고, 반대로 응집해 커지면 지름 제곱으로 빨리 가라앉아 결함의 원인이 됩니다.",
                "Engineering meaning: a 1 μm silica particle needs about 4 hours to settle 1 cm in water. That is why CMP slurries stay stable, and why agglomerates, settling with the square of their size, become a source of defects."
              )}
            </Note>
          </div>
          <Chart xr={[0.1, 300]} yr={[1e-9, 1]} xlog ylog xl={t("입자 지름 d (μm)", "particle diameter d (μm)")} yl="U_T (m/s)"
            series={[{ pts: curve, color: C.copper, width: 2.6 }]}
            dots={[{ x: d * 1e6, y: UT }]} />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: mass transfer to a sphere ---------------------------------- */
const shAT = (PeR) => (PeR <= 0 ? 2 : 2 * (1 + PeR / 4 + (PeR * PeR / 8) * Math.log(PeR) + 0.01702 * PeR * PeR + (PeR ** 3 / 32) * Math.log(PeR)));
const shBH = (Ped) => Math.sqrt(4 + 1.21 * Math.pow(Ped, 2 / 3));
const shLargePe = (Ped) => 0.991 * Math.cbrt(Ped);
const shFroessling = (Re, Sc) => 2 + 0.552 * Math.sqrt(Re) * Math.cbrt(Sc);

function TabSphereSh({ t }) {
  const [logPe, setLogPe] = useState(1);
  const Ped = Math.pow(10, logPe);
  const pes = logspace(-2, 5, 160);
  // Froessling calculator
  const [dmm, setDmm] = useState(1);
  const [U, setU] = useState(1);
  const nu = 1.55e-5, D = 6.1e-6;
  const ReF = (U * dmm * 1e-3) / nu, ScF = nu / D, ShF = shFroessling(ReF, ScF);
  return (
    <div>
      <Panel title={t("Pe ≪ 1: 확산만 남으면 Sh = 2", "Pe ≪ 1: with diffusion alone, Sh = 2")}>
        <P>
          {t(
            "무차원 온도(또는 농도) Θ와 ξ = r/R, Pe = UR/D를 쓰면 지배식은 Pe ṽ·∇Θ = ∇²Θ입니다. Pe ≪ 1이면 왼쪽을 버릴 수 있고, 구가 등방이므로 Θ는 ξ에만 의존합니다.",
            "With the dimensionless temperature (or concentration) Θ, ξ = r/R and Pe = UR/D, the governing equation is Pe ṽ·∇Θ = ∇²Θ. For Pe ≪ 1 the left side drops out, and because the sphere is isotropic Θ depends on ξ only."
          )}
        </P>
        <Eq block>(1/ξ²) d/dξ (ξ² dΘ/dξ) = 0, &nbsp;Θ(1) = 1, Θ(∞) = 0 &nbsp;⇒&nbsp; Θ = 1/ξ &nbsp;⇒&nbsp; Sh = k_c(2R)/D = −2 dΘ/dξ|₁ = 2</Eq>
        <P>
          {t(
            "이때 전달은 표면 전체에서 균일하므로, 국소 Sh와 평균 Sh가 같습니다. 다른 형상도 같은 방식으로 구합니다.",
            "Transfer is then uniform over the surface, so local and mean Sh coincide. Other shapes follow the same way:"
          )}
        </P>
        <Table head={[t("형상", "Shape"), t("길이 L", "Length L"), "Sh (Pe ≪ 1)"]}
          rows={[
            [t("구", "sphere"), "2R", "2"],
            [t("편평 회전타원체 (a/b = 1/2)", "oblate spheroid (a/b = 1/2)"), "2b", "2.40"],
            [t("원판", "circular disk"), "2R", "8/π = 2.55"],
            [t("정사각 판", "square plate"), "a", "π/ln 4 = 2.27"],
          ]} />
        <P>
          {t(
            "Pe가 조금 커지면 특이 섭동법(Acrivos–Taylor)으로 보정항이 붙습니다(Pe = UR/D, Pe ≲ 1).",
            "As Pe grows a little, singular perturbation (Acrivos–Taylor) adds corrections (Pe = UR/D, Pe ≲ 1):"
          )}
        </P>
        <Eq block>Sh = 2 [1 + Pe/4 + (Pe²/8) ln Pe + 0.01702 Pe² + (Pe³/32) ln Pe + …]</Eq>
      </Panel>

      <Panel title={t("Pe ≫ 1: 얇은 농도 경계층과 Pe^(1/3)", "Pe ≫ 1: a thin concentration layer and Pe^(1/3)")}>
        <P>
          {t(
            "Pe ≫ 1에서 확산 항을 통째로 버리면 구에서 유체로 전달될 길이 없어집니다. 그래서 영역을 둘로 나눕니다. 바깥에서는 대류만, 표면 근처의 얇은 층에서는 대류와 확산이 함께 작동합니다.",
            "Dropping diffusion entirely at Pe ≫ 1 leaves no way for material to leave the sphere. The domain is therefore split: convection alone outside, and convection plus diffusion in a thin layer at the surface."
          )}
        </P>
        <P>
          {t(
            "층 안에서는 늘인 좌표 Y = (ξ − 1)Pe^b를 씁니다. 표면 근처의 크리핑 흐름 속도는 벽 거리에 비례합니다. 이를 넣고 크기를 어림하면 대류 항은 Pe^(−b), 확산 항은 Pe^(2b−1) 차수입니다. 두 항이 같은 차수여야 층 안에서 둘이 함께 작동하므로 b = 1/3입니다.",
            "Inside the layer use the stretched coordinate Y = (ξ − 1)Pe^b. Near the surface the creeping-flow velocity grows linearly with wall distance, and balancing the convective order Pe^(−b) against the diffusive order Pe^(2b−1) gives b = 1/3."
          )}
        </P>
        <Eq block>{t("두께", "thickness")} δ_c/R ~ Pe^(−1/3) &nbsp;⇒&nbsp; Sh ~ R/δ_c ~ Pe^(1/3): &nbsp;&nbsp; Sh = 1.249 Pe^(1/3) = 0.991 Pe_d^(1/3) &nbsp;(Pe_d = Ud/D)</Eq>
        <Note>
          {t(
            "같은 결과가 평판 경계층에도 있습니다. Pr(Sc) ≫ 1이면 열(농도) 경계층이 속도 경계층 안쪽의 선형 속도 영역에 있어 δ_M/δ_T ~ Pr^(1/3)이고, Pr ≪ 1이면 바깥의 균일 속도 영역에 있어 δ_M/δ_T ~ Pr^(1/2)입니다.",
            "The flat-plate boundary layer shows the same result. For Pr (Sc) ≫ 1 the thermal (concentration) layer lies in the linear-velocity region inside the momentum layer, giving δ_M/δ_T ~ Pr^(1/3); for Pr ≪ 1 it lies in the uniform outer flow, giving δ_M/δ_T ~ Pr^(1/2)."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 전체 Pe 범위의 Sh", "Simulation: Sh over the whole Pe range")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Pe_d" value={logPe} min={-2} max={5} step={0.02} onChange={setLogPe} fmt={(x) => `${x.toFixed(2)} (Pe_d = ${sci(Ped, 2)})`} />
            <Readout>
              Brian–Hales: Sh = (4 + 1.21 Pe_d^(2/3))^(1/2) = {shBH(Ped).toFixed(3)}<br />
              {Ped <= 2 && <>Acrivos–Taylor (Pe = Pe_d/2): {shAT(Ped / 2).toFixed(3)}<br /></>}
              {t("얇은 층", "thin layer")}: 0.991 Pe_d^(1/3) = {shLargePe(Ped).toFixed(3)}<br />
              0.991 Pe_d^(1/3) + 0.922 = {(shLargePe(Ped) + 0.922).toFixed(3)}
            </Readout>
            <Note>
              {t(
                "Pe 정의를 확인하십시오. 이론식은 반지름(Pe = UR/D), 상관식은 지름(Pe_d = Ud/D = 2Pe)을 씁니다. Brian–Hales 식은 Pe_d → 0에서 Sh → 2가 되므로 지름 기준입니다.",
                "Check the Pe definition. The theory uses the radius (Pe = UR/D); the correlations use the diameter (Pe_d = Ud/D = 2Pe). The Brian–Hales formula tends to Sh → 2 as Pe_d → 0, so it is diameter-based."
              )}
            </Note>
          </div>
          <Chart xr={[0.01, 1e5]} yr={[1, 100]} xlog ylog xl="Pe_d = U d / D" yl="Sh = k_c d / D"
            series={[
              { pts: pes.map((p) => [p, shBH(p)]), color: C.copper, width: 2.6 },
              { pts: pes.filter((p) => p <= 2).map((p) => [p, shAT(p / 2)]), color: C.good, width: 2, dash: "6 4" },
              { pts: pes.filter((p) => p >= 1).map((p) => [p, shLargePe(p)]), color: C.cool, width: 2, dash: "6 4" },
            ]}
            hlines={[{ y: 2, color: C.inkSoft }]}
            dots={[{ x: Ped, y: shBH(Ped) }]}
            legend={[{ label: "Brian–Hales", color: C.copper }, { label: "Acrivos–Taylor", color: C.good, dash: "6 4" }, { label: "0.991 Pe_d^(1/3)", color: C.cool, dash: "6 4" }]} legendAt="tl" />
        </Grid2>
      </Panel>

      <Panel title={t("기체 흐름 속 구: Froessling 식", "A sphere in a gas stream: the Froessling equation")}>
        <P>
          {t(
            "Re가 커져 크리핑 흐름이 아니면 Sh = Sh_ideal + C Re^m Sc^(1/3) 꼴을 씁니다. 기체에서는 Froessling 식이 대표적입니다(2 < Re < 800, 0.6 < Sc < 2.7).",
            "Beyond creeping flow one uses Sh = Sh_ideal + C Re^m Sc^(1/3). For gases the standard form is the Froessling equation (2 < Re < 800, 0.6 < Sc < 2.7):"
          )}
        </P>
        <Eq block>Sh = 2 + 0.552 Re^(1/2) Sc^(1/3)</Eq>
        <Grid2>
          <div>
            <Slider label={t("나프탈렌 구 지름 d", "naphthalene sphere diameter d")} value={dmm} min={0.2} max={10} step={0.1} onChange={setDmm} unit=" mm" />
            <Slider label={t("공기 속도 U", "air velocity U")} value={U} min={0.05} max={5} step={0.05} onChange={setU} unit=" m/s" />
          </div>
          <Readout>
            Re = {ReF.toFixed(1)} {ReF < 2 || ReF > 800 ? t("(범위 밖)", "(out of range)") : ""}, &nbsp;Sc = {ScF.toFixed(2)}<br />
            Sh = {ShF.toFixed(2)} &nbsp;({t("순수 확산 2의", "")} {(ShF / 2).toFixed(1)}{t("배", "× pure diffusion")})<br />
            k_c = {sci((ShF * D) / (dmm * 1e-3), 3)} m/s
          </Readout>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: pipes and packed beds ---------------------------------- */
const shGilliland = (Re, Sc) => 0.023 * Math.pow(Re, 0.83) * Math.pow(Sc, 0.44);
const shLinton = (Re, Sc) => 0.023 * Math.pow(Re, 0.83) * Math.cbrt(Sc);
const shLamTube = (Re, Sc, dL) => 1.86 * Math.cbrt(Re * Sc * dL);
const jDbedGas = (Re) => 1.17 * Math.pow(Re, -0.415);
const epsjDWilson = (Re) => (Re < 55 ? 1.09 * Math.pow(Re, -2 / 3) : 0.25 * Math.pow(Re, -0.31));

function TabConfined({ t }) {
  // pipe
  const [logRe, setLogRe] = useState(4);
  const [logSc, setLogSc] = useState(3);
  const [Ld, setLd] = useState(100);
  const Re = Math.pow(10, logRe), Sc = Math.pow(10, logSc);
  const res = logspace(1, 4.6, 140);
  const lam = res.filter((r) => r <= 2000).map((r) => [r, shLamTube(r, Sc, 1 / Ld)]);
  const turbL = res.filter((r) => r >= 2000).map((r) => [r, shLinton(r, Sc)]);
  const turbG = res.filter((r) => r >= 2000).map((r) => [r, shGilliland(r, Sc)]);
  const pipeSh = Re <= 2000 ? shLamTube(Re, Sc, 1 / Ld) : Sc > 100 ? shLinton(Re, Sc) : shGilliland(Re, Sc);
  // packed bed
  const [dp, setDp] = useState(6);
  const [vs, setVs] = useState(1);
  const [eps, setEps] = useState(0.4);
  const nuW = 8.9e-7, DW = 8.9e-10, ScW = nuW / DW;
  const ReB = (dp * 1e-3 * vs * 1e-3) / nuW;
  const jD = epsjDWilson(ReB) / eps;
  const kcB = (jD * vs * 1e-3) / Math.pow(ScW, 2 / 3);
  const rb = logspace(-2.7, 3.2, 140);
  return (
    <div>
      <Panel title={t("관 속 흐름의 상관식", "Correlations for flow in pipes")}>
        <P>
          {t(
            "관에서는 흐름이 벽에 갇혀 있어 경계층이 관 중심에서 만납니다. 그래서 평판과 달리 길이 L은 관 지름 d를 쓰고, 층류에서는 관 길이도 들어갑니다.",
            "In a pipe the flow is confined and the boundary layers meet at the axis. Unlike the plate, the length scale is the diameter d, and in laminar flow the pipe length also enters."
          )}
        </P>
        <Table head={[t("조건", "Condition"), t("상관식", "Correlation"), t("범위", "Range")]}
          rows={[
            [t("기체, 난류 (Gilliland–Sherwood, 관벽 액체의 증발)", "gas, turbulent (Gilliland–Sherwood, evaporation of a wall liquid)"), "Sh (p_B,lm/P) = 0.023 Re^0.83 Sc^0.44", "2000 < Re < 35000, 0.6 < Sc < 2.5"],
            [t("액체, 난류 (Linton–Sherwood)", "liquid, turbulent (Linton–Sherwood)"), "Sh = 0.023 Re^0.83 Sc^(1/3)", "2000 < Re < 35000, 1000 < Sc < 2260"],
            [t("층류", "laminar"), "Sh = 1.86 (Re Sc d/L)^(1/3)", "10 < Re < 2000"],
          ]} />
        <Note>
          {t(
            "p_B,lm/P는 10주차의 '정지한 B를 통한 확산' 보정입니다. 증발하는 성분이 희박하면 1에 가깝습니다. 층류 식에서 Sh가 L^(−1/3)로 줄어드는 것은 관을 따라 농도 경계층이 계속 두꺼워지기 때문입니다.",
            "p_B,lm/P is the 'diffusion through stagnant B' correction of Week 10; it is close to 1 when the evaporating species is dilute. In the laminar formula Sh falls as L^(−1/3) because the concentration layer keeps thickening along the pipe."
          )}
        </Note>
        <Grid2>
          <div>
            <Slider label="log₁₀ Re" value={logRe} min={1} max={4.54} step={0.02} onChange={setLogRe} fmt={(x) => `${x.toFixed(2)} (Re = ${sci(Re, 2)})`} />
            <Slider label="log₁₀ Sc" value={logSc} min={-0.2} max={3.4} step={0.02} onChange={setLogSc} fmt={(x) => `${x.toFixed(2)} (Sc = ${sci(Sc, 2)})`} />
            <Slider label="L / d" value={Ld} min={10} max={1000} step={10} onChange={setLd} />
            <Readout>
              {Re <= 2000 ? t("층류: 1.86(Re Sc d/L)^(1/3)", "laminar: 1.86(Re Sc d/L)^(1/3)") : Sc > 100 ? "Linton–Sherwood" : "Gilliland–Sherwood"}<br />
              Sh = {pipeSh.toFixed(2)}
              {Re > 2000 && (Sc > 2.5 && Sc < 1000) ? <><br />{t("주의: 이 Sc는 두 상관식 어느 범위에도 없습니다.", "Caution: this Sc lies outside both correlations' ranges.")}</> : null}
            </Readout>
          </div>
          <Chart xr={[10, 4e4]} yr={[1, 3000]} xlog ylog xl="Re = v d / ν" yl="Sh = k_c d / D"
            series={[
              { pts: lam, color: C.good, width: 2.4 },
              { pts: turbL, color: C.copper, width: 2.4 },
              { pts: turbG, color: C.cool, width: 2, dash: "6 4" },
            ]}
            vlines={[{ x: 2000, color: C.inkSoft }]}
            dots={[{ x: Re, y: pipeSh }]}
            legend={[{ label: t("층류 1.86(…)^(1/3)", "laminar 1.86(…)^(1/3)"), color: C.good }, { label: "Linton–Sherwood", color: C.copper }, { label: "Gilliland–Sherwood", color: C.cool, dash: "6 4" }]} legendAt="tl" />
        </Grid2>
      </Panel>

      <Panel title={t("충전층과 유동층", "Packed and fluidized beds")}>
        <P>
          {t(
            "충전층에서는 입자 사이의 좁은 통로를 유체가 지나므로, 빈 관 기준 속도(겉보기 속도) v′와 입자 지름 d_p로 Re를 정의하고 j_D로 정리합니다.",
            "In a packed bed the fluid threads narrow channels between particles, so Re is defined with the superficial (empty-tube) velocity v′ and the particle diameter d_p, and the data are expressed through j_D."
          )}
        </P>
        <Eq block>j_D = (k_c / v′) Sc^(2/3), &nbsp; Re = d_p v′ ρ / μ = d_p G / μ</Eq>
        <Table head={[t("조건", "Condition"), t("상관식", "Correlation"), t("범위", "Range")]}
          rows={[
            [t("기체", "gases"), "j_D = 1.17 Re^(−0.415)", "10 < Re < 2500"],
            [t("액체 (Wilson–Geankoplis)", "liquids (Wilson–Geankoplis)"), "ε j_D = 1.09 Re^(−2/3)", "0.0016 < Re < 55, 165 < Sc < 70600, 0.35 < ε < 0.75"],
            [t("액체 (Wilson–Geankoplis)", "liquids (Wilson–Geankoplis)"), "ε j_D = 0.250 Re^(−0.31)", "55 < Re < 1500, 165 < Sc < 10690"],
          ]} />
        <Note>
          {t(
            "강의 슬라이드에는 첫 액체 식이 ε j_D = 1.09/Re로 적혀 있지만, 원 상관식의 지수는 −2/3입니다. 지수가 −2/3이어야 Re = 55에서 두 식이 이어집니다(0.0754 대 0.0722). 또 G가 질량 유속(kg/m²·s)이면 Re = d_p G/μ이고 ρ가 들어가지 않습니다.",
            "The lecture slide writes the first liquid correlation as ε j_D = 1.09/Re, but the original exponent is −2/3; only then do the two branches meet at Re = 55 (0.0754 versus 0.0722). Also, with G a mass flux (kg/m²·s), Re = d_p G/μ without an extra ρ."
          )}
        </Note>
        <Grid2>
          <div>
            <P>{t("예: 벤조산 구 충전층을 지나는 물 (Sc = 1000)", "Example: water through a bed of benzoic acid spheres (Sc = 1000)")}</P>
            <Slider label={t("입자 지름 d_p", "particle diameter d_p")} value={dp} min={1} max={20} step={0.5} onChange={setDp} unit=" mm" />
            <Slider label={t("겉보기 속도 v′", "superficial velocity v′")} value={vs} min={0.05} max={20} step={0.05} onChange={setVs} unit=" mm/s" />
            <Slider label={t("공극률 ε", "void fraction ε")} value={eps} min={0.35} max={0.75} step={0.01} onChange={setEps} fmt={(x) => x.toFixed(2)} />
            <Readout>
              Re = {ReB.toFixed(2)} {ReB > 1500 ? t("(범위 밖)", "(out of range)") : ""}<br />
              ε j_D = {epsjDWilson(ReB).toFixed(4)}, &nbsp;j_D = {jD.toFixed(4)}<br />
              k_c = {sci(kcB, 3)} m/s, &nbsp;Sh = k_c d_p/D = {((kcB * dp * 1e-3) / DW).toFixed(1)}
            </Readout>
          </div>
          <Chart xr={[0.002, 1500]} yr={[0.005, 20]} xlog ylog xl="Re = d_p v′ ρ/μ" yl="ε j_D"
            series={[{ pts: rb.map((r) => [r, epsjDWilson(r)]), color: C.copper, width: 2.6 }]}
            vlines={[{ x: 55, color: C.inkSoft }]}
            dots={[{ x: ReB, y: epsjDWilson(ReB) }]} />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: equilibrium ---------------------------------- */
const HENRY = {
  o2: { kr: "산소 O₂", en: "oxygen O₂", H: 4.3e4, M: 32, yAir: 0.21 },
  n2: { kr: "질소 N₂", en: "nitrogen N₂", H: 8.6e4, M: 28, yAir: 0.78 },
  co2: { kr: "이산화탄소 CO₂", en: "carbon dioxide CO₂", H: 1.6e3, M: 44, yAir: 0.0004 },
};

function TabEquilibrium({ t, lang }) {
  const [gas, setGas] = useState("o2");
  const [p, setP] = useState(0.21);
  const g = HENRY[gas];
  const x = p / g.H;
  const cmol = x * 55.5; // mol/L for dilute aqueous solution
  const mgL = cmol * g.M * 1000;
  return (
    <div>
      <Panel title={t("계면에서는 상평형이 성립한다", "Phase equilibrium holds at the interface")}>
        <P>
          {t(
            "두 상 사이의 전달에서 계면 자체는 저항이 없다고 봅니다. 그래서 계면 양쪽의 조성은 상평형 관계로 이어집니다. 대표적인 관계는 다음 세 가지입니다.",
            "In interphase transfer the interface itself is taken to offer no resistance, so the compositions on its two sides are linked by phase equilibrium. Three relations are standard:"
          )}
        </P>
        <Table head={[t("법칙", "Law"), t("식", "Equation"), t("적용", "Use")]}
          rows={[
            [t("Raoult 법칙", "Raoult's law"), "p_A = x_A P_A", t("이상 용액, 주성분 (P_A: 순수 A의 증기압)", "ideal solutions, major component (P_A: vapor pressure of pure A)")],
            [t("Dalton 법칙", "Dalton's law"), "p_A = y_A P", t("이상 기체의 분압", "partial pressure in an ideal gas")],
            [t("Henry 법칙", "Henry's law"), "p_A = H c_A  (= H′ x_A)", t("묽은 용액에 녹은 기체", "dilute dissolved gases")],
            [t("분배 법칙", "distribution law"), "c_A,1 = K c_A,2", t("두 액체 사이의 용질 분배 (예: log P_ow)", "solute partition between two liquids (e.g., log P_ow)")],
          ]} />
        <P>
          {t(
            "Raoult와 Dalton을 함께 쓰면 y_A = (P_A/P) x_A이고, Henry와 Dalton을 함께 쓰면 y_A = (H′/P) x_A = m x_A입니다. 기울기 m이 크면 잘 녹지 않는 기체입니다.",
            "Combining Raoult and Dalton gives y_A = (P_A/P) x_A; combining Henry and Dalton gives y_A = (H′/P) x_A = m x_A. A large slope m means a sparingly soluble gas."
          )}
        </P>
      </Panel>

      <Panel title={t("계산: 물에 녹는 기체의 양", "Calculation: how much gas dissolves in water")}>
        <Grid2>
          <div>
            <Select label={t("기체", "gas")} value={gas} onChange={(v) => { setGas(v); setP(HENRY[v].yAir); }}
              options={Object.entries(HENRY).map(([k, v]) => ({ v: k, label: lang === "kr" ? v.kr : v.en }))} />
            <Slider label={t("기체 분압 p_A", "partial pressure p_A")} value={p} min={0.0002} max={1} step={0.0002} onChange={setP} unit=" atm" fmt={(v) => v.toFixed(4)} />
            <Readout>
              H′ ≈ {sci(g.H, 2)} atm ({t("25 °C, 몰분율 기준", "25 °C, mole-fraction basis")})<br />
              x_A = p_A/H′ = {sci(x, 3)}<br />
              c_A ≈ 55.5 x_A = {sci(cmol, 3)} mol/L = {mgL.toFixed(2)} mg/L
            </Readout>
          </div>
          <Note>
            {t(
              "공기 중 산소(0.21 atm)는 25 °C 물에 약 8.7 mg/L 녹습니다. 측정된 포화 용존 산소(약 8.3 mg/L)와 비슷합니다. H′ 값은 설명용 대표값입니다.",
              "Oxygen in air (0.21 atm) dissolves to about 8.7 mg/L in water at 25 °C, close to the measured saturation of about 8.3 mg/L. The H′ values are representative, for illustration."
            )}
          </Note>
        </Grid2>
      </Panel>

      <Panel title={t("분배 계수: 두 액체 사이", "Partition coefficients: between two liquids")}>
        <P>
          {t(
            "용질이 서로 섞이지 않는 두 액체에 나뉘어 녹을 때, 농도 비 K는 일정합니다. 옥탄올–물 분배 계수 log P_ow는 약물의 막 투과성이나 환경 중 이동을 예측하는 데 쓰입니다(강의 표).",
            "When a solute partitions between two immiscible liquids, the concentration ratio K is constant. The octanol–water coefficient log P_ow predicts drug membrane permeability and environmental fate (lecture table):"
          )}
        </P>
        <Table head={[t("물질", "Compound"), "log P_ow", "T (°C)"]}
          rows={[
            [t("아세트아마이드", "acetamide"), "−1.16", "25"],
            [t("메탄올", "methanol"), "−0.81", "19"],
            [t("포름산", "formic acid"), "−0.41", "25"],
            [t("다이에틸 에테르", "diethyl ether"), "0.83", "20"],
            [t("p-다이클로로벤젠", "p-dichlorobenzene"), "3.37", "25"],
            [t("헥사메틸벤젠", "hexamethylbenzene"), "4.61", "25"],
          ]} />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: two-resistance theory ---------------------------------- */
function TabTwoFilm({ t }) {
  const [logm, setLogm] = useState(0.5);
  const [ky, setKy] = useState(1.0);  // ×1e-3 kmol/(m² s)
  const [kx, setKx] = useState(5.0);  // ×1e-3 kmol/(m² s)
  const [yB, setYB] = useState(0.05);
  const [xB, setXB] = useState(0.002);
  const m = Math.pow(10, logm);
  const Ky = 1 / (1 / ky + m / kx);            // ×1e-3
  const N = Ky * (yB - m * xB);                 // ×1e-3
  const yi = yB - N / ky, xi = xB + N / kx;
  const gasShare = (1 / ky) / (1 / Ky);
  const ystar = m * xB, xstar = yB / m;
  const xmax = Math.max(xB, xi, Math.min(xstar, 0.2)) * 1.6 + 1e-6;
  const ymax = Math.max(yB, m * xmax * 0.6) * 1.15;
  const eqPts = lin(0, xmax, 60).map((x) => [x, m * x]);
  const tie = [[xB, yB], [xi, yi]];
  return (
    <div>
      <Panel title={t("두 막의 저항이 직렬로", "Two film resistances in series")}>
        <P>
          {t(
            "이중 경막(two-resistance) 이론은 계면 양쪽에 얇은 정체 막이 있고, 각 막에서 물질이 확산으로만 지나간다고 봅니다. 정상상태에서는 기상 막을 지나는 플럭스와 액상 막을 지나는 플럭스가 같습니다.",
            "The two-resistance (two-film) theory pictures a thin stagnant film on each side of the interface, crossed by diffusion alone. At steady state the flux through the gas film equals the flux through the liquid film:"
          )}
        </P>
        <Eq block>N_A = k_y (y − y_i) = k_x (x_i − x), &nbsp; y_i = m x_i {t("(계면 평형)", "(interface equilibrium)")}</Eq>
        <P>
          {t(
            "1단계. 첫 식에서 −(N/k_x)를 기울기로 보면, 본체 점 (x, y)에서 계면 점 (x_i, y_i)로 가는 선의 기울기는 −k_x/k_y입니다. 2단계. 계면 조성을 소거하려고 y − y* = (y − y_i) + m(x_i − x)를 씁니다(y* = m x). 각 괄호에 플럭스 식을 넣으면 총괄 계수가 나옵니다.",
            "Step 1. From the first equation, the line from the bulk point (x, y) to the interface point (x_i, y_i) has slope −k_x/k_y. Step 2. To eliminate the interface compositions, write y − y* = (y − y_i) + m(x_i − x) with y* = m x. Inserting the flux expressions gives the overall coefficients:"
          )}
        </P>
        <Eq block>N_A = K_y (y − y*), &nbsp; 1/K_y = 1/k_y + m/k_x; &nbsp;&nbsp; N_A = K_x (x* − x), &nbsp; 1/K_x = 1/(m k_y) + 1/k_x</Eq>
        <P>
          {t(
            "강의의 분압·농도 표기(p_A = m c_A)로는 1/K_G = 1/k_G + m/k_L, 1/K_L = 1/(m k_G) + 1/k_L입니다. m이 작으면(잘 녹는 기체, NH₃) 기상 막이, m이 크면(잘 녹지 않는 기체, O₂) 액상 막이 저항을 차지합니다.",
            "In the lecture's partial-pressure and concentration notation (p_A = m c_A): 1/K_G = 1/k_G + m/k_L and 1/K_L = 1/(m k_G) + 1/k_L. Small m (very soluble gas, NH₃) puts the resistance in the gas film; large m (sparingly soluble gas, O₂) puts it in the liquid film."
          )}
        </P>
      </Panel>

      <Panel title={t("시뮬레이션: 계면 조성과 저항의 몫", "Simulation: interface composition and resistance shares")}>
        <Grid2>
          <div>
            <Slider label={t("평형 기울기 log₁₀ m", "equilibrium slope log₁₀ m")} value={logm} min={-1} max={4.6} step={0.02} onChange={setLogm} fmt={(v) => `${v.toFixed(2)} (m = ${sci(m, 2)})`} />
            <Slider label="k_y (×10⁻³ kmol/m²·s)" value={ky} min={0.1} max={10} step={0.1} onChange={setKy} fmt={(v) => v.toFixed(1)} />
            <Slider label="k_x (×10⁻³ kmol/m²·s)" value={kx} min={0.1} max={10} step={0.1} onChange={setKx} fmt={(v) => v.toFixed(1)} />
            <Slider label={t("기상 본체 y", "bulk gas y")} value={yB} min={0.005} max={0.2} step={0.005} onChange={setYB} fmt={(v) => v.toFixed(3)} />
            <Slider label={t("액상 본체 x", "bulk liquid x")} value={xB} min={0} max={0.02} step={0.0005} onChange={setXB} fmt={(v) => v.toFixed(4)} />
            <Readout>
              y_i = {yi.toFixed(5)}, &nbsp;x_i = {sci(xi, 3)}<br />
              K_y = {sci(Ky * 1e-3, 3)} kmol/m²·s<br />
              N_A = {sci(N * 1e-3, 3)} kmol/m²·s {N < 0 ? t("(탈거: 액체 → 기체)", "(stripping: liquid → gas)") : t("(흡수: 기체 → 액체)", "(absorption: gas → liquid)")}<br />
              {t("기상 막 저항의 몫", "gas-film share of resistance")} = {(gasShare * 100).toFixed(1)}%, {t("액상 막", "liquid film")} = {((1 - gasShare) * 100).toFixed(1)}%
            </Readout>
          </div>
          <Chart xr={[0, xmax]} yr={[0, ymax]} xl={t("액상 몰분율 x", "liquid mole fraction x")} yl={t("기상 몰분율 y", "gas mole fraction y")}
            series={[
              { pts: eqPts, color: C.cool, width: 2.4 },
              { pts: tie, color: C.copper, width: 2.4 },
              { pts: [[xB, yB], [xB, ystar]], color: C.inkSoft, width: 1.4, dash: "4 3" },
            ]}
            dots={[{ x: xB, y: yB }, { x: xi, y: yi, fill: C.cool, color: C.cool }]}
            labels={[
              { x: xB, y: yB, text: "P (x, y)", dx: 8, dy: -6 },
              { x: xi, y: yi, text: t("계면 (x_i, y_i)", "interface (x_i, y_i)"), dx: 8, dy: 14, color: C.cool },
            ]}
            legend={[{ label: t("평형선 y = m x", "equilibrium y = m x"), color: C.cool }, { label: t("기울기 −k_x/k_y", "slope −k_x/k_y"), color: C.copper }, { label: "y − y*", color: C.inkSoft, dash: "4 3" }]} legendAt="tl" />
        </Grid2>
        <Note>
          {t(
            "m을 끝까지 올려 보십시오. 계면 점이 본체 점 P 바로 아래(y_i ≈ y)로 붙습니다. 기상 쪽 구동력이 거의 없다는 뜻이고, 액상 막이 저항을 독점합니다. 반대로 m이 작으면 x_i ≈ x가 되어 기상 막이 저항을 차지합니다.",
            "Push m all the way up: the interface point sits right below P (y_i ≈ y). Almost no driving force remains on the gas side, and the liquid film holds the whole resistance. For small m, x_i ≈ x and the gas film holds it."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: packed tower ---------------------------------- */
function ntuOG(yb, ya, xa, LV, m) {
  const A = LV / m;
  if (Math.abs(A - 1) < 1e-6) return (yb - ya) / (ya - m * xa);
  return Math.log((1 - 1 / A) * ((yb - m * xa) / (ya - m * xa)) + 1 / A) / (1 - 1 / A);
}

function TowerSketch({ t }) {
  const W = 300, H = 240;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <defs><marker id="arT" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={C.ink} /></marker></defs>
      <rect x={100} y={30} width={100} height={180} fill="#fbf8f3" stroke={C.ink} strokeWidth={1.6} />
      {lin(0, 1, 9).map((u, i) => lin(0, 1, 5).map((v, j) => <circle key={i + "-" + j} cx={112 + v * 76} cy={45 + u * 150} r={5} fill="none" stroke={C.inkSoft} />))}
      <line x1={40} y1={42} x2={98} y2={42} stroke={C.cool} strokeWidth={2} markerEnd="url(#arT)" />
      <text x={8} y={36} fontSize="11.5" fill={C.cool}>{t("액체 L, x_a", "liquid L, x_a")}</text>
      <line x1={202} y1={36} x2={262} y2={36} stroke={C.copper} strokeWidth={2} markerEnd="url(#arT)" />
      <text x={214} y={28} fontSize="11.5" fill={C.copper}>{t("기체 V, y_a", "gas V, y_a")}</text>
      <line x1={40} y1={200} x2={98} y2={200} stroke={C.copper} strokeWidth={2} markerEnd="url(#arT)" />
      <text x={8} y={222} fontSize="11.5" fill={C.copper}>{t("기체 V, y_b", "gas V, y_b")}</text>
      <line x1={202} y1={206} x2={262} y2={206} stroke={C.cool} strokeWidth={2} markerEnd="url(#arT)" />
      <text x={210} y={226} fontSize="11.5" fill={C.cool}>{t("액체 L, x_b", "liquid L, x_b")}</text>
      <text x={150} y={22} fontSize="12" textAnchor="middle" fill={C.ink}>{t("꼭대기 a", "top a")}</text>
      <text x={150} y={234} fontSize="12" textAnchor="middle" fill={C.ink}>{t("바닥 b", "bottom b")}</text>
      <text x={210} y={124} fontSize="12" fill={C.ink}>Z</text>
    </svg>
  );
}

function TabTower({ t }) {
  const [yb, setYb] = useState(0.02);
  const [rec, setRec] = useState(0.95);
  const [m, setM] = useState(1.2);
  const [fac, setFac] = useState(1.5);
  const [HTU, setHTU] = useState(0.5);
  const xa = 0, ya = yb * (1 - rec);
  const LVmin = (yb - ya) / (yb / m - xa);
  const LV = fac * LVmin;
  const xb = xa + (yb - ya) / LV;
  const NTU = ntuOG(yb, ya, xa, LV, m);
  const Z = HTU * NTU;
  const A = LV / m;
  const xmax = (yb / m) * 1.1;
  const facs = lin(1.02, 4, 100);
  return (
    <div>
      <Panel title={t("충전탑의 구조와 운전", "Structure and operation of a packed tower")}>
        <Grid2>
          <TowerSketch t={t} />
          <div>
            <P>
              {t(
                "기체는 바닥에서, 액체는 꼭대기에서 들어가 서로 반대로 흐릅니다(향류). 충전물(라시히 링, 벌 새들, 폴 링 등)은 넓은 기액 접촉 면적을 만듭니다. 향류에서는 탑 전체에서 구동력이 고르게 유지됩니다.",
                "Gas enters at the bottom and liquid at the top, flowing counter-currently. The packing (Raschig rings, Berl saddles, Pall rings, …) creates a large gas–liquid contact area. Counter-current flow keeps the driving force fairly even along the tower."
              )}
            </P>
            <Note>
              {t(
                "기체 유량을 올리면 압력 손실이 커지고, 부하점(loading point)부터 액체가 탑에 붙잡히기 시작합니다. 범람점(flooding point)을 넘으면 액체가 내려가지 못합니다. 설계 유량은 보통 범람 유량보다 충분히 낮게 잡습니다.",
                "Raising the gas rate increases the pressure drop; from the loading point liquid starts to be held up in the tower, and beyond the flooding point it can no longer flow down. Design gas rates stay well below flooding."
              )}
            </Note>
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("유도: 조작선, 최소 액기비, HTU × NTU", "Derivation: operating line, minimum L/V, HTU × NTU")}>
        <P>
          {t(
            "1단계(조작선). 꼭대기에서 임의 높이까지의 상자에 A의 물질수지를 세웁니다. 묽은 계에서는 L과 V가 거의 일정합니다.",
            "Step 1 (operating line). Balance A over a box from the top down to an arbitrary height. In a dilute system L and V are nearly constant:"
          )}
        </P>
        <Eq block>L x_a + V y = L x + V y_a &nbsp;⇒&nbsp; y = (L/V) x + (y_a − (L/V) x_a)</Eq>
        <P>
          {t(
            "2단계(최소 액기비). L/V를 줄이면 조작선이 평형선에 다가갑니다. 바닥에서 두 선이 만나면(x_b = y_b/m) 구동력이 0이 되어 무한히 높은 탑이 필요합니다. 이때의 L/V가 최소값입니다.",
            "Step 2 (minimum L/V). Lowering L/V swings the operating line toward the equilibrium line. When they touch at the bottom (x_b = y_b/m) the driving force vanishes and an infinitely tall tower would be needed; that L/V is the minimum."
          )}
        </P>
        <Eq block>(L/V)_min = (y_b − y_a) / (y_b/m − x_a)</Eq>
        <P>
          {t(
            "3단계(높이). 두께 dz, 단면적 S인 조각에서 '기체가 잃은 A = 액체로 넘어간 A'입니다: −V dy = K_y a (y − y*) S dz. 여기서 a는 단위 부피당 기액 접촉 면적입니다. 적분하면 높이가 두 인자의 곱으로 나뉩니다.",
            "Step 3 (height). In a slice of thickness dz and cross-section S, the A lost by the gas equals the A taken up by the liquid: −V dy = K_y a (y − y*) S dz, where a is the gas–liquid area per unit volume. Integrating splits the height into two factors:"
          )}
        </P>
        <Eq block>Z = [G_M / (K_y a)] × ∫ dy/(y − y*) = HTU_OG × NTU_OG, &nbsp;&nbsp; G_M = V/S</Eq>
        <P>
          {t(
            "HTU는 '전달 단위 하나의 높이'로 충전물과 유량이 정하고, NTU는 '얼마나 어려운 분리인가'로 조성과 평형이 정합니다. 직선 평형과 직선 조작선이면 NTU를 닫힌 꼴로 적분할 수 있습니다(A = L/(mV), 흡수 인자).",
            "HTU, the height of one transfer unit, is set by the packing and flow rates; NTU, how hard the separation is, by the compositions and equilibrium. With straight equilibrium and operating lines, NTU integrates in closed form (A = L/(mV), the absorption factor):"
          )}
        </P>
        <Eq block>NTU_OG = ln[ (1 − 1/A)(y_b − m x_a)/(y_a − m x_a) + 1/A ] / (1 − 1/A)</Eq>
        <Note>
          {t(
            "막별로도 같은 정의가 있습니다: HTU_G = G_M/(k_y a), HTU_L = L_M/(k_x a). 둘을 합치면 HTU_OG = HTU_G + (mG_M/L_M) HTU_L입니다. 잘 녹지 않는 기체(O₂)는 HTU_L이, 잘 녹는 기체(NH₃)는 HTU_G가 지배합니다.",
            "Film-wise definitions follow the same pattern: HTU_G = G_M/(k_y a), HTU_L = L_M/(k_x a), combining to HTU_OG = HTU_G + (mG_M/L_M) HTU_L. HTU_L dominates for sparingly soluble gases (O₂), HTU_G for very soluble ones (NH₃)."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 흡수탑 설계", "Simulation: designing an absorber")}>
        <Grid2>
          <div>
            <Slider label={t("입구 기체 y_b", "inlet gas y_b")} value={yb} min={0.005} max={0.05} step={0.001} onChange={setYb} fmt={(v) => v.toFixed(3)} />
            <Slider label={t("회수율", "recovery")} value={rec} min={0.5} max={0.995} step={0.005} onChange={setRec} fmt={(v) => `${(v * 100).toFixed(1)}%`} />
            <Slider label={t("평형 기울기 m", "equilibrium slope m")} value={m} min={0.2} max={5} step={0.05} onChange={setM} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("L/V ÷ (L/V)_min", "L/V ÷ (L/V)_min")} value={fac} min={1.02} max={4} step={0.02} onChange={setFac} fmt={(v) => v.toFixed(2)} />
            <Slider label="HTU_OG" value={HTU} min={0.2} max={1.5} step={0.05} onChange={setHTU} unit=" m" fmt={(v) => v.toFixed(2)} />
            <Readout>
              y_a = {ya.toFixed(5)}, &nbsp;(L/V)_min = {LVmin.toFixed(3)}<br />
              L/V = {LV.toFixed(3)}, &nbsp;A = L/(mV) = {A.toFixed(3)}, &nbsp;x_b = {xb.toFixed(5)}<br />
              NTU_OG = {NTU.toFixed(2)} → <b>Z = {Z.toFixed(2)} m</b>
            </Readout>
          </div>
          <Chart xr={[0, xmax]} yr={[0, yb * 1.1]} xl={t("액상 몰분율 x", "liquid mole fraction x")} yl={t("기상 몰분율 y", "gas mole fraction y")}
            series={[
              { pts: lin(0, xmax, 40).map((x) => [x, m * x]), color: C.cool, width: 2.4 },
              { pts: [[xa, ya], [xb, yb]], color: C.copper, width: 2.6 },
              { pts: [[xa, ya], [yb / m, yb]], color: C.copper, width: 1.4, dash: "5 4" },
            ]}
            dots={[{ x: xa, y: ya }, { x: xb, y: yb }]}
            labels={[{ x: xa, y: ya, text: "a", dx: 6, dy: -6 }, { x: xb, y: yb, text: "b", dx: -14, dy: -4 }]}
            legend={[{ label: t("평형선", "equilibrium line"), color: C.cool }, { label: t("조작선", "operating line"), color: C.copper }, { label: t("최소 L/V", "minimum L/V"), color: C.copper, dash: "5 4" }]} legendAt="tl" />
        </Grid2>
        <Chart xr={[1, 4]} yr={[0, Math.min(30, ntuOG(yb, ya, xa, 1.05 * LVmin, m) * HTU * 1.1)]} xl="L/V ÷ (L/V)_min" yl={t("탑 높이 Z (m)", "tower height Z (m)")}
          series={[{ pts: facs.map((f) => [f, HTU * ntuOG(yb, ya, xa, f * LVmin, m)]), color: C.copper, width: 2.6 }]}
          dots={[{ x: fac, y: Z }]} />
        <Note>
          {t(
            "액기비가 최소값에 가까울수록 탑이 급격히 높아지고, 크게 하면 탑은 낮아지지만 용매와 재생 비용이 늡니다. 그래서 보통 최소값의 1.1–1.5배 근처에서 정합니다(강의).",
            "As L/V nears its minimum the tower grows steeply; a large L/V shortens it but raises solvent and regeneration costs. A value around 1.1–1.5 times the minimum is typical (lecture)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 10: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t("P1. 25 °C 공기가 5 m/s로 길이 0.3 m의 나프탈렌 판 위를 흐른다(ν = 1.55×10⁻⁵, D = 6.1×10⁻⁶ m²/s). 평균 k_c를 구하라.",
        "P1. Air at 25 °C flows at 5 m/s over a naphthalene plate 0.3 m long (ν = 1.55×10⁻⁵, D = 6.1×10⁻⁶ m²/s). Find the mean k_c."),
      s: t("Re_L = 5 × 0.3/1.55×10⁻⁵ = 9.68×10⁴ < 2×10⁵이므로 층류입니다. Sc = 2.54. Sh_L = 0.664 Re_L^(1/2) Sc^(1/3) = 0.664 × 311.1 × 1.365 = 282. k_c = 282 × 6.1×10⁻⁶/0.3 = 5.73×10⁻³ m/s.",
        "Re_L = 5 × 0.3/1.55×10⁻⁵ = 9.68×10⁴ < 2×10⁵, so laminar. Sc = 2.54. Sh_L = 0.664 Re_L^(1/2) Sc^(1/3) = 0.664 × 311.1 × 1.365 = 282. k_c = 282 × 6.1×10⁻⁶/0.3 = 5.73×10⁻³ m/s."),
    },
    {
      q: t("P2. 같은 공기가 15 m/s로 길이 1 m의 판 위를 흐르면 k_c는 몇 배가 되는가?",
        "P2. If the same air flows at 15 m/s over a 1 m plate, by what factor does k_c change?"),
      s: t("Re_L = 9.68×10⁵ > 2×10⁵이므로 난류 식을 씁니다. Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3) = 3061. k_c = 3061 × 6.1×10⁻⁶/1 = 1.87×10⁻² m/s로 P1의 약 3.3배입니다. 판이 길어졌는데도 커진 것은 난류 때문입니다.",
        "Re_L = 9.68×10⁵ > 2×10⁵, so use the turbulent formula: Sh_L = 0.0365 Re_L^(4/5) Sc^(1/3) = 3061 and k_c = 3061 × 6.1×10⁻⁶/1 = 1.87×10⁻² m/s, about 3.3 times P1. It rises despite the longer plate because the flow is turbulent."),
    },
    {
      q: t("P3. 강의의 CVD 예제에서 웨이퍼 시작점을 X = 2 cm로 옮기면 x = 9 cm의 k_c는?",
        "P3. In the lecture's CVD example, move the wafer start to X = 2 cm. What is k_c at x = 9 cm?"),
      s: t("Re_x = 158.3, Sc = 3.67은 그대로입니다. [Sc/(1 − (2/9)^(3/4))]^(1/3) = 1.757. Sh_x = 0.332 × 12.58 × 1.757 = 7.34. k_c = 7.34 × 1.55/9 = 1.26 cm/s로, X = 4 cm일 때(1.44 cm/s)보다 작습니다. 농도 경계층이 더 일찍 시작해 더 두꺼워졌기 때문입니다.",
        "Re_x = 158.3 and Sc = 3.67 are unchanged. [Sc/(1 − (2/9)^(3/4))]^(1/3) = 1.757, Sh_x = 0.332 × 12.58 × 1.757 = 7.34 and k_c = 7.34 × 1.55/9 = 1.26 cm/s, below the X = 4 cm value (1.44 cm/s): the concentration layer started earlier and is thicker."),
    },
    {
      q: t("P4. 지름 2 μm 실리카 입자(ρ_p = 2200 kg/m³)가 25 °C 물(ρ = 997 kg/m³, μ = 8.9×10⁻⁴ Pa·s)에서 1 cm 가라앉는 데 걸리는 시간은? Stokes 법칙이 맞는지도 확인하라.",
        "P4. How long does a 2 μm silica particle (ρ_p = 2200 kg/m³) take to settle 1 cm in water at 25 °C (ρ = 997 kg/m³, μ = 8.9×10⁻⁴ Pa·s)? Check that Stokes' law applies."),
      s: t("U_T = 2R²(ρ_p − ρ)g/(9μ) = 2 × (10⁻⁶)² × 1203 × 9.81/(9 × 8.9×10⁻⁴) = 2.95×10⁻⁶ m/s. 1 cm에는 3.4×10³ s ≈ 0.94시간이 걸립니다. Re = ρU_T d/μ = 6.6×10⁻⁶ ≪ 1이므로 Stokes 법칙이 맞습니다.",
        "U_T = 2R²(ρ_p − ρ)g/(9μ) = 2 × (10⁻⁶)² × 1203 × 9.81/(9 × 8.9×10⁻⁴) = 2.95×10⁻⁶ m/s, so 1 cm takes 3.4×10³ s ≈ 0.94 h. Re = ρU_T d/μ = 6.6×10⁻⁶ ≪ 1, so Stokes' law holds."),
    },
    {
      q: t("P5. 지름 100 μm 약물 입자가 물속에서 1 mm/s로 움직이며 녹는다(D = 10⁻⁹ m²/s). Brian–Hales 식으로 k_c를 구하라.",
        "P5. A 100 μm drug particle dissolves while moving at 1 mm/s through water (D = 10⁻⁹ m²/s). Find k_c with the Brian–Hales equation."),
      s: t("Pe_d = Ud/D = 10⁻³ × 10⁻⁴/10⁻⁹ = 100. Sh = (4 + 1.21 × 100^(2/3))^(1/2) = (4 + 26.1)^(1/2) = 5.48. k_c = Sh D/d = 5.48 × 10⁻⁹/10⁻⁴ = 5.5×10⁻⁵ m/s. 정지한 경우(Sh = 2)의 약 2.7배입니다.",
        "Pe_d = Ud/D = 10⁻³ × 10⁻⁴/10⁻⁹ = 100. Sh = (4 + 1.21 × 100^(2/3))^(1/2) = (4 + 26.1)^(1/2) = 5.48, so k_c = Sh D/d = 5.48 × 10⁻⁹/10⁻⁴ = 5.5×10⁻⁵ m/s, about 2.7 times the stagnant value (Sh = 2)."),
    },
    {
      q: t("P6. k_y = 1×10⁻³, k_x = 5×10⁻³ kmol/m²·s, m = 30, 본체 조성 y = 0.05, x = 0.001이다. K_y, 플럭스, 계면 조성, 기상 막 저항의 몫을 구하라.",
        "P6. With k_y = 1×10⁻³ and k_x = 5×10⁻³ kmol/m²·s, m = 30, and bulk compositions y = 0.05, x = 0.001, find K_y, the flux, the interface compositions and the gas-film share of the resistance."),
      s: t("1/K_y = 1/k_y + m/k_x = 1000 + 6000 = 7000 → K_y = 1.43×10⁻⁴. y* = mx = 0.03, N = K_y(y − y*) = 2.86×10⁻⁶ kmol/m²·s. y_i = y − N/k_y = 0.0471, x_i = x + N/k_x = 1.57×10⁻³ (확인: m x_i = 0.0471). 기상 막의 몫 = 1000/7000 = 14%로, 액상 막이 저항을 주로 차지합니다.",
        "1/K_y = 1/k_y + m/k_x = 1000 + 6000 = 7000, so K_y = 1.43×10⁻⁴. y* = mx = 0.03 and N = K_y(y − y*) = 2.86×10⁻⁶ kmol/m²·s. y_i = y − N/k_y = 0.0471 and x_i = x + N/k_x = 1.57×10⁻³ (check: m x_i = 0.0471). The gas-film share is 1000/7000 = 14%; the liquid film holds most of the resistance."),
    },
    {
      q: t("P7. 묽은 흡수탑: y_b = 0.02, 회수율 90%, 깨끗한 용매(x_a = 0), m = 1.0, L/V = 1.5 × 최소값, HTU_OG = 0.6 m. NTU_OG와 탑 높이를 구하라.",
        "P7. Dilute absorber: y_b = 0.02, 90% recovery, clean solvent (x_a = 0), m = 1.0, L/V = 1.5 × minimum, HTU_OG = 0.6 m. Find NTU_OG and the tower height."),
      s: t("y_a = 0.002. (L/V)_min = (0.02 − 0.002)/(0.02/1.0) = 0.90 → L/V = 1.35, A = 1.35. NTU_OG = ln[(1 − 1/A)(y_b/y_a) + 1/A]/(1 − 1/A) = 4.64. Z = 0.6 × 4.64 = 2.79 m.",
        "y_a = 0.002. (L/V)_min = (0.02 − 0.002)/(0.02/1.0) = 0.90, so L/V = 1.35 and A = 1.35. NTU_OG = ln[(1 − 1/A)(y_b/y_a) + 1/A]/(1 − 1/A) = 4.64, and Z = 0.6 × 4.64 = 2.79 m."),
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
            <div style={{ marginTop: 10, fontSize: 13.8, lineHeight: 1.75, background: C.coolPale, borderRadius: 8, padding: "10px 14px", color: C.ink }}>{p.s}</div>
          )}
        </Panel>
      ))}
    </div>
  );
}
/* ---------------------------------- Tab 11: Code ---------------------------------- */
function TabCode({ t }) {
  const topics = ["topic1", "topic2", "topic3", "topic4"];
  const langs = [
    { key: "python", label: "Python", ext: "py" },
    { key: "matlab", label: "MATLAB", ext: "m" },
    { key: "julia", label: "Julia", ext: "jl" },
    { key: "cpp", label: "C++", ext: "cpp" },
  ];
  const fileStem = {
    topic1: "week13_topic1_flat_plate_cvd",
    topic2: "week13_topic2_sphere_creeping",
    topic3: "week13_topic3_pipe_packed_bed",
    topic4: "week13_topic4_two_film_packed_tower",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK13_CODES[topic][lang];
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
              {WEEK13_CODES[tp].title}
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
            "Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 확인한 값: 주제 1은 강의의 CVD 예제(Re = 158.3, Sh = 8.37, k_c = 1.44 cm/s)를 재현합니다. 주제 2는 1.249 Pe^(1/3) = 0.991 Pe_d^(1/3)과 형상 계수 8/π, π/ln 4를 재현합니다. 주제 3은 충전층 두 식이 Re = 55에서 이어짐을 확인합니다. 주제 4는 NTU의 닫힌 꼴과 수치 적분이 소수 셋째 자리까지 같음을 확인합니다. MATLAB과 Julia는 같은 계산을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "The Python and C++ versions were run and their outputs compared; for all four topics they agree digit for digit. Checks: topic 1 reproduces the lecture's CVD example (Re = 158.3, Sh = 8.37, k_c = 1.44 cm/s). Topic 2 reproduces 1.249 Pe^(1/3) = 0.991 Pe_d^(1/3) and the shape factors 8/π and π/ln 4. Topic 3 confirms that the two packed-bed branches meet at Re = 55. Topic 4 confirms that the closed-form NTU matches numerical integration to three decimals. The MATLAB and Julia versions port the same calculations but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week13App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("평판 상관식", "Flat plate"), comp: <TabPlate t={t} /> },
    { label: t("CVD 예제", "CVD example"), comp: <TabCVD t={t} /> },
    { label: t("크리핑 흐름", "Creeping flow"), comp: <TabStokes t={t} lang={lang} /> },
    { label: t("구의 물질전달", "Sphere Sh"), comp: <TabSphereSh t={t} /> },
    { label: t("관·충전층", "Pipes & beds"), comp: <TabConfined t={t} /> },
    { label: t("상평형", "Equilibrium"), comp: <TabEquilibrium t={t} lang={lang} /> },
    { label: t("이중 경막", "Two-resistance"), comp: <TabTwoFilm t={t} /> },
    { label: t("충전탑", "Packed tower"), comp: <TabTower t={t} /> },
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
                Heat & Mass Transfer · Week 13
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("물질전달 상관식과 상간 물질전달", "Mass-Transfer Correlations & Interphase Mass Transfer")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("평판 상관식과 입구 효과 · CVD 예제 · 크리핑 흐름과 Stokes 항력 · 구의 Sh(Pe) · 관과 충전층 · 상평형 · 이중 경막 이론 · 충전탑 설계(HTU × NTU)",
                   "Flat-plate correlations & entrance effect · CVD example · creeping flow & Stokes drag · Sh(Pe) for spheres · pipes & packed beds · phase equilibrium · two-resistance theory · packed-tower design (HTU × NTU)")}
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
