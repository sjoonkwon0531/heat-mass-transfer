// Week12App.jsx — Heat & Mass Transfer, Week 12: Convective mass transfer
// Part 1 — Dimensionless groups (Sc, Pr, Le, Sh, Gr), Blasius similarity solution, laminar concentration
// boundary layer (Pohlhausen, Sh_x = 0.332 Re^1/2 Sc^1/3), integral method (cubic profile, 1/7 power law).
// Part 2 — Turbulent transport (mixing length, eddy diffusivity, laminar sublayer), Reynolds, Prandtl,
// von Kármán and Chilton–Colburn analogies, film / penetration / boundary-layer models of kc.
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK12_CODES from "./Week12Codes";

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
const F2EXACT = 0.332057;

/* Blasius 2f''' + f f'' = 0 by RK4; returns arrays of eta, f, f', f'' */
function blasius(a, etaMax = 10, h = 0.01) {
  const n = Math.round(etaMax / h);
  const E = [0], F = [0], F1 = [0], F2 = [a];
  let u = [0, 0, a];
  const rhs = (v) => [v[1], v[2], -0.5 * v[0] * v[2]];
  for (let i = 0; i < n; i++) {
    const k1 = rhs(u);
    const k2 = rhs(u.map((x, j) => x + 0.5 * h * k1[j]));
    const k3 = rhs(u.map((x, j) => x + 0.5 * h * k2[j]));
    const k4 = rhs(u.map((x, j) => x + h * k3[j]));
    u = u.map((x, j) => x + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    if (!isFinite(u[1]) || Math.abs(u[1]) > 50) break;
    E.push((i + 1) * h); F.push(u[0]); F1.push(u[1]); F2.push(u[2]);
  }
  return { E, F, F1, F2, h };
}
/* concentration profile C(eta) for a given Sc on a converged Blasius solution */
function concProfile(B, Sc) {
  const { E, F, h } = B;
  const C = [0];
  let Fi = 0, I = 0, gp = 1;
  const G = [1];
  for (let i = 1; i < E.length; i++) {
    Fi += 0.5 * (F[i] + F[i - 1]) * h;
    const g = Math.exp(-0.5 * Sc * Fi);
    I += 0.5 * (g + gp) * h;
    G.push(g); C.push(I);
    gp = g;
  }
  return { C: C.map((c) => c / I), dC0: 1 / I };
}
const BLASIUS = blasius(F2EXACT, 12, 0.005);

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 흐름이 물질을 실어 나를 때", "This week: when flow carries mass")}>
        <P>
          {t(
            "10–11주차에는 정지한 매질 속의 확산만 다뤘습니다. 실제 장치에서는 기체나 액체가 표면 위를 흐르며 물질을 실어 갑니다. 이때 표면의 플럭스는 확산과 흐름이 함께 정하고, 우리는 그 결과를 물질전달계수 k_c 하나로 요약합니다.",
            "Weeks 10–11 dealt with diffusion in a still medium. In real equipment a gas or liquid flows over a surface and carries material away. The surface flux is then set by diffusion and flow together, and we summarize the result in one mass-transfer coefficient k_c."
          )}
        </P>
        <Eq block>N_A = k_c (c_As − c_A∞)</Eq>
        <P>
          {t(
            "이번 주의 목표는 k_c를 '맞춤 상수'가 아니라 유동과 물성에서 계산하는 것입니다. 층류 경계층에서는 엄밀한 해(Blasius)로, 난류에서는 운동량 전달과의 유사성으로 계산합니다.",
            "The goal this week is to compute k_c from the flow and the properties rather than treat it as a fitted constant: exactly for laminar boundary layers (Blasius), and through the analogy with momentum transfer in turbulence."
          )}
        </P>
      </Panel>

      <Panel title={t("세 가지 확산계수와 무차원수", "Three diffusivities and the dimensionless groups")}>
        <P>
          {t(
            "운동량, 열, 물질은 모두 '확산계수'를 가집니다. 단위는 모두 m²/s입니다. 두 확산계수의 비가 경계층 두께의 비를 정합니다.",
            "Momentum, heat and mass each have a diffusivity, all in m²/s. The ratio of two diffusivities sets the ratio of the boundary-layer thicknesses."
          )}
        </P>
        <Table
          head={[t("이름", "Name"), t("정의", "Definition"), t("의미", "Meaning")]}
          rows={[
            ["Schmidt, Sc", "ν / D_AB", t("운동량 확산 / 물질 확산", "momentum / mass diffusivity")],
            ["Prandtl, Pr", "ν / α", t("운동량 확산 / 열 확산", "momentum / heat diffusivity")],
            ["Lewis, Le", "α / D_AB = Sc/Pr", t("열 확산 / 물질 확산", "heat / mass diffusivity")],
            ["Sherwood, Sh", "k_c L / D_AB", t("대류 전달 / 순수 확산 (질량 Nusselt 수)", "convective / purely diffusive transfer (mass Nusselt number)")],
            ["Reynolds, Re", "v L / ν", t("관성력 / 점성력", "inertia / viscous forces")],
            ["Grashof, Gr", "g Δρ L³ / (ρ ν²)", t("부력 / 점성력 (자연대류)", "buoyancy / viscous forces (natural convection)")],
          ]}
        />
        <Table
          head={[t("계", "System"), "ν (m²/s)", "D (m²/s)", "Sc"]}
          rows={[
            [t("수증기–공기, 25 °C", "water vapor–air, 25 °C"), "1.55×10⁻⁵", "2.6×10⁻⁵", "0.60"],
            [t("나프탈렌–공기, 25 °C", "naphthalene–air, 25 °C"), "1.55×10⁻⁵", "6.1×10⁻⁶", "2.5"],
            [t("작은 분자–물, 25 °C", "small solute–water, 25 °C"), "8.9×10⁻⁷", "1×10⁻⁹", "~900"],
            [t("단백질–물", "protein–water"), "8.9×10⁻⁷", "~6×10⁻¹¹", "~15 000"],
          ]}
        />
        <Note>
          {t(
            "표의 값은 설명용 크기입니다. 핵심은 기체에서 Sc ~ 1, 액체에서 Sc ~ 10³입니다. 그래서 액체의 농도 경계층은 속도 경계층보다 약 Sc^(1/3) ≈ 10배 얇습니다.",
            "The table values are illustrative. The point: Sc ~ 1 in gases and Sc ~ 10³ in liquids, so a liquid's concentration boundary layer is thinner than its velocity layer by about Sc^(1/3) ≈ 10."
          )}
        </Note>
      </Panel>

      <Panel title={t("Sherwood 수는 두 저항의 비", "The Sherwood number is a ratio of two resistances")}>
        <P>
          {t(
            "표면에서는 유체가 멈춰 있으므로(점착 조건) 물질은 확산으로만 표면을 떠납니다. 그래서 표면 플럭스를 두 가지로 쓸 수 있습니다.",
            "The fluid is at rest on the surface (no slip), so material leaves the surface only by diffusion. The surface flux can therefore be written two ways:"
          )}
        </P>
        <Eq block>k_c (c_As − c_A∞) = −D_AB ∂c_A/∂y |_(y=0) &nbsp;⇒&nbsp; Sh = k_c L / D_AB = ∂[(c_A − c_As)/(c_A∞ − c_As)]/∂(y/L) |₀</Eq>
        <P>
          {t(
            "Sh는 표면의 무차원 농도 기울기입니다. 동시에 '순수 확산 저항 L/D'를 '대류 저항 1/k_c'로 나눈 값이기도 합니다. 강제대류에서는 Sh = f(Re, Sc), 자연대류에서는 Sh = f(Gr, Sc)입니다.",
            "Sh is the dimensionless concentration gradient at the surface, and also the purely diffusive resistance L/D divided by the convective resistance 1/k_c. Forced convection gives Sh = f(Re, Sc); natural convection gives Sh = f(Gr, Sc)."
          )}
        </P>
      </Panel>

      <Panel title={t("12주차 로드맵", "Week 12 roadmap")}>
        <Table
          head={[t("주제", "Topic"), t("핵심 결과", "Key result")]}
          rows={[
            [t("Blasius 해 (운동량)", "Blasius solution (momentum)"), "2f‴ + ff″ = 0,  f″(0) = 0.332,  δ₉₉ = 4.91 x/√Re_x"],
            [t("농도 경계층 (Pohlhausen)", "Concentration boundary layer"), "Sh_x = 0.332 Re_x^(1/2) Sc^(1/3),  Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)"],
            [t("적분 방법", "Integral method"), t("3차 분포 → δ = 4.64 x/√Re_x;  1/7 승 → Sh_x = 0.0292 Re_x^(4/5)", "cubic → δ = 4.64 x/√Re_x;  1/7 power → Sh_x = 0.0292 Re_x^(4/5)")],
            [t("난류와 와확산", "Turbulence and eddy diffusivity"), "N = −(D + ε_D) dc/dy,  δ_sub/D = 62 Re^(−7/8)"],
            [t("유사성", "Analogies"), "Reynolds, Prandtl, von Kármán, Chilton–Colburn j_D = C_f/2"],
            [t("k_c 모델", "k_c models"), t("막 ∝ D, 침투 ∝ D^(1/2), 경계층 ∝ D^(2/3)", "film ∝ D, penetration ∝ D^(1/2), boundary layer ∝ D^(2/3)")],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Blasius ---------------------------------- */
function TabBlasius({ t }) {
  const [a, setA] = useState(0.30);
  const trial = useMemo(() => blasius(a, 8, 0.01), [a]);
  const B = BLASIUS;
  const step = 8;
  const pts = (arr) => B.E.filter((_, i) => i % step === 0).map((e, k) => [e, arr[k * step]]);
  const end = trial.F1[trial.F1.length - 1];
  const i99 = B.F1.findIndex((v) => v >= 0.99);
  return (
    <div>
      <Panel title={t("유도: 상사 변수로 PDE를 ODE로", "Derivation: a similarity variable turns the PDE into an ODE")}>
        <P>
          {t(
            "가정: 정상, 비압축성, 2차원 층류이고 평판 위 자유흐름 속도 v∞가 일정합니다(dp/dx = 0). 경계층이 얇아 y 방향 확산이 x 방향보다 훨씬 크다고 봅니다.",
            "Assumptions: steady, incompressible, two-dimensional laminar flow with a constant free-stream velocity v∞ (dp/dx = 0). The layer is thin, so diffusion in y dominates diffusion in x."
          )}
        </P>
        <Eq block>∂v_x/∂x + ∂v_y/∂y = 0, &nbsp;&nbsp; v_x ∂v_x/∂x + v_y ∂v_x/∂y = ν ∂²v_x/∂y²</Eq>
        <P>
          {t(
            "1단계. 경계층 두께는 δ(x) ~ √(νx/v∞)로 자랍니다. 그래서 y를 δ(x)로 나눈 η = y√(v∞/(νx))를 쓰면, 모든 x의 속도 분포가 한 곡선으로 겹칠 것이라고 추측합니다.",
            "Step 1. The layer thickness grows as δ(x) ~ √(νx/v∞). Using η = y√(v∞/(νx)), y scaled by δ(x), we guess that the profiles at every x collapse onto one curve."
          )}
        </P>
        <P>
          {t(
            "2단계. 연속 방정식을 자동으로 만족시키려고 유선 함수 ψ = √(νxv∞) f(η)를 씁니다. v_x = ∂ψ/∂y = v∞f′(η), v_y = −∂ψ/∂x = ½√(νv∞/x)(ηf′ − f)입니다.",
            "Step 2. To satisfy continuity automatically, use the stream function ψ = √(νxv∞) f(η): v_x = ∂ψ/∂y = v∞f′(η) and v_y = −∂ψ/∂x = ½√(νv∞/x)(ηf′ − f)."
          )}
        </P>
        <P>
          {t(
            "3단계. 이를 운동량 식에 넣으면 x가 모두 약분되고 Blasius 방정식이 남습니다. x가 사라진 것이 1단계 추측이 옳았다는 증거입니다.",
            "Step 3. Substituting into the momentum equation cancels every x and leaves the Blasius equation; the disappearance of x confirms the guess of Step 1."
          )}
        </P>
        <Eq block>2 f‴ + f f″ = 0, &nbsp; f(0) = f′(0) = 0 &nbsp;({t("점착", "no slip")}), &nbsp; f′(∞) = 1 &nbsp;({t("자유흐름", "free stream")})</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 사격법(shooting)으로 f″(0) 찾기", "Simulation: find f″(0) by shooting")}>
        <P>
          {t(
            "조건 하나(f′(∞) = 1)가 먼 쪽에 있으므로, f″(0)을 추측해 적분하고 결과가 1에 맞는지 봅니다. 슬라이더로 직접 '쏴' 보세요.",
            "One condition (f′(∞) = 1) sits far away, so we guess f″(0), integrate, and check whether the result hits 1. Try 'shooting' with the slider."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("추측한 f″(0)", "guessed f″(0)")} value={a} min={0.2} max={0.45} step={0.001} onChange={setA} fmt={(v) => v.toFixed(3)} />
            <button style={btnStyle(Math.abs(a - F2EXACT) < 5e-4)} onClick={() => setA(0.332)}>{t("정답으로 맞추기 (0.332)", "Snap to the answer (0.332)")}</button>
            <Readout>
              f′(η = 8) = {end.toFixed(4)} &nbsp;→&nbsp; {Math.abs(end - 1) < 0.003 ? t("명중!", "hit!") : end < 1 ? t("너무 낮음: f″(0)을 키우세요", "too low: increase f″(0)") : t("너무 높음: f″(0)을 줄이세요", "too high: decrease f″(0)")}<br />
              {t("수렴값", "converged value")}: f″(0) = 0.332057
            </Readout>
          </div>
          <Chart xr={[0, 8]} yr={[0, 1.4]} xl="η = y √(v∞/νx)" yl="f′ = v_x / v∞"
            series={[
              { pts: pts(B.F1).filter((p) => p[0] <= 8), color: C.ink, dash: "5 4", width: 1.4 },
              { pts: trial.E.map((e, i) => [e, trial.F1[i]]), color: C.copper, width: 2.4 },
            ]}
            hlines={[{ y: 1, color: C.inkSoft }]}
            legend={[{ label: t("정답", "solution"), color: C.ink, dash: "5 4" }, { label: t("추측", "trial"), color: C.copper }]} legendAt="br" />
        </Grid2>
      </Panel>

      <Panel title={t("해의 모양과 쓸모", "What the solution looks like and what it gives")}>
        <Grid2>
          <Chart xr={[0, 8]} yr={[0, 1.4]} xl="η" yl="f, f′, f″"
            series={[
              { pts: pts(B.F).filter((p) => p[0] <= 8 && p[1] <= 1.4), color: C.cool, width: 2 },
              { pts: pts(B.F1).filter((p) => p[0] <= 8), color: C.copper, width: 2.4 },
              { pts: pts(B.F2).filter((p) => p[0] <= 8).map((p) => [p[0], 3 * p[1]]), color: C.good, width: 2 },
            ]}
            legend={[{ label: "f", color: C.cool }, { label: "f′ = v_x/v∞", color: C.copper }, { label: "3 f″", color: C.good }]} legendAt="tl" />
          <div>
            <Readout>
              δ₉₉ ({t("f′ = 0.99인 η", "η where f′ = 0.99")}) = {(i99 * B.h).toFixed(2)}<br />
              → δ₉₉ = {(i99 * B.h).toFixed(2)} x / Re_x^(1/2)<br />
              {t("벽 기울기", "wall gradient")} ∂v_x/∂y|₀ = 0.332 v∞ √(v∞/νx)<br />
              C_f,x = τ_w/(½ρv∞²) = 0.664 / Re_x^(1/2)
            </Readout>
            <Note>
              {t(
                "f″(0) = 0.332 하나에서 벽 전단응력, 마찰계수, 그리고 다음 탭의 물질전달계수가 모두 나옵니다. 가까운 곳에서는 f ≈ 0.332η²/2, 먼 곳에서는 f ≈ η − 1.72입니다.",
                "The single number f″(0) = 0.332 gives the wall shear, the friction coefficient and, in the next tab, the mass-transfer coefficient. Near the wall f ≈ 0.332η²/2; far away f ≈ η − 1.72."
              )}
            </Note>
          </div>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Concentration boundary layer ---------------------------------- */
function TabConcBL({ t }) {
  const [logSc, setLogSc] = useState(0);
  const Sc = Math.pow(10, logSc);
  const B = BLASIUS;
  const cp = useMemo(() => concProfile(B, Sc), [Sc]);
  const step = 6;
  const sel = (arr) => B.E.map((e, i) => [e, arr[i]]).filter((_, i) => i % step === 0 && B.E[i] <= 10);
  const iC = cp.C.findIndex((v) => v >= 0.99);
  const iM = B.F1.findIndex((v) => v >= 0.99);
  const scs = logspace(-1, 3, 60);
  const exactCurve = useMemo(() => scs.map((s) => [s, concProfile(B, s).dC0]), []);
  // plate case
  const [v, setV] = useState(0.1);
  const [Lc, setLc] = useState(0.3);
  const [fluid, setFluid] = useState("water");
  const props = fluid === "water" ? { nu: 8.9e-7, D: 1e-9 } : { nu: 1.55e-5, D: 2.6e-5 };
  const ScP = props.nu / props.D;
  const ReL = (v * Lc) / props.nu;
  const xs = lin(Lc / 200, Lc, 120);
  const kx = (x) => (0.332 * Math.cbrt(ScP) * Math.sqrt((v * x) / props.nu) * props.D) / x;
  const kmean = (0.664 * Math.cbrt(ScP) * Math.sqrt(ReL) * props.D) / Lc;
  return (
    <div>
      <Panel title={t("유도: 농도 식도 같은 상사 변수로", "Derivation: the same similarity variable for concentration")}>
        <P>
          {t(
            "가정: 정상 층류, 희박한 A(벌크 흐름이 유동을 바꾸지 않음), 일정한 물성, 반응 없음, 표면 농도 c_As 일정. 그러면 농도는 속도장 위에서 실려 가며 확산합니다.",
            "Assumptions: steady laminar flow, dilute A (its flux does not disturb the flow), constant properties, no reaction, uniform surface concentration c_As. Concentration is then carried by the velocity field while diffusing."
          )}
        </P>
        <Eq block>v_x ∂C/∂x + v_y ∂C/∂y = D_AB ∂²C/∂y², &nbsp; C = (c_A − c_As)/(c_A∞ − c_As), &nbsp; C(0) = 0, C(∞) = 1</Eq>
        <P>
          {t(
            "1단계. Blasius와 같은 η, 같은 v_x, v_y를 넣으면 다음 ODE가 됩니다. Sc = 1이면 이 식은 Blasius 식을 한 번 미분한 식과 같아 C = f′입니다. 강의의 '수학적 유사성'이 바로 이것입니다.",
            "Step 1. With the same η, v_x and v_y as Blasius, the equation becomes the ODE below. For Sc = 1 it matches the derivative of the Blasius equation, so C = f′: this is the lecture's 'mathematical analogy'."
          )}
        </P>
        <Eq block>C″ + (Sc/2) f C′ = 0 &nbsp;⇒&nbsp; C′(η) = C′(0) exp[−(Sc/2)∫₀^η f dη′], &nbsp; C′(0) = 1 / ∫₀^∞ exp[−(Sc/2)∫₀^η f] dη</Eq>
        <P>
          {t(
            "2단계. 1계 선형 식이므로 바로 적분됩니다. 3단계. 표면 플럭스 D(∂c/∂y)₀ = k_c(c_As − c_A∞)에 ∂η/∂y = √(v∞/νx)를 넣으면 국소 Sherwood 수가 나옵니다.",
            "Step 2. The equation is linear and first order in C′, so it integrates directly. Step 3. Inserting ∂η/∂y = √(v∞/νx) into the surface flux D(∂c/∂y)₀ = k_c(c_As − c_A∞) gives the local Sherwood number:"
          )}
        </P>
        <Eq block>Sh_x = k_c x / D_AB = C′(0) Re_x^(1/2) ≈ 0.332 Re_x^(1/2) Sc^(1/3), &nbsp;&nbsp; Sh_L = 0.664 Re_L^(1/2) Sc^(1/3)</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: Sc가 두 경계층의 두께 비를 정한다", "Simulation: Sc sets the ratio of the two layer thicknesses")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Sc" value={logSc} min={-1} max={3} step={0.02} onChange={setLogSc} fmt={(x) => `${x.toFixed(2)} (Sc = ${sci(Sc, 2)})`} />
            <Readout>
              C′(0) = {cp.dC0.toFixed(4)} &nbsp;|&nbsp; 0.332 Sc^(1/3) = {(0.332 * Math.cbrt(Sc)).toFixed(4)}<br />
              {t("비율", "ratio")} = {(cp.dC0 / (0.332 * Math.cbrt(Sc))).toFixed(4)}<br />
              η(δ_M) = {(iM * B.h).toFixed(2)}, &nbsp; η(δ_c) = {iC > 0 ? (iC * B.h).toFixed(2) : "> 12"}<br />
              δ_M/δ_c = {iC > 0 ? ((iM * B.h) / (iC * B.h)).toFixed(2) : "—"} &nbsp;(Sc^(1/3) = {Math.cbrt(Sc).toFixed(2)})
            </Readout>
            <Note>
              {t(
                "Sc가 크면(액체) 농도 경계층은 속도 경계층 안쪽 깊숙이 들어갑니다. 그 안에서 속도는 거의 직선(v_x ≈ 0.332v∞η)이라, 두께 비가 Sc^(1/3)이 됩니다.",
                "At large Sc (liquids) the concentration layer sits deep inside the velocity layer, where the velocity is nearly linear (v_x ≈ 0.332v∞η); this is what makes the thickness ratio Sc^(1/3)."
              )}
            </Note>
          </div>
          <Chart xr={[0, 10]} yr={[0, 1.05]} xl="η = y √(v∞/νx)" yl={t("v_x/v∞, C", "v_x/v∞, C")}
            series={[
              { pts: sel(B.F1), color: C.cool, width: 2.2 },
              { pts: sel(cp.C), color: C.copper, width: 2.6 },
            ]}
            legend={[{ label: t("속도 f′", "velocity f′"), color: C.cool }, { label: t("농도 C", "concentration C"), color: C.copper }]} legendAt="br" />
        </Grid2>
        <Chart xr={[0.1, 1000]} yr={[0.1, 5]} xlog ylog xl="Sc" yl="C′(0) = Sh_x / Re_x^(1/2)"
          series={[
            { pts: exactCurve, color: C.copper, width: 2.6 },
            { pts: scs.map((s) => [s, 0.332 * Math.cbrt(s)]), color: C.cool, dash: "6 4" },
          ]}
          dots={[{ x: Sc, y: cp.dC0 }]}
          legend={[{ label: t("Pohlhausen 수치해", "Pohlhausen (numerical)"), color: C.copper }, { label: "0.332 Sc^(1/3)", color: C.cool, dash: "6 4" }]} legendAt="tl" />
      </Panel>

      <Panel title={t("케이스: 평판 위의 물질전달 (웨이퍼 세정 · 나프탈렌 승화)", "Case: mass transfer on a plate (wafer rinsing, naphthalene sublimation)")}>
        <Grid2>
          <div>
            <Seg value={fluid} onChange={setFluid} options={[{ v: "water", label: t("물 속 작은 분자 (Sc ≈ 890)", "small solute in water (Sc ≈ 890)") }, { v: "air", label: t("공기 속 수증기 (Sc ≈ 0.6)", "water vapor in air (Sc ≈ 0.6)") }]} />
            <Slider label={t("유속 v∞", "velocity v∞")} value={v} min={0.01} max={fluid === "water" ? 1 : 10} step={0.01} onChange={setV} unit=" m/s" fmt={(x) => x.toFixed(2)} />
            <Slider label={t("판 길이 L", "plate length L")} value={Lc} min={0.02} max={0.5} step={0.01} onChange={setLc} unit=" m" fmt={(x) => x.toFixed(2)} />
            <Readout>
              Re_L = {sci(ReL, 2)} {ReL > 5e5 ? t("(층류 가정 깨짐)", "(laminar assumption fails)") : ""}<br />
              {t("평균", "mean")} k_c = {sci(kmean * 1e6, 3)} μm/s<br />
              {t("끝단 국소", "local at x = L")} k_c = {sci(kx(Lc) * 1e6, 3)} μm/s ({t("평균의 절반", "half the mean")})
            </Readout>
          </div>
          <Chart xr={[0, Lc]} yr={[0, kx(Lc / 20) * 1e6 * 1.05]} xl="x (m)" yl={t("국소 k_c (μm/s)", "local k_c (μm/s)")}
            series={[{ pts: xs.map((x) => [x, kx(x) * 1e6]), color: C.copper, width: 2.4 }]}
            hlines={[{ y: kmean * 1e6, color: C.cool }]} />
        </Grid2>
        <P>
          {t(
            "k_c는 앞전에서 가장 크고 x^(−1/2)로 줄어듭니다. 경계층이 얇은 앞쪽에서 기울기가 가장 가파르기 때문입니다. 습식 세정에서 흐름이 먼저 닿는 웨이퍼 앞쪽 가장자리부터 깨끗해지는 이유이고, 나프탈렌 판의 앞쪽이 가장 빨리 깎이는 이유입니다.",
            "k_c is largest at the leading edge and falls as x^(−1/2), because the layer is thinnest and the gradient steepest there. This is why a wafer in a wet rinse cleans first at the upstream edge, and why a naphthalene plate erodes fastest at the front."
          )}
        </P>
        <Note>
          {t(
            "나프탈렌 승화법: 판의 표면 후퇴량을 측정해 국소 k_c를 얻고, 유사성(다음 탭들)으로 열전달계수를 추정합니다. 열 측정보다 정밀한 국소 분포를 얻을 수 있어 열교환기·터빈 냉각 연구에 쓰입니다.",
            "The naphthalene sublimation technique measures the surface recession of a plate to get local k_c, then converts it to a heat-transfer coefficient through the analogy (next tabs). It yields finer local maps than direct heat measurements and is used in heat-exchanger and turbine-cooling studies."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Integral method ---------------------------------- */
function TabIntegral({ t }) {
  const [logSc, setLogSc] = useState(1);
  const Sc = Math.pow(10, logSc);
  const cub = (p) => 1.5 * p - 0.5 * p * p * p;
  const simp = (f, n = 400) => { const h = 1 / n; let s = f(0) + f(1); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h); return (s * h) / 3; };
  const Hm = simp((p) => cub(p) * (1 - cub(p)));
  const c = Math.sqrt(3 / Hm);
  const G = (r) => simp((p) => cub(r * p) * (1 - cub(p)));
  const solveR = (s) => { let lo = 1e-4, hi = 1.01; const f = (r) => (r * G(r) * c * c) / 2 - 1.5 / (r * s); for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return 0.5 * (lo + hi); };
  const r = Sc >= 1 ? solveR(Sc) : null;
  const coef = r ? 1.5 / (r * c) / Math.cbrt(Sc) : null;
  const ys = lin(0, 1.2, 100);
  const Res = logspace(4, 7, 80);
  return (
    <div>
      <Panel title={t("유도: 경계층 전체에 대한 물질수지", "Derivation: a mole balance over the whole layer")}>
        <P>
          {t(
            "엄밀해 대신, 높이 δ_c, 길이 dx인 검사체적에 대해 물질수지만 맞추는 방법입니다. 분포의 자세한 모양을 모르더라도 '그럴듯한 모양'을 넣으면 좋은 근사가 나옵니다. 난류처럼 엄밀해가 없는 경우에 특히 쓸모가 있습니다.",
            "Instead of an exact solution, balance moles only over a control volume of height δ_c and length dx. Even without the exact profile, a plausible shape gives a good approximation, which is especially useful where no exact solution exists, such as turbulence."
          )}
        </P>
        <P>
          {t(
            "1단계. x 면으로 들어오는 양, x + dx 면으로 나가는 양, 표면에서 나오는 양, 그리고 위쪽 경계를 넘어 들어오는 양(농도 c_A∞)을 더합니다. 2단계. dx → 0을 취합니다.",
            "Step 1. Add the inflow through face x, the outflow through x + dx, the release from the surface, and the inflow across the top edge (at c_A∞). Step 2. Let dx → 0:"
          )}
        </P>
        <Eq block>d/dx ∫₀^δc v_x (c_A − c_A∞) dy = k_c (c_As − c_A∞) = −D_AB ∂c_A/∂y|₀</Eq>
        <P>
          {t(
            "3단계. 네 조건(표면 값, 바깥 값, 바깥 기울기 0, 표면 곡률 0)을 만족하는 3차식을 속도와 농도에 모두 씁니다. 4단계. 운동량 적분에서 δ_M/x = 4.64/√Re_x를 얻고, r = δ_c/δ_M을 농도 적분에서 정합니다.",
            "Step 3. Use the cubic that satisfies four conditions (surface value, outer value, zero outer slope, zero wall curvature) for both velocity and concentration. Step 4. The momentum integral gives δ_M/x = 4.64/√Re_x, and the concentration integral fixes r = δ_c/δ_M:"
          )}
        </P>
        <Eq block>v_x/v∞ = (3/2)(y/δ_M) − (1/2)(y/δ_M)³, &nbsp; C = (3/2)(y/δ_c) − (1/2)(y/δ_c)³ &nbsp;⇒&nbsp; r ≈ 0.976 Sc^(−1/3), &nbsp; Sh_x = (3/2) x/δ_c</Eq>
      </Panel>

      <Panel title={t("계산: 3차 분포의 상수들", "Computation: the constants of the cubic profile")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Sc (≥ 0)" value={logSc} min={0} max={3} step={0.02} onChange={setLogSc} fmt={(x) => `${x.toFixed(2)} (Sc = ${sci(Sc, 2)})`} />
            <Readout>
              {t("운동량 두께/δ", "momentum thickness/δ")} = {Hm.toFixed(5)} (= 39/280)<br />
              δ_M/x = {c.toFixed(3)} / Re_x^(1/2) &nbsp;({t("엄밀해 δ₉₉", "exact δ₉₉")}: 4.91)<br />
              r = δ_c/δ_M = {r.toFixed(4)}, &nbsp; r Sc^(1/3) = {(r * Math.cbrt(Sc)).toFixed(4)}<br />
              Sh_x/(Re^(1/2) Sc^(1/3)) = {coef.toFixed(4)}
            </Readout>
            <Note>
              {t(
                "3차 분포를 끝까지 계산하면 계수는 0.323–0.331로, 엄밀해 0.332와 1–3% 차이입니다. 강의 슬라이드의 0.36(8% 오차)은 2차 분포 2(y/δ) − (y/δ)²로 계산한 값(Sc = 1에서 0.365)과 맞습니다. 3차 분포는 벽 곡률 조건을 하나 더 만족해 더 정확합니다.",
                "Carrying the cubic through gives 0.323–0.331, within 1–3% of the exact 0.332. The lecture's 0.36 (8% error) matches a quadratic profile 2(y/δ) − (y/δ)² (0.365 at Sc = 1); the cubic satisfies one more wall condition and is more accurate."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1.2]} yr={[0, 1.2]} xl="y/δ" yl={t("무차원 분포", "dimensionless profile")}
            series={[
              { pts: BLASIUS.E.filter((_, i) => i % 6 === 0 && BLASIUS.E[i] <= 4.91 * 1.2).map((e, k) => [e / 4.91, BLASIUS.F1[k * 6]]), color: C.ink, dash: "5 4", width: 1.5 },
              { pts: ys.map((y) => [y, y <= 1 ? cub(y) : 1]), color: C.copper, width: 2.4 },
            ]}
            legend={[{ label: t("Blasius 엄밀해", "exact Blasius"), color: C.ink, dash: "5 4" }, { label: t("3차 근사", "cubic"), color: C.copper }]} legendAt="br" />
        </Grid2>
      </Panel>

      <Panel title={t("난류 경계층: 1/7 승 분포", "Turbulent boundary layer: the 1/7 power law")}>
        <P>
          {t(
            "난류에서는 벽 근처에서 분포가 훨씬 가파르고 바깥은 평평합니다. 이를 v_x ∝ y^(1/7)로 근사하고 같은 적분 방법을 쓰면 국소 Sherwood 수는 Re_x^(4/5)에 비례합니다. 층류의 Re_x^(1/2)보다 훨씬 빨리 커집니다.",
            "In turbulence the profile is much steeper near the wall and flat outside. Approximating it as v_x ∝ y^(1/7) and repeating the integral method gives a local Sherwood number proportional to Re_x^(4/5), growing much faster than the laminar Re_x^(1/2)."
          )}
        </P>
        <Chart xr={[1e4, 1e7]} yr={[10, 2e4]} xlog ylog xl="Re_x" yl="Sh_x (Sc = 1)"
          series={[
            { pts: Res.map((x) => [x, 0.332 * Math.sqrt(x)]), color: C.cool, width: 2.4 },
            { pts: Res.map((x) => [x, 0.0292 * Math.pow(x, 0.8)]), color: C.copper, width: 2.4 },
          ]}
          vlines={[{ x: 5e5, color: C.inkSoft }]}
          legend={[{ label: t("층류 0.332 Re^(1/2)", "laminar 0.332 Re^(1/2)"), color: C.cool }, { label: t("난류 0.0292 Re^(4/5)", "turbulent 0.0292 Re^(4/5)"), color: C.copper }]} legendAt="tl" />
        <Note>
          {t(
            "강의는 1/7 승 결과에 Sc 효과가 없다고 적었습니다. Sc = 1을 가정해 두 분포를 같게 놓았기 때문입니다. Sc ≠ 1인 기체·액체에는 보통 Chilton–Colburn 형태 Sh_x = 0.0292 Re_x^(4/5) Sc^(1/3)을 씁니다(유사성 탭).",
            "The lecture notes that the 1/7-law result has no Sc effect, because Sc = 1 was assumed to make the two profiles identical. For gases and liquids with Sc ≠ 1 the Chilton–Colburn form Sh_x = 0.0292 Re_x^(4/5) Sc^(1/3) is normally used (Analogies tab)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- analogies ---------------------------------- */
const halfCf = (Re) => 0.023 * Math.pow(Re, -0.2);
const shReynolds = (Re, Sc) => halfCf(Re) * Re * Sc;
const shPrandtl = (Re, Sc) => { const c = halfCf(Re); return (c * Re * Sc) / (1 + 5 * Math.sqrt(c) * (Sc - 1)); };
const shKarman = (Re, Sc) => { const c = halfCf(Re); return (c * Re * Sc) / (1 + 5 * Math.sqrt(c) * (Sc - 1 + Math.log((1 + 5 * Sc) / 6))); };
const shColburn = (Re, Sc) => halfCf(Re) * Re * Math.cbrt(Sc);

/* ---------------------------------- Tab 5: Turbulence ---------------------------------- */
function TabTurb({ t }) {
  const [logRe, setLogRe] = useState(4.5);
  const [nexp, setNexp] = useState(7);
  const Re = Math.pow(10, logRe);
  const dsub = 62 * Math.pow(Re, -0.875);
  const rs = lin(0, 1, 200);
  return (
    <div>
      <Panel title={t("난류는 '빠른 확산'처럼 행동한다", "Turbulence acts like fast diffusion")}>
        <P>
          {t(
            "난류에서는 유체 덩어리(와류)가 y 방향으로 요동하며 이웃 층의 물질을 섞습니다. 한 덩어리가 혼합 길이 L만큼 움직이면, 출발점과 도착점의 농도 차는 L dc/dy입니다.",
            "In turbulence, fluid lumps (eddies) fluctuate in y and mix material between neighboring layers. A lump moving a mixing length L carries a concentration difference L dc/dy between its start and end."
          )}
        </P>
        <Eq block>c_A′ = c_A|_(y+L) − c_A|_y ≈ L dc_A/dy &nbsp;⇒&nbsp; N_Ay = −D_AB dc_A/dy − v_y′ L dc_A/dy = −(D_AB + ε_D) dc_A/dy</Eq>
        <P>
          {t(
            "ε_D = v_y′L을 와(eddy) 물질확산계수라고 부릅니다. 분자 운동의 '평균 자유 행로'를 와류의 '혼합 길이'로 바꾼 것과 같습니다. 운동량에도 같은 방식으로 와점성 ε_M이 생깁니다: τ = ρ(ν + ε_M) dv_x/dy.",
            "ε_D = v_y′L is the eddy mass diffusivity: the molecular 'mean free path' replaced by the eddy 'mixing length'. Momentum acquires an eddy viscosity ε_M in the same way: τ = ρ(ν + ε_M) dv_x/dy."
          )}
        </P>
        <B_list t={t} />
      </Panel>

      <Panel title={t("시뮬레이션: 층류 저층의 두께", "Simulation: thickness of the laminar sublayer")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Re" value={logRe} min={3.6} max={6} step={0.02} onChange={setLogRe} fmt={(x) => `${x.toFixed(2)} (Re = ${sci(Re, 2)})`} />
            <Slider label={t("멱법칙 지수 n (u/u_C = (y/a)^(1/n))", "power-law exponent n (u/u_C = (y/a)^(1/n))")} value={nexp} min={5} max={10} step={1} onChange={setNexp} />
            <Readout>
              δ_sub/D = 62 Re^(−7/8) = {dsub.toFixed(5)}<br />
              {t("지름 25 mm 관에서", "in a 25 mm pipe")}: δ_sub = {(dsub * 25e3).toFixed(0)} μm
            </Readout>
            <Note>
              {t(
                "물질전달 저항의 대부분이 이 얇은 저층에 있습니다. 액체(Sc ~ 1000)에서는 농도 변화가 저층보다 더 얇은 층에 몰려, 표면 거칠기나 저층의 작은 요동이 k_c를 크게 바꿉니다.",
                "Most of the mass-transfer resistance sits in this thin sublayer. In liquids (Sc ~ 1000) the concentration change crowds into a layer thinner still, so wall roughness or small fluctuations within the sublayer change k_c markedly."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[0, 1.05]} xl={t("벽에서의 거리 y/a", "distance from the wall y/a")} yl="u / u_C"
            series={[
              { pts: rs.map((y) => [y, 1 - (1 - y) * (1 - y)]), color: C.cool, width: 2, dash: "6 4" },
              { pts: rs.map((y) => [y, Math.pow(Math.max(y, 1e-9), 1 / nexp)]), color: C.copper, width: 2.6 },
            ]}
            vlines={[{ x: Math.min(dsub * 2, 1), color: C.warn }]}
            legend={[{ label: t("층류 (포물선)", "laminar (parabola)"), color: C.cool, dash: "6 4" }, { label: `${t("난류", "turbulent")} 1/${nexp}`, color: C.copper }, { label: t("층류 저층 끝", "sublayer edge"), color: C.warn }]} legendAt="br" />
        </Grid2>
      </Panel>
    </div>
  );
}
function B_list({ t }) {
  return (
    <Table plain
      head={[t("영역", "Region"), t("지배하는 수송", "Dominant transport"), t("특징", "Feature")]}
      rows={[
        [t("층류 저층", "laminar sublayer"), "ε_M, ε_D ≈ 0", t("분자 확산만, 기울기가 가장 가파름", "molecular diffusion only; steepest gradient")],
        [t("완충층", "buffer layer"), "ε ~ ν, D", t("분자 확산과 와확산이 비슷", "molecular and eddy transport comparable")],
        [t("난류 중심부", "turbulent core"), "ε_M ≫ ν, ε_D ≫ D", t("평평한 분포, 저항이 작음", "flat profile; little resistance")],
      ]}
    />
  );
}

/* ---------------------------------- Tab 6: Analogies ---------------------------------- */
function TabAnalogy({ t }) {
  const [logRe, setLogRe] = useState(4);
  const [logSc, setLogSc] = useState(0);
  const Re = Math.pow(10, logRe), Sc = Math.pow(10, logSc);
  const scs = logspace(-0.3, 3.4, 120);
  const rows = [
    ["Reynolds", shReynolds(Re, Sc)],
    ["Prandtl", shPrandtl(Re, Sc)],
    ["von Kármán", shKarman(Re, Sc)],
    ["Chilton–Colburn", shColburn(Re, Sc)],
  ];
  return (
    <div>
      <Panel title={t("유도 1: Reynolds 유사성 (Sc = 1)", "Derivation 1: the Reynolds analogy (Sc = 1)")}>
        <P>
          {t(
            "Sc = 1이면 속도와 농도의 무차원 분포가 같은 식을 따르므로, 표면 기울기도 같습니다. 이 한 줄에서 물질전달과 마찰을 잇는 관계가 나옵니다.",
            "When Sc = 1, the dimensionless velocity and concentration obey the same equation, so their wall gradients are equal. That one line ties mass transfer to friction:"
          )}
        </P>
        <Eq block>∂/∂y[(c_A − c_As)/(c_A∞ − c_As)]₀ = ∂/∂y[v_x/v∞]₀ &nbsp;⇒&nbsp; k_c = (D/v∞)∂v_x/∂y|₀ = τ_w/(ρv∞) &nbsp;⇒&nbsp; k_c/v∞ = C_f/2</Eq>
        <P>
          {t(
            "마찰계수 C_f는 압력 손실로 쉽게 측정됩니다. 그래서 측정하기 어려운 k_c를 C_f로 어림할 수 있습니다. 문제는 Sc ≠ 1일 때입니다.",
            "The friction coefficient C_f is easy to measure from the pressure drop, so the hard-to-measure k_c can be estimated from it. The trouble starts when Sc ≠ 1."
          )}
        </P>
      </Panel>

      <Panel title={t("유도 2: Prandtl과 von Kármán – 층류 저층을 따로 보기", "Derivation 2: Prandtl and von Kármán – treat the sublayer separately")}>
        <P>
          {t(
            "1단계. 두께 ξ의 층류 저층에서는 와확산이 없으므로 τ_s ≈ ρν v_x|_ξ/ξ, N_A ≈ D(c_As − c_A|_ξ)/ξ입니다. 2단계. 저층 밖 난류 중심부에서는 Reynolds 유사성을 씁니다. 3단계. 두 영역의 저항을 직렬로 더하고 저층 끝 속도 v_x|_ξ/v∞ ≈ 5√(C_f/2)를 넣습니다.",
            "Step 1. In the laminar sublayer of thickness ξ there is no eddy transport, so τ_s ≈ ρν v_x|_ξ/ξ and N_A ≈ D(c_As − c_A|_ξ)/ξ. Step 2. In the turbulent core beyond it, use the Reynolds analogy. Step 3. Add the two resistances in series and insert the sublayer-edge velocity v_x|_ξ/v∞ ≈ 5√(C_f/2):"
          )}
        </P>
        <Eq block>k_c/v∞ = (C_f/2) / [1 + 5√(C_f/2)(Sc − 1)] &nbsp;({t("Prandtl", "Prandtl")})</Eq>
        <Eq block>Sh = (C_f/2) Re Sc / [1 + 5√(C_f/2)(Sc − 1 + ln((1 + 5Sc)/6))] &nbsp;({t("von Kármán, 완충층 추가", "von Kármán, adds the buffer layer")})</Eq>
        <Eq block>j_D ≡ (k_c/v∞) Sc^(2/3) = C_f/2 &nbsp;({t("Chilton–Colburn, 0.6 < Sc < 2500", "Chilton–Colburn, 0.6 < Sc < 2500")})</Eq>
        <Note>
          {t(
            "Chilton–Colburn의 Sc^(2/3)은 층류 평판 결과에서 옵니다. Sh_x = 0.332Re_x^(1/2)Sc^(1/3)을 Re_x Sc^(1/3)으로 나누면 j_D = 0.332Re_x^(−1/2) = C_f,x/2가 정확히 성립합니다.",
            "The Sc^(2/3) in Chilton–Colburn comes from the laminar plate: dividing Sh_x = 0.332Re_x^(1/2)Sc^(1/3) by Re_x Sc^(1/3) gives j_D = 0.332Re_x^(−1/2) = C_f,x/2 exactly."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 매끈한 관에서 네 유사성 비교", "Simulation: the four analogies in a smooth pipe")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ Re" value={logRe} min={3.7} max={5.5} step={0.02} onChange={setLogRe} fmt={(x) => `${x.toFixed(2)} (Re = ${sci(Re, 2)})`} />
            <Slider label="log₁₀ Sc" value={logSc} min={-0.3} max={3.4} step={0.02} onChange={setLogSc} fmt={(x) => `${x.toFixed(2)} (Sc = ${sci(Sc, 2)})`} />
            <Table head={[t("유사성", "Analogy"), "Sh"]} rows={rows.map(([n, v]) => [n, v.toFixed(1)])} />
            <Readout>C_f/2 = 0.023 Re^(−0.2) = {halfCf(Re).toFixed(5)}</Readout>
          </div>
          <Chart xr={[0.5, 2500]} yr={[5, 1e5]} xlog ylog xl="Sc" yl="Sh"
            series={[
              { pts: scs.map((s) => [s, shReynolds(Re, s)]), color: C.warn, width: 2, dash: "4 4" },
              { pts: scs.map((s) => [s, shPrandtl(Re, s)]), color: C.cool, width: 2.2 },
              { pts: scs.map((s) => [s, shKarman(Re, s)]), color: C.good, width: 2.2 },
              { pts: scs.map((s) => [s, shColburn(Re, s)]), color: C.copper, width: 2.6 },
            ]}
            vlines={[{ x: Sc, color: C.inkSoft }]}
            legend={[{ label: "Reynolds", color: C.warn, dash: "4 4" }, { label: "Prandtl", color: C.cool }, { label: "von Kármán", color: C.good }, { label: "Chilton–Colburn", color: C.copper }]} legendAt="tl" />
        </Grid2>
        <Note>
          {t(
            "Sc = 1에서는 넷이 같습니다. Sc가 커지면 Reynolds는 지나치게 크고, Prandtl과 von Kármán은 저층 안의 와확산을 0으로 두어 평평해집니다. 액체 데이터는 Sc^(1/3)을 따르는 경우가 많아 Chilton–Colburn 형태가 실무 기본값입니다.",
            "All four coincide at Sc = 1. As Sc grows, Reynolds overshoots, while Prandtl and von Kármán level off because they allow no eddy transport inside the sublayer. Liquid data usually follow Sc^(1/3), so the Chilton–Colburn form is the practical default."
          )}
        </Note>
      </Panel>

      <Panel title={t("케이스: 배관 내벽의 용해와 부식", "Case: dissolution and corrosion of a pipe wall")}>
        <P>
          {t(
            "물(Sc ≈ 1000)이 Re = 2×10⁴으로 흐르는 25 mm 관에서 벽 물질이 녹아 나간다고 합시다(D = 10⁻⁹ m²/s). 유사성마다 k_c가 약 3배 차이 납니다: Prandtl 9.0 μm/s, von Kármán 8.9 μm/s, Chilton–Colburn 25.4 μm/s.",
            "Suppose wall material dissolves into water (Sc ≈ 1000) flowing at Re = 2×10⁴ in a 25 mm pipe (D = 10⁻⁹ m²/s). The analogies differ by about a factor of 3: Prandtl 9.0 μm/s, von Kármán 8.9 μm/s, Chilton–Colburn 25.4 μm/s."
          )}
        </P>
        <P>
          {t(
            "유속에 따라 부식 속도가 달라지는 '유동 가속 부식'은 이 물질전달 단계가 속도를 정할 때 나타납니다. 전기화학의 한계전류법은 반대로, 전류를 재서 k_c를 직접 측정합니다.",
            "Flow-accelerated corrosion, whose rate depends on velocity, appears when this mass-transfer step controls the rate. The electrochemical limiting-current technique works the other way round, measuring k_c directly from a current."
          )}
        </P>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: three models of kc ---------------------------------- */
function TabModels({ t }) {
  const [logD, setLogD] = useState(-9);
  const D = Math.pow(10, logD);
  const delta = 50e-6, tc = 0.1, nu = 1e-6, v = 0.5, L = 0.05;
  const film = (d) => d / delta;
  const pen = (d) => 2 * Math.sqrt(d / (Math.PI * tc));
  const bl = (d) => ((0.664 * d) / L) * Math.sqrt((v * L) / nu) * Math.cbrt(nu / d);
  const Ds = logspace(-10, -8, 60);
  return (
    <div>
      <Panel title={t("같은 k_c, 세 가지 그림", "One k_c, three pictures")}>
        <Table plain
          head={[t("모델", "Model"), t("그림", "Picture"), "k_c", t("D 의존성", "D dependence")]}
          rows={[
            [t("막 모델 (10주차)", "Film (Week 10)"), t("두께 δ의 정체막을 정상 확산", "steady diffusion across a stagnant film δ"), "D/δ (× P/p_B,lm)", "D¹"],
            [t("침투 모델 (11주차)", "Penetration (Week 11)"), t("표면 요소가 t_c 동안 반무한 매질처럼 흡수 후 교체", "surface elements absorb like a semi-infinite medium for t_c, then are replaced"), "2√(D/(π t_c))", "D^(1/2)"],
            [t("경계층 모델 (이번 주)", "Boundary layer (this week)"), t("흐름과 확산이 함께 만드는 층류 경계층", "laminar layer shaped by flow and diffusion together"), "0.664 (D/L) Re^(1/2) Sc^(1/3)", "D^(2/3)"],
          ]}
        />
        <P>
          {t(
            "세 모델은 같은 현상의 다른 단순화입니다. 막 모델은 흐름을 무시하고, 침투 모델은 표면 갱신만 보고, 경계층 모델은 속도 분포를 정직하게 넣습니다. 그래서 D 지수가 1, 1/2, 2/3로 다릅니다.",
            "The three models simplify one phenomenon in different ways: the film model ignores the flow, the penetration model sees only surface renewal, and the boundary-layer model includes the velocity profile honestly. Hence the D exponents 1, 1/2 and 2/3."
          )}
        </P>
      </Panel>
      <Panel title={t("시뮬레이션: log k_c 대 log D의 기울기", "Simulation: the slope of log k_c versus log D")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ D (m²/s)" value={logD} min={-10} max={-8} step={0.02} onChange={setLogD} fmt={(x) => x.toFixed(2)} />
            <Readout>
              {t("막", "film")}: {sci(film(D) * 1e6, 3)} μm/s<br />
              {t("침투", "penetration")}: {sci(pen(D) * 1e6, 3)} μm/s<br />
              {t("경계층", "boundary layer")}: {sci(bl(D) * 1e6, 3)} μm/s
            </Readout>
            <Note>
              {t(
                "실험에서는 확산계수가 다른 두 용질(예: O₂와 CO₂)의 k_c를 같은 장치에서 재고, 기울기 log(k₁/k₂)/log(D₁/D₂)를 봅니다. 기울기가 0.5에 가까우면 침투형(기포·충전탑), 0.67이면 경계층형(매끈한 표면 흐름)입니다.",
                "Experimentally, measure k_c for two solutes with different diffusivities (for example O₂ and CO₂) in the same equipment and read the slope log(k₁/k₂)/log(D₁/D₂). A slope near 0.5 points to penetration (bubbles, packed columns); 0.67 to a boundary layer (flow over smooth surfaces)."
              )}
            </Note>
          </div>
          <Chart xr={[1e-10, 1e-8]} yr={[1, 2e3]} xlog ylog xl="D (m²/s)" yl="k_c (μm/s)"
            series={[
              { pts: Ds.map((d) => [d, film(d) * 1e6]), color: C.cool, width: 2.2 },
              { pts: Ds.map((d) => [d, pen(d) * 1e6]), color: C.good, width: 2.2 },
              { pts: Ds.map((d) => [d, bl(d) * 1e6]), color: C.copper, width: 2.6 },
            ]}
            vlines={[{ x: D, color: C.inkSoft }]}
            legend={[{ label: t("막 (기울기 1)", "film (slope 1)"), color: C.cool }, { label: t("침투 (1/2)", "penetration (1/2)"), color: C.good }, { label: t("경계층 (2/3)", "boundary layer (2/3)"), color: C.copper }]} legendAt="tl" />
        </Grid2>
        <Note>
          {t(
            "막 두께 50 μm, 접촉 시간 0.1 s, 판 길이 5 cm·유속 0.5 m/s(물)를 가정한 설명용 비교입니다. 절대값보다 기울기를 보세요.",
            "An illustrative comparison assuming a 50 μm film, a 0.1 s contact time, and a 5 cm plate at 0.5 m/s (water). Look at the slopes rather than the absolute values."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: heat–mass analogy & wet bulb ---------------------------------- */
const psatW = (T) => 611.21 * Math.exp((18.678 - T / 234.5) * (T / (257.14 + T)));
function wetBulb(T, RH, Le, P = 101325) {
  const Tk = T + 273.15, rho = (P * 0.02897) / (8.314 * Tk), cp = 1006;
  const rv = (RH * psatW(T) * 0.018015) / (8.314 * Tk);
  const f = (Ts) => (T - Ts) * rho * cp * Math.pow(Le, 2 / 3) - (2.501e6 - 2370 * Ts) * ((psatW(Ts) * 0.018015) / (8.314 * (Ts + 273.15)) - rv);
  let lo = -20, hi = T;
  for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
  return 0.5 * (lo + hi);
}
function TabWetBulb({ t }) {
  const [T, setT] = useState(30);
  const [RH, setRH] = useState(0.5);
  const Le = 2.2e-5 / 2.6e-5;
  const tw = wetBulb(T, RH, Le);
  const tw1 = wetBulb(T, RH, 1);
  const rhs = lin(0.05, 1, 60);
  return (
    <div>
      <Panel title={t("유도: 열과 물질의 Chilton–Colburn 유사성", "Derivation: the Chilton–Colburn analogy for heat and mass")}>
        <P>
          {t(
            "같은 유동에서 열전달과 물질전달은 모두 C_f/2와 연결됩니다: j_H = St Pr^(2/3) = C_f/2, j_D = (k_c/v) Sc^(2/3) = C_f/2. 두 식을 같게 놓으면 h와 k_c의 관계가 나옵니다.",
            "In the same flow, heat and mass transfer are both tied to C_f/2: j_H = St Pr^(2/3) = C_f/2 and j_D = (k_c/v) Sc^(2/3) = C_f/2. Equating the two relates h to k_c:"
          )}
        </P>
        <Eq block>h/(ρ c_p v) Pr^(2/3) = (k_c/v) Sc^(2/3) &nbsp;⇒&nbsp; h / k_c = ρ c_p (Sc/Pr)^(2/3) = ρ c_p Le^(2/3)</Eq>
        <P>
          {t(
            "습구 온도계는 젖은 심지로 감싼 온도계입니다. 정상상태에서 공기가 대류로 넣어 주는 열과 증발로 빠져나가는 잠열이 같습니다. 이 균형을 위 관계로 풀면, h와 k_c를 몰라도 습구 온도를 얻습니다.",
            "A wet-bulb thermometer is wrapped in a wet wick. At steady state, the heat brought by convection from the air equals the latent heat removed by evaporation. Using the relation above, the wet-bulb temperature follows without knowing h or k_c:"
          )}
        </P>
        <Eq block>h(T∞ − T_s) = λ k_c(ρ_v,s − ρ_v,∞) &nbsp;⇒&nbsp; T∞ − T_s = λ(ρ_v,s − ρ_v,∞) / (ρ c_p Le^(2/3))</Eq>
      </Panel>
      <Panel title={t("계산기: 습구 온도와 증발 냉각", "Calculator: wet-bulb temperature and evaporative cooling")}>
        <Grid2>
          <div>
            <Slider label={t("공기 온도 T∞", "air temperature T∞")} value={T} min={10} max={45} step={0.5} onChange={setT} unit=" °C" />
            <Slider label={t("상대 습도", "relative humidity")} value={RH} min={0.05} max={1} step={0.01} onChange={setRH} fmt={(x) => `${(x * 100).toFixed(0)}%`} />
            <Readout>
              Le = α/D = {Le.toFixed(3)}, Le^(2/3) = {Math.pow(Le, 2 / 3).toFixed(3)}<br />
              T_wb (Le^(2/3)) = {tw.toFixed(2)} °C<br />
              T_wb (Le = 1) = {tw1.toFixed(2)} °C<br />
              {t("냉각 가능 폭", "cooling potential")} T∞ − T_wb = {(T - tw).toFixed(2)} K
            </Readout>
          </div>
          <Chart xr={[0, 100]} yr={[Math.min(...rhs.map((r) => wetBulb(T, r, Le))) - 1, T + 1]} xl={t("상대 습도 (%)", "relative humidity (%)")} yl={t("습구 온도 (°C)", "wet-bulb temperature (°C)")}
            series={[{ pts: rhs.map((r) => [r * 100, wetBulb(T, r, Le)]), color: C.copper, width: 2.4 }]}
            hlines={[{ y: T, color: C.inkSoft }]} dots={[{ x: RH * 100, y: tw }]} />
        </Grid2>
        <Note>
          {t(
            "물성(α, D)은 25 °C 공기의 설명용 값이고, 포화 증기압은 근사식을 썼습니다. 두 열의 차이가 Lewis 수 효과입니다. 공기–물에서는 Le^(2/3) ≈ 0.9라 습구 온도가 단열 포화 온도와 거의 같아집니다. 습도계(건습구)가 동작하는 이유입니다.",
            "The properties (α, D) are illustrative values for air at 25 °C and the saturation pressure uses an approximate fit. The difference between the two results is the Lewis-number effect. For air–water Le^(2/3) ≈ 0.9, so the wet-bulb temperature nearly equals the adiabatic saturation temperature, which is why the psychrometer works."
          )}
        </Note>
      </Panel>
      <Panel title={t("케이스: 냉각탑과 데이터센터 증발 냉각", "Case: cooling towers and evaporative cooling of data centers")}>
        <P>
          {t(
            "냉각탑은 물을 공기와 접촉시켜 일부를 증발시키고, 남은 물을 식힙니다. 이론적으로 물이 내려갈 수 있는 하한이 습구 온도입니다. 그래서 건조한 날(RH 20%, 30 °C)에는 약 15 K까지 식힐 수 있지만, 습한 날(RH 80%)에는 3 K 정도뿐입니다.",
            "A cooling tower brings water into contact with air, evaporates a fraction, and cools the rest. The theoretical lower limit for the water is the wet-bulb temperature, so a dry day (RH 20%, 30 °C) allows about 15 K of cooling but a humid day (RH 80%) only about 3 K."
          )}
        </P>
        <P>
          {t(
            "AI 데이터센터의 증발식 냉각도 같은 물리입니다. 설계자는 그 지역의 습구 온도 분포로 냉각 용량과 물 소비량을 정합니다. 반도체 팹의 공조와 초순수 냉각수 계통도 마찬가지입니다.",
            "Evaporative cooling of AI data centers follows the same physics: designers size cooling capacity and water use from the local wet-bulb distribution. So do semiconductor-fab air handling and process cooling-water loops."
          )}
        </P>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t("P1. 25 °C 공기 속 수증기의 Sc, Pr, Le를 구하라. ν = 1.55×10⁻⁵, D = 2.6×10⁻⁵, α = 2.2×10⁻⁵ m²/s.",
        "P1. Find Sc, Pr and Le for water vapor in air at 25 °C, with ν = 1.55×10⁻⁵, D = 2.6×10⁻⁵ and α = 2.2×10⁻⁵ m²/s."),
      s: t("Sc = ν/D = 0.596, Pr = ν/α = 0.705, Le = α/D = Sc/Pr = 0.846. 셋 모두 1에 가까우므로 공기에서는 속도·온도·농도 경계층 두께가 비슷합니다.",
        "Sc = ν/D = 0.596, Pr = ν/α = 0.705, Le = α/D = Sc/Pr = 0.846. All are near 1, so in air the velocity, thermal and concentration layers have similar thicknesses."),
    },
    {
      q: t("P2. 25 °C 건조 공기가 2 m/s로 길이 0.3 m의 물 표면 위를 흐른다. 평균 k_c와 증발 속도(kg/m²·h)를 구하라. 표면의 수증기 밀도는 포화값 0.0230 kg/m³이다.",
        "P2. Dry air at 25 °C flows at 2 m/s over a water surface 0.3 m long. Find the mean k_c and the evaporation rate (kg/m²·h). The vapor density at the surface is the saturated value, 0.0230 kg/m³."),
      s: t("Re_L = 2 × 0.3/1.55×10⁻⁵ = 3.87×10⁴(층류). Sh_L = 0.664 Re_L^(1/2) Sc^(1/3) = 0.664 × 196.7 × 0.842 = 110. k_c = 110 × 2.6×10⁻⁵/0.3 = 9.53×10⁻³ m/s. 증발 속도 = k_c × 0.0230 = 2.19×10⁻⁴ kg/m²·s = 0.79 kg/m²·h.",
        "Re_L = 2 × 0.3/1.55×10⁻⁵ = 3.87×10⁴ (laminar). Sh_L = 0.664 Re_L^(1/2) Sc^(1/3) = 0.664 × 196.7 × 0.842 = 110. k_c = 110 × 2.6×10⁻⁵/0.3 = 9.53×10⁻³ m/s. Evaporation = k_c × 0.0230 = 2.19×10⁻⁴ kg/m²·s = 0.79 kg/m²·h."),
    },
    {
      q: t("P3. 물 속 작은 분자(Sc ≈ 1000)가 평판 표면에서 녹아 나온다. 속도 경계층과 농도 경계층의 두께 비는? 이것이 실험에 주는 의미는?",
        "P3. A small molecule (Sc ≈ 1000) dissolves from a plate into water. What is the ratio of the velocity to the concentration layer thickness, and what does it mean for experiments?"),
      s: t("δ_M/δ_c ≈ Sc^(1/3) = 10. 농도 변화가 속도층의 바닥 10%에 몰리므로, 그 안의 속도는 거의 직선입니다. 그래서 벽 전단율만 알면 k_c를 예측할 수 있고(Lévêque 근사), 표면 거칠기가 결과에 크게 영향을 줍니다.",
        "δ_M/δ_c ≈ Sc^(1/3) = 10. The concentration change crowds into the bottom 10% of the velocity layer, where velocity is nearly linear. k_c is then predictable from the wall shear rate alone (the Lévêque approximation), and surface roughness strongly affects results."),
    },
    {
      q: t("P4. 층류 평판에서 x = L의 국소 k_c와 0~L 평균 k_c의 비는? 이유는?",
        "P4. On a laminar plate, what is the ratio of the local k_c at x = L to the mean k_c over 0–L, and why?"),
      s: t("국소 k_c ∝ x^(−1/2)이므로 평균은 (1/L)∫₀^L x^(−1/2)dx = 2L^(−1/2)입니다. 따라서 국소/평균 = 1/2입니다. 앞전 근처의 얇은 경계층이 평균을 끌어올립니다.",
        "Local k_c ∝ x^(−1/2), so the mean is (1/L)∫₀^L x^(−1/2)dx = 2L^(−1/2); local/mean = 1/2. The thin layer near the leading edge pulls the mean up."),
    },
    {
      q: t("P5. 지름 2 cm 관에서 액체(Sc = 500, D = 1.2×10⁻⁹ m²/s)가 Re = 5×10⁴으로 흐른다. Chilton–Colburn으로 k_c를 구하고, Reynolds 유사성과 비교하라.",
        "P5. A liquid (Sc = 500, D = 1.2×10⁻⁹ m²/s) flows at Re = 5×10⁴ in a 2 cm pipe. Find k_c by Chilton–Colburn and compare with the Reynolds analogy."),
      s: t("Sh = 0.023 Re^0.8 Sc^(1/3) = 1048, k_c = Sh D/d = 6.29×10⁻⁵ m/s. Reynolds 유사성은 Sh = (C_f/2)Re Sc = 6.6×10⁴으로 63배(= Sc^(2/3)) 큽니다. 액체에 Reynolds 유사성을 쓰면 안 되는 이유입니다.",
        "Sh = 0.023 Re^0.8 Sc^(1/3) = 1048, k_c = Sh D/d = 6.29×10⁻⁵ m/s. The Reynolds analogy gives Sh = (C_f/2)Re Sc = 6.6×10⁴, 63 times (= Sc^(2/3)) larger, which is why it must not be used for liquids."),
    },
    {
      q: t("P6. 같은 기포탑에서 D가 2배 다른 두 기체의 k_c 비가 1.41이었다. 어떤 모델이 맞는가?",
        "P6. In one bubble column, two gases whose D differ by a factor of 2 show a k_c ratio of 1.41. Which model fits?"),
      s: t("지수 = log 1.41/log 2 = 0.50이므로 침투 모델입니다. 기포 표면이 계속 갱신되어 짧은 접촉 시간 동안 반무한 확산이 일어난다는 뜻입니다.",
        "Exponent = log 1.41/log 2 = 0.50, so the penetration model fits: the bubble surface is continually renewed and semi-infinite diffusion acts during short contact times."),
    },
    {
      q: t("P7. 30 °C, 상대 습도 50% 공기의 습구 온도를 Le^(2/3) 보정을 넣어 구하라.",
        "P7. Find the wet-bulb temperature of air at 30 °C and 50% relative humidity, including the Le^(2/3) correction."),
      s: t("h(T∞ − T_s) = λ k_c(ρ_v,s − ρ_v,∞), h/k_c = ρc_p Le^(2/3)을 반복 계산으로 풀면 T_s ≈ 21.5 °C입니다(Le = 1이면 21.7 °C). 냉각 가능 폭은 약 8.5 K입니다.",
        "Solving h(T∞ − T_s) = λ k_c(ρ_v,s − ρ_v,∞) with h/k_c = ρc_p Le^(2/3) iteratively gives T_s ≈ 21.5 °C (21.7 °C with Le = 1), a cooling potential of about 8.5 K."),
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
    topic1: "week12_topic1_blasius_concentration_bl",
    topic2: "week12_topic2_integral_method",
    topic3: "week12_topic3_turbulent_analogies",
    topic4: "week12_topic4_wetbulb_kc_models",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK12_CODES[topic][lang];
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
              {WEEK12_CODES[tp].title}
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
            "Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 확인한 값: 주제 1은 사격법으로 f″(0) = 0.332057과 δ₉₉ = 4.91을 재현하고, Pohlhausen 수치해 C′(0)가 0.332 Sc^(1/3)과 2% 안에서 맞습니다. 주제 2는 3차 분포의 39/280과 4.64를 재현합니다. 주제 3은 Sc = 1에서 네 유사성이 같은 값을 줍니다. 주제 4는 증발 지수 1, 1/2, 2/3을 재현합니다. MATLAB과 Julia는 같은 알고리즘을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "The Python and C++ versions were run and their outputs compared; for all four topics they agree digit for digit. Checks: topic 1 reproduces f″(0) = 0.332057 and δ₉₉ = 4.91 by shooting, and the Pohlhausen C′(0) agrees with 0.332 Sc^(1/3) within 2%. Topic 2 reproduces 39/280 and 4.64 for the cubic profile. Topic 3 gives identical values for all four analogies at Sc = 1. Topic 4 recovers the D exponents 1, 1/2 and 2/3. The MATLAB and Julia versions port the same algorithms but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week12App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("Blasius 해", "Blasius solution"), comp: <TabBlasius t={t} /> },
    { label: t("농도 경계층", "Concentration BL"), comp: <TabConcBL t={t} /> },
    { label: t("적분 방법", "Integral method"), comp: <TabIntegral t={t} /> },
    { label: t("난류와 와확산", "Turbulence"), comp: <TabTurb t={t} /> },
    { label: t("유사성", "Analogies"), comp: <TabAnalogy t={t} /> },
    { label: t("k_c 모델", "k_c models"), comp: <TabModels t={t} /> },
    { label: t("열·물질 유사성", "Heat–mass analogy"), comp: <TabWetBulb t={t} /> },
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
                Heat & Mass Transfer · Week 12
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("대류 물질전달", "Convective Mass Transfer")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("무차원수와 Sherwood 수 · Blasius 해 · 농도 경계층 · 적분 방법 · 난류와 와확산 · Reynolds·Prandtl·von Kármán·Chilton–Colburn 유사성 · k_c 모델 · 습구 온도",
                   "Dimensionless groups & Sherwood number · Blasius solution · concentration boundary layer · integral method · turbulence & eddy diffusivity · Reynolds, Prandtl, von Kármán & Chilton–Colburn analogies · k_c models · wet-bulb temperature")}
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
