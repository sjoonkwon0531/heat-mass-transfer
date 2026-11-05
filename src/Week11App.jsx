// Week11App.jsx — Heat & Mass Transfer, Week 11: Unsteady-state molecular diffusion
// Part 1 — Fick's second law: semi-infinite medium (erfc, Laplace transform, doping depth),
// finite slab (separation of variables, Fourier series, Gibbs), sphere (drug release from a bead).
// Part 2 — Self-adjoint operators and Sturm–Liouville theory (orthogonality, eigenfunction expansion),
// Bessel functions in a cylinder (three BC types, heated wire by finite Fourier transform).
// Part 3 — Spherical coordinates: spherical Bessel functions, first-order reaction in a sphere
// (steady and start-up, effectiveness factor), Legendre polynomials (sphere in a gradient, Maxwell).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK11_CODES from "./Week11Codes";

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



/* ---------------------------------- special functions ---------------------------------- */
/* Bessel J_n from J_n(x) = (1/π)∫₀^π cos(nτ − x sinτ)dτ (trapezoid; exponentially accurate) */
function besselJ(n, x, m = 64) {
  const h = Math.PI / m;
  let s = 0.5 * (1 + Math.cos(n * Math.PI));
  for (let k = 1; k < m; k++) {
    const u = k * h;
    s += Math.cos(n * u - x * Math.sin(u));
  }
  return (s * h) / Math.PI;
}
/* Bessel Y0 from its ascending series (adequate for 0 < x ≤ 16) */
function besselY0(x) {
  const g = 0.5772156649015329;
  let sum = 0, term = 1, H = 0;
  const q = (x * x) / 4;
  for (let k = 1; k < 80; k++) {
    term *= q / (k * k);
    H += 1 / k;
    sum += (k % 2 ? 1 : -1) * H * term;
    if (term * H < 1e-17) break;
  }
  return (2 / Math.PI) * ((Math.log(x / 2) + g) * besselJ(0, x) + sum);
}
/* sign-change scan + bisection */
function findRoots(f, xmax = 20, dx = 0.02, start = 1e-6) {
  const out = [];
  let x = start, fx = f(x);
  while (x < xmax) {
    const x2 = x + dx, f2 = f(x2);
    if (fx * f2 < 0) {
      let a = x, b = x2, fa = fx;
      for (let i = 0; i < 60; i++) {
        const c = 0.5 * (a + b), fc = f(c);
        if (fa * fc <= 0) b = c; else { a = c; fa = fc; }
      }
      out.push(0.5 * (a + b));
    }
    x = x2; fx = f2;
  }
  return out;
}
/* cylinder eigenvalues for the three BC types (lecture Part 2) */
function cylEigen(type, Bi, n = 6) {
  if (type === 1) return findRoots((x) => besselJ(0, x), 25).slice(0, n);
  if (type === 2) return [0, ...findRoots((x) => besselJ(1, x), 25)].slice(0, n);
  return findRoots((x) => x * besselJ(1, x) - Bi * besselJ(0, x), 25).slice(0, n);
}
/* sphere eigenvalues: Type 1 nπ; Type 2 λ = tanλ; Type 3 λ = (1 − A) tanλ  ⇔ λcosλ − (1 − A) sinλ = 0 */
function sphEigen(type, A, n = 6) {
  if (type === 1) return Array.from({ length: n }, (_, i) => (i + 1) * Math.PI);
  const a = type === 2 ? 0 : A;
  return findRoots((x) => x * Math.cos(x) - (1 - a) * Math.sin(x), 30, 0.01, 1e-4).slice(0, n);
}
const sj = [
  (x) => Math.sin(x) / x,
  (x) => Math.sin(x) / (x * x) - Math.cos(x) / x,
  (x) => (3 / (x * x) - 1) * Math.sin(x) / x - (3 * Math.cos(x)) / (x * x),
  (x) => (15 / (x * x * x) - 6 / x) * Math.sin(x) / x - (15 / (x * x) - 1) * Math.cos(x) / x,
];
const sy = [
  (x) => -Math.cos(x) / x,
  (x) => -Math.cos(x) / (x * x) - Math.sin(x) / x,
];
const si = [
  (x) => Math.sinh(x) / x,
  (x) => (x * Math.cosh(x) - Math.sinh(x)) / (x * x),
];
const sk = [
  (x) => Math.exp(-x) / x,
  (x) => (Math.exp(-x) * (x + 1)) / (x * x),
];
function legendreP(n, x) {
  if (n === 0) return 1;
  let p0 = 1, p1 = x;
  for (let k = 1; k < n; k++) { const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1); p0 = p1; p1 = p2; }
  return p1;
}
function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const PALETTE = [C.copper, C.cool, C.good, C.violet, C.warn, C.copperDeep];

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  const media = [
    { k: t("기체 (O₂–N₂, 1 atm)", "Gas (O₂–N₂, 1 atm)"), D: 2e-5 },
    { k: t("액체 (작은 분자, 물)", "Liquid (small solute in water)"), D: 1e-9 },
    { k: t("고분자·겔 (단백질)", "Polymer or gel (protein)"), D: 1e-11 },
    { k: t("고체 (Si 속 P, 1100 °C)", "Solid (P in Si, 1100 °C)"), D: 6.5e-17 },
  ];
  const fmtT = (s) => (s < 60 ? `${sci(s, 1)} s` : s < 3600 ? `${(s / 60).toFixed(1)} min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)} h` : s < 86400 * 365 * 2 ? `${(s / 86400).toFixed(0)} ${t("일", "d")}` : `${sci(s / (86400 * 365), 1)} ${t("년", "yr")}`);
  return (
    <div>
      <Panel title={t("이번 주: 비정상상태 분자확산", "This week: unsteady-state molecular diffusion")}>
        <P>
          {t(
            "10주차에는 농도가 시간에 따라 변하지 않는 문제를 풀었습니다. 11주차에는 시간 항을 되살립니다. 출발점은 9주차의 화학종 연속방정식입니다. 반응과 벌크 흐름이 없고 D가 일정하면, 이 식은 Fick 제2법칙으로 줄어듭니다.",
            "In Week 10 the concentration did not change in time. In Week 11 we bring the time derivative back. The starting point is the species continuity equation of Week 9. Without reaction or bulk motion and with constant D, it reduces to Fick's second law."
          )}
        </P>
        <Eq block>∂c_A/∂t = −∇·N_A + R_A &nbsp;&nbsp;→&nbsp;&nbsp; ∂c_A/∂t = D_AB ∇²c_A</Eq>
        <P>
          {t(
            "이 식은 4주차의 비정상 열전도 식 ∂T/∂t = α∇²T와 모양이 같습니다. 그래서 T를 c로, α를 D로 바꾸면 열전도 해가 그대로 확산 해가 됩니다. 다만 물질전달에서는 D가 α보다 훨씬 작아, 같은 거리를 가는 데 훨씬 오래 걸립니다.",
            "It has the same form as transient conduction in Week 4, ∂T/∂t = α∇²T. Replace T by c and α by D, and every conduction solution becomes a diffusion solution. The difference is that D is usually far smaller than α, so diffusion over the same distance takes much longer."
          )}
        </P>
      </Panel>

      <Panel title={t("확산 길이 √(Dt): 한 줄로 하는 어림", "Diffusion length √(Dt): a one-line estimate")}>
        <P>
          {t(
            "비정상 확산의 모든 해에는 √(Dt)라는 길이가 들어 있습니다. 거리 L을 확산하는 데 걸리는 시간은 대략 L²/D입니다. 거리가 2배가 되면 시간은 4배가 됩니다.",
            "Every transient diffusion solution contains the length √(Dt). The time to diffuse a distance L is roughly L²/D. Doubling the distance takes four times longer."
          )}
        </P>
        <Table
          head={[t("매질", "Medium"), "D (m²/s)", t("1 μm 확산 시간", "time for 1 μm"), t("1 mm 확산 시간", "time for 1 mm")]}
          rows={media.map((m) => [m.k, sci(m.D, 1), fmtT(1e-12 / m.D), fmtT(1e-6 / m.D)])}
        />
        <Note>
          {t(
            "Si 속 P의 D(1100 °C)는 강의의 6.5×10⁻¹³ cm²/s입니다. 1 μm를 확산하는 데 몇 시간이 걸리므로, 도핑 깊이를 √(Dt)로 정밀하게 조절할 수 있습니다. 반면 같은 시간이면 기체 속 분자는 수십 cm를 갑니다.",
            "The D of P in Si at 1100 °C is the lecture's 6.5×10⁻¹³ cm²/s. Diffusing 1 μm takes hours, which is why the doping depth can be set precisely through √(Dt). In the same time a gas molecule travels tens of centimeters."
          )}
        </Note>
      </Panel>

      <Panel title={t("11주차 로드맵: 기하에 따라 고유함수가 바뀐다", "Week 11 roadmap: the geometry picks the eigenfunctions")}>
        <Table
          head={[t("문제", "Problem"), t("방법", "Method"), t("핵심 결과", "Key result")]}
          rows={[
            [t("반무한 매질", "Semi-infinite medium"), t("Laplace 변환 (길이 척도 없음)", "Laplace transform (no length scale)"), "c/c_s = erfc(z/2√(Dt)),  N ∝ t^−1/2"],
            [t("유한 평판", "Finite slab"), t("변수분리, sin 급수", "separation, sine series"), "Y = (4/π)Σ sin(nπz/L) e^(−n²π²Dt/L²)/n"],
            [t("구 (약물 방출)", "Sphere (drug release)"), t("변수분리, sin(λr)/r", "separation, sin(λr)/r"), "m/m₀ = (6/π²)Σ e^(−n²π²τ)/n²"],
            [t("Sturm–Liouville 이론", "Sturm–Liouville theory"), t("자기수반 연산자", "self-adjoint operator"), t("실수 고유값, 직교 고유함수", "real eigenvalues, orthogonal eigenfunctions")],
            [t("원통 (전열선)", "Cylinder (heated wire)"), t("Bessel J₀, 유한 Fourier 변환", "Bessel J₀, finite Fourier transform"), "Θ_ss = 1/(2Bi) + (1 − r²)/4"],
            [t("구 + 1차 반응 (촉매 펠릿)", "Sphere + 1st-order reaction (pellet)"), t("수정 구면 Bessel i₀", "modified spherical Bessel i₀"), "Θ = sinh(φr)/(r sinhφ),  η = 3(φcothφ − 1)/φ²"],
            [t("구 주위의 각도 의존성", "Angular dependence around a sphere"), t("Legendre 다항식", "Legendre polynomials"), t("Maxwell 유효 전도도", "Maxwell effective conductivity")],
          ]}
        />
      </Panel>

      <Panel title={t("모든 문제에 쓰는 하나의 순서", "One recipe for every bounded problem")}>
        <P>
          {t(
            "유한 영역의 문제는 같은 순서로 풉니다. 먼저 무차원화해 경계조건을 동차로 만듭니다. 다음으로 c = T(t)Z(z)로 변수를 분리합니다. 공간 부분은 Sturm–Liouville 고유값 문제가 됩니다. 고유함수는 서로 직교하므로, 초기조건을 고유함수로 전개하면 계수가 내적 하나로 정해집니다.",
            "Bounded problems are solved by one recipe. First nondimensionalize so that the boundary conditions become homogeneous. Then separate variables, c = T(t)Z(z). The spatial part becomes a Sturm–Liouville eigenvalue problem. Its eigenfunctions are orthogonal, so expanding the initial condition in them fixes each coefficient by a single inner product."
          )}
        </P>
        <Eq block>a_n = ⟨f, Φ_n⟩ / ⟨Φ_n, Φ_n⟩, &nbsp;&nbsp; ⟨u, v⟩ = ∫ u v w dx &nbsp;&nbsp; (w: {t("평판 1, 원통 r, 구 r²", "slab 1, cylinder r, sphere r²")})</Eq>
        <Note>
          {t(
            "가중함수 w를 빠뜨리면 원통과 구에서 직교성이 깨집니다. 'Sturm–Liouville' 탭에서 w를 켜고 끄며 직접 확인해 보세요.",
            "Leave out the weight w and orthogonality fails in cylinders and spheres. Toggle w on and off in the 'Sturm–Liouville' tab to see it."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Semi-infinite medium ---------------------------------- */
function TabSemiInf({ t }) {
  const [logD, setLogD] = useState(-9);
  const [tS, setTS] = useState(100);
  const D = Math.pow(10, logD);
  const L = Math.sqrt(D * tS);
  const zmax = 6 * L;
  const zs = lin(0, zmax, 160);
  const times = [tS / 4, tS, 4 * tS];
  const series = times.map((ti, i) => ({ pts: zs.map((z) => [z / L, erfc(z / (2 * Math.sqrt(D * ti)))]), color: PALETTE[i], width: 2.2 }));
  const flux = (ti) => Math.sqrt(D / (Math.PI * ti));
  const ts = lin(tS / 50, 4 * tS, 160);

  // doping case (lecture)
  const [cTarget, setCTarget] = useState(18.4);
  const [hours, setHours] = useState(1);
  const Dp = 6.5e-13; // cm²/s at 1373 K (lecture)
  const cs = 2.5e20;
  const ratio = Math.pow(10, cTarget) / cs;
  const phi = (() => { let lo = 0, hi = 6; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (erfc(m) > ratio) lo = m; else hi = m; } return 0.5 * (lo + hi); })();
  const depth = 2 * phi * Math.sqrt(Dp * hours * 3600) * 1e4; // μm

  return (
    <div>
      <Panel title={t("유도: 길이 척도가 없는 매질", "Derivation: a medium with no length scale")}>
        <P>
          {t(
            "가정은 네 가지입니다. 1차원이고, 반응과 벌크 흐름이 없고, D가 일정하며, 매질이 확산 길이보다 훨씬 깁니다. 처음 농도는 c_A0이고, t > 0에서 표면 농도를 c_As로 고정합니다. θ = c_A − c_A0로 두면 초기조건이 0이 됩니다.",
            "Four assumptions: one dimension, no reaction or bulk motion, constant D, and a medium much longer than the diffusion length. The initial concentration is c_A0, and for t > 0 the surface is held at c_As. Setting θ = c_A − c_A0 makes the initial condition zero."
          )}
        </P>
        <Eq block>∂θ/∂t = D ∂²θ/∂z², &nbsp; θ(z,0) = 0, &nbsp; θ(0,t) = c_As − c_A0, &nbsp; θ(∞,t) = 0</Eq>
        <P>
          {t(
            "1단계. 시간에 대해 Laplace 변환하면 ∂θ/∂t가 sθ̄ − θ(z,0) = sθ̄가 됩니다. 편미분방정식이 z에 대한 상미분방정식으로 바뀝니다.",
            "Step 1. A Laplace transform in time turns ∂θ/∂t into sθ̄ − θ(z,0) = sθ̄. The PDE becomes an ODE in z."
          )}
        </P>
        <Eq block>s θ̄ = D d²θ̄/dz² &nbsp;⇒&nbsp; θ̄ = A₁ e^(+z√(s/D)) + B₁ e^(−z√(s/D))</Eq>
        <P>
          {t(
            "2단계. z → ∞에서 θ̄가 유한해야 하므로 A₁ = 0입니다. z = 0의 조건을 변환하면 θ̄(0) = (c_As − c_A0)/s이므로 B₁이 정해집니다.",
            "Step 2. θ̄ must stay finite as z → ∞, so A₁ = 0. The transformed surface condition is θ̄(0) = (c_As − c_A0)/s, which fixes B₁."
          )}
        </P>
        <Eq block>θ̄ = ((c_As − c_A0)/s) e^(−z√(s/D)) &nbsp;⇒(L⁻¹)&nbsp; (c_A − c_A0)/(c_As − c_A0) = erfc(z / 2√(Dt))</Eq>
        <P>
          {t(
            "3단계. 표면에서 미분하면 플럭스가, 시간으로 적분하면 누적 흡수량이 나옵니다. 플럭스는 t^(−1/2)로 줄고, 흡수량은 t^(1/2)로 늘어납니다.",
            "Step 3. Differentiating at the surface gives the flux, and integrating over time gives the cumulative uptake. The flux falls as t^(−1/2) and the uptake grows as t^(1/2)."
          )}
        </P>
        <Eq block>N_A|₀ = (c_As − c_A0) √(D/(πt)), &nbsp;&nbsp; W/S = 2(c_As − c_A0) √(Dt/π)</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 모든 분포는 하나의 곡선이다", "Simulation: every profile is one curve")}>
        <Grid2>
          <div>
            <Slider label={t("log₁₀ D (m²/s)", "log₁₀ D (m²/s)")} value={logD} min={-13} max={-5} step={0.1} onChange={setLogD} fmt={(v) => v.toFixed(1)} />
            <Slider label={t("기준 시간 t", "reference time t")} value={tS} min={1} max={3600} step={1} onChange={setTS} unit=" s" />
            <Readout>
              √(Dt) = {sci(L * 1e6, 3)} μm<br />
              N_A|₀ / Δc = {sci(flux(tS), 3)} m/s<br />
              W/(SΔc) = {sci(2 * Math.sqrt(D * tS / Math.PI) * 1e6, 3)} μm
            </Readout>
            <Note>
              {t(
                "가로축을 z/√(Dt₀)로 그렸습니다. t를 4배로 늘리면 같은 농도가 2배 깊이에 나타납니다. erfc 곡선 하나를 √t 비율로 늘린 것입니다.",
                "The horizontal axis is z/√(Dt₀). Quadrupling t moves each concentration twice as deep: one erfc curve stretched in proportion to √t."
              )}
            </Note>
          </div>
          <div>
            <Chart xr={[0, 6]} yr={[0, 1]} xl={t("z / √(D t₀)", "z / √(D t₀)")} yl="(c − c₀)/(c_s − c₀)" series={series}
              legend={[{ label: "t₀/4", color: PALETTE[0] }, { label: "t₀", color: PALETTE[1] }, { label: "4t₀", color: PALETTE[2] }]} legendAt="tr" />
            <Chart xr={[ts[0], ts[ts.length - 1]]} yr={[0, flux(ts[0]) * 1.05e6]} xl={t("t (s)", "t (s)")} yl={t("플럭스/Δc (μm/s)", "flux/Δc (μm/s)")}
              series={[{ pts: ts.map((ti) => [ti, flux(ti) * 1e6]), color: C.copper }]} />
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("케이스: Si 웨이퍼의 n형 도핑 (강의 예제)", "Case: n-type doping of a Si wafer (lecture example)")}>
        <P>
          {t(
            "1373 K에서 P를 표면 농도 2.5×10²⁰ cm⁻³로 유지하고 확산시킵니다. D = 6.5×10⁻¹³ cm²/s입니다. 목표 농도가 되는 깊이는 erfc(φ) = c/c_s에서 φ를 구해 z = 2φ√(Dt)로 계산합니다.",
            "P is diffused into Si at 1373 K with the surface held at 2.5×10²⁰ cm⁻³ and D = 6.5×10⁻¹³ cm²/s. The depth of a target concentration follows from erfc(φ) = c/c_s and z = 2φ√(Dt)."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("목표 농도 log₁₀ c (cm⁻³)", "target log₁₀ c (cm⁻³)")} value={cTarget} min={15} max={20} step={0.1} onChange={setCTarget} fmt={(v) => v.toFixed(1)} />
            <Slider label={t("확산 시간", "diffusion time")} value={hours} min={0.1} max={8} step={0.1} onChange={setHours} unit=" h" fmt={(v) => v.toFixed(1)} />
          </div>
          <Readout>
            c/c_s = {sci(ratio, 2)} → φ = {phi.toFixed(3)}<br />
            {t("깊이", "depth")} z = 2φ√(Dt) = {depth.toFixed(2)} μm<br />
            {t("강의 값 (2.5×10¹⁸ cm⁻³, 1 h)", "lecture value (2.5×10¹⁸ cm⁻³, 1 h)")}: 1.76 μm
          </Readout>
        </Grid2>
        <Note>
          {t(
            "시간을 4배로 늘려도 깊이는 2배만 깊어집니다. 그래서 얕은 접합은 시간보다 온도(D의 Arrhenius 의존성)로 조절합니다. 실제 공정에서는 P 농도가 높아 D가 농도에 의존하므로 erfc에서 벗어납니다.",
            "Quadrupling the time only doubles the depth. Shallow junctions are therefore controlled through temperature (the Arrhenius dependence of D) rather than time. In practice, high P concentrations make D concentration-dependent, and the profile departs from erfc."
          )}
        </Note>
      </Panel>

      <Panel title={t("연결: 침투 이론과 12주차", "Connection: penetration theory and Week 12")}>
        <P>
          {t(
            "액체가 기체와 잠깐 접촉했다가 섞여 버리면, 접촉 시간 t_c 동안 액체는 반무한 매질처럼 행동합니다. 접촉 시간 동안의 평균 플럭스로 물질전달계수를 정의하면 Higbie의 침투 이론이 됩니다. 이때 k_c ∝ D^(1/2)로, 10주차 막 모델의 k_c ∝ D와 다릅니다.",
            "If a liquid element touches the gas briefly and is then mixed away, it behaves as a semi-infinite medium during the contact time t_c. Averaging the flux over t_c defines the mass-transfer coefficient of Higbie's penetration theory. It gives k_c ∝ D^(1/2), unlike k_c ∝ D from the film model of Week 10."
          )}
        </P>
        <Eq block>k_c = (1/t_c)∫₀^t_c √(D/(πt)) dt = 2√(D/(π t_c))</Eq>
      </Panel>
    </div>
  );
}


/* ---------------------------------- slab & sphere series ---------------------------------- */
function slabY(z, Fo, nterms = 200) {          // z = z/L in [0, 1]
  let s = 0;
  for (let k = 1; k <= nterms; k++) {
    const m = 2 * k - 1;
    const e = Math.exp(-((m * Math.PI) ** 2) * Fo);
    if (Fo > 0 && e < 1e-16) break;
    s += (4 / (m * Math.PI)) * Math.sin(m * Math.PI * z) * e;
  }
  return s;
}
function slabUptake(Fo) {
  let s = 0;
  for (let k = 1; k <= 400; k++) {
    const m = 2 * k - 1;
    s += (8 / (m * m * Math.PI ** 2)) * Math.exp(-((m * Math.PI) ** 2) * Fo);
  }
  return 1 - s;
}
function sphereRemaining(tau) {
  if (tau <= 0) return 1;
  let s = 0;
  for (let n = 1; n <= 400; n++) s += Math.exp(-((n * Math.PI) ** 2) * tau) / (n * n);
  return (6 / Math.PI ** 2) * s;
}
function sphereTheta(rho, tau) {   // c/c0 inside a bead with a perfect sink at the surface
  if (tau <= 0) return 1;
  let s = 0;
  for (let n = 1; n <= 400; n++) {
    const e = Math.exp(-((n * Math.PI) ** 2) * tau);
    if (e < 1e-300) break;
    const shape = rho < 1e-9 ? n * Math.PI : Math.sin(n * Math.PI * rho) / rho;
    s += ((2 * (n % 2 ? 1 : -1)) / (n * Math.PI)) * shape * e;
  }
  return s;
}
function solveMono(f, target, lo, hi, decreasing = true) {
  for (let i = 0; i < 100; i++) {
    const m = Math.sqrt(lo * hi);
    if ((f(m) > target) === decreasing) lo = m; else hi = m;
  }
  return Math.sqrt(lo * hi);
}

/* ---------------------------------- Tab 3: Finite slab ---------------------------------- */
function TabSlab({ t }) {
  const [Fo, setFo] = useState(0.02);
  const [nt, setNt] = useState(5);
  const zs = lin(0, 1, 241);
  const fo50 = solveMono(slabUptake, 0.5, 1e-5, 2, false);
  const fo90 = solveMono(slabUptake, 0.9, 1e-5, 2, false);
  const [Lum, setLum] = useState(100);
  const [logD, setLogD] = useState(-12);
  const Dm = Math.pow(10, logD);
  const Lm = Lum * 1e-6;
  const fos = lin(0.0005, 0.4, 200);
  const fmtTime = (s) => (s < 120 ? `${s.toFixed(1)} s` : s < 7200 ? `${(s / 60).toFixed(1)} min` : s < 172800 ? `${(s / 3600).toFixed(1)} h` : `${(s / 86400).toFixed(1)} ${t("일", "d")}`);
  return (
    <div>
      <Panel title={t("유도: 변수분리와 고유함수 전개", "Derivation: separation of variables and eigenfunction expansion")}>
        <P>
          {t(
            "두께 L의 평판이 처음에 c_A0이고, t > 0에서 양면이 c_As로 고정됩니다. Y = (c_A − c_As)/(c_A0 − c_As)로 두면 경계조건이 동차(Y = 0)가 됩니다. 이 무차원화가 변수분리의 전제 조건입니다.",
            "A slab of thickness L starts at c_A0, and for t > 0 both faces are held at c_As. With Y = (c_A − c_As)/(c_A0 − c_As) the boundary conditions become homogeneous (Y = 0). That is the precondition for separating variables."
          )}
        </P>
        <Eq block>∂Y/∂t = D ∂²Y/∂z², &nbsp; Y(z,0) = 1, &nbsp; Y(0,t) = Y(L,t) = 0</Eq>
        <P>
          {t(
            "1단계. Y = T(t)Z(z)를 넣고 TZ로 나누면, 왼쪽은 t만의 함수, 오른쪽은 z만의 함수입니다. 둘이 같으려면 같은 상수여야 합니다. 상수를 −λ²로 고른 이유는 농도 차이가 시간이 지나며 감쇠해야 하기 때문입니다.",
            "Step 1. Substitute Y = T(t)Z(z) and divide by TZ. The left side depends on t only and the right side on z only, so both equal one constant. We choose −λ² because the concentration difference must decay in time."
          )}
        </P>
        <Eq block>(1/(D T)) dT/dt = (1/Z) d²Z/dz² = −λ² &nbsp;⇒&nbsp; T = e^(−Dλ²t), &nbsp; Z = C₁cos λz + C₂ sin λz</Eq>
        <P>
          {t(
            "2단계. Z(0) = 0이면 C₁ = 0입니다. Z(L) = 0이면 sin λL = 0이므로 λ_n = nπ/L입니다. 경계조건이 고유값을 정합니다.",
            "Step 2. Z(0) = 0 gives C₁ = 0. Z(L) = 0 gives sin λL = 0, so λ_n = nπ/L. The boundary conditions select the eigenvalues."
          )}
        </P>
        <P>
          {t(
            "3단계. 모든 n의 해를 더하고 t = 0에서 1과 같게 놓습니다. sin(mπz/L)를 곱해 0부터 L까지 적분하면, 직교성 때문에 m ≠ n인 항은 모두 사라집니다.",
            "Step 3. Superpose all n and require the sum to equal 1 at t = 0. Multiply by sin(mπz/L) and integrate over 0 to L; orthogonality removes every term with m ≠ n."
          )}
        </P>
        <Eq block>C_n = (2/L)∫₀^L sin(nπz/L) dz = 2(1 − (−1)ⁿ)/(nπ) &nbsp;⇒&nbsp; Y = (4/π) Σ_(k=1)^∞ [1/(2k−1)] sin((2k−1)πz/L) e^(−(2k−1)²π²Dt/L²)</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 항의 개수와 Gibbs 현상", "Simulation: number of terms and the Gibbs phenomenon")}>
        <Grid2>
          <div>
            <Slider label="Fo = Dt/L²" value={Fo} min={0} max={0.3} step={0.001} onChange={setFo} fmt={(v) => v.toFixed(3)} />
            <Slider label={t("급수 항의 수 (홀수 항)", "number of (odd) terms")} value={nt} min={1} max={60} step={1} onChange={setNt} />
            <Readout>
              Y({t("중심", "centre")}) = {slabY(0.5, Fo).toFixed(4)}<br />
              M(t)/M∞ = {slabUptake(Fo).toFixed(4)}<br />
              {t("단항 근사", "one-term")}: (4/π)e^(−π²Fo) = {((4 / Math.PI) * Math.exp(-(Math.PI ** 2) * Fo)).toFixed(4)}
            </Readout>
            <Note>
              {t(
                "Fo = 0 근처에서는 항을 많이 넣어도 표면 근처에 약 9%의 넘침이 남습니다. 불연속(초기 1, 표면 0)을 연속 함수의 합으로 나타내기 때문입니다. 시간이 조금만 지나도 높은 차수의 항이 e^(−n²π²Fo)로 빨리 사라져 몇 항으로 충분해집니다.",
                "Near Fo = 0 an overshoot of about 9% stays near the faces however many terms you add, because a discontinuity (1 inside, 0 at the face) is being built from smooth functions. A little later the high-order terms die out as e^(−n²π²Fo), and a few terms suffice."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[0, 1.2]} xl="z/L" yl="Y = (c − c_s)/(c₀ − c_s)"
            series={[
              { pts: zs.map((z) => [z, slabY(z, Fo, 300)]), color: C.ink, width: 1.4, dash: "5 4" },
              { pts: zs.map((z) => [z, slabY(z, Fo, nt)]), color: C.copper, width: 2.4 },
            ]}
            legend={[{ label: t("수렴한 해", "converged"), color: C.ink, dash: "5 4" }, { label: `${nt} ${t("항", "terms")}`, color: C.copper }]} legendAt="bc" />
        </Grid2>
      </Panel>

      <Panel title={t("평판은 언제 '반무한'인가", "When is a slab 'semi-infinite'?")}>
        <P>
          {t(
            "Y를 평판 전체에 대해 적분하면 흡수 비율 M(t)/M∞를 얻습니다. 초기에는 양면이 서로를 보지 못하므로, 각 면이 반무한 매질처럼 2√(Dt/π)씩 흡수합니다. 그래서 M/M∞ ≈ 4√(Fo/π)입니다.",
            "Integrating Y over the slab gives the fractional uptake M(t)/M∞. At early times the two faces do not see each other, so each absorbs 2√(Dt/π) like a semi-infinite medium, and M/M∞ ≈ 4√(Fo/π)."
          )}
        </P>
        <Eq block>M(t)/M∞ = 1 − Σ_k [8/((2k−1)²π²)] e^(−(2k−1)²π²Fo) &nbsp;≈&nbsp; 4√(Fo/π) &nbsp;(Fo ≲ 0.05)</Eq>
        <Chart xr={[0, 0.4]} yr={[0, 1.05]} xl="Fo = Dt/L²" yl="M(t)/M∞"
          series={[
            { pts: fos.map((f) => [f, slabUptake(f)]), color: C.copper, width: 2.4 },
            { pts: fos.map((f) => [f, 4 * Math.sqrt(f / Math.PI)]), color: C.cool, dash: "6 4" },
          ]}
          vlines={[{ x: 0.05, color: C.inkSoft }]}
          legend={[{ label: t("정확한 급수", "exact series"), color: C.copper }, { label: "4√(Fo/π)", color: C.cool, dash: "6 4" }]} legendAt="br" />
        <Readout>
          {t("50% 흡수", "50% uptake")}: Fo = {fo50.toFixed(4)} &nbsp;|&nbsp; {t("90% 흡수", "90% uptake")}: Fo = {fo90.toFixed(4)}
        </Readout>
      </Panel>

      <Panel title={t("케이스: 반도체 패키지 몰딩 화합물(EMC)의 수분 흡수", "Case: moisture uptake by an epoxy molding compound (EMC)")}>
        <P>
          {t(
            "패키지의 에폭시 몰딩 화합물은 공기 중 수분을 흡수합니다. 이 수분이 리플로(약 260 °C)에서 갑자기 기화하면 내부 압력으로 박리나 균열('팝콘' 균열)이 생길 수 있습니다. 그래서 습도 민감도 등급(MSL)에 따라 노출 시간을 관리하고, 필요하면 베이킹으로 수분을 뺍니다. 흡수와 베이킹 모두 이 평판 해로 시간을 어림합니다.",
            "The epoxy molding compound of a package absorbs moisture from the air. If that water vaporizes suddenly during reflow (about 260 °C), the internal pressure can cause delamination or cracking ('popcorn' cracking). Exposure time is therefore managed by moisture sensitivity level (MSL), and parts are baked out when needed. Both uptake and bake-out times are estimated with this slab solution."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("두께 L (양면 노출)", "thickness L (both faces exposed)")} value={Lum} min={20} max={2000} step={10} onChange={setLum} unit=" μm" />
            <Slider label="log₁₀ D (m²/s)" value={logD} min={-14} max={-10} step={0.1} onChange={setLogD} fmt={(v) => v.toFixed(1)} />
          </div>
          <Readout>
            L²/D = {fmtTime(Lm * Lm / Dm)}<br />
            {t("50% 흡수", "50% uptake")}: {fmtTime(fo50 * Lm * Lm / Dm)}<br />
            {t("90% 흡수", "90% uptake")}: {fmtTime(fo90 * Lm * Lm / Dm)}
          </Readout>
        </Grid2>
        <Note>
          {t(
            "D는 수지와 온도에 따라 크게 달라지므로 슬라이더 값은 설명용 크기입니다. 핵심은 두께에 대한 의존성입니다. 두께가 2배면 흡수와 베이킹 시간이 모두 4배가 됩니다. 얇은 패키지가 빨리 젖고 빨리 마르는 이유입니다.",
            "D depends strongly on the resin and the temperature, so the slider values are illustrative. The point is the thickness dependence: doubling the thickness quadruples both uptake and bake-out times. Thin packages wet quickly and dry quickly."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Sphere / drug release ---------------------------------- */
function TabSphere({ t }) {
  const [tau, setTau] = useState(0.05);
  const [Rmm, setRmm] = useState(1);
  const [logD, setLogD] = useState(-11);
  const rs = lin(0, 1, 161);
  const taus = lin(0.002, 0.5, 200);
  const t50 = solveMono(sphereRemaining, 0.5, 1e-6, 3, true);
  const t90 = solveMono(sphereRemaining, 0.1, 1e-6, 3, true);
  const R = Rmm * 1e-3, D = Math.pow(10, logD);
  const fmtTime = (s) => (s < 120 ? `${s.toFixed(1)} s` : s < 7200 ? `${(s / 60).toFixed(1)} min` : s < 172800 ? `${(s / 3600).toFixed(1)} h` : `${(s / 86400).toFixed(1)} ${t("일", "d")}`);
  return (
    <div>
      <Panel title={t("유도: 구에서는 u = r c로 평판 문제가 된다", "Derivation: in a sphere, u = r c turns it into a slab problem")}>
        <P>
          {t(
            "반지름 R인 젤 비드가 처음에 약물 농도 c_A0을 가집니다. 주변 액체가 약물을 즉시 씻어 내므로 표면 농도는 0입니다. 구 대칭이고 D가 일정하다고 가정합니다.",
            "A gel bead of radius R initially holds drug at c_A0. The surrounding liquid sweeps the drug away at once, so the surface concentration is zero. We assume spherical symmetry and constant D."
          )}
        </P>
        <Eq block>∂c/∂t = D (∂²c/∂r² + (2/r) ∂c/∂r), &nbsp; c(R,t) = 0, &nbsp; ∂c/∂r(0,t) = 0, &nbsp; c(r,0) = c_A0</Eq>
        <P>
          {t(
            "1단계. u = r c로 두면 ∂²u/∂r² = r(∂²c/∂r² + (2/r)∂c/∂r)이므로 식이 ∂u/∂t = D ∂²u/∂r²가 됩니다. 평판과 같은 식입니다. 중심에서 c가 유한하므로 u(0) = 0이고, 표면에서 u(R) = 0입니다.",
            "Step 1. With u = r c, ∂²u/∂r² = r(∂²c/∂r² + (2/r)∂c/∂r), so the equation becomes ∂u/∂t = D ∂²u/∂r², the slab equation. A finite c at the centre requires u(0) = 0, and the surface gives u(R) = 0."
          )}
        </P>
        <P>
          {t(
            "2단계. 평판처럼 고유함수는 sin(nπr/R)이고, c로 되돌리면 sin(nπr/R)/r입니다. 초기조건 u = r c_A0를 전개하면 계수에 (−1)^(n+1)이 붙습니다.",
            "Step 2. As in the slab, the eigenfunctions are sin(nπr/R); back in terms of c they are sin(nπr/R)/r. Expanding the initial condition u = r c_A0 gives coefficients with a factor (−1)^(n+1)."
          )}
        </P>
        <Eq block>c/c_A0 = (2R/(πr)) Σ_n [(−1)^(n+1)/n] sin(nπr/R) e^(−n²π²τ), &nbsp; τ = Dt/R²</Eq>
        <P>
          {t(
            "3단계. 비드에 남은 약물은 c를 4πr²dr로 적분해 얻습니다. 각 항의 계수가 6/(π²n²)이고, 그 합은 τ = 0에서 정확히 1입니다(Σ1/n² = π²/6).",
            "Step 3. The drug left in the bead is the integral of c over 4πr²dr. Each term carries 6/(π²n²), and the sum is exactly 1 at τ = 0 (Σ1/n² = π²/6)."
          )}
        </P>
        <Eq block>m(t)/m₀ = (6/π²) Σ_n (1/n²) e^(−n²π²τ) &nbsp;≈&nbsp; (6/π²) e^(−π²τ) &nbsp;(τ ≳ 0.1)</Eq>
        <Note>
          {t(
            "강의 슬라이드는 장시간 근사를 e^(−π²τ)로 적었습니다. 첫 항만 남기면 앞에 6/π² ≈ 0.61이 붙습니다. 아래 그래프에서 두 근사를 비교해 보세요.",
            "The lecture slide writes the long-time approximation as e^(−π²τ). Keeping only the first term leaves a prefactor 6/π² ≈ 0.61. Compare the two approximations in the plot below."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 비드 속 농도와 남은 약물", "Simulation: concentration in the bead and drug remaining")}>
        <Grid2>
          <div>
            <Slider label="τ = Dt/R²" value={tau} min={0.001} max={0.5} step={0.001} onChange={setTau} fmt={(v) => v.toFixed(3)} />
            <Readout>
              c({t("중심", "centre")})/c₀ = {sphereTheta(0, tau).toFixed(4)}<br />
              m/m₀ = {sphereRemaining(tau).toFixed(4)}<br />
              {t("방출됨", "released")} = {(100 * (1 - sphereRemaining(tau))).toFixed(1)}%
            </Readout>
            <Chart xr={[0, 1]} yr={[0, 1.05]} xl="r/R" yl="c/c₀"
              series={[{ pts: rs.map((r) => [r, sphereTheta(r, tau)]), color: C.copper, width: 2.4 }]} />
          </div>
          <Chart xr={[0, 0.5]} yr={[0.005, 1]} ylog xl="τ = Dt/R²" yl="m(t)/m₀"
            series={[
              { pts: taus.map((x) => [x, sphereRemaining(x)]), color: C.copper, width: 2.4 },
              { pts: taus.map((x) => [x, (6 / Math.PI ** 2) * Math.exp(-(Math.PI ** 2) * x)]), color: C.cool, dash: "6 4" },
              { pts: taus.map((x) => [x, Math.exp(-(Math.PI ** 2) * x)]), color: C.warn, dash: "2 4" },
            ]}
            dots={[{ x: tau, y: sphereRemaining(tau) }]}
            legend={[{ label: t("급수 (정확)", "series (exact)"), color: C.copper }, { label: "(6/π²)e^(−π²τ)", color: C.cool, dash: "6 4" }, { label: "e^(−π²τ)", color: C.warn, dash: "2 4" }]} legendAt="tr" />
        </Grid2>
        <Readout>
          {t("50% 방출", "50% released")}: τ = {t50.toFixed(4)} &nbsp;|&nbsp; {t("90% 방출", "90% released")}: τ = {t90.toFixed(4)}
        </Readout>
      </Panel>

      <Panel title={t("케이스: 비드 크기로 방출 시간 설계하기", "Case: designing the release time with bead size")}>
        <Grid2>
          <div>
            <Slider label={t("비드 반지름 R", "bead radius R")} value={Rmm} min={0.05} max={3} step={0.05} onChange={setRmm} unit=" mm" fmt={(v) => v.toFixed(2)} />
            <Slider label="log₁₀ D (m²/s)" value={logD} min={-13} max={-9} step={0.1} onChange={setLogD} fmt={(v) => v.toFixed(1)} />
          </div>
          <Readout>
            R²/D = {fmtTime(R * R / D)}<br />
            t₅₀ = {fmtTime(t50 * R * R / D)}<br />
            t₉₀ = {fmtTime(t90 * R * R / D)}
          </Readout>
        </Grid2>
        <P>
          {t(
            "방출 시간은 R²/D에 비례합니다. 작은 약물(D ~ 10⁻¹⁰ m²/s)은 mm 비드에서도 몇 분 만에 빠져나옵니다. 단백질처럼 큰 분자(D ~ 10⁻¹¹ m²/s 이하)이거나 비드를 키우면 몇 시간이 됩니다. 실제 서방형 제제는 고분자 망목을 촘촘하게 만들어 D를 낮춥니다.",
            "Release time scales as R²/D. A small drug (D ~ 10⁻¹⁰ m²/s) escapes a millimeter bead in minutes. A large molecule such as a protein (D ~ 10⁻¹¹ m²/s or lower), or a larger bead, takes hours. Sustained-release formulations tighten the polymer network to lower D."
          )}
        </P>
        <Note>
          {t(
            "같은 해가 다른 분야에도 그대로 쓰입니다. 리튬이온 전지의 활물질 입자 속 Li 확산(특성 시간 R²/D_s), 크로마토그래피 수지의 흡착, 촉매 펠릿의 탈기, 그리고 4주차 구의 냉각(Bi → ∞)이 모두 이 식입니다.",
            "The same solution serves other fields unchanged: Li diffusion inside battery active-material particles (time scale R²/D_s), adsorption into chromatography resin, degassing of catalyst pellets, and the cooling of a sphere in Week 4 (Bi → ∞)."
          )}
        </Note>
      </Panel>
    </div>
  );
}


/* ---------------------------------- Tab 5: Sturm–Liouville ---------------------------------- */
const SL_GEOMS = {
  slab: { a: 0, b: 1, w: () => 1, u: (n, x) => Math.sin(n * Math.PI * x), lam: (n) => n * Math.PI },
  cyl: { a: 0, b: 1, w: (x) => x, u: (n, x, L) => besselJ(0, L[n - 1] * x) },
  sph: { a: 0, b: 1, w: (x) => x * x, u: (n, x) => (x < 1e-9 ? n * Math.PI : Math.sin(n * Math.PI * x) / x) },
  leg: { a: -1, b: 1, w: () => 1, u: (n, x) => legendreP(n - 1, x) },
};
function TabSL({ t }) {
  const [geom, setGeom] = useState("cyl");
  const [useW, setUseW] = useState(true);
  const [N, setN] = useState(6);
  const J0roots = useMemo(() => findRoots((x) => besselJ(0, x), 82, 0.05).slice(0, 25), []);
  const G = SL_GEOMS[geom];
  const ip = (f, g, weighted) => simpson((x) => f(x) * g(x) * (weighted ? G.w(x) : 1), G.a, G.b, 400);
  const u = (n) => (x) => G.u(n, x, J0roots);
  const gram = useMemo(() => {
    const M = [];
    for (let i = 1; i <= 5; i++) {
      const row = [];
      for (let j = 1; j <= 5; j++) {
        const v = ip(u(i), u(j), useW) / Math.sqrt(ip(u(i), u(i), useW) * ip(u(j), u(j), useW));
        row.push(v);
      }
      M.push(row);
    }
    return M;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom, useW]);
  // expansion of f(x) = 1 (or f = x for Legendre to show odd modes)
  const fTarget = (x) => (geom === "leg" ? (x > 0 ? 1 : 0) : 1);
  const coef = useMemo(() => {
    const out = [];
    for (let n = 1; n <= 25; n++) out.push(ip(fTarget, u(n), true) / ip(u(n), u(n), true));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geom]);
  const xs = lin(G.a + 1e-4, G.b, 241);
  const partial = (x) => coef.slice(0, N).reduce((s, a, k) => s + a * G.u(k + 1, x, J0roots), 0);
  const cell = 46;
  return (
    <div>
      <Panel title={t("자기수반 연산자: 왜 고유함수가 직교하는가", "Self-adjoint operators: why eigenfunctions are orthogonal")}>
        <P>
          {t(
            "변수분리로 얻은 공간 방정식은 모두 같은 꼴로 쓸 수 있습니다. 이것을 Sturm–Liouville 문제라고 부릅니다. p, q, w만 바뀝니다.",
            "Every spatial equation from separation of variables can be written in one form, called a Sturm–Liouville problem. Only p, q and w change."
          )}
        </P>
        <Eq block>L_x Φ ≡ (1/w)[d/dx(p dΦ/dx) + qΦ] = −λ²Φ, &nbsp;&nbsp; ⟨u, v⟩ = ∫_a^b u v w dx</Eq>
        <Table
          head={[t("기하", "Geometry"), "w(x)", "p(x)", "q(x)", t("고유함수", "Eigenfunctions")]}
          rows={[
            [t("평판", "Slab"), "1", "1", "0", "sin(λz), cos(λz)"],
            [t("원통 (축대칭)", "Cylinder (axisymmetric)"), "r", "r", "0", "J₀(λr)"],
            [t("구 (구대칭)", "Sphere (radial)"), "r²", "r²", "0", "sin(λr)/r = λ j₀(λr)"],
            [t("구 (극각, η = cosθ)", "Sphere (polar, η = cosθ)"), "1", "1 − η²", "0", "P_n(η), λ² = n(n+1)"],
          ]}
        />
        <P>
          {t(
            "1단계. ⟨L_x u, v⟩를 부분적분합니다. 두 번 부분적분하면 u와 v의 역할이 바뀌고 경계항이 하나 남습니다.",
            "Step 1. Integrate ⟨L_x u, v⟩ by parts twice. The roles of u and v swap, and one boundary term is left."
          )}
        </P>
        <Eq block>⟨L_x u, v⟩ = [p(v u′ − u v′)]_a^b + ⟨u, L_x v⟩</Eq>
        <P>
          {t(
            "2단계. u와 v가 같은 동차 경계조건(Dirichlet, Neumann, Robin 또는 주기 조건)을 만족하면 경계항이 0입니다. 예를 들어 Robin 조건 u′ = −Au, v′ = −Av를 넣으면 v u′ − u v′ = −Auv + Auv = 0입니다. 이때 연산자를 자기수반이라고 합니다. 경계조건이 동차여야 하는 이유가 여기 있습니다.",
            "Step 2. If u and v satisfy the same homogeneous boundary conditions (Dirichlet, Neumann, Robin or periodic), the boundary term vanishes. With Robin conditions u′ = −Au and v′ = −Av, for instance, v u′ − u v′ = −Auv + Auv = 0. The operator is then called self-adjoint. This is why the boundary conditions must be homogeneous."
          )}
        </P>
        <P>
          {t(
            "3단계. L_x u = −λ²u, L_x v = −μ²v이고 λ ≠ μ라고 합시다. 자기수반성에서 (μ² − λ²)⟨u, v⟩ = 0이므로 ⟨u, v⟩ = 0입니다. 같은 논리로 고유값이 실수임도 보일 수 있습니다.",
            "Step 3. Let L_x u = −λ²u and L_x v = −μ²v with λ ≠ μ. Self-adjointness gives (μ² − λ²)⟨u, v⟩ = 0, so ⟨u, v⟩ = 0. The same argument shows that the eigenvalues are real."
          )}
        </P>
        <Note>
          {t(
            "일반적인 2계 선형 동차 ODE u″ + f₁u′ + f₀u = 0도 적분인자 p = exp(∫f₁dx)를 곱하면 (pu′)′ + p f₀ u = 0이 되어 Sturm–Liouville 꼴이 됩니다. 원통의 1/r 항, 구의 2/r 항이 바로 이렇게 p = r, p = r²가 됩니다.",
            "A general linear homogeneous second-order ODE u″ + f₁u′ + f₀u = 0 also takes the Sturm–Liouville form after multiplying by the integrating factor p = exp(∫f₁dx): (pu′)′ + p f₀ u = 0. That is exactly how the 1/r term of a cylinder and the 2/r term of a sphere become p = r and p = r²."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 가중함수 w를 빼면 직교성이 깨진다", "Simulation: drop the weight w and orthogonality breaks")}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
          <Seg value={geom} onChange={setGeom} options={[
            { v: "slab", label: t("평판 sin", "slab sin") }, { v: "cyl", label: t("원통 J₀", "cylinder J₀") },
            { v: "sph", label: t("구 sin(λr)/r", "sphere sin(λr)/r") }, { v: "leg", label: "Legendre P_n" }]} />
          <button onClick={() => setUseW(!useW)} style={btnStyle(useW)}>{useW ? t("w 포함 ✓", "with w ✓") : t("w 제외", "without w")}</button>
        </div>
        <Grid2>
          <div>
            <svg viewBox={`0 0 ${cell * 5 + 40} ${cell * 5 + 40}`} style={{ width: "100%", maxWidth: 300, display: "block", margin: "0 auto" }}>
              {gram.map((row, i) => row.map((v, j) => (
                <g key={i + "-" + j}>
                  <rect x={30 + j * cell} y={10 + i * cell} width={cell - 2} height={cell - 2} fill={ramp(Math.abs(v))} />
                  <text x={30 + j * cell + cell / 2 - 1} y={10 + i * cell + cell / 2 + 4} fontSize="11" textAnchor="middle" fill={Math.abs(v) > 0.5 ? "#fff" : C.ink}>{v.toFixed(2)}</text>
                </g>
              )))}
              {[1, 2, 3, 4, 5].map((k) => <text key={"r" + k} x={18} y={10 + (k - 0.5) * cell + 4} fontSize="11" fill={C.inkSoft} textAnchor="middle">{k}</text>)}
            </svg>
            <Note>
              {t(
                "정규화한 내적 ⟨u_i, u_j⟩/√(⟨u_i,u_i⟩⟨u_j,u_j⟩)입니다. w를 포함하면 대각선 밖이 모두 0입니다. 원통이나 구에서 w를 빼면 대각선 밖이 0이 아니게 됩니다. 평판과 Legendre는 w = 1이라 차이가 없습니다.",
                "Normalized inner products ⟨u_i, u_j⟩/√(⟨u_i,u_i⟩⟨u_j,u_j⟩). With w, every off-diagonal entry is 0. Drop w for the cylinder or the sphere and the off-diagonal entries become nonzero. The slab and Legendre cases have w = 1, so nothing changes."
              )}
            </Note>
          </div>
          <div>
            <Slider label={t("전개 항의 수 N", "number of terms N")} value={N} min={1} max={25} step={1} onChange={setN} />
            <Chart xr={[G.a, G.b]} yr={[-0.3, 1.4]} xl={geom === "leg" ? "η = cosθ" : "x"} yl={geom === "leg" ? t("계단 함수의 전개", "expansion of a step") : t("f = 1의 전개", "expansion of f = 1")}
              series={[
                { pts: xs.map((x) => [x, fTarget(x)]), color: C.ink, dash: "5 4", width: 1.4 },
                { pts: xs.map((x) => [x, partial(x)]), color: C.copper, width: 2.4 },
              ]} />
            <Readout>a₁…a₄ = {coef.slice(0, 4).map((a) => a.toFixed(4)).join(", ")}</Readout>
          </div>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Bessel functions in a cylinder ---------------------------------- */
function TabBessel({ t }) {
  const [type, setType] = useState(3);
  const [logBi, setLogBi] = useState(0);
  const Bi = Math.pow(10, logBi);
  const lams = useMemo(() => cylEigen(type, Bi, 4), [type, Bi]);
  const xs = lin(0.02, 20, 300);
  const rs = lin(0, 1, 121);
  const norm = (l) => {
    if (type === 1) return Math.SQRT2 / Math.abs(besselJ(1, l));
    if (type === 2) return l === 0 ? Math.SQRT2 : Math.SQRT2 / Math.abs(besselJ(0, l));
    return Math.SQRT2 / (Math.abs(besselJ(0, l)) * Math.sqrt(1 + (Bi / l) ** 2));
  };
  const cond = type === 1 ? "J₀(λ) = 0" : type === 2 ? "J₁(λ) = 0" : "λ J₁(λ) = Bi J₀(λ)";
  return (
    <div>
      <Panel title={t("유도: 원통에서는 Bessel 방정식이 나온다", "Derivation: a cylinder gives Bessel's equation")}>
        <P>
          {t(
            "무한히 긴 원통에서 축대칭을 가정하면 θ와 z 방향 변화가 사라집니다. 남은 식에 Θ = T(t)Φ(r)를 넣으면 공간 부분은 차수 0의 Bessel 방정식입니다. Sturm–Liouville 꼴로는 w = p = r, q = 0입니다.",
            "In an infinitely long cylinder with axial symmetry, the θ and z variations disappear. Substituting Θ = T(t)Φ(r), the spatial part is Bessel's equation of order zero. In Sturm–Liouville form, w = p = r and q = 0."
          )}
        </P>
        <Eq block>∂Θ/∂t = (1/r)∂/∂r(r ∂Θ/∂r) &nbsp;⇒&nbsp; (1/r)(rΦ′)′ = −λ²Φ &nbsp;⇒&nbsp; Φ = a J₀(λr) + b Y₀(λr)</Eq>
        <P>
          {t(
            "Y₀는 r → 0에서 −∞로 발산합니다. 원통 중심의 농도나 온도는 유한해야 하므로 b = 0입니다. 남은 J₀(λr)의 λ는 표면 경계조건이 정합니다. 계산에는 dJ₀/dr = −λJ₁(λr)와 d(rJ₁)/dr = λrJ₀(λr) 두 성질만 있으면 됩니다.",
            "Y₀ diverges to −∞ as r → 0. The concentration or temperature at the axis must be finite, so b = 0. The surface condition then picks λ in J₀(λr). Only two properties are needed for the algebra: dJ₀/dr = −λJ₁(λr) and d(rJ₁)/dr = λrJ₀(λr)."
          )}
        </P>
        <Chart xr={[0, 20]} yr={[-1, 1]} xl="x" yl="J_n(x), Y₀(x)"
          series={[0, 1, 2, 3].map((n) => ({ pts: xs.map((x) => [x, besselJ(n, x)]), color: PALETTE[n], width: 2 }))
            .concat([{ pts: xs.filter((x) => x > 0.3).map((x) => [x, besselY0(x)]), color: C.ink, dash: "5 4", width: 1.5 }])}
          hlines={[{ y: 0, color: C.line, dash: "none" }]}
          legend={[{ label: "J₀", color: PALETTE[0] }, { label: "J₁", color: PALETTE[1] }, { label: "J₂", color: PALETTE[2] }, { label: "J₃", color: PALETTE[3] }, { label: "Y₀", color: C.ink, dash: "5 4" }]} legendAt="tr" />
      </Panel>

      <Panel title={t("경계조건이 고유값을 정한다", "The boundary condition fixes the eigenvalues")}>
        <div style={{ marginBottom: 6 }}>
          <Seg value={type} onChange={setType} options={[
            { v: 1, label: t("1형: Φ(1) = 0", "Type 1: Φ(1) = 0") },
            { v: 2, label: t("2형: Φ′(1) = 0", "Type 2: Φ′(1) = 0") },
            { v: 3, label: t("3형: Φ′ + BiΦ = 0", "Type 3: Φ′ + BiΦ = 0") }]} />
        </div>
        {type === 3 && <Slider label="log₁₀ Bi" value={logBi} min={-2} max={2} step={0.05} onChange={setLogBi} fmt={(v) => `${v.toFixed(2)} (Bi = ${sci(Bi, 2)})`} />}
        <Grid2>
          <div>
            <Readout>
              {t("고유값 조건", "eigenvalue condition")}: {cond}<br />
              λ₁…λ₄ = {lams.map((l) => l.toFixed(4)).join(", ")}
            </Readout>
            <Table
              head={[t("경계조건", "BC"), t("고유값 조건", "condition"), t("정규화 고유함수 (반지름 1)", "normalized eigenfunction (radius 1)")]}
              rows={[
                [t("1형 (농도 고정)", "Type 1 (fixed value)"), "J₀(λ_n) = 0", "√2 J₀(λ_n r)/J₁(λ_n)"],
                [t("2형 (절연, 불투과)", "Type 2 (insulated)"), "J₁(λ_n) = 0", "√2 J₀(λ_n r)/J₀(λ_n), Φ₀ = √2"],
                [t("3형 (Robin)", "Type 3 (Robin)"), "λ_n J₁(λ_n) = Bi J₀(λ_n)", "√2 J₀(λ_n r)/[J₀(λ_n)√(1 + (Bi/λ_n)²)]"],
              ]}
            />
            <Note>
              {t(
                "3형에서 Bi → 0이면 2형(절연)에, Bi → ∞이면 1형(표면 값 고정)에 다가갑니다. Bi를 움직이며 λ₁이 0에서 2.405로 옮겨 가는 것을 확인해 보세요.",
                "Type 3 tends to Type 2 (insulated) as Bi → 0 and to Type 1 (fixed surface value) as Bi → ∞. Move Bi and watch λ₁ travel from 0 to 2.405."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[-2.5, 3.2]} xl="r" yl={t("정규화 고유함수 Φ_n", "normalized Φ_n")}
            series={lams.map((l, i) => ({ pts: rs.map((r) => [r, norm(l) * besselJ(0, l * r)]), color: PALETTE[i], width: 2 }))}
            hlines={[{ y: 0, color: C.line, dash: "none" }]}
            legend={lams.map((l, i) => ({ label: `n = ${type === 2 ? i : i + 1}`, color: PALETTE[i] }))} legendAt="tr" />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: Heated wire (finite Fourier transform) ---------------------------------- */
function TabWire({ t }) {
  const [logBi, setLogBi] = useState(0);
  const [tt, setTt] = useState(0.3);
  const Bi = Math.pow(10, logBi);
  const lams = useMemo(() => findRoots((x) => x * besselJ(1, x) - Bi * besselJ(0, x), 60, 0.02).slice(0, 18), [Bi]);
  const coefs = useMemo(() => lams.map((l) => {
    const J0 = besselJ(0, l), J1 = besselJ(1, l);
    return (2 * J1) / (l ** 3 * J0 * J0 * (1 + (Bi / l) ** 2));
  }), [lams, Bi]);
  const theta = (r, time) => lams.reduce((s, l, i) => s + coefs[i] * besselJ(0, l * r) * (1 - Math.exp(-l * l * time)), 0);
  const steady = (r) => 1 / (2 * Bi) + (1 - r * r) / 4;
  const rs = lin(0, 1, 61);
  const tmax = Math.max(3 / (lams[0] * lams[0]), 0.5);
  const ts = lin(0, tmax, 120);
  const ymax = steady(0) * 1.08;
  const t95 = 3 / (lams[0] * lams[0]);
  return (
    <div>
      <Panel title={t("강의 예제 1: 전류가 흐르는 도선의 비정상 가열", "Lecture Ex 1: transient heating of a current-carrying wire")}>
        <P>
          {t(
            "반지름 R인 도선에 전류를 켜면 부피당 q‴의 열이 생깁니다. 표면은 대류 계수 h로 주변(T∞)에 열을 잃습니다. Θ = k(T − T∞)/(q‴R²), t* = αt/R², Bi = hR/k로 무차원화합니다.",
            "Switching on a current generates heat q‴ per unit volume in a wire of radius R. The surface loses heat to the surroundings (T∞) with coefficient h. Nondimensionalize with Θ = k(T − T∞)/(q‴R²), t* = αt/R² and Bi = hR/k."
          )}
        </P>
        <Eq block>∂Θ/∂t = (1/r)∂/∂r(r ∂Θ/∂r) + 1, &nbsp; Θ(r,0) = 0, &nbsp; ∂Θ/∂r(0) = 0, &nbsp; ∂Θ/∂r(1) + BiΘ(1) = 0</Eq>
        <P>
          {t(
            "이 식에는 생성항 +1이 있어 변수분리를 바로 쓸 수 없습니다. 대신 유한 Fourier 변환(FFT)을 씁니다. 1단계. 3형 고유함수 Φ_n으로 변환 온도 ψ_n(t) = ∫₀¹ Φ_n Θ r dr을 정의합니다.",
            "The source term +1 prevents direct separation of variables, so we use the finite Fourier transform (FFT). Step 1. With the Type 3 eigenfunctions Φ_n, define the transformed temperature ψ_n(t) = ∫₀¹ Φ_n Θ r dr."
          )}
        </P>
        <P>
          {t(
            "2단계. 지배방정식에 Φ_n r을 곱해 0부터 1까지 적분합니다. 확산항은 두 번 부분적분하면 −λ_n²ψ_n이 됩니다. Θ와 Φ_n이 같은 Robin 조건을 만족하므로 경계항은 사라집니다. 생성항은 ∫Φ_n r dr이라는 상수가 됩니다.",
            "Step 2. Multiply the governing equation by Φ_n r and integrate from 0 to 1. Integrating the diffusion term by parts twice gives −λ_n²ψ_n; the boundary term vanishes because Θ and Φ_n obey the same Robin condition. The source term becomes the constant ∫Φ_n r dr."
          )}
        </P>
        <Eq block>dψ_n/dt + λ_n²ψ_n = ∫₀¹Φ_n r dr, &nbsp; ψ_n(0) = 0 &nbsp;⇒&nbsp; ψ_n = (∫₀¹Φ_n r dr)(1 − e^(−λ_n² t))/λ_n²</Eq>
        <P>
          {t(
            "3단계. 역변환 Θ = Σψ_nΦ_n에 ∫₀¹J₀(λr) r dr = J₁(λ)/λ를 쓰면 강의의 결과가 나옵니다. t → ∞에서는 정상 해 1/(2Bi) + (1 − r²)/4로 수렴합니다.",
            "Step 3. Inverting, Θ = Σψ_nΦ_n, and using ∫₀¹J₀(λr) r dr = J₁(λ)/λ gives the lecture's result. As t → ∞ it converges to the steady solution 1/(2Bi) + (1 − r²)/4."
          )}
        </P>
        <Eq block>Θ(r,t) = 2 Σ_n [J₁(λ_n) J₀(λ_n r)] / [λ_n³ J₀(λ_n)² (1 + (Bi/λ_n)²)] · (1 − e^(−λ_n² t))</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 도선이 데워지는 과정", "Simulation: the wire warming up")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Bi" value={logBi} min={-1.5} max={1.5} step={0.05} onChange={setLogBi} fmt={(v) => `${v.toFixed(2)} (Bi = ${sci(Bi, 2)})`} />
            <Slider label="t* = αt/R²" value={tt} min={0.01} max={Math.max(3, tmax)} step={0.01} onChange={setTt} fmt={(v) => v.toFixed(2)} />
            <Readout>
              λ₁ = {lams[0].toFixed(4)} &nbsp;(λ₁² = {(lams[0] ** 2).toFixed(3)})<br />
              Θ({t("중심", "centre")}) = {theta(0, tt).toFixed(4)} / {t("정상", "steady")} {steady(0).toFixed(4)}<br />
              Θ({t("표면", "surface")}) = {theta(1, tt).toFixed(4)} / {t("정상", "steady")} {steady(1).toFixed(4)}<br />
              {t("정상의 약 95% 도달", "about 95% of steady")}: t* ≈ 3/λ₁² = {t95.toFixed(3)}
            </Readout>
            <Note>
              {t(
                "Bi가 작으면 도선 안의 온도 차(1/4)보다 표면 저항(1/(2Bi))이 훨씬 큽니다. 도선 전체가 거의 같은 온도로 오르는 집중계 거동입니다. 이때 λ₁² ≈ 2Bi이므로 시간 상수는 R²/(2αBi) = ρcR/(2h)입니다.",
                "When Bi is small, the surface resistance (1/(2Bi)) dwarfs the internal temperature difference (1/4). The whole wire warms almost uniformly, the lumped behavior. Then λ₁² ≈ 2Bi, and the time constant is R²/(2αBi) = ρcR/(2h)."
              )}
            </Note>
          </div>
          <div>
            <Chart xr={[0, 1]} yr={[0, ymax]} xl="r/R" yl="Θ = k(T − T∞)/(q‴R²)"
              series={[
                { pts: rs.map((r) => [r, steady(r)]), color: C.ink, dash: "5 4", width: 1.5 },
                ...[0.25, 0.5, 1].map((f, i) => ({ pts: rs.map((r) => [r, theta(r, tt * f)]), color: PALETTE[i], width: 2.2 })),
              ]}
              legend={[{ label: t("정상", "steady"), color: C.ink, dash: "5 4" }, { label: "t*/4", color: PALETTE[0] }, { label: "t*/2", color: PALETTE[1] }, { label: "t*", color: PALETTE[2] }]} legendAt="tr" />
            <Chart xr={[0, tmax]} yr={[0, ymax]} xl="t*" yl={t("중심 Θ", "centre Θ")}
              series={[{ pts: ts.map((x) => [x, theta(0, x)]), color: C.copper, width: 2.2 }]}
              hlines={[{ y: steady(0), color: C.ink }]} vlines={[{ x: tt, color: C.cool }]} />
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("케이스: 백금 열선과 본딩 와이어", "Case: platinum hot wires and bond wires")}>
        <P>
          {t(
            "반지름 25 μm 백금선(k ≈ 72 W/m·K)이 정지 공기 중에서 h ≈ 300 W/m²·K로 냉각되면 Bi = hR/k ≈ 10⁻⁴입니다. 도선 안의 온도는 사실상 균일하고, 거동은 집중계 시간 상수 ρcR/(2h) ≈ 0.1 s로 정해집니다. 열선 풍속계나 가스 센서의 응답 속도를 정하는 수치가 바로 이것입니다.",
            "A platinum wire of radius 25 μm (k ≈ 72 W/m·K) cooled in still air at h ≈ 300 W/m²·K has Bi = hR/k ≈ 10⁻⁴. The temperature inside is practically uniform, and the response follows the lumped time constant ρcR/(2h) ≈ 0.1 s. That number sets the response speed of hot-wire anemometers and gas sensors."
          )}
        </P>
        <P>
          {t(
            "반도체 패키지의 본딩 와이어도 같은 식을 따릅니다. 큰 전류가 짧게 흐르면 와이어가 주변 몰딩 화합물로 열을 내보내기 전에 데워집니다. 펄스 폭이 시간 상수보다 짧으면 온도는 생성열에 비례해 거의 직선으로 오르고, 길면 정상 값에서 포화됩니다.",
            "Bond wires in semiconductor packages obey the same equation. A short, large current pulse heats the wire before it can shed heat to the molding compound. If the pulse is shorter than the time constant, the temperature rises almost linearly with the generated heat; if longer, it saturates at the steady value."
          )}
        </P>
        <Note>
          {t(
            "물질전달로 바꾸면 '부피 생성'은 균일한 0차 반응 생성(예: 원통형 담체 속 생성물)이 되고, Bi는 물질전달 Biot 수 k_cR/D_eff가 됩니다. 수학은 그대로입니다.",
            "In mass-transfer terms, the volumetric source becomes uniform zero-order production (a product formed inside a cylindrical support, for example), and Bi becomes the mass-transfer Biot number k_cR/D_eff. The mathematics is unchanged."
          )}
        </Note>
      </Panel>
    </div>
  );
}


/* ---------------------------------- Tab 8: Spherical eigenfunctions ---------------------------------- */
function TabSpherical({ t }) {
  const [type, setType] = useState(3);
  const [A, setA] = useState(1);
  const lams = useMemo(() => sphEigen(type, A, 4), [type, A]);
  const xs = lin(0.05, 15, 300);
  const xs2 = lin(0.05, 4, 160);
  const rs = lin(0.001, 1, 121);
  const an = (l) => Math.SQRT2 / Math.sqrt(1 - (Math.cos(l) * Math.sin(l)) / l);
  const cond = type === 1 ? "λ_n = nπ" : type === 2 ? "λ = tan λ" : "λ = (1 − A) tan λ";
  return (
    <div>
      <Panel title={t("유도: 구에서는 구면 Bessel 함수가 나온다", "Derivation: a sphere gives spherical Bessel functions")}>
        <P>
          {t(
            "축대칭(φ 의존성 없음)인 구에서 η = cosθ로 바꾸면 지배방정식이 반지름 부분과 극각 부분으로 나뉩니다. 각도 변화가 없으면(1형 문제) 반지름 부분만 남습니다. Sturm–Liouville 꼴로 w = p = r², q = 0입니다.",
            "In an axisymmetric sphere (no φ dependence), the substitution η = cosθ splits the governing equation into radial and polar parts. Without angular variation (Case 1) only the radial part remains. In Sturm–Liouville form, w = p = r² and q = 0."
          )}
        </P>
        <Eq block>∂Θ/∂t = (1/r²)∂/∂r(r² ∂Θ/∂r) + (1/r²)∂/∂η[(1 − η²)∂Θ/∂η], &nbsp; −1 ≤ η ≤ 1</Eq>
        <Eq block>(1/r²)(r²Φ′)′ = −λ²Φ &nbsp;⇒&nbsp; Φ = a sin(λr)/r + b cos(λr)/r</Eq>
        <P>
          {t(
            "cos(λr)/r는 중심에서 발산하므로 b = 0입니다. 남는 sin(λr)/r는 차수 0의 구면 Bessel 함수 j₀(λr)에 λ를 곱한 것입니다. 반대로 반응이 있어 우변의 부호가 바뀌면 sinh(λr)/r, cosh(λr)/r가 나옵니다. 이것이 수정 구면 Bessel 함수 i₀, k₀입니다.",
            "cos(λr)/r diverges at the centre, so b = 0. The remaining sin(λr)/r is λ times the spherical Bessel function j₀(λr). When a reaction flips the sign of the right-hand side, sinh(λr)/r and cosh(λr)/r appear instead; these are the modified spherical Bessel functions i₀ and k₀."
          )}
        </P>
        <Grid2>
          <Chart xr={[0, 15]} yr={[-0.6, 1.05]} xl="ρ" yl="j_n(ρ), y_n(ρ)"
            series={[0, 1, 2, 3].map((n) => ({ pts: xs.map((x) => [x, sj[n](x)]), color: PALETTE[n], width: 2 }))
              .concat([0, 1].map((n) => ({ pts: xs.filter((x) => x > 0.6 + 0.6 * n).map((x) => [x, sy[n](x)]), color: PALETTE[n], dash: "5 4", width: 1.5 })))}
            hlines={[{ y: 0, color: C.line, dash: "none" }]}
            legend={[{ label: "j₀", color: PALETTE[0] }, { label: "j₁", color: PALETTE[1] }, { label: "j₂", color: PALETTE[2] }, { label: "j₃", color: PALETTE[3] }, { label: t("y₀, y₁ (점선)", "y₀, y₁ (dashed)"), color: C.inkSoft, dash: "5 4" }]} legendAt="tr" />
          <Chart xr={[0, 4]} yr={[0.01, 30]} ylog xl="ρ" yl="i_n(ρ), k_n(ρ)"
            series={[
              { pts: xs2.map((x) => [x, si[0](x)]), color: PALETTE[0], width: 2 },
              { pts: xs2.map((x) => [x, si[1](x)]), color: PALETTE[1], width: 2 },
              { pts: xs2.map((x) => [x, sk[0](x)]), color: PALETTE[0], dash: "5 4", width: 1.6 },
              { pts: xs2.map((x) => [x, sk[1](x)]), color: PALETTE[1], dash: "5 4", width: 1.6 },
            ]}
            legend={[{ label: "i₀ = sinhρ/ρ", color: PALETTE[0] }, { label: "i₁", color: PALETTE[1] }, { label: "k₀ = e^(−ρ)/ρ", color: PALETTE[0], dash: "5 4" }, { label: "k₁", color: PALETTE[1], dash: "5 4" }]} legendAt="tc" />
        </Grid2>
      </Panel>

      <Panel title={t("구의 고유값: 세 가지 경계조건", "Sphere eigenvalues: three boundary conditions")}>
        <div style={{ marginBottom: 6 }}>
          <Seg value={type} onChange={setType} options={[
            { v: 1, label: t("1형: Φ(1) = 0", "Type 1: Φ(1) = 0") },
            { v: 2, label: t("2형: Φ′(1) = 0", "Type 2: Φ′(1) = 0") },
            { v: 3, label: t("3형: Φ′ + AΦ = 0", "Type 3: Φ′ + AΦ = 0") }]} />
        </div>
        {type === 3 && <Slider label="A (= Bi)" value={A} min={0.02} max={50} step={0.02} onChange={setA} fmt={(v) => v.toFixed(2)} />}
        <Grid2>
          <div>
            <Readout>
              {t("고유값 조건", "eigenvalue condition")}: {cond}<br />
              λ₁…λ₄ = {lams.map((l) => l.toFixed(4)).join(", ")}
            </Readout>
            <P>
              {t(
                "3형 조건에 Φ = sin(λr)/r를 넣으면 λcosλ − sinλ + A sinλ = 0, 곧 λ = (1 − A)tanλ입니다. A = 1이면 λ = π/2, 3π/2, …가 됩니다. A가 크면 1형(nπ)으로 다가갑니다.",
                "Substituting Φ = sin(λr)/r into the Type 3 condition gives λcosλ − sinλ + A sinλ = 0, that is, λ = (1 − A)tanλ. A = 1 gives λ = π/2, 3π/2, …; large A approaches Type 1 (nπ)."
              )}
            </P>
            <Note>
              {t(
                "2형(절연 구)은 λ = 0 모드 Φ₀ = √3도 가집니다. 총량이 보존되는 문제(외부와 교환 없음)에서 평균값을 담당하는 모드입니다.",
                "Type 2 (insulated sphere) also has the λ = 0 mode Φ₀ = √3. It carries the mean value in problems where the total amount is conserved (no exchange with the outside)."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[-8, 20]} xl="r" yl={t("정규화 Φ_n = a_n sin(λ_n r)/r", "normalized Φ_n = a_n sin(λ_n r)/r")}
            series={lams.map((l, i) => ({ pts: rs.map((r) => [r, (an(l) * Math.sin(l * r)) / r]), color: PALETTE[i], width: 2 }))}
            hlines={[{ y: 0, color: C.line, dash: "none" }]}
            legend={lams.map((l, i) => ({ label: `λ = ${l.toFixed(3)}`, color: PALETTE[i] }))} legendAt="tr" />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: Sphere with first-order reaction ---------------------------------- */
const pelletSteady = (r, Da) => { const p = Math.sqrt(Da); return r < 1e-9 ? p / Math.sinh(p) : Math.sinh(p * r) / (r * Math.sinh(p)); };
const etaSphere = (phi) => (phi < 1e-4 ? 1 : (3 * (phi / Math.tanh(phi) - 1)) / (phi * phi));
function pelletTransient(r, time, Da, nterms = 200) {
  let s = pelletSteady(r, Da);
  for (let n = 1; n <= nterms; n++) {
    const a = n * Math.PI;
    const e = Math.exp(-(a * a + Da) * time);
    if (e < 1e-14) break;
    const shape = r < 1e-9 ? a : Math.sin(a * r) / r;
    s += ((2 * a * (n % 2 ? -1 : 1)) / (a * a + Da)) * e * shape;
  }
  return s;
}
function TabPellet({ t }) {
  const [logDa, setLogDa] = useState(Math.log10(9));
  const [tt, setTt] = useState(0.05);
  const Da = Math.pow(10, logDa), phi = Math.sqrt(Da);
  const rs = lin(0, 1, 121);
  const phis = lin(-1, 2, 160).map((e) => Math.pow(10, e));
  const ts = lin(0.0005, 0.5, 160);
  // design case
  const [logk, setLogk] = useState(1);
  const [logDe, setLogDe] = useState(-6);
  const [Rmm, setRmm] = useState(2);
  const kk = Math.pow(10, logk), De = Math.pow(10, logDe), Rp = Rmm * 1e-3;
  const phiP = Rp * Math.sqrt(kk / De);
  const etaP = etaSphere(phiP);
  const phi90 = (() => { let lo = 1e-3, hi = 50; for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (etaSphere(m) > 0.9) lo = m; else hi = m; } return 0.5 * (lo + hi); })();
  const R90 = phi90 / Math.sqrt(kk / De);
  return (
    <div>
      <Panel title={t("강의 예제 1: 1차 반응이 있는 구의 정상 확산", "Lecture Ex 1: steady diffusion with a first-order reaction in a sphere")}>
        <P>
          {t(
            "다공성 촉매 펠릿 안으로 반응물이 확산하면서 1차 반응으로 소모됩니다. 가정은 구 대칭, 정상상태, 등온, 유효 확산계수 D가 일정함, 그리고 표면 농도 c_s가 고정됨(외부 막 저항 무시)입니다. Θ = c/c_s, r* = r/R로 두면 Damköhler 수 하나가 남습니다.",
            "A reactant diffuses into a porous catalyst pellet and is consumed by a first-order reaction. Assume spherical symmetry, steady state, isothermal operation, a constant effective diffusivity D, and a fixed surface concentration c_s (no external film resistance). With Θ = c/c_s and r* = r/R, one Damköhler number remains."
          )}
        </P>
        <Eq block>(1/r²) d/dr(r² dΘ/dr) − Da Θ = 0, &nbsp; Da = kR²/D = φ² &nbsp;({t("반응 속도/확산 속도", "reaction rate / diffusion rate")}), &nbsp; Θ′(0) = 0, &nbsp; Θ(1) = 1</Eq>
        <P>
          {t(
            "1단계. 수정 구면 Bessel 방정식(n = 0)과 비교하면 일반해는 sinh(φr)/r와 cosh(φr)/r의 조합입니다. 2단계. 중심에서 유한하려면 cosh 항이 빠집니다. 3단계. Θ(1) = 1로 계수를 정합니다.",
            "Step 1. Comparing with the modified spherical Bessel equation (n = 0), the general solution combines sinh(φr)/r and cosh(φr)/r. Step 2. Finiteness at the centre removes the cosh term. Step 3. Θ(1) = 1 fixes the coefficient."
          )}
        </P>
        <Eq block>Θ(r) = sinh(φr) / (r sinh φ), &nbsp;&nbsp; Θ(0) = φ / sinh φ</Eq>
        <P>
          {t(
            "4단계. 유효 인자 η는 실제 반응 속도를 '펠릿 전체가 표면 농도였을 때'의 속도로 나눈 값입니다. 정상상태에서 실제 속도는 표면으로 들어오는 확산 플럭스와 같습니다.",
            "Step 4. The effectiveness factor η is the actual reaction rate divided by the rate if the whole pellet were at the surface concentration. At steady state the actual rate equals the diffusive flux entering the surface."
          )}
        </P>
        <Eq block>η = 4πR²D(dc/dr)|_R / ((4/3)πR³ k c_s) = (3/φ²) Θ′(1) = 3(φ coth φ − 1)/φ² &nbsp;→&nbsp; 3/φ &nbsp;(φ ≫ 1)</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 정상 분포, 시동 과정, 유효 인자", "Simulation: steady profile, start-up and effectiveness factor")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Da" value={logDa} min={-1} max={3} step={0.02} onChange={setLogDa} fmt={(v) => `${v.toFixed(2)} (Da = ${sci(Da, 2)}, φ = ${phi.toFixed(2)})`} />
            <Slider label={t("시동 후 시간 t* = Dt/R²", "time after start-up t* = Dt/R²")} value={tt} min={0.001} max={0.5} step={0.001} onChange={setTt} fmt={(v) => v.toFixed(3)} />
            <Readout>
              Θ({t("중심, 정상", "centre, steady")}) = {pelletSteady(0, Da).toFixed(4)}<br />
              η = {etaSphere(phi).toFixed(4)} &nbsp;({t("φ ≫ 1 근사", "φ ≫ 1 limit")} 3/φ = {(3 / phi).toFixed(4)})<br />
              {t("가장 느린 감쇠 속도", "slowest decay rate")} π² + Da = {(Math.PI ** 2 + Da).toFixed(2)}
            </Readout>
            <Chart xr={[0, 1]} yr={[0, 1.05]} xl="r/R" yl="Θ = c/c_s"
              series={[
                { pts: rs.map((r) => [r, pelletSteady(r, Da)]), color: C.ink, dash: "5 4", width: 1.5 },
                { pts: rs.map((r) => [r, Math.max(0, pelletTransient(r, tt, Da))]), color: C.copper, width: 2.4 },
              ]}
              legend={[{ label: t("정상", "steady"), color: C.ink, dash: "5 4" }, { label: `t* = ${tt.toFixed(3)}`, color: C.copper }]} legendAt="tl" />
          </div>
          <div>
            <Chart xr={[0.1, 100]} yr={[0.02, 1.2]} xlog ylog xl="φ = R√(k/D)" yl="η"
              series={[
                { pts: phis.map((p) => [p, etaSphere(p)]), color: C.copper, width: 2.4 },
                { pts: phis.filter((p) => p > 1).map((p) => [p, 3 / p]), color: C.cool, dash: "6 4" },
              ]}
              hlines={[{ y: 1, color: C.inkSoft }]} dots={[{ x: phi, y: etaSphere(phi) }]}
              legend={[{ label: "η(φ)", color: C.copper }, { label: "3/φ", color: C.cool, dash: "6 4" }]} legendAt="bl" />
            <Chart xr={[0, 0.5]} yr={[0, 1.05]} xl="t*" yl={t("중심 Θ", "centre Θ")}
              series={[{ pts: ts.map((x) => [x, Math.max(0, pelletTransient(0, x, Da))]), color: C.copper, width: 2.2 }]}
              hlines={[{ y: pelletSteady(0, Da), color: C.ink }]} vlines={[{ x: tt, color: C.cool }]} />
          </div>
        </Grid2>
        <Note>
          {t(
            "강의 예제 2는 같은 펠릿을 Θ = 0에서 시작합니다. 비동차 경계 Θ(1) = 1 때문에 변환식에 경계항 −√2(nπ)(−1)ⁿ이 남고, 각 모드는 (nπ)² + Da의 속도로 감쇠합니다. 반응이 빠를수록 정상상태에 더 빨리 도달하지만, 도달하는 값은 더 작습니다.",
            "Lecture Ex 2 starts the same pellet from Θ = 0. Because of the non-homogeneous boundary Θ(1) = 1, a boundary term −√2(nπ)(−1)ⁿ remains in the transformed equation, and each mode decays at the rate (nπ)² + Da. A faster reaction reaches steady state sooner, but at a lower level."
          )}
        </Note>
      </Panel>

      <Panel title={t("케이스: 촉매 펠릿의 크기 정하기", "Case: sizing a catalyst pellet")}>
        <Grid2>
          <div>
            <Slider label={t("log₁₀ k (s⁻¹, 펠릿 부피 기준)", "log₁₀ k (s⁻¹, per pellet volume)")} value={logk} min={-2} max={3} step={0.05} onChange={setLogk} fmt={(v) => `${v.toFixed(2)} (k = ${sci(kk, 2)})`} />
            <Slider label="log₁₀ D_eff (m²/s)" value={logDe} min={-8} max={-5} step={0.05} onChange={setLogDe} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("펠릿 반지름 R", "pellet radius R")} value={Rmm} min={0.05} max={10} step={0.05} onChange={setRmm} unit=" mm" fmt={(v) => v.toFixed(2)} />
          </div>
          <Readout>
            φ = R√(k/D_eff) = {phiP.toFixed(3)}<br />
            η = {etaP.toFixed(3)}<br />
            {t("η = 0.9를 위한 최대 반지름", "largest R for η = 0.9")}: {(R90 * 1e3).toFixed(3)} mm (φ = {phi90.toFixed(3)})<br />
            {t("Weisz–Prater 수", "Weisz–Prater number")} ηφ² = {(etaP * phiP * phiP).toFixed(3)}
          </Readout>
        </Grid2>
        <P>
          {t(
            "φ가 크면 반응물이 펠릿 깊숙이 들어가기 전에 소모되어, 중심부 촉매가 놀게 됩니다. 펠릿을 작게 만들면 η가 오르지만 충전층의 압력 손실이 커집니다. 그래서 산업에서는 달걀 껍질형(egg-shell) 담지처럼 활성 성분을 바깥 껍질에만 두기도 합니다.",
            "At large φ the reactant is consumed before it penetrates deep, and the catalyst at the core sits idle. Smaller pellets raise η but increase the pressure drop of the packed bed. Industry therefore sometimes places the active phase only in an outer shell (egg-shell catalysts)."
          )}
        </P>
        <Note>
          {t(
            "k를 모르는 실험 단계에서는 관측 속도 r_obs로 계산하는 Weisz–Prater 수 r_obs R²/(D_eff c_s) = ηφ²를 씁니다. 이 값이 1보다 훨씬 작으면 내부 확산 제한이 없다고 판단합니다. 반도체에서도 같은 길이 √(D/k)가 나옵니다. 화학증폭형 레지스트에서 광산(photoacid)이 확산하면서 염기 소광제와 반응해 사라지는데, 이 반응–확산 길이가 패턴의 흐림(blur)을 정합니다.",
            "When k is unknown, the Weisz–Prater number r_obs R²/(D_eff c_s) = ηφ², computed from the observed rate, is used instead. A value much smaller than 1 indicates no internal diffusion limitation. The same length √(D/k) appears in semiconductors: in chemically amplified resists the photoacid diffuses while being neutralized by a base quencher, and that reaction–diffusion length sets the image blur."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 10: Legendre polynomials & Maxwell ---------------------------------- */
function TabLegendre({ t }) {
  const [gamma, setGamma] = useState(10);
  const [f, setF] = useState(0.3);
  const etas = lin(-1, 1, 201);
  const fs = lin(0, 0.6, 121);
  const maxwell = (g, ff) => (g + 2 + 2 * ff * (g - 1)) / (g + 2 - ff * (g - 1));
  // temperature field around one sphere (R = 1), uniform gradient G = 1 along z
  const Nn = 56, span = 3;
  const field = useMemo(() => {
    const out = [];
    const beta = (1 - gamma) / (2 + gamma);
    for (let j = 0; j < Nn; j++) {
      const row = [];
      for (let i = 0; i < Nn; i++) {
        const x = -span + ((i + 0.5) * 2 * span) / Nn, z = span - ((j + 0.5) * 2 * span) / Nn;
        const r = Math.hypot(x, z);
        row.push(r <= 1 ? (3 / (2 + gamma)) * z : z * (1 + beta / (r * r * r)));
      }
      out.push(row);
    }
    return out;
  }, [gamma]);
  const cellPx = 300 / Nn;
  return (
    <div>
      <Panel title={t("유도: 극각 방향에서는 Legendre 다항식이 나온다", "Derivation: the polar direction gives Legendre polynomials")}>
        <P>
          {t(
            "반지름 변화가 없고 극각 θ로만 변하는 문제(2형 문제)에서 η = cosθ로 바꾸면 Legendre 방정식이 나옵니다. Sturm–Liouville 꼴로 w = 1, p = 1 − η², q = 0입니다.",
            "For a problem that varies only with the polar angle θ (Case 2), the substitution η = cosθ gives Legendre's equation. In Sturm–Liouville form, w = 1, p = 1 − η² and q = 0."
          )}
        </P>
        <Eq block>d/dη[(1 − η²) dΦ/dη] = −λ²Φ, &nbsp; −1 ≤ η ≤ 1</Eq>
        <P>
          {t(
            "η = ±1(극)에서 p = 0이므로 경계조건 대신 '해가 유한해야 한다'는 조건이 들어갑니다. 이 조건은 λ² = n(n+1)일 때만 만족되고, 해는 다항식 P_n(η)입니다. P₀ = 1, P₁ = η이고 나머지는 점화식 P_(n+1) = [(2n+1)ηP_n − nP_(n−1)]/(n+1)로 얻습니다.",
            "At the poles η = ±1, p = 0, so the requirement that the solution stay finite replaces a boundary condition. It is met only when λ² = n(n+1), and the solutions are the polynomials P_n(η). P₀ = 1, P₁ = η, and the rest follow from P_(n+1) = [(2n+1)ηP_n − nP_(n−1)]/(n+1)."
          )}
        </P>
        <Eq block>∫₋₁¹ P_n P_m dη = [2/(2n+1)] δ_nm &nbsp;⇒&nbsp; Φ_n = √((2n+1)/2) P_n(η)</Eq>
        <Chart H={340} xr={[-1, 1]} yr={[-1.05, 2.3]} xl="η = cosθ" yl="P_n(η)"
          series={[0, 1, 2, 3, 4].map((n) => ({ pts: etas.map((x) => [x, legendreP(n, x)]), color: PALETTE[n], width: 2 }))}
          hlines={[{ y: 0, color: C.line, dash: "none" }]}
          legend={[0, 1, 2, 3, 4].map((n) => ({ label: `P${"₀₁₂₃₄"[n]}`, color: PALETTE[n] }))} legendAt="tc" />
      </Panel>

      <Panel title={t("강의 예제: 균일한 온도 기울기 속의 구", "Lecture example: a sphere in a uniform temperature gradient")}>
        <P>
          {t(
            "전도도 k_A인 매질 속에 전도도 k_B인 구가 있고, 멀리서는 z 방향으로 균일한 기울기 G가 걸려 있습니다. γ = k_B/k_A입니다. 정상상태에서 안팎 모두 Laplace 방정식을 만족합니다.",
            "A sphere of conductivity k_B sits in a matrix of conductivity k_A, with a uniform far-field gradient G along z. Let γ = k_B/k_A. At steady state both regions satisfy Laplace's equation."
          )}
        </P>
        <P>
          {t(
            "1단계. Φ_n(η)로 변환하면 각 모드는 (r²Ψ_n′)′ = n(n+1)Ψ_n이 되고, 해는 r^n과 r^(−(n+1))입니다. 2단계. 멀리서 T → G r η = G r P₁이므로 n = 1만 살아남습니다. 3단계. 구 안에서는 중심에서 유한해야 하므로 r¹만 남습니다. 4단계. r = R에서 온도와 열유속(k_A∂Ψ/∂r = k_B∂Λ/∂r)이 연속이라는 두 조건으로 B₁과 C₁을 정합니다.",
            "Step 1. Transforming with Φ_n(η), each mode obeys (r²Ψ_n′)′ = n(n+1)Ψ_n, with solutions r^n and r^(−(n+1)). Step 2. Far away T → G r η = G r P₁, so only n = 1 survives. Step 3. Inside, finiteness at the centre leaves only r¹. Step 4. Continuity of temperature and heat flux (k_A∂Ψ/∂r = k_B∂Λ/∂r) at r = R fixes B₁ and C₁."
          )}
        </P>
        <Eq block>T_out = G r cosθ [1 + ((1 − γ)/(2 + γ))(R/r)³], &nbsp;&nbsp; T_in = G r cosθ · 3/(2 + γ)</Eq>
        <Grid2>
          <div>
            <Slider label="γ = k_B/k_A" value={gamma} min={0} max={100} step={0.1} onChange={setGamma} fmt={(v) => v.toFixed(1)} />
            <Readout>
              {t("구 안의 기울기", "gradient inside")} = {(3 / (2 + gamma)).toFixed(4)} G<br />
              {t("쌍극자 세기", "dipole strength")} (1 − γ)/(2 + γ) = {((1 - gamma) / (2 + gamma)).toFixed(4)}
            </Readout>
            <Note>
              {t(
                "γ > 1이면 등온선이 구 쪽으로 끌려 들어오고, 열이 구를 지름길로 씁니다. γ = 0(단열 구, 또는 확산이 통하지 않는 입자)이면 등온선이 구를 피해 돌아갑니다. 구의 전도도를 아무리 높여도 구 안의 기울기는 0으로 줄어들 뿐입니다. 반대로 단열 구(γ → 0)에서도 구 안의 기울기는 바깥의 1.5배를 넘지 못합니다.",
                "For γ > 1 the isotherms are pulled into the sphere and heat takes it as a shortcut. For γ = 0 (an insulating sphere, or a particle that blocks diffusion) the isotherms bend around it. However conductive the sphere, its internal gradient only falls toward 0; even for an insulating sphere (γ → 0) it never exceeds 1.5 times the far-field gradient."
              )}
            </Note>
          </div>
          <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 320, display: "block", margin: "0 auto" }}>
            {field.map((row, j) => row.map((v, i) => {
              const band = Math.round(((v + span) / (2 * span)) * 12) / 12;
              return <rect key={i + "-" + j} x={i * cellPx} y={j * cellPx} width={cellPx + 0.4} height={cellPx + 0.4} fill={ramp(band)} />;
            }))}
            <circle cx={150} cy={150} r={150 / span} fill="none" stroke="#fff" strokeWidth={1.6} strokeDasharray="4 3" />
            <text x={8} y={16} fontSize="12" fill="#fff">z ↑</text>
          </svg>
        </Grid2>
      </Panel>

      <Panel title={t("Maxwell 유효 전도도와 케이스", "Maxwell's effective conductivity and cases")}>
        <P>
          {t(
            "희박한 현탁액에서는 구들이 서로의 장을 거의 보지 못합니다. 각 구가 만드는 쌍극자 장을 더하면 Maxwell의 유효 전도도를 얻습니다. 확산에도 그대로 쓰입니다(k를 D로, 그리고 분배계수 차이가 없을 때).",
            "In a dilute suspension the spheres barely see one another's fields. Adding the dipole field of each sphere yields Maxwell's effective conductivity. It applies to diffusion as well (replace k by D, with no partition-coefficient difference)."
          )}
        </P>
        <Eq block>k_eff/k_A = [γ + 2 + 2f(γ − 1)] / [γ + 2 − f(γ − 1)], &nbsp; f: {t("구의 부피 분율", "sphere volume fraction")}</Eq>
        <Grid2>
          <div>
            <Slider label={t("부피 분율 f", "volume fraction f")} value={f} min={0} max={0.6} step={0.01} onChange={setF} fmt={(v) => v.toFixed(2)} />
            <Readout>
              k_eff/k_A (Maxwell) = {maxwell(gamma, f).toFixed(3)}<br />
              {t("병렬 상한", "parallel bound")} = {(f * gamma + (1 - f)).toFixed(3)}<br />
              {t("직렬 하한", "series bound")} = {(1 / (f / Math.max(gamma, 1e-9) + (1 - f))).toFixed(3)}
            </Readout>
          </div>
          <Chart xr={[0, 0.6]} yr={[0, Math.max(3, maxwell(gamma, 0.6) * 1.1)]} xl={t("부피 분율 f", "volume fraction f")} yl="k_eff / k_A"
            series={[
              { pts: fs.map((x) => [x, maxwell(gamma, x)]), color: C.copper, width: 2.4 },
              { pts: fs.map((x) => [x, x * gamma + (1 - x)]), color: C.cool, dash: "6 4" },
              { pts: fs.map((x) => [x, 1 / (x / Math.max(gamma, 1e-9) + (1 - x))]), color: C.good, dash: "2 4" },
            ]}
            dots={[{ x: f, y: maxwell(gamma, f) }]}
            legend={[{ label: "Maxwell", color: C.copper }, { label: t("병렬", "parallel"), color: C.cool, dash: "6 4" }, { label: t("직렬", "series"), color: C.good, dash: "2 4" }]} legendAt="tl" />
        </Grid2>
        <Table plain
          head={[t("분야", "Field"), t("케이스", "Case"), t("이 식이 말해 주는 것", "What the formula says")]}
          rows={[
            [t("반도체 패키징", "Semiconductor packaging"), t("열 계면 소재(TIM), 언더필, 몰딩 화합물의 세라믹 충전재", "ceramic fillers in TIMs, underfills and molding compounds"), t("γ가 아무리 커도 희박 영역에서는 k_eff/k_A ≤ (1+2f)/(1−f). 고전도 TIM은 입자가 서로 닿는 고충전(f > 0.5)이 필요합니다.", "However large γ is, the dilute limit gives k_eff/k_A ≤ (1+2f)/(1−f). High-conductivity TIMs need high loadings (f > 0.5) where particles touch.")],
            [t("촉매공학", "Catalysis"), t("확산이 통하지 않는 입자가 섞인 담체", "supports containing impermeable particles"), t("γ = 0이면 D_eff/D = 2(1 − f)/(2 + f). 부피의 30%를 막아도 D는 약 39%만 줄어듭니다.", "With γ = 0, D_eff/D = 2(1 − f)/(2 + f). Blocking 30% of the volume lowers D by only about 39%.")],
            [t("화학공학", "Chemical engineering"), t("혼합 기질 분리막(고분자 + 다공성 충전재)", "mixed-matrix membranes (polymer + porous filler)"), t("투과도가 높은 충전재(γ > 1)를 넣으면 투과도가 오르지만, 계면 결함이 없을 때만 Maxwell을 따릅니다.", "A permeable filler (γ > 1) raises permeability, following Maxwell only when the interfaces are defect-free.")],
          ]}
        />
        <Note>
          {t(
            "Maxwell 식은 구가 서로 멀리 떨어진 희박 영역(f ≲ 0.25)의 결과입니다. 입자가 사슬로 이어지는 퍼콜레이션이 생기면 측정값이 이 식보다 크게 나옵니다.",
            "Maxwell's formula is a dilute-limit result (f ≲ 0.25) for well-separated spheres. Once particles form connected chains (percolation), measured values exceed it."
          )}
        </Note>
      </Panel>
    </div>
  );
}


/* ---------------------------------- Tab 11: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. 깊고 잔잔한 물(25 °C)의 표면이 갑자기 공기와 접촉해 표면 O₂ 농도가 0.26 mol/m³로 유지된다. 물 속 초기 O₂는 0이고 D = 2.1×10⁻⁹ m²/s이다. 1시간 뒤 (a) 확산 길이 √(Dt), (b) 표면 플럭스, (c) 단위 면적당 흡수된 O₂ 양을 구하라.",
        "P1. The surface of deep, still water at 25 °C is suddenly exposed to air and held at an O₂ concentration of 0.26 mol/m³. The water initially has no O₂, and D = 2.1×10⁻⁹ m²/s. After 1 h find (a) the diffusion length √(Dt), (b) the surface flux and (c) the O₂ absorbed per unit area."
      ),
      s: t(
        "(a) √(Dt) = √(2.1×10⁻⁹ × 3600) = 2.75 mm. 물 깊이가 수 cm 이상이면 반무한 가정이 맞습니다. (b) N = c_s√(D/(πt)) = 0.26 × √(2.1×10⁻⁹/(π × 3600)) = 1.12×10⁻⁷ mol/m²·s. (c) W/S = 2c_s√(Dt/π) = 8.07×10⁻⁴ mol/m², 약 26 mg/m²입니다. 확산만으로는 산소 공급이 매우 느리므로, 수처리에서는 폭기로 표면을 계속 새로 만듭니다(침투 이론).",
        "(a) √(Dt) = √(2.1×10⁻⁹ × 3600) = 2.75 mm, so water a few centimeters deep or more is effectively semi-infinite. (b) N = c_s√(D/(πt)) = 0.26 × √(2.1×10⁻⁹/(π × 3600)) = 1.12×10⁻⁷ mol/m²·s. (c) W/S = 2c_s√(Dt/π) = 8.07×10⁻⁴ mol/m², about 26 mg/m². Diffusion alone supplies oxygen very slowly, which is why water treatment aerates to keep renewing the surface (penetration theory)."
      ),
    },
    {
      q: t(
        "P2. 강의의 P 도핑 조건(1373 K, c_s = 2.5×10²⁰ cm⁻³, D = 6.5×10⁻¹³ cm²/s)에서 30분 동안 확산했다. 기판 농도 10¹⁷ cm⁻³와 같아지는 깊이(접합 깊이)를 구하라.",
        "P2. Under the lecture's P-doping conditions (1373 K, c_s = 2.5×10²⁰ cm⁻³, D = 6.5×10⁻¹³ cm²/s), diffusion runs for 30 min. Find the depth at which the concentration equals the substrate level of 10¹⁷ cm⁻³ (the junction depth)."
      ),
      s: t(
        "erfc(φ) = 10¹⁷/2.5×10²⁰ = 4×10⁻⁴ → φ = 2.503. z = 2φ√(Dt) = 2 × 2.503 × √(6.5×10⁻¹³ × 1800) = 1.71×10⁻⁴ cm = 1.71 μm. 목표 농도를 25배 낮췄더니(2.5×10¹⁸ → 10¹⁷) φ가 1.82에서 2.50으로 커졌습니다. erfc의 꼬리가 가파르기 때문에, 시간을 절반으로 줄인 효과와 거의 상쇄됩니다.",
        "erfc(φ) = 10¹⁷/2.5×10²⁰ = 4×10⁻⁴ gives φ = 2.503. z = 2φ√(Dt) = 2 × 2.503 × √(6.5×10⁻¹³ × 1800) = 1.71×10⁻⁴ cm = 1.71 μm. Lowering the target 25-fold (2.5×10¹⁸ → 10¹⁷) raised φ from 1.82 to 2.50. Because the erfc tail is steep, this nearly cancels the effect of halving the time."
      ),
    },
    {
      q: t(
        "P3. 두께 50 μm의 고분자 필름이 양면에서 용매를 흡수한다. D = 1.0×10⁻¹² m²/s이다. 50%와 90% 흡수에 걸리는 시간을 구하라. 50% 시간을 단시간 근사 4√(Fo/π)로도 구해 비교하라.",
        "P3. A 50 μm polymer film absorbs a solvent through both faces, with D = 1.0×10⁻¹² m²/s. Find the times for 50% and 90% uptake. Also estimate the 50% time with the short-time formula 4√(Fo/π) and compare."
      ),
      s: t(
        "급수에서 M/M∞ = 0.5는 Fo = 0.0492, 0.9는 Fo = 0.212입니다. L²/D = (50×10⁻⁶)²/10⁻¹² = 2500 s이므로 t₅₀ = 123 s, t₉₀ = 530 s입니다. 단시간 근사에서는 4√(Fo/π) = 0.5 → Fo = π/64 = 0.0491로, 정확한 값과 0.2% 차이입니다. 50%까지는 두 면이 서로를 보지 못한다는 뜻입니다.",
        "The series gives M/M∞ = 0.5 at Fo = 0.0492 and 0.9 at Fo = 0.212. With L²/D = (50×10⁻⁶)²/10⁻¹² = 2500 s, t₅₀ = 123 s and t₉₀ = 530 s. The short-time formula 4√(Fo/π) = 0.5 gives Fo = π/64 = 0.0491, within 0.2% of the exact value. Up to 50% uptake, the two faces effectively do not see each other."
      ),
    },
    {
      q: t(
        "P4. 반지름 0.5 mm 하이드로젤 비드에서 단백질 약물(D = 1×10⁻¹¹ m²/s)이 완전 흡수(sink) 조건으로 방출된다. (a) 50%, 90% 방출 시간을 구하라. (b) 50% 방출 시점의 중심 농도는? (c) 90% 시간을 단항 근사로 구하면?",
        "P4. A protein drug (D = 1×10⁻¹¹ m²/s) is released under perfect-sink conditions from a hydrogel bead of radius 0.5 mm. (a) Find the 50% and 90% release times. (b) What is the centre concentration at 50% release? (c) Estimate the 90% time with the one-term approximation."
      ),
      s: t(
        "(a) m/m₀ = 0.5는 τ = 0.0305, 0.1은 τ = 0.183입니다. R²/D = 2.5×10⁴ s이므로 t₅₀ = 12.7분, t₉₀ = 76.2분입니다. (b) τ = 0.0305에서 c(0)/c₀ = 1 + 2Σ(−1)ⁿe^(−n²π²τ) = 0.998로, 절반이 빠져나가는 동안 중심은 거의 변하지 않습니다. 방출은 바깥 껍질에서 먼저 일어납니다. (c) (6/π²)e^(−π²τ) = 0.1 → τ = 0.1829로, 정확한 값과 거의 같습니다. 단항 근사는 τ ≳ 0.1에서 충분합니다.",
        "(a) m/m₀ = 0.5 at τ = 0.0305 and 0.1 at τ = 0.183. With R²/D = 2.5×10⁴ s, t₅₀ = 12.7 min and t₉₀ = 76.2 min. (b) At τ = 0.0305, c(0)/c₀ = 1 + 2Σ(−1)ⁿe^(−n²π²τ) = 0.998: while half the drug leaves, the centre hardly changes, because release starts from the outer shell. (c) (6/π²)e^(−π²τ) = 0.1 gives τ = 0.1829, almost identical to the exact value; the one-term form is adequate for τ ≳ 0.1."
      ),
    },
    {
      q: t(
        "P5. 강의 예제 1의 전열선에서 Bi = 1이다. (a) 정상상태의 중심과 표면 무차원 온도, (b) 첫 고유값 λ₁, (c) 중심 온도가 정상 값의 약 95%에 이르는 무차원 시간을 구하라.",
        "P5. For the heated wire of lecture Ex 1, Bi = 1. Find (a) the steady dimensionless temperatures at the centre and the surface, (b) the first eigenvalue λ₁ and (c) the dimensionless time for the centre to reach about 95% of its steady value."
      ),
      s: t(
        "(a) Θ_ss = 1/(2Bi) + (1 − r²)/4이므로 중심 0.75, 표면 0.50입니다. 표면 저항(0.5)이 내부 온도 차(0.25)의 2배입니다. (b) λJ₁(λ) = J₀(λ)를 풀면 λ₁ = 1.2558입니다. (c) 첫 모드가 지배하므로 e^(−λ₁²t) ≈ 0.05 → t* ≈ 3/λ₁² = 1.90입니다. 전체 급수로 풀면 1.91입니다.",
        "(a) Θ_ss = 1/(2Bi) + (1 − r²)/4 gives 0.75 at the centre and 0.50 at the surface; the surface resistance (0.5) is twice the internal difference (0.25). (b) Solving λJ₁(λ) = J₀(λ) gives λ₁ = 1.2558. (c) The first mode dominates, so e^(−λ₁²t) ≈ 0.05 and t* ≈ 3/λ₁² = 1.90. The full series gives 1.91."
      ),
    },
    {
      q: t(
        "P6. 반지름 3 mm 구형 촉매 펠릿에서 1차 반응이 일어난다. k = 5 s⁻¹, D_eff = 2×10⁻⁷ m²/s이다. (a) φ와 η를 구하라. (b) η = 0.9가 되려면 반지름을 얼마로 줄여야 하는가?",
        "P6. A first-order reaction runs in spherical catalyst pellets of radius 3 mm, with k = 5 s⁻¹ and D_eff = 2×10⁻⁷ m²/s. (a) Find φ and η. (b) To what radius must the pellet shrink for η = 0.9?"
      ),
      s: t(
        "(a) φ = R√(k/D_eff) = 3×10⁻³ × √(2.5×10⁷) = 15.0. η = 3(φcothφ − 1)/φ² = 3 × 14/225 = 0.187로, 3/φ = 0.20에 가깝습니다. 촉매의 80% 이상이 놀고 있습니다. (b) η = 0.9는 φ = 1.322일 때입니다. R = 1.322/√(2.5×10⁷) = 0.264 mm. 이렇게 작은 입자는 충전층 압력 손실이 크므로, 실제로는 달걀 껍질형 담지나 모노리스를 검토합니다.",
        "(a) φ = R√(k/D_eff) = 3×10⁻³ × √(2.5×10⁷) = 15.0. η = 3(φcothφ − 1)/φ² = 3 × 14/225 = 0.187, close to 3/φ = 0.20: over 80% of the catalyst is idle. (b) η = 0.9 requires φ = 1.322, so R = 1.322/√(2.5×10⁷) = 0.264 mm. Particles this small cause a large bed pressure drop, so in practice egg-shell catalysts or monoliths are considered."
      ),
    },
    {
      q: t(
        "P7. 강한 기공 확산 제한(φ ≫ 1)에서 펠릿 단위 부피당 관측 속도는 ηkc_s ≈ (3/φ)kc_s이다. 참 활성화 에너지가 100 kJ/mol이면 측정되는 겉보기 활성화 에너지는 얼마인가? D_eff의 온도 의존성은 무시한다.",
        "P7. Under strong pore-diffusion limitation (φ ≫ 1), the observed rate per pellet volume is ηkc_s ≈ (3/φ)kc_s. If the true activation energy is 100 kJ/mol, what apparent activation energy is measured? Neglect the temperature dependence of D_eff."
      ),
      s: t(
        "φ = R√(k/D_eff)이므로 (3/φ)k = (3/R)√(kD_eff) ∝ k^(1/2)입니다. 따라서 E_app = E/2 = 50 kJ/mol입니다. 온도를 바꿔 얻은 Arrhenius 기울기가 고온에서 절반으로 꺾이면, 화학이 아니라 기공 확산이 속도를 정하고 있다는 신호입니다.",
        "Since φ = R√(k/D_eff), (3/φ)k = (3/R)√(kD_eff) ∝ k^(1/2). Therefore E_app = E/2 = 50 kJ/mol. If an Arrhenius slope halves at high temperature, pore diffusion rather than chemistry is controlling the rate."
      ),
    },
    {
      q: t(
        "P8. 에폭시(k_A = 0.2 W/m·K)에 알루미나 구(k_B = 30 W/m·K)를 넣어 열 계면 소재를 만든다. (a) f = 0.4에서 Maxwell 식의 k_eff는? (b) k_eff = 1 W/m·K가 되려면 Maxwell 식으로 f가 얼마여야 하는가? 이 값을 믿을 수 있는가?",
        "P8. Alumina spheres (k_B = 30 W/m·K) are added to epoxy (k_A = 0.2 W/m·K) to make a thermal interface material. (a) What does Maxwell's formula give for k_eff at f = 0.4? (b) What f would Maxwell's formula require for k_eff = 1 W/m·K? Can that value be trusted?"
      ),
      s: t(
        "γ = 150. (a) k_eff/k_A = (152 + 298 × 0.4)/(152 − 149 × 0.4) = 2.94이므로 k_eff = 0.587 W/m·K입니다. (b) (152 + 298f)/(152 − 149f) = 5 → f = 0.583입니다. 이 값은 희박 가정(f ≲ 0.25)을 크게 벗어나므로 정량적으로 믿기 어렵습니다. 실제 고충전 TIM에서는 입자 접촉과 퍼콜레이션 때문에 Maxwell보다 높은 값이 나오기도 하고, 계면 열저항 때문에 낮게 나오기도 합니다.",
        "γ = 150. (a) k_eff/k_A = (152 + 298 × 0.4)/(152 − 149 × 0.4) = 2.94, so k_eff = 0.587 W/m·K. (b) (152 + 298f)/(152 − 149f) = 5 gives f = 0.583. That is far outside the dilute assumption (f ≲ 0.25), so it cannot be trusted quantitatively. Real high-loading TIMs can exceed Maxwell because particles touch and percolate, or fall below it because of interfacial thermal resistance."
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

/* ---------------------------------- Tab 12: Code ---------------------------------- */
function TabCode({ t }) {
  const topics = ["topic1", "topic2", "topic3", "topic4"];
  const langs = [
    { key: "python", label: "Python", ext: "py" },
    { key: "matlab", label: "MATLAB", ext: "m" },
    { key: "julia", label: "Julia", ext: "jl" },
    { key: "cpp", label: "C++", ext: "cpp" },
  ];
  const fileStem = {
    topic1: "week11_topic1_slab_semi_infinite",
    topic2: "week11_topic2_sphere_release",
    topic3: "week11_topic3_bessel_cylinder",
    topic4: "week11_topic4_sphere_reaction_legendre",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK11_CODES[topic][lang];
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
              {WEEK11_CODES[tp].title}
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
            "Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 확인한 값은 다음과 같습니다. 주제 1: 강의의 도핑 깊이 1.76 μm를 재현하고, 평판 급수와 Crank–Nicolson 해가 일치합니다. 주제 2: 구 급수와 유한체적 해가 소수 넷째 자리까지 같습니다. 주제 3: J₀ 근 2.4048·5.5201·8.6537, 가중 직교성, 전열선 급수와 유한체적 해가 맞습니다. 주제 4: 반응 구의 급수와 유한체적 해, Legendre 직교성 2/(2n+1)이 맞습니다. MATLAB과 Julia는 같은 알고리즘을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "The Python and C++ versions were run and their outputs compared; for all four topics they agree digit for digit. Checks: topic 1 reproduces the lecture's doping depth of 1.76 μm, and the slab series matches Crank–Nicolson. Topic 2: the sphere series and finite-volume solutions agree to four decimals. Topic 3: the J₀ roots 2.4048, 5.5201 and 8.6537, weighted orthogonality, and the heated-wire series agree with finite volumes. Topic 4: the reacting-sphere series agrees with finite volumes, and Legendre orthogonality gives 2/(2n+1). The MATLAB and Julia versions port the same algorithms but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week11App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("반무한 매질", "Semi-infinite"), comp: <TabSemiInf t={t} /> },
    { label: t("유한 평판", "Finite slab"), comp: <TabSlab t={t} /> },
    { label: t("구: 약물 방출", "Sphere: drug release"), comp: <TabSphere t={t} /> },
    { label: "Sturm–Liouville", comp: <TabSL t={t} /> },
    { label: t("원통: Bessel", "Cylinder: Bessel"), comp: <TabBessel t={t} /> },
    { label: t("전열선 (FFT)", "Heated wire (FFT)"), comp: <TabWire t={t} /> },
    { label: t("구면 Bessel", "Spherical Bessel"), comp: <TabSpherical t={t} /> },
    { label: t("촉매 펠릿", "Catalyst pellet"), comp: <TabPellet t={t} /> },
    { label: t("Legendre·Maxwell", "Legendre & Maxwell"), comp: <TabLegendre t={t} /> },
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
                Heat & Mass Transfer · Week 11
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("비정상상태 분자확산", "Unsteady-State Molecular Diffusion")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("반무한 매질과 erfc · 평판과 구의 고유함수 전개 · Sturm–Liouville 이론 · Bessel 함수와 유한 Fourier 변환 · 반응이 있는 구 · Legendre 다항식",
                   "Semi-infinite media & erfc · eigenfunction expansions in slabs and spheres · Sturm–Liouville theory · Bessel functions & the finite Fourier transform · reacting spheres · Legendre polynomials")}
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
