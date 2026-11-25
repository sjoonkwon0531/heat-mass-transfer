// Week15App.jsx — Heat & Mass Transfer, Week 15: Pattern formation by instability and by phase separation
// Part 1 — Linear stability of paired dynamic systems, Turing instability, reaction–diffusion models
// (Turing, Lengyel–Epstein/CDIMA, Gray–Scott, Gierer–Meinhardt, Lotka–Volterra).
// Part 2 — Lattice-gas model, spinodal decomposition, Cahn–Hilliard and Allen–Cahn equations.
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import WEEK15_CODES from "./Week15Codes";

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

/* ---------------------------------- shared math ---------------------------------- */
function eig2(a11, a12, a21, a22) {
  const T = a11 + a22, D = a11 * a22 - a12 * a21, disc = T * T - 4 * D;
  if (disc >= 0) { const r = Math.sqrt(disc); return { re1: (T + r) / 2, im1: 0, re2: (T - r) / 2, im2: 0, T, D }; }
  const r = Math.sqrt(-disc);
  return { re1: T / 2, im1: r / 2, re2: T / 2, im2: -r / 2, T, D };
}
function classify2(a11, a12, a21, a22, t) {
  const T = a11 + a22, D = a11 * a22 - a12 * a21;
  if (Math.abs(D) < 1e-9) return t("비고립 고정점 (Δ = 0)", "non-isolated fixed points (Δ = 0)");
  if (D < 0) return t("안장점 (불안정)", "saddle (unstable)");
  if (T * T - 4 * D < 0) {
    if (Math.abs(T) < 1e-9) return t("중심 (중립 안정)", "center (neutrally stable)");
    return T < 0 ? t("안정 나선", "stable spiral") : t("불안정 나선", "unstable spiral");
  }
  return T < 0 ? t("안정 노드", "stable node") : t("불안정 노드", "unstable node");
}

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 불안정성이 무늬를 만든다", "This week: instability makes patterns")}>
        <P>
          {t(
            "지금까지 확산은 늘 '고르게 만드는' 과정이었습니다. 농도 차가 있으면 확산이 그 차이를 줄였습니다. 이번 주에는 반대 상황을 봅니다. 확산이 반응과 결합하거나, 혼합물의 자유에너지가 아래로 볼록하지 않으면, 아주 작은 요동이 저절로 자라서 일정한 간격의 무늬가 생깁니다.",
            "Until now diffusion always evened things out: given a concentration difference, diffusion shrank it. This week we see the opposite. When diffusion couples with reaction, or when a mixture's free energy is not convex, tiny fluctuations grow on their own into patterns with a definite spacing."
          )}
        </P>
        <P>
          {t(
            "두 경로를 다룹니다. 첫째는 반응-확산 계의 Turing 불안정성입니다(얼룩말 줄무늬, 열대어 무늬, CDIMA 반응). 둘째는 혼합물의 스피노달 분해입니다(합금, 고분자 블렌드, 세포막 지질). 두 경우 모두 '어떤 파장이 가장 빨리 자라는가'가 무늬의 크기를 정합니다.",
            "Two routes are covered. The first is the Turing instability of reaction–diffusion systems (zebra stripes, tropical-fish patterns, the CDIMA reaction). The second is spinodal decomposition of mixtures (alloys, polymer blends, membrane lipids). In both, the wavelength that grows fastest sets the size of the pattern."
          )}
        </P>
      </Panel>

      <Panel title={t("자연 무늬 형성의 핵심 요소 (강의)", "Key elements of natural pattern formation (lecture)")}>
        <Table
          head={[t("짝", "Pair"), t("무늬에서 하는 일", "Role in the pattern")]}
          rows={[
            [t("활성화 ↔ 억제", "activation ↔ inhibition"), t("활성자는 자신을 늘리고, 억제자는 활성자를 줄입니다.", "The activator boosts itself; the inhibitor suppresses the activator.")],
            [t("협력 ↔ 경쟁", "cooperation ↔ competition"), t("가까운 곳은 서로 돕고, 먼 곳은 자원을 두고 다툽니다.", "Nearby regions help each other; distant ones compete for resources.")],
            [t("증폭 ↔ 감쇠", "amplification ↔ attenuation"), t("어떤 파장은 자라고, 나머지는 사라집니다.", "Some wavelengths grow; the rest decay.")],
            [t("양의 되먹임 ↔ 음의 되먹임", "positive ↔ negative feedback"), t("양의 되먹임이 무늬를 만들고, 음의 되먹임이 그 모양을 다듬습니다.", "Positive feedback creates the pattern; negative feedback shapes it.")],
            [t("공간·시간 제약", "spatial & temporal confinement"), t("계의 크기와 경계가 허용되는 파장을 고릅니다.", "System size and boundaries select the allowed wavelengths.")],
          ]}
        />
      </Panel>

      <Panel title={t("15주차 로드맵", "Week 15 roadmap")}>
        <Table
          head={[t("탭", "Tab"), t("핵심 질문", "Key question"), t("핵심 결과", "Key result")]}
          rows={[
            [t("선형 안정성", "Linear stability"), t("평형점 근처의 작은 교란은 자라는가?", "Does a small disturbance near a fixed point grow?"), "λ² − Tλ + Δ = 0"],
            [t("Turing 불안정성", "Turing instability"), t("안정한 반응이 확산 때문에 불안정해질 수 있나?", "Can diffusion destabilize a stable reaction?"), "dR̂₁₁ + R̂₂₂ > 0, Δ(R̂) < (dR̂₁₁ + R̂₂₂)²/(4d)"],
            [t("반응-확산 시뮬레이터", "RD simulator"), t("실제로 어떤 무늬가 생기나?", "What patterns actually appear?"), t("점, 줄, 미로", "spots, stripes, labyrinths")],
            [t("격자 기체 모델", "Lattice gas"), t("혼합물은 언제 두 상으로 나뉘나?", "When does a mixture split into two phases?"), "T_c = κ/(2k_B), 2χφ(1 − φ) = 1"],
            [t("Cahn–Hilliard 이론", "Cahn–Hilliard"), t("상분리는 얼마나 빨리, 어떤 크기로 진행하나?", "How fast and at what size does separation proceed?"), "λ_m = 2π/q_m"],
            [t("상분리 시뮬레이터", "Phase-separation simulator"), t("보존 변수와 비보존 변수는 어떻게 다른가?", "How do conserved and non-conserved order parameters differ?"), t("CH: 평균 일정, AC: 평균 변함", "CH: mean fixed; AC: mean drifts")],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Linear stability ---------------------------------- */
function TabStability({ t }) {
  const [a11, setA11] = useState(-0.5);
  const [a12, setA12] = useState(-2);
  const [a21, setA21] = useState(2);
  const [a22, setA22] = useState(-0.5);
  const e = eig2(a11, a12, a21, a22);
  const presets = [
    [t("안정 노드", "stable node"), [-1, 0.3, 0.2, -2]],
    [t("안정 나선", "stable spiral"), [-0.5, -2, 2, -0.5]],
    [t("불안정 나선", "unstable spiral"), [0.3, -2, 2, 0.1]],
    [t("안장점", "saddle"), [1, 0.5, 0.5, -1]],
    [t("중심", "center"), [0, -1, 1, 0]],
  ];
  const traj = useMemo(() => {
    const out = [];
    for (let m = 0; m < 10; m++) {
      const th = (2 * Math.PI * m) / 10 + 0.2;
      let x = 1.6 * Math.cos(th), y = 1.6 * Math.sin(th);
      const pts = [[x, y]];
      const fx = (x, y) => [a11 * x + a12 * y, a21 * x + a22 * y];
      for (let s = 0; s < 400; s++) {
        const h = 0.02;
        const k1 = fx(x, y), k2 = fx(x + (h / 2) * k1[0], y + (h / 2) * k1[1]);
        const k3 = fx(x + (h / 2) * k2[0], y + (h / 2) * k2[1]), k4 = fx(x + h * k3[0], y + h * k3[1]);
        x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        if (Math.abs(x) > 3 || Math.abs(y) > 3) break;
        pts.push([x, y]);
      }
      out.push(pts);
    }
    return out;
  }, [a11, a12, a21, a22]);
  const Ts = lin(-4, 4, 100);
  return (
    <div>
      <Panel title={t("유도: 두 변수 계의 선형화", "Derivation: linearizing a two-variable system")}>
        <P>
          {t(
            "1단계. ẋ = f(x, y), ẏ = g(x, y)인 계의 평형점 (x*, y*)에서는 f = g = 0입니다. 2단계. 평형점에서 조금 벗어난 Δx, Δy에 대해 f와 g를 Taylor 전개하고 1차 항만 남깁니다. 평형점에서 f = g = 0이므로 상수항이 사라집니다.",
            "Step 1. For ẋ = f(x, y), ẏ = g(x, y), the fixed point (x*, y*) has f = g = 0. Step 2. Expand f and g in a Taylor series for small Δx, Δy and keep first-order terms. The constant terms vanish because f = g = 0 there."
          )}
        </P>
        <Eq block>d/dt [Δx, Δy]ᵀ = J [Δx, Δy]ᵀ, &nbsp; J = [[∂f/∂x, ∂f/∂y], [∂g/∂x, ∂g/∂y]] ({t("평형점에서 계산", "evaluated at the fixed point")})</Eq>
        <P>
          {t(
            "3단계. 해를 e^(λt) 꼴로 두면 (J − λI)v = 0이 되고, 0이 아닌 v가 있으려면 행렬식이 0이어야 합니다. 2×2 행렬에서는 대각합 T와 행렬식 Δ만으로 고유값이 정해집니다.",
            "Step 3. Trying solutions proportional to e^(λt) gives (J − λI)v = 0; a nonzero v requires a zero determinant. For a 2×2 matrix the eigenvalues depend only on the trace T and the determinant Δ:"
          )}
        </P>
        <Eq block>λ² − Tλ + Δ = 0, &nbsp; λ₁,₂ = [T ± (T² − 4Δ)^(1/2)]/2, &nbsp; T = A₁₁ + A₂₂, &nbsp; Δ = A₁₁A₂₂ − A₁₂A₂₁</Eq>
        <P>
          {t(
            "4단계. 일반해는 두 모드의 선형 결합 c₁v₁e^(λ₁t) + c₂v₂e^(λ₂t)입니다. 따라서 두 고유값의 실수부가 모두 음수여야 교란이 사라집니다. 이 조건은 T < 0이면서 Δ > 0인 것과 같습니다.",
            "Step 4. The general solution is the combination c₁v₁e^(λ₁t) + c₂v₂e^(λ₂t), so a disturbance dies out only if both eigenvalues have negative real parts. That is equivalent to T < 0 and Δ > 0."
          )}
        </P>
      </Panel>

      <Panel title={t("시뮬레이션: T–Δ 평면과 위상 궤적", "Simulation: the T–Δ plane and phase portrait")}>
        <div style={{ marginBottom: 8 }}>
          {presets.map(([lb, v], i) => (
            <button key={i} style={btnStyle(false)} onClick={() => { setA11(v[0]); setA12(v[1]); setA21(v[2]); setA22(v[3]); }}>{lb}</button>
          ))}
        </div>
        <Grid2>
          <div>
            <Slider label="A₁₁ = ∂f/∂x" value={a11} min={-3} max={3} step={0.05} onChange={setA11} fmt={(v) => v.toFixed(2)} />
            <Slider label="A₁₂ = ∂f/∂y" value={a12} min={-3} max={3} step={0.05} onChange={setA12} fmt={(v) => v.toFixed(2)} />
            <Slider label="A₂₁ = ∂g/∂x" value={a21} min={-3} max={3} step={0.05} onChange={setA21} fmt={(v) => v.toFixed(2)} />
            <Slider label="A₂₂ = ∂g/∂y" value={a22} min={-3} max={3} step={0.05} onChange={setA22} fmt={(v) => v.toFixed(2)} />
            <Readout>
              T = {e.T.toFixed(3)}, Δ = {e.D.toFixed(3)}, T² − 4Δ = {(e.T * e.T - 4 * e.D).toFixed(3)}<br />
              λ₁ = {e.re1.toFixed(3)}{e.im1 ? ` ${e.im1 >= 0 ? "+" : "−"} ${Math.abs(e.im1).toFixed(3)}i` : ""}, λ₂ = {e.re2.toFixed(3)}{e.im2 ? ` ${e.im2 >= 0 ? "+" : "−"} ${Math.abs(e.im2).toFixed(3)}i` : ""}<br />
              → {classify2(a11, a12, a21, a22, t)}
            </Readout>
            <Chart W={420} H={300} xr={[-4, 4]} yr={[-3, 5]} xl={t("대각합 T", "trace T")} yl={t("행렬식 Δ", "determinant Δ")}
              series={[{ pts: Ts.map((T) => [T, (T * T) / 4]), color: C.cool, width: 2 }]}
              hlines={[{ y: 0, color: C.inkSoft, dash: "none" }]} vlines={[{ x: 0, color: C.inkSoft, dash: "none" }]}
              dots={[{ x: e.T, y: e.D, r: 6 }]}
              labels={[{ x: -3.8, y: 4.3, text: t("안정 나선", "stable spiral"), color: C.good }, { x: -3.8, y: 1.4, text: t("안정 노드", "stable node"), color: C.good }, { x: 1.6, y: 4.3, text: t("불안정 나선", "unstable spiral"), color: C.warn }, { x: -1.0, y: -2.3, text: t("안장점", "saddle"), color: C.warn }, { x: 1.9, y: 0.5, text: "Δ = T²/4", color: C.cool }]} />
          </div>
          <Chart W={420} H={420} xr={[-2, 2]} yr={[-2, 2]} xl="Δx" yl="Δy"
            series={traj.map((pts, i) => ({ pts, color: PALETTE[i % PALETTE.length], width: 1.6 }))}
            dots={[{ x: 0, y: 0, r: 5, color: C.ink }].concat(traj.map((p) => ({ x: p[0][0], y: p[0][1], r: 3, color: C.inkSoft, fill: "#fff" })))} />
        </Grid2>
        <Note>
          {t(
            "왼쪽 아래 사분면(T < 0, Δ > 0)이 강의 그림의 '안정성이 완전히 보장되는 영역'입니다. 포물선 Δ = T²/4 위쪽은 나선(진동), 아래쪽은 노드입니다. 오른쪽 그림의 흰 점에서 출발한 궤적이 원점으로 모이면 안정합니다.",
            "The upper-left region (T < 0, Δ > 0) is the lecture figure's 'region where stability is fully secured'. Above the parabola Δ = T²/4 the motion spirals (oscillates); below it the fixed point is a node. Trajectories leaving the white dots in the right panel converge to the origin when it is stable."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Turing instability ---------------------------------- */
const LE_PRESET = (() => {
  const a = 12, b = 0.3, sigma = 50, u = a / 5, q = 1 + u * u;
  return { r11: (3 * u * u - 5) / q, r12: (-4 * u) / q, r21: (sigma * 2 * b * u * u) / q, r22: (-sigma * b * u) / q, d: 50 };
})();

function TabTuring({ t }) {
  const [r11, setR11] = useState(+LE_PRESET.r11.toFixed(3));
  const [r12, setR12] = useState(+LE_PRESET.r12.toFixed(3));
  const [r21, setR21] = useState(+LE_PRESET.r21.toFixed(2));
  const [r22, setR22] = useState(+LE_PRESET.r22.toFixed(3));
  const [d, setD] = useState(50);
  const [g, setG] = useState(1);
  const TR = r11 + r22, DR = r11 * r22 - r12 * r21;
  const c1 = d * r11 + r22;
  const cond0 = TR < 0 && DR > 0;
  const cond1 = c1 > 0;
  const cond2 = cond1 && DR < (c1 * c1) / (4 * d);
  const kstar2 = (g * c1) / (2 * d);
  const lam = (k) => eig2(g * r11 - k * k, g * r12, g * r21, g * r22 - d * k * k).re1;
  const ks = lin(0, 2.5, 400);
  const curve = ks.map((k) => [k, lam(k)]);
  let km = 0, lm = -1e9, lo = null, hi = null;
  curve.forEach(([k, l]) => { if (l > lm) { lm = l; km = k; } if (l > 0) { if (lo === null) lo = k; hi = k; } });
  const detQ = ks.map((k) => [k, g * g * DR - g * k * k * c1 + d * k ** 4]);
  const ymax = Math.max(0.3, lm * 1.3);
  return (
    <div>
      <Panel title={t("유도: 확산이 안정한 반응을 불안정하게 만든다", "Derivation: diffusion destabilizes a stable reaction")}>
        <P>
          {t(
            "1단계(무차원화). ∂A/∂t = F(A, B) + D_A∇²A, ∂B/∂t = G(A, B) + D_B∇²B에서 x̂ = x/L, t̂ = t/t*, t* = L²/D_A, a = A/A*, b = B/A*로 바꿉니다. 그러면 확산계수 비 d = D_B/D_A와 반응 대 확산 시간의 비 γ = t*/t_C 두 무차원 수만 남습니다.",
            "Step 1 (scaling). In ∂A/∂t = F(A, B) + D_A∇²A, ∂B/∂t = G(A, B) + D_B∇²B set x̂ = x/L, t̂ = t/t*, t* = L²/D_A, a = A/A*, b = B/A*. Only two groups survive: the diffusivity ratio d = D_B/D_A and the ratio of diffusion to reaction time γ = t*/t_C:"
          )}
        </P>
        <Eq block>∂a/∂t̂ = γ f(a, b) + ∇̂²a, &nbsp; ∂b/∂t̂ = γ g(a, b) + d ∇̂²b</Eq>
        <P>
          {t(
            "2단계(선형화와 Fourier 변환). 균일 정상상태 근처의 교란 W = (δa, δb)에 대해 ∂W/∂t̂ = D∇̂²W + γR̂W, D = diag(1, d)입니다. 공간 Fourier 변환에서 ∇² → −k²이므로, 각 파수 k마다 독립된 2×2 문제가 됩니다.",
            "Step 2 (linearize and Fourier-transform). For a disturbance W = (δa, δb) about the uniform steady state, ∂W/∂t̂ = D∇̂²W + γR̂W with D = diag(1, d). A spatial Fourier transform turns ∇² into −k², so each wavenumber k gives its own 2×2 problem:"
          )}
        </P>
        <Eq block>∂Ŵ/∂t̂ = Q Ŵ, &nbsp; Q = γR̂ − k²D, &nbsp; T(Q) = γT(R̂) − (1 + d)k², &nbsp; Δ(Q) = γ²Δ(R̂) − γk²(dR̂₁₁ + R̂₂₂) + dk⁴</Eq>
        <P>
          {t(
            "3단계(조건). 확산이 없을 때 안정하다고 가정합니다: T(R̂) < 0, Δ(R̂) > 0. 그러면 T(Q)는 k가 커질수록 더 음수가 되므로, 불안정은 Δ(Q) < 0으로만 생길 수 있습니다. Δ(Q)는 k²에 대한 2차식이고, 그 최솟값이 음수가 되어야 합니다.",
            "Step 3 (conditions). Assume the reaction alone is stable: T(R̂) < 0 and Δ(R̂) > 0. T(Q) only becomes more negative as k grows, so instability can arise only through Δ(Q) < 0. Δ(Q) is quadratic in k², and its minimum must be negative:"
          )}
        </P>
        <Eq block>{t("조건 1", "Condition 1")}: dR̂₁₁ + R̂₂₂ > 0, &nbsp;&nbsp; {t("조건 2", "Condition 2")}: Δ(R̂) &lt; (dR̂₁₁ + R̂₂₂)²/(4d), &nbsp;&nbsp; k*² = γ(dR̂₁₁ + R̂₂₂)/(2d), &nbsp; L_c = 2π/k*</Eq>
        <P>
          {t(
            "조건 1과 T(R̂) < 0이 함께 성립하려면 d ≠ 1이고 R̂₁₁과 R̂₂₂의 부호가 달라야 합니다. 즉 한 성분은 자기 자신을 늘리는 활성자(R̂₁₁ > 0)이고, 다른 성분은 억제자이며 더 빨리 퍼져야 합니다(d > 1). '국소 활성화, 원거리 억제'가 이 조건의 물리적 의미입니다.",
            "Condition 1 together with T(R̂) < 0 requires d ≠ 1 and opposite signs of R̂₁₁ and R̂₂₂: one species is a self-enhancing activator (R̂₁₁ > 0), the other an inhibitor that must spread faster (d > 1). 'Local activation, long-range inhibition' is the physical meaning."
          )}
        </P>
      </Panel>

      <Panel title={t("시뮬레이션: 분산 관계 Re λ(k)", "Simulation: the dispersion relation Re λ(k)")}>
        <div style={{ marginBottom: 8 }}>
          <button style={btnStyle(false)} onClick={() => { setR11(+LE_PRESET.r11.toFixed(3)); setR12(+LE_PRESET.r12.toFixed(3)); setR21(+LE_PRESET.r21.toFixed(2)); setR22(+LE_PRESET.r22.toFixed(3)); setD(50); setG(1); }}>
            {t("Lengyel–Epstein (a = 12, b = 0.3, σ = 50)", "Lengyel–Epstein (a = 12, b = 0.3, σ = 50)")}
          </button>
        </div>
        <Grid2>
          <div>
            <Slider label="R̂₁₁" value={r11} min={-2} max={3} step={0.01} onChange={setR11} fmt={(v) => v.toFixed(2)} />
            <Slider label="R̂₁₂" value={r12} min={-5} max={5} step={0.01} onChange={setR12} fmt={(v) => v.toFixed(2)} />
            <Slider label="R̂₂₁" value={r21} min={-40} max={40} step={0.1} onChange={setR21} fmt={(v) => v.toFixed(1)} />
            <Slider label="R̂₂₂" value={r22} min={-10} max={2} step={0.01} onChange={setR22} fmt={(v) => v.toFixed(2)} />
            <Slider label="d = D_B/D_A" value={d} min={1} max={100} step={0.5} onChange={setD} fmt={(v) => v.toFixed(1)} />
            <Slider label="γ" value={g} min={0.1} max={4} step={0.05} onChange={setG} fmt={(v) => v.toFixed(2)} />
            <Readout>
              {t("확산 없이", "without diffusion")}: T(R̂) = {TR.toFixed(3)}, Δ(R̂) = {DR.toFixed(3)} → {cond0 ? t("안정 ✓", "stable ✓") : t("불안정 (전제 위반)", "unstable (premise violated)")}<br />
              {t("조건 1", "condition 1")}: dR̂₁₁ + R̂₂₂ = {c1.toFixed(3)} {cond1 ? "✓" : "✗"}<br />
              {t("조건 2", "condition 2")}: Δ(R̂) = {DR.toFixed(2)} {cond2 ? "<" : "≥"} {((c1 * c1) / (4 * d)).toFixed(2)} {cond2 ? "✓" : "✗"}<br />
              {cond1 ? <>k* = {Math.sqrt(kstar2).toFixed(4)}, L_c = 2π/k* = {((2 * Math.PI) / Math.sqrt(kstar2)).toFixed(3)}<br /></> : null}
              {lm > 0 && km > 0 ? <>{t("최대 성장", "fastest growth")}: k_m = {km.toFixed(4)}, Re λ = {lm.toFixed(4)}, 2π/k_m = {((2 * Math.PI) / km).toFixed(3)}<br />{t("불안정 띠", "unstable band")}: {lo.toFixed(3)} &lt; k &lt; {hi.toFixed(3)}</> : t("모든 k에서 감쇠: 무늬가 생기지 않습니다.", "All k decay: no pattern forms.")}
            </Readout>
          </div>
          <div>
            <Chart xr={[0, 2.5]} yr={[-Math.max(1, ymax * 2), ymax]} xl={t("파수 k", "wavenumber k")} yl="Re λ_max(k)"
              series={[{ pts: curve, color: C.copper, width: 2.6 }]} hlines={[{ y: 0, color: C.inkSoft }]}
              vlines={cond1 ? [{ x: Math.sqrt(kstar2), color: C.cool }] : []}
              dots={lm > 0 ? [{ x: km, y: lm }] : []}
              labels={cond1 ? [{ x: Math.min(2.4, Math.sqrt(kstar2)), y: ymax * 0.85, text: "k*", color: C.cool, dx: 4 }] : []} />
            <Chart xr={[0, 2.5]} yr={[Math.min(-5, g * g * DR - (g * g * c1 * c1) / (4 * d)) * 1.1, Math.max(10, g * g * DR * 1.5)]} xl={t("파수 k", "wavenumber k")} yl="Δ(Q)"
              series={[{ pts: detQ, color: C.cool, width: 2.4 }]} hlines={[{ y: 0, color: C.inkSoft }]} />
          </div>
        </Grid2>
        <Note>
          {t(
            "강의는 Δ(Q)가 가장 작은 k*를 무늬의 파수로 씁니다. 그러나 가장 빨리 자라는 모드는 Re λ가 최대인 k_m입니다. 둘은 불안정이 막 시작될 때(조건 2의 경계)만 같습니다. Lengyel–Epstein 예에서는 k* = 0.925, k_m = 0.861로 약 7% 차이가 납니다. L_c = 2π/k*는 '시작점 근처의 근사'로 이해하는 것이 정확합니다.",
            "The lecture uses the k* that minimizes Δ(Q) as the pattern wavenumber. The fastest-growing mode, however, is the k_m that maximizes Re λ. The two coincide only at the onset (the boundary of condition 2). In the Lengyel–Epstein example k* = 0.925 and k_m = 0.861, a 7% difference, so L_c = 2π/k* is best read as a near-onset approximation."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- canvas helpers ---------------------------------- */
const CMAP_STOPS = [[32, 48, 79], [58, 110, 165], [94, 170, 168], [243, 210, 170], [196, 118, 64], [124, 69, 32]];
function cmap(v) {
  const u = Math.max(0, Math.min(1, v)) * (CMAP_STOPS.length - 1);
  const i = Math.min(CMAP_STOPS.length - 2, Math.floor(u)), f = u - i;
  const a = CMAP_STOPS[i], b = CMAP_STOPS[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
const SIMN = 128;
function lcgRand(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
function lap5(Z, i, j, N) {
  const im = i === 0 ? N - 1 : i - 1, ip = i === N - 1 ? 0 : i + 1, jm = j === 0 ? N - 1 : j - 1, jp = j === N - 1 ? 0 : j + 1;
  return Z[im * N + j] + Z[ip * N + j] + Z[i * N + jm] + Z[i * N + jp] - 4 * Z[i * N + j];
}
function drawField(canvas, Z, lo, hi) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = SIMN, img = ctx.createImageData(N, N);
  for (let n = 0; n < N * N; n++) {
    const c = cmap((Z[n] - lo) / (hi - lo));
    img.data[4 * n] = c[0]; img.data[4 * n + 1] = c[1]; img.data[4 * n + 2] = c[2]; img.data[4 * n + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
function SimCanvas({ canvasRef, onPaint }) {
  const handle = (e) => {
    if (!onPaint) return;
    const r = e.currentTarget.getBoundingClientRect();
    const j = Math.floor(((e.clientX - r.left) / r.width) * SIMN), i = Math.floor(((e.clientY - r.top) / r.height) * SIMN);
    onPaint(i, j);
  };
  return (
    <canvas ref={canvasRef} width={SIMN} height={SIMN} onMouseDown={handle}
      style={{ width: "100%", maxWidth: 420, aspectRatio: "1 / 1", imageRendering: "pixelated", borderRadius: 8, border: `1px solid ${C.line}`, cursor: onPaint ? "crosshair" : "default", display: "block", margin: "0 auto" }} />
  );
}

/* ---------------------------------- reaction–diffusion models ---------------------------------- */
const RD_MODELS = {
  gs: {
    name: ["Gray–Scott", "Gray–Scott"],
    dt: 1, perFrame: 12,
    init(st, p) {
      const N = SIMN, r = lcgRand(12345);
      st.u = new Float64Array(N * N).fill(1); st.v = new Float64Array(N * N);
      const c0 = N / 2 - 8, c1 = N / 2 + 8;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const n = i * N + j, z = 0.02 * (r() - 0.5);
        if (i >= c0 && i < c1 && j >= c0 && j < c1) { st.u[n] = 0.5; st.v[n] = 0.25; }
        st.u[n] += z; st.v[n] += z;
      }
    },
    step(st, p) {
      const N = SIMN, { u, v } = st, un = st.un || (st.un = new Float64Array(N * N)), vn = st.vn || (st.vn = new Float64Array(N * N));
      const F = p.F, k = p.k, Du = 0.16, Dv = 0.08;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const n = i * N + j, uvv = u[n] * v[n] * v[n];
        un[n] = u[n] + (Du * lap5(u, i, j, N) - uvv + F * (1 - u[n]));
        vn[n] = v[n] + (Dv * lap5(v, i, j, N) + uvv - (F + k) * v[n]);
      }
      st.u = un; st.v = vn; st.un = u; st.vn = v;
    },
    show: (st) => st.v, range: [0, 0.4],
    paint(st, i0, j0) {
      const N = SIMN;
      for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) {
        const i = (i0 + di + N) % N, j = (j0 + dj + N) % N;
        st.u[i * N + j] = 0.5; st.v[i * N + j] = 0.25;
      }
    },
  },
  le: {
    name: ["Lengyel–Epstein (CDIMA)", "Lengyel–Epstein (CDIMA)"],
    dt: 0.004, perFrame: 120,
    init(st, p) {
      const N = SIMN, r = lcgRand(777), us = p.a / 5, vs = 1 + us * us;
      st.u = new Float64Array(N * N); st.v = new Float64Array(N * N);
      for (let n = 0; n < N * N; n++) { st.u[n] = us * (1 + 0.02 * (r() - 0.5)); st.v[n] = vs * (1 + 0.02 * (r() - 0.5)); }
    },
    step(st, p) {
      const N = SIMN, { u, v } = st, un = st.un || (st.un = new Float64Array(N * N)), vn = st.vn || (st.vn = new Float64Array(N * N));
      const dt = 0.004, a = p.a, b = p.b, s = p.sigma, Dv = p.sigma * p.d;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const n = i * N + j, U = u[n], V = v[n], q = (U * V) / (1 + U * U);
        un[n] = U + dt * (a - U - 4 * q + lap5(u, i, j, N));
        vn[n] = V + dt * (s * b * (U - q) + Dv * lap5(v, i, j, N));
      }
      st.u = un; st.v = vn; st.un = u; st.vn = v;
    },
    show: (st) => st.u, range: [0, 6],
    paint(st, i0, j0) {
      const N = SIMN;
      for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) st.u[((i0 + di + N) % N) * N + ((j0 + dj + N) % N)] *= 1.3;
    },
  },
  gm: {
    name: ["Gierer–Meinhardt", "Gierer–Meinhardt"],
    dt: 0.02, perFrame: 40,
    init(st, p) {
      const N = SIMN, r = lcgRand(4242), us = 1 / p.b, vs = 1 / (p.b * p.b);
      st.u = new Float64Array(N * N); st.v = new Float64Array(N * N);
      for (let n = 0; n < N * N; n++) { st.u[n] = us * (1 + 0.04 * (r() - 0.5)); st.v[n] = vs * (1 + 0.04 * (r() - 0.5)); }
    },
    step(st, p) {
      const N = SIMN, { u, v } = st, un = st.un || (st.un = new Float64Array(N * N)), vn = st.vn || (st.vn = new Float64Array(N * N));
      const dt = 0.02, b = p.b, Du = 0.25, Dv = 0.25 * p.ratio;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const n = i * N + j, U = u[n], V = Math.max(1e-6, v[n]);
        un[n] = Math.min(1e3, U + dt * ((U * U) / V - b * U + Du * lap5(u, i, j, N)));
        vn[n] = V + dt * (U * U - V + Dv * lap5(v, i, j, N));
      }
      st.u = un; st.v = vn; st.un = u; st.vn = v;
    },
    show: (st) => st.u, range: null,
    paint(st, i0, j0) {
      const N = SIMN;
      for (let di = -3; di <= 3; di++) for (let dj = -3; dj <= 3; dj++) st.u[((i0 + di + N) % N) * N + ((j0 + dj + N) % N)] *= 1.5;
    },
  },
};

function rangeFor(model, M, st, p) {
  if (model === "le") return [0, p.a / 2];
  if (M.range) return M.range;
  const Z = M.show(st);
  let hi = 0;
  for (let n = 0; n < Z.length; n++) if (Z[n] > hi) hi = Z[n];
  return [0, Math.max(1e-6, hi)];
}

const GS_PRESETS = [
  { kr: "점 (자기복제)", en: "spots (self-replicating)", F: 0.035, k: 0.065 },
  { kr: "줄·미로", en: "stripes / labyrinth", F: 0.06, k: 0.062 },
  { kr: "점과 줄 혼합", en: "spots + stripes", F: 0.025, k: 0.06 },
  { kr: "산호", en: "coral", F: 0.0545, k: 0.062 },
  { kr: "세포 분열", en: "mitosis", F: 0.0367, k: 0.0649 },
];

function TabRDSim({ t }) {
  const [model, setModel] = useState("gs");
  const [F, setF] = useState(0.035);
  const [k, setK] = useState(0.065);
  const [a, setA] = useState(12);
  const [b, setB] = useState(0.3);
  const [gmb, setGmb] = useState(0.5);
  const [ratio, setRatio] = useState(40);
  const [running, setRunning] = useState(true);
  const [time, setTime] = useState(0);
  const [nonce, setNonce] = useState(0);
  const canvasRef = useRef(null);
  const st = useRef({});
  const params = useRef({});
  params.current = model === "gs" ? { F, k } : model === "le" ? { a, b, sigma: 50, d: 1 } : { b: gmb, ratio };
  const M = RD_MODELS[model];

  useEffect(() => {
    st.current = { t: 0 };
    M.init(st.current, params.current);
    setTime(0);
    const [lo, hi] = rangeFor(model, M, st.current, params.current);
    drawField(canvasRef.current, M.show(st.current), lo, hi);
  }, [model, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return undefined;
    let raf, alive = true, frames = 0;
    const loop = () => {
      if (!alive) return;
      for (let s = 0; s < M.perFrame; s++) M.step(st.current, params.current);
      st.current.t += M.perFrame * M.dt;
      const [lo, hi] = rangeFor(model, M, st.current, params.current);
      drawField(canvasRef.current, M.show(st.current), lo, hi);
      if (++frames % 6 === 0) setTime(st.current.t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [running, model]); // eslint-disable-line react-hooks/exhaustive-deps

  const paint = (i, j) => {
    M.paint(st.current, i, j);
    const [lo, hi] = rangeFor(model, M, st.current, params.current);
    drawField(canvasRef.current, M.show(st.current), lo, hi);
  };

  return (
    <div>
      <Panel title={t("세 가지 반응-확산 모델", "Three reaction–diffusion models")}>
        <Table
          head={[t("모델", "Model"), t("식 (무차원)", "Equations (dimensionless)"), t("특징", "Feature")]}
          rows={[
            ["Gray–Scott", "U_t = D_U∇²U − UV² + F(1 − U),  V_t = D_V∇²V + UV² − (F + k)V", t("U + 2V → 3V (자기촉매), V → P; 공급률 F와 제거율 k로 무늬가 바뀝니다.", "U + 2V → 3V (autocatalysis), V → P; the feed F and kill k select the pattern.")],
            ["Lengyel–Epstein", "u_t = a − u − 4uv/(1 + u²) + ∇²u,  v_t = σ[b(u − uv/(1 + u²)) + d∇²v]", t("CDIMA 반응의 두 변수 모델(u ~ [I⁻], v ~ [ClO₂⁻]). 녹말이 활성자를 붙잡아 σ가 커집니다.", "Two-variable model of the CDIMA reaction (u ~ [I⁻], v ~ [ClO₂⁻]). Starch binds the activator, which makes σ large.")],
            ["Gierer–Meinhardt", "u_t = u²/v − bu + D_u∇²u,  v_t = u² − v + D_v∇²v", t("국소 활성화(u²)와 측면 억제(1/v)의 원형 모델입니다.", "The prototype of local activation (u²) and lateral inhibition (1/v).")],
          ]}
        />
        <Note>
          {t(
            "세 모델 모두 2D 격자(128 × 128, 격자 간격 1, 주기 경계)에서 명시적 Euler 법과 5점 Laplacian으로 풉니다. Lengyel–Epstein은 탭 'Turing 불안정성'의 기본 예제(a = 12, b = 0.3, σ = 50, d = 1)와 같은 값이어서, 예측된 파장 2π/k_m ≈ 7.3 격자를 화면에서 직접 확인할 수 있습니다. 캔버스를 클릭하면 국소 교란을 넣습니다.",
            "All three are solved on a 2D grid (128 × 128, spacing 1, periodic) with explicit Euler and a 5-point Laplacian. The Lengyel–Epstein run uses the default example of the Turing tab (a = 12, b = 0.3, σ = 50, d = 1), so the predicted wavelength 2π/k_m ≈ 7.3 cells can be checked on screen. Click the canvas to add a local disturbance."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이터", "Simulator")}>
        <div style={{ marginBottom: 10 }}>
          <Seg value={model} onChange={(m) => { setModel(m); setRunning(true); }}
            options={[{ v: "gs", label: "Gray–Scott" }, { v: "le", label: "Lengyel–Epstein" }, { v: "gm", label: "Gierer–Meinhardt" }]} />
        </div>
        <Grid2>
          <div>
            {model === "gs" && (<>
              <div style={{ marginBottom: 8 }}>
                {GS_PRESETS.map((p, i) => (
                  <button key={i} style={btnStyle(F === p.F && k === p.k)} onClick={() => { setF(p.F); setK(p.k); setNonce((x) => x + 1); }}>{t(p.kr, p.en)}</button>
                ))}
              </div>
              <Slider label={t("공급률 F", "feed rate F")} value={F} min={0.01} max={0.08} step={0.0005} onChange={setF} fmt={(v) => v.toFixed(4)} />
              <Slider label={t("제거율 k", "kill rate k")} value={k} min={0.04} max={0.075} step={0.0005} onChange={setK} fmt={(v) => v.toFixed(4)} />
              <Note>{t("D_U = 0.16, D_V = 0.08, Δt = 1. 화면은 V 농도입니다.", "D_U = 0.16, D_V = 0.08, Δt = 1. The map shows V.")}</Note>
            </>)}
            {model === "le" && (<>
              <Slider label="a" value={a} min={8} max={16} step={0.1} onChange={setA} fmt={(v) => v.toFixed(1)} />
              <Slider label="b" value={b} min={0.1} max={0.6} step={0.01} onChange={setB} fmt={(v) => v.toFixed(2)} />
              <Note>{t("σ = 50, d = 1 (유효 확산계수 비 σd = 50), Δt = 0.004. 화면은 u(요오드화 이온)입니다. b를 키우면 억제가 강해져 무늬가 사라집니다.", "σ = 50, d = 1 (effective diffusivity ratio σd = 50), Δt = 0.004. The map shows u (iodide). Raising b strengthens inhibition until the pattern disappears.")}</Note>
            </>)}
            {model === "gm" && (<>
              <Slider label="b" value={gmb} min={0.2} max={0.9} step={0.01} onChange={setGmb} fmt={(v) => v.toFixed(2)} />
              <Slider label="D_v / D_u" value={ratio} min={2} max={60} step={1} onChange={setRatio} />
              <Note>{t("D_u = 0.25, Δt = 0.02. 비가 작으면(억제자가 느리면) 균일 상태가 유지됩니다. 화면은 활성자 u입니다.", "D_u = 0.25, Δt = 0.02. With a small ratio (slow inhibitor) the uniform state survives. The map shows the activator u.")}</Note>
            </>)}
            <div style={{ marginTop: 8 }}>
              <button style={btnStyle(running)} onClick={() => setRunning((r) => !r)}>{running ? t("일시정지", "Pause") : t("실행", "Run")}</button>
              <button style={btnStyle(false)} onClick={() => setNonce((x) => x + 1)}>{t("초기화", "Reset")}</button>
            </div>
            <Readout>{RD_MODELS[model].name[0]} · t = {time.toFixed(model === "gs" ? 0 : 1)}</Readout>
          </div>
          <SimCanvas canvasRef={canvasRef} onPaint={paint} />
        </Grid2>
      </Panel>

      <Panel title={t("포식자-피식자(Lotka–Volterra) 모델도 무늬를 만든다", "Predator–prey (Lotka–Volterra) models also make patterns")}>
        <P>
          {t(
            "강의의 확산 있는 LV 모델은 피식자 X의 로지스틱 성장과 포식자 Y의 포화형 포식을 결합합니다. 확산이 없으면 두 개체군은 시간에 따라 진동하고, 확산이 들어가면 공간 무늬가 생깁니다.",
            "The lecture's LV model with diffusion couples logistic growth of the prey X with saturating predation by Y. Without diffusion the populations oscillate in time; with diffusion, spatial patterns appear."
          )}
        </P>
        <Eq block>dX/dτ = X[r₀(1 − X/X₀) − kY/(1 + X)] + ∇²X, &nbsp; dY/dτ = Y[kX/(1 + X) − 1 − k_f Y] + d∇²Y</Eq>
      </Panel>
    </div>
  );
}

/* ---------------------------------- lattice-gas thermodynamics ---------------------------------- */
const fmix = (p, chi) => chi * p * (1 - p) + p * Math.log(p) + (1 - p) * Math.log(1 - p);
const fmix2 = (p, chi) => -2 * chi + 1 / (p * (1 - p));
function spinodalPts(chi) {
  if (chi <= 2) return null;
  const s = Math.sqrt(1 - 2 / chi);
  return [0.5 * (1 - s), 0.5 * (1 + s)];
}
function binodalPts(chi) {
  if (chi <= 2) return null;
  const g = (p) => chi * (1 - 2 * p) + Math.log(p / (1 - p));
  let lo = 1e-12, hi = spinodalPts(chi)[0];
  for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
  const p = 0.5 * (lo + hi);
  return [p, 1 - p];
}

/* ---------------------------------- Tab 5: lattice gas ---------------------------------- */
function TabLatticeGas({ t }) {
  const [chi, setChi] = useState(2.5);
  const [phi0, setPhi0] = useState(0.35);
  const ps = lin(0.002, 0.998, 300);
  const sp = spinodalPts(chi), bn = binodalPts(chi);
  const f2 = fmix2(phi0, chi);
  let region;
  if (!sp) region = t("χ ≤ 2 (T ≥ T_c): 모든 조성에서 섞입니다.", "χ ≤ 2 (T ≥ T_c): mixes at every composition.");
  else if (phi0 > sp[0] && phi0 < sp[1]) region = t("불안정 (스피노달 안): 작은 요동이 바로 자랍니다 → 스피노달 분해", "unstable (inside the spinodal): small fluctuations grow at once → spinodal decomposition");
  else if (phi0 > bn[0] && phi0 < bn[1]) region = t("준안정 (바이노달과 스피노달 사이): 핵생성이 필요합니다 → 핵생성·성장", "metastable (between binodal and spinodal): nucleation needed → nucleation & growth");
  else region = t("안정 (바이노달 밖): 한 상으로 남습니다.", "stable (outside the binodal): stays one phase.");
  const chis = lin(2.0005, 6, 300);
  const binL = chis.map((c) => [binodalPts(c)[0], 2 / c]), binR = chis.map((c) => [binodalPts(c)[1], 2 / c]);
  const spL = chis.map((c) => [spinodalPts(c)[0], 2 / c]), spR = chis.map((c) => [spinodalPts(c)[1], 2 / c]);
  const fmin = Math.min(...ps.map((p) => fmix(p, chi)));
  return (
    <div>
      <Panel title={t("유도: 격자 기체(정규 용액) 모델", "Derivation: the lattice-gas (regular-solution) model")}>
        <P>
          {t(
            "가정: A와 B의 분자 부피가 같고, 각 분자는 격자 한 칸을 차지합니다. 상호작용은 가장 가까운 이웃(배위수 Z) 사이에만 있고, 분자 부피는 온도와 압력에 무관합니다. 내부 에너지는 이 짧은 거리 상호작용만으로 정해집니다.",
            "Assumptions: A and B have equal molecular volumes and each occupies one lattice site. Interactions act only between nearest neighbours (coordination number Z), molecular volumes do not change with T and P, and the internal energy comes only from these short-range interactions."
          )}
        </P>
        <P>
          {t(
            "1단계(에너지). 섞기 전과 후의 접촉 에너지 차를 세면, 무작위 혼합(평균장)에서 A–B 접촉 수가 Z N φ_A φ_B이므로 다음을 얻습니다.",
            "Step 1 (energy). Counting contact energies before and after mixing, with Z N φ_A φ_B A–B contacts for random (mean-field) mixing:"
          )}
        </P>
        <Eq block>ΔU/N = κ φ_A φ_B, &nbsp; κ = (Z/2)(2ε_AB − ε_AA − ε_BB), &nbsp; χ = κ/(k_B T)</Eq>
        <P>
          {t(
            "2단계(엔트로피). 배치의 수 Ω = N!/(N_A! N_B!)에 Stirling 근사 ln N! ≈ N ln N − N을 쓰면 혼합 엔트로피가 나옵니다.",
            "Step 2 (entropy). The number of arrangements Ω = N!/(N_A! N_B!) with Stirling's approximation ln N! ≈ N ln N − N gives the entropy of mixing:"
          )}
        </P>
        <Eq block>ΔS/(k_B N) = −(φ_A ln φ_A + φ_B ln φ_B)</Eq>
        <P>{t("3단계. 둘을 합쳐 혼합 자유에너지를 만들고, 두 번 미분해 안정성을 봅니다.", "Step 3. Combine them into the free energy of mixing and differentiate twice to test stability:")}</P>
        <Eq block>f(φ) = ΔF/(k_B T N) = χφ(1 − φ) + φ ln φ + (1 − φ) ln(1 − φ), &nbsp; f″(φ) = −2χ + 1/[φ(1 − φ)]</Eq>
        <P>
          {t(
            "f″ < 0이면 작은 조성 요동이 자유에너지를 낮추므로 혼합물이 불안정합니다. 경계 f″ = 0이 스피노달 2χφ(1 − φ) = 1입니다. φ = 1/2에서 χ = 2일 때 처음 나타나므로 임계 온도는 T_c = κ/(2k_B)입니다. 두 상의 공존 조성(바이노달)은 공통 접선으로 정하며, 이 대칭 모델에서는 f′(φ) = 0과 같습니다.",
            "Where f″ < 0, a small composition fluctuation lowers the free energy, so the mixture is unstable. The boundary f″ = 0 is the spinodal 2χφ(1 − φ) = 1. It first appears at φ = 1/2 when χ = 2, so the critical temperature is T_c = κ/(2k_B). The coexisting compositions (binodal) follow from the common tangent; for this symmetric model that reduces to f′(φ) = 0."
          )}
        </P>
      </Panel>

      <Panel title={t("시뮬레이션: 자유에너지와 상태도", "Simulation: free energy and phase diagram")}>
        <Grid2>
          <div>
            <Slider label={`χ = κ/(k_B T)   (T/T_c = ${(2 / chi).toFixed(3)})`} value={chi} min={1} max={4} step={0.01} onChange={setChi} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("전체 조성 φ₀", "overall composition φ₀")} value={phi0} min={0.02} max={0.98} step={0.005} onChange={setPhi0} fmt={(v) => v.toFixed(3)} />
            <Readout>
              f″(φ₀) = {f2.toFixed(3)}<br />
              {bn ? <>{t("바이노달", "binodal")}: {bn[0].toFixed(4)}, {bn[1].toFixed(4)}<br />{t("스피노달", "spinodal")}: {sp[0].toFixed(4)}, {sp[1].toFixed(4)}<br /></> : null}
              → {region}
            </Readout>
            <Chart xr={[0, 1]} yr={[Math.min(-0.75, fmin - 0.02), 0.12]} xl="φ_A" yl="ΔF/(k_B T N)"
              series={[{ pts: ps.map((p) => [p, fmix(p, chi)]), color: C.copper, width: 2.6 }].concat(bn ? [{ pts: [[bn[0], fmix(bn[0], chi)], [bn[1], fmix(bn[1], chi)]], color: C.cool, width: 1.4, dash: "5 4" }] : [])}
              dots={[{ x: phi0, y: fmix(phi0, chi) }].concat(sp ? sp.map((x) => ({ x, y: fmix(x, chi), r: 3.5, color: C.warn, fill: "#fff" })) : [])} />
          </div>
          <Chart W={460} H={420} xr={[0, 1]} yr={[0.3, 1.1]} xl="φ_A" yl="T / T_c"
            series={[
              { pts: binL.concat(binR.slice().reverse()), color: C.cool, width: 2.4 },
              { pts: spL.concat(spR.slice().reverse()), color: C.warn, width: 2, dash: "6 4" },
            ]}
            hlines={[{ y: 2 / chi, color: C.inkSoft }]}
            dots={[{ x: phi0, y: 2 / chi, r: 6 }]}
            legend={[{ label: t("바이노달", "binodal"), color: C.cool }, { label: t("스피노달", "spinodal"), color: C.warn, dash: "6 4" }]} legendAt="br" />
        </Grid2>
        <Note>
          {t(
            "점선 직선은 바이노달 두 점을 잇는 공통 접선입니다. 바이노달과 스피노달 사이(준안정 영역)에서는 작은 요동이 사라지므로, 일정 크기 이상의 핵이 생겨야 상분리가 시작됩니다. 스피노달 안에서는 그런 장벽이 없습니다.",
            "The dashed straight line is the common tangent joining the two binodal points. Between the binodal and the spinodal (metastable region) small fluctuations decay, so separation must wait for a nucleus of sufficient size. Inside the spinodal there is no such barrier."
          )}
        </Note>
      </Panel>

      <Panel title={t("핵생성·성장 vs 스피노달 분해", "Nucleation & growth vs. spinodal decomposition")}>
        <Table
          head={["", t("핵생성·성장", "Nucleation & growth"), t("스피노달 분해", "Spinodal decomposition")]}
          rows={[
            [t("위치", "where"), t("바이노달과 스피노달 사이 (f″ > 0)", "between binodal and spinodal (f″ > 0)"), t("스피노달 안 (f″ < 0)", "inside the spinodal (f″ < 0)")],
            [t("요동", "fluctuation"), t("크고 국소적인 요동이 필요", "needs a large, local fluctuation"), t("작고 넓게 퍼진 요동이 자람", "small, extended fluctuations grow")],
            [t("확산 방향", "diffusion"), t("내리막 (D_eff > 0)", "downhill (D_eff > 0)"), t("오르막 (D_eff < 0)", "uphill (D_eff < 0)")],
            [t("계면", "interface"), t("처음부터 날카로움", "sharp from the start"), t("처음에는 퍼져 있다가 점점 날카로워짐", "diffuse at first, sharpening with time")],
            [t("형태", "morphology"), t("흩어진 방울", "isolated droplets"), t("서로 연결된 미로 구조", "interconnected labyrinth")],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Cahn–Hilliard theory ---------------------------------- */
function TabCHTheory({ t }) {
  const [chi, setChi] = useState(2.5);
  const [phi0, setPhi0] = useState(0.5);
  const K = chi / 2; // gradient coefficient K = C h^2, C = chi/2, h = 1
  const f2 = fmix2(phi0, chi);
  const unstable = f2 < 0;
  const qc = unstable ? Math.sqrt(-f2 / (2 * K)) : 0, qm = qc / Math.SQRT2;
  const w = (q) => -q * q * (f2 + 2 * K * q * q);
  const qs = lin(0, Math.max(1.2, qc * 1.4), 300);
  const wmax = unstable ? w(qm) : 0.05;
  return (
    <div>
      <Panel title={t("유도: Cahn–Hilliard 식", "Derivation: the Cahn–Hilliard equation")}>
        <P>
          {t(
            "1단계(플럭스). B에 대한 A의 상대 플럭스는 화학 퍼텐셜 차 μ_A − μ_B = ∂Δf/∂φ의 기울기에 비례합니다(14주차의 '일반화된 구동력'). 연쇄 법칙을 쓰면 유효 확산계수가 f″에 비례함을 알 수 있습니다.",
            "Step 1 (flux). The flux of A relative to B is proportional to the gradient of μ_A − μ_B = ∂Δf/∂φ (Week 14's generalized driving force). The chain rule shows that the effective diffusivity is proportional to f″:"
          )}
        </P>
        <Eq block>J = −[φ(1 − φ)D/(υk_B T)] ∇(∂Δf/∂φ) = −D_eff ∇φ, &nbsp; D_eff = [φ(1 − φ)D/(υk_B T)] ∂²Δf/∂φ²</Eq>
        <P>
          {t(
            "스피노달 안에서는 f″ < 0이므로 D_eff < 0입니다. 물질이 농도가 높은 쪽으로 흐르는 오르막 확산이고, 확산 방정식만 쓰면 짧은 파장일수록 더 빨리 자라 해가 발산합니다.",
            "Inside the spinodal f″ < 0, so D_eff < 0: matter flows uphill toward higher concentration. With the diffusion equation alone, shorter wavelengths grow ever faster and the solution blows up."
          )}
        </P>
        <P>
          {t(
            "2단계(계면 에너지). Cahn과 Hilliard는 조성이 공간적으로 고르지 않으면 계면 에너지가 생긴다는 항을 더했습니다. 자유에너지 범함수 F = ∫[f₀(φ) + K|∇φ|²]dV의 변분 도함수가 새 화학 퍼텐셜입니다.",
            "Step 2 (interface energy). Cahn and Hilliard added an energy cost for non-uniform composition. The variational derivative of the functional F = ∫[f₀(φ) + K|∇φ|²]dV is the new chemical potential:"
          )}
        </P>
        <Eq block>μ = δF/δφ = f₀′(φ) − 2K∇²φ</Eq>
        <P>{t("3단계(연속 방정식). ∂φ/∂t + ∇·J = 0에 J = −M∇μ를 넣으면 Cahn–Hilliard 식이 됩니다(M = φ(1 − φ)D/(k_B T)).", "Step 3 (continuity). Inserting J = −M∇μ into ∂φ/∂t + ∇·J = 0 gives the Cahn–Hilliard equation (M = φ(1 − φ)D/(k_B T)):")}</P>
        <Eq block>∂φ/∂t = M∇²[f₀′(φ) − 2K∇²φ] ≈ M[f₀″ ∇²φ − 2K∇⁴φ] ({t("선형화", "linearized")})</Eq>
        <P>
          {t(
            "4단계(Fourier 해석). φ − φ₀ ∝ e^(iq·x + ωt)를 넣으면 성장률은 다음과 같습니다. 계면 항(−2Kq⁴)이 짧은 파장을 눌러, 특정 파수에서 성장이 가장 빠릅니다.",
            "Step 4 (Fourier analysis). Substituting φ − φ₀ ∝ e^(iq·x + ωt) gives the growth rate below. The interface term (−2Kq⁴) suppresses short wavelengths, so growth peaks at a particular wavenumber:"
          )}
        </P>
        <Eq block>ω(q) = −Mq²[f₀″ + 2Kq²], &nbsp; q_c² = −f₀″/(2K) ({t("임계", "marginal")}), &nbsp; q_m² = −f₀″/(4K) = q_c²/2 ({t("최대 성장", "fastest")}), &nbsp; λ_m = 2π/q_m</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 성장률 스펙트럼", "Simulation: the growth-rate spectrum")}>
        <Grid2>
          <div>
            <Slider label="χ" value={chi} min={1.5} max={4} step={0.01} onChange={setChi} fmt={(v) => v.toFixed(2)} />
            <Slider label="φ₀" value={phi0} min={0.05} max={0.95} step={0.005} onChange={setPhi0} fmt={(v) => v.toFixed(3)} />
            <Readout>
              f₀″(φ₀) = {f2.toFixed(4)}, K = χh²/2 = {K.toFixed(3)} h²<br />
              {unstable ? <>q_c = {qc.toFixed(4)}/h, q_m = {qm.toFixed(4)}/h<br />λ_m = 2π/q_m = {((2 * Math.PI) / qm).toFixed(2)} h, ω_max/M = {wmax.toFixed(4)}</> : t("f₀″ > 0: 모든 파수가 감쇠합니다(스피노달 밖).", "f₀″ > 0: every wavenumber decays (outside the spinodal).")}
            </Readout>
            <Note>
              {t(
                "강의의 상분리 길이 식 q_C = (1/h)[1 − 1/(2χφ₀(1 − φ₀))]^(1/2)은 위의 q_m과 정확히 같습니다(K = χh²/2를 쓰면). 예: χ = 2.5, φ₀ = 0.5에서 q_m = 0.447/h, λ_m = 14.0h.",
                "The lecture's length-scale formula q_C = (1/h)[1 − 1/(2χφ₀(1 − φ₀))]^(1/2) is exactly the q_m above (with K = χh²/2). Example: χ = 2.5, φ₀ = 0.5 gives q_m = 0.447/h and λ_m = 14.0h."
              )}
            </Note>
          </div>
          <Chart xr={[0, qs[qs.length - 1]]} yr={[-Math.max(0.05, wmax) * 1.5, Math.max(0.05, wmax) * 1.3]} xl={t("파수 q (1/h)", "wavenumber q (1/h)")} yl="ω(q) / M"
            series={[{ pts: qs.map((q) => [q, w(q)]), color: C.copper, width: 2.6 }, { pts: qs.filter((q) => q < 0.9 * qs[qs.length - 1]).map((q) => [q, -f2 * q * q]), color: C.inkSoft, width: 1.3, dash: "5 4" }]}
            hlines={[{ y: 0, color: C.inkSoft }]}
            vlines={unstable ? [{ x: qm, color: C.cool }, { x: qc, color: C.warn }] : []}
            dots={unstable ? [{ x: qm, y: wmax }] : []}
            legend={[{ label: "Cahn–Hilliard", color: C.copper }, { label: t("확산식만 (K = 0)", "diffusion only (K = 0)"), color: C.inkSoft, dash: "5 4" }]} legendAt="bl" />
        </Grid2>
      </Panel>

      <Panel title={t("강의 슬라이드와 다른 점", "Where this differs from the lecture slides")}>
        <P>
          {t(
            "'Characteristic length scale' 슬라이드는 g(q) = −q²(F₀″ + 2κq²l²)에서 ∂g/∂q = 0을 풀어 q_m² = −F₀″/(2κl²)라고 적었습니다. 그러나 ∂g/∂q = −2F₀″q − 8κl²q³ = 0에서는 q_m² = −F₀″/(4κl²)가 나옵니다. 슬라이드의 값은 성장률이 0이 되는 임계 파수 q_c입니다. 앞 슬라이드의 q_C = q_th/√2와는 맞으므로, 'λ_m' 슬라이드의 분모 2를 4로 고치는 것을 제안합니다.",
            "The 'characteristic length scale' slide solves ∂g/∂q = 0 for g(q) = −q²(F₀″ + 2κq²l²) and writes q_m² = −F₀″/(2κl²). But ∂g/∂q = −2F₀″q − 8κl²q³ = 0 gives q_m² = −F₀″/(4κl²); the slide's value is the marginal wavenumber q_c where the growth rate vanishes. It agrees with the earlier slide's q_C = q_th/√2, so changing the denominator 2 to 4 on the λ_m slide is suggested."
          )}
        </P>
        <P>
          {t(
            "또 슬라이드에서 κ가 두 뜻으로 쓰입니다. 격자 모델에서는 상호작용 에너지 (Z/2)(2ε_AB − ε_AA − ε_BB)이고, Cahn–Hilliard 식에서는 기울기 에너지 계수입니다. 이 모듈은 후자를 K로 구분했습니다.",
            "The slides also use κ for two things: the interaction energy (Z/2)(2ε_AB − ε_AA − ε_BB) in the lattice model and the gradient-energy coefficient in the Cahn–Hilliard equation. This module writes the latter as K."
          )}
        </P>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: phase-separation simulator ---------------------------------- */
const GRAIN_COLORS = [[196, 118, 64], [58, 110, 165], [62, 125, 79], [160, 64, 36], [124, 92, 170], [214, 170, 60], [32, 48, 79], [120, 180, 190]];

function chordLen(c, N) {
  let n = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const s = c[i * N + j] > 0;
    if (s !== (c[(i === 0 ? N - 1 : i - 1) * N + j] > 0)) n++;
    if (s !== (c[i * N + (j === 0 ? N - 1 : j - 1)] > 0)) n++;
  }
  return n > 0 ? (2 * N * N) / n : NaN;
}

function TabPhaseSim({ t }) {
  const [mode, setMode] = useState("ch");
  const [c0, setC0] = useState(0);
  const [speed, setSpeed] = useState(40);
  const [ngr, setNgr] = useState(6);
  const [running, setRunning] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [hist, setHist] = useState([]);
  const canvasRef = useRef(null);
  const st = useRef({});
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const N = SIMN, gamma = 1;

  const draw = () => {
    const s = st.current, cv = canvasRef.current;
    if (!cv) return;
    if (mode !== "grain") { drawField(cv, s.c, -1.1, 1.1); return; }
    const ctx = cv.getContext("2d"), img = ctx.createImageData(N, N);
    for (let n = 0; n < N * N; n++) {
      let best = 0, bv = -1e9, sum2 = 0;
      for (let g = 0; g < s.eta.length; g++) { const v = s.eta[g][n] * s.eta[g][n]; sum2 += v; if (v > bv) { bv = v; best = g; } }
      const col = GRAIN_COLORS[best % GRAIN_COLORS.length], shade = Math.max(0.25, Math.min(1, sum2));
      img.data[4 * n] = col[0] * shade; img.data[4 * n + 1] = col[1] * shade; img.data[4 * n + 2] = col[2] * shade; img.data[4 * n + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  useEffect(() => {
    const r = lcgRand(2024);
    if (mode === "grain") {
      st.current = { t: 0, eta: Array.from({ length: ngr }, () => Float64Array.from({ length: N * N }, () => 0.02 * (r() - 0.5))) };
    } else {
      st.current = { t: 0, c: Float64Array.from({ length: N * N }, () => c0 + 0.1 * (r() - 0.5)), mu: new Float64Array(N * N), cn: new Float64Array(N * N) };
    }
    setHist([]);
    draw();
  }, [mode, nonce, ngr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return undefined;
    let raf, alive = true, frames = 0;
    const loop = () => {
      if (!alive) return;
      const s = st.current, steps = speedRef.current;
      if (mode === "grain") {
        const dt = 0.1, Q = s.eta.length;
        const nx = s.nx || (s.nx = Array.from({ length: Q }, () => new Float64Array(N * N)));
        for (let k = 0; k < Math.max(1, Math.round(steps / 8)); k++) {
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const n = i * N + j;
            let s2 = 0;
            for (let g = 0; g < Q; g++) s2 += s.eta[g][n] * s.eta[g][n];
            for (let g = 0; g < Q; g++) {
              const e = s.eta[g][n], others = s2 - e * e;
              const dfde = -e + e * e * e + 3 * e * others;
              nx[g][n] = e + dt * (lap5(s.eta[g], i, j, N) - dfde);
            }
          }
          for (let g = 0; g < Q; g++) { const tmp = s.eta[g]; s.eta[g] = nx[g]; nx[g] = tmp; }
          s.t += dt;
        }
      } else {
        const dt = 0.01, { mu } = s;
        for (let k = 0; k < steps; k++) {
          const c = s.c, cn = s.cn;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const n = i * N + j, v = c[n]; mu[n] = v * v * v - v - gamma * lap5(c, i, j, N); }
          if (mode === "ch") { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const n = i * N + j; cn[n] = c[n] + dt * lap5(mu, i, j, N); } }
          else { for (let n = 0; n < N * N; n++) cn[n] = c[n] - dt * mu[n]; }
          s.c = cn; s.cn = c; s.t += dt;
        }
      }
      draw();
      if (++frames % 10 === 0 && mode !== "grain") {
        let m = 0; for (let n = 0; n < N * N; n++) m += s.c[n];
        const L = chordLen(s.c, N);
        setHist((h) => h.concat([[s.t, m / (N * N), L]]).slice(-400));
      } else if (frames % 10 === 0) {
        setHist((h) => h.concat([[s.t, 0, 0]]).slice(-400));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [running, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = hist[hist.length - 1];
  const aLin = 1 - 3 * c0 * c0, qm = aLin > 0 ? Math.sqrt(aLin / (2 * gamma)) : NaN;
  const tmax = Math.max(10, last ? last[0] : 10);
  return (
    <div>
      <Panel title={t("보존 변수와 비보존 변수", "Conserved vs. non-conserved order parameters")}>
        <P>
          {t(
            "무차원 이중 우물 f(c) = 1/4 − c²/2 + c⁴/4(두 상은 c = ±1)와 μ = c³ − c − γ∇²c를 씁니다. 조성처럼 총량이 보존되는 변수는 플럭스의 발산으로만 바뀌므로 Cahn–Hilliard 식을 따릅니다. 결정 방향이나 규칙도처럼 총량이 보존되지 않는 변수는 국소적으로 바로 이완하므로 Allen–Cahn 식을 따릅니다.",
            "Use the dimensionless double well f(c) = 1/4 − c²/2 + c⁴/4 (phases at c = ±1) and μ = c³ − c − γ∇²c. A conserved variable such as composition changes only through the divergence of a flux, so it obeys Cahn–Hilliard. A non-conserved variable such as crystal orientation or long-range order relaxes locally, so it obeys Allen–Cahn."
          )}
        </P>
        <Eq block>Cahn–Hilliard: ∂c/∂t = ∇²μ &nbsp;&nbsp;|&nbsp;&nbsp; Allen–Cahn: ∂c/∂t = −μ = ∇²c − ∂f/∂c ({t("강의 꼴, γ = 1", "lecture form, γ = 1")})</Eq>
        <P>
          {t(
            "다결정 결정립 성장에서는 방향마다 하나씩 Q개의 비보존 변수 c_i를 둡니다. 강의의 다성분 자유에너지 f = (1/4) − Σ(c_i²/2 − c_i⁴/4) + (3/4)ΣΣ_(j≠i) c_i²c_j²는 한 지점에서 한 결정립만 살아남도록 합니다(c_i = ±1이 모두 최소점이므로, 화면은 |c_i|가 가장 큰 변수의 색으로 칠합니다). 이때 ∂f/∂c_i = −c_i + c_i³ + 3c_iΣ_(j≠i)c_j²입니다.",
            "Polycrystalline grain growth uses Q non-conserved variables c_i, one per orientation. The lecture's multicomponent free energy f = (1/4) − Σ(c_i²/2 − c_i⁴/4) + (3/4)ΣΣ_(j≠i) c_i²c_j² lets only one grain survive at each point (c_i = ±1 are both minima, so the map colours each point by the field with the largest |c_i|), with ∂f/∂c_i = −c_i + c_i³ + 3c_iΣ_(j≠i)c_j²."
          )}
        </P>
      </Panel>

      <Panel title={t("시뮬레이터", "Simulator")}>
        <div style={{ marginBottom: 10 }}>
          <Seg value={mode} onChange={(m) => { setMode(m); setRunning(true); }}
            options={[{ v: "ch", label: t("Cahn–Hilliard (보존)", "Cahn–Hilliard (conserved)") }, { v: "ac", label: t("Allen–Cahn (비보존)", "Allen–Cahn (non-conserved)") }, { v: "grain", label: t("결정립 성장 (Q개 변수)", "Grain growth (Q fields)") }]} />
        </div>
        <Grid2>
          <div>
            {mode !== "grain" ? (
              <Slider label={t("초기 평균 조성 c₀ (적용: 초기화)", "initial mean c₀ (applies on reset)")} value={c0} min={-0.7} max={0.7} step={0.01} onChange={setC0} fmt={(v) => v.toFixed(2)} />
            ) : (
              <Slider label={t("결정 방향 수 Q", "number of orientations Q")} value={ngr} min={2} max={8} step={1} onChange={setNgr} />
            )}
            <Slider label={t("화면당 계산 단계", "steps per frame")} value={speed} min={5} max={120} step={5} onChange={setSpeed} />
            <div>
              <button style={btnStyle(running)} onClick={() => setRunning((r) => !r)}>{running ? t("일시정지", "Pause") : t("실행", "Run")}</button>
              <button style={btnStyle(false)} onClick={() => setNonce((x) => x + 1)}>{t("초기화", "Reset")}</button>
            </div>
            <Readout>
              t = {last ? last[0].toFixed(1) : "0.0"}<br />
              {mode !== "grain" && last ? <>{t("평균", "mean")} c = {last[1] >= 0 ? "+" : ""}{last[1].toFixed(5)}<br />{t("평균 현 길이", "mean chord length")} = {isFinite(last[2]) ? last[2].toFixed(2) : "—"}<br /></> : null}
              {mode === "ch" ? (aLin > 0 ? <>{t("선형 이론", "linear theory")}: λ_m = 2π/q_m = {((2 * Math.PI) / qm).toFixed(2)}, ω_max = {((aLin * aLin) / 4).toFixed(4)}</> : t("|c₀| > 1/√3: 스피노달 밖이라 작은 요동이 자라지 않습니다.", "|c₀| > 1/√3: outside the spinodal, small fluctuations do not grow.")) : null}
            </Readout>
            {mode !== "grain" && (
              <>
                <Chart H={200} xr={[0, tmax]} yr={[-1, 1]} xl="t" yl={t("평균 c", "mean c")} series={[{ pts: hist.map((h) => [h[0], h[1]]), color: C.copper, width: 2.2 }]} hlines={[{ y: c0, color: C.inkSoft }]} />
                <Chart H={200} xr={[0, tmax]} yr={[0, Math.max(20, ...hist.map((h) => (isFinite(h[2]) ? h[2] : 0))) * 1.1]} xl="t" yl={t("현 길이", "chord length")} series={[{ pts: hist.filter((h) => isFinite(h[2])).map((h) => [h[0], h[2]]), color: C.cool, width: 2.2 }]} />
              </>
            )}
          </div>
          <SimCanvas canvasRef={canvasRef} />
        </Grid2>
        <Note>
          {t(
            "격자 128 × 128, γ = 1, Δt = 0.01(결정립 성장은 Δt = 0.1), 주기 경계, 명시적 Euler 법입니다. Cahn–Hilliard에서는 평균 c가 처음 값 그대로이고 무늬가 점점 굵어집니다(조대화). Allen–Cahn에서는 평균이 한쪽으로 흘러 결국 한 상이 이깁니다. c₀ = −0.3이면 CH에서도 연결 구조 대신 방울이 생깁니다(강의의 40:60 혼합물).",
            "Grid 128 × 128, γ = 1, Δt = 0.01 (grain growth Δt = 0.1), periodic, explicit Euler. In Cahn–Hilliard the mean of c stays at its initial value while the pattern coarsens. In Allen–Cahn the mean drifts and one phase eventually wins. With c₀ = −0.3 even CH forms droplets rather than a connected network (the lecture's 40:60 mixture)."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: experiments & applications ---------------------------------- */
function TabApplications({ t }) {
  return (
    <div>
      <Panel title={t("실험으로 본 Turing 무늬", "Turing patterns in experiments")}>
        <Table
          head={[t("계", "System"), t("무엇을 보였나", "What was shown"), t("출처", "Source")]}
          rows={[
            [t("CIMA 반응 (겔 반응기)", "CIMA reaction (gel reactor)"), t("화학 반응에서 처음 관찰된 정지 Turing 무늬", "first stationary Turing pattern observed in a chemical reaction"), "Castets, Dulos, Boissonade & De Kepper, Phys. Rev. Lett. 64, 2953 (1990)"],
            [t("CIMA 반응 (2D)", "CIMA reaction (2D)"), t("점에서 줄로 바뀌는 2차원 무늬", "2D patterns changing from spots to stripes"), "Ouyang & Swinney, Nature 352, 610 (1991)"],
            [t("CDIMA 모델", "CDIMA model"), t("녹말이 활성자를 붙잡아 유효 확산 비를 키운다는 두 변수 모델", "two-variable model in which starch binds the activator and raises the effective diffusivity ratio"), "Lengyel & Epstein, Science 251, 650 (1991)"],
            [t("열대어 Pomacanthus", "angelfish Pomacanthus"), t("자라면서 줄무늬가 갈라지고 이동하는 모습이 반응-확산 예측과 일치", "stripes branch and move during growth as reaction–diffusion predicts"), "Kondo & Asai, Nature 376, 765 (1995)"],
            [t("교잡 물고기", "hybrid fish"), t("점 무늬와 바탕 무늬 부모의 교잡이 미로 무늬를 만든다", "crossing spotted and plain parents yields labyrinth patterns"), "Miyazawa, Okamoto & Kondo, Nat. Commun. 1, 66 (2010)"],
            [t("Gray–Scott 모델", "Gray–Scott model"), t("(F, k) 평면의 무늬 분류(점 복제 등)", "classification of patterns in the (F, k) plane, incl. self-replicating spots"), "Pearson, Science 261, 189 (1993)"],
          ]}
        />
        <Note>
          {t(
            "강의의 CDIMA 슬라이드는 Lengyel–Epstein(1991)을 '첫 실험 관찰'로 소개합니다. 그러나 첫 실험 관찰은 Castets 등(1990)의 CIMA 반응이고, Lengyel–Epstein(1991)은 그 무늬를 설명하는 모델 논문입니다. 슬라이드에 인용된 논문 제목도 'Modeling of Turing structures…'입니다. 두 논문을 함께 적는 것을 제안합니다.",
            "The lecture's CDIMA slide presents Lengyel–Epstein (1991) as the 'first experimental observation'. The first experimental observation was the CIMA reaction of Castets et al. (1990); Lengyel–Epstein (1991) is the modelling paper explaining those patterns, as its title 'Modeling of Turing structures…' says. Citing both is suggested."
          )}
        </Note>
      </Panel>

      <Panel title={t("상분리의 공학적 의미", "Engineering relevance of phase separation")}>
        <Table
          head={[t("분야", "Field"), t("현상", "Phenomenon"), t("Cahn–Hilliard로 보는 관점", "Cahn–Hilliard view")]}
          rows={[
            [t("유기 태양전지", "organic photovoltaics"), t("P3HT:PCBM 블렌드를 열처리하면 상분리 도메인이 굵어집니다.", "Annealing a P3HT:PCBM blend coarsens the phase-separated domains.")
              , t("엑시톤 확산 길이(~10 nm)와 λ_m을 맞추도록 χ와 열처리 시간을 고릅니다.", "Choose χ and annealing time so that λ_m matches the exciton diffusion length (~10 nm).")],
            [t("다공성 막·유리", "porous membranes & glass"), t("상분리 후 한 상을 녹여 연결된 기공을 만듭니다(Vycor 유리, 분리막).", "Separate, then dissolve one phase to leave connected pores (Vycor glass, membranes).")
              , t("스피노달 분해의 연결 구조와 λ_m이 기공 크기를 정합니다.", "The connected spinodal structure and λ_m set the pore size.")],
            [t("반도체·합금", "semiconductors & alloys"), t("InGaN 등 혼정의 조성 요동, 합금의 석출", "composition fluctuations in InGaN and similar alloys; precipitation in metals"),
              t("성장 온도가 스피노달 안에 들어가면 조성 불균일이 저절로 자랍니다.", "If the growth temperature lies inside the spinodal, composition non-uniformity grows by itself.")],
            [t("생체막", "biomembranes"), t("지질-콜레스테롤 혼합 소포에서 두 액체상이 공존합니다.", "Two liquid phases coexist in lipid–cholesterol vesicles."),
              "Veatch & Keller, Biophys. J. 85, 3074 (2003)"],
            [t("촉매", "catalysis"), t("합금 나노입자의 상분리와 표면 편석", "phase separation and surface segregation in alloy nanoparticles"),
              t("활성점의 조성과 분포가 열처리 중에 바뀝니다.", "The composition and distribution of active sites change during heat treatment.")],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t("P1. 선형계 d/dt[x, y]ᵀ = A[x, y]ᵀ, A = [[−2, 3], [−1, 1]]의 평형점을 분류하라.",
        "P1. Classify the fixed point of d/dt[x, y]ᵀ = A[x, y]ᵀ with A = [[−2, 3], [−1, 1]]."),
      s: t("T = −2 + 1 = −1, Δ = (−2)(1) − (3)(−1) = 1입니다. T² − 4Δ = −3 < 0이므로 고유값은 복소수 λ = −0.5 ± 0.866i입니다. T < 0, Δ > 0이므로 안정 나선입니다. 교란은 진동하면서 e^(−0.5t)로 줄어듭니다.",
        "T = −2 + 1 = −1 and Δ = (−2)(1) − (3)(−1) = 1. T² − 4Δ = −3 < 0, so the eigenvalues are complex, λ = −0.5 ± 0.866i. With T < 0 and Δ > 0 the point is a stable spiral: disturbances oscillate while shrinking as e^(−0.5t)."),
    },
    {
      q: t("P2. 반응 야코비안 R̂ = [[1, −1], [3, −2]], γ = 1인 두 성분 계가 있다. Turing 무늬가 생기는 최소 확산계수 비 d_c는? d = 10일 때 k*와 L_c는?",
        "P2. A two-species system has the reaction Jacobian R̂ = [[1, −1], [3, −2]] and γ = 1. What is the smallest diffusivity ratio d_c for Turing patterns? Find k* and L_c for d = 10."),
      s: t("확산 없이: T = −1 < 0, Δ = −2 + 3 = 1 > 0이므로 안정합니다. 조건 1: d·1 − 2 > 0 → d > 2. 조건 2: 1 < (d − 2)²/(4d) → d² − 8d + 4 > 0 → d > 4 + 2√3 = 7.46. 따라서 d_c = 7.46입니다. d = 10이면 k*² = (10 − 2)/(2 × 10) = 0.4, k* = 0.632, L_c = 2π/k* = 9.93입니다.",
        "Without diffusion: T = −1 < 0 and Δ = −2 + 3 = 1 > 0, so stable. Condition 1: d·1 − 2 > 0 → d > 2. Condition 2: 1 < (d − 2)²/(4d) → d² − 8d + 4 > 0 → d > 4 + 2√3 = 7.46, so d_c = 7.46. For d = 10, k*² = (10 − 2)/(2 × 10) = 0.4, k* = 0.632 and L_c = 2π/k* = 9.93."),
    },
    {
      q: t("P3. Gray–Scott 모델에서 k = 0.06일 때, (U, V) = (1, 0) 외의 균일 정상상태가 존재하는 F의 범위는?",
        "P3. For the Gray–Scott model with k = 0.06, for what range of F do uniform steady states other than (U, V) = (1, 0) exist?"),
      s: t("V ≠ 0인 정상상태에서 UV² = (F + k)V이므로 U = (F + k)/V입니다. 이를 F(1 − U) = UV²에 넣으면 (F + k)V² − FV + F(F + k) = 0이 되고, 실근 조건(판별식 ≥ 0)은 F ≥ 4(F + k)²입니다. 4(F + 0.06)² = F → 4F² − 0.52F + 0.0144 = 0 → F = (0.52 ± 0.20)/8. 따라서 0.040 ≤ F ≤ 0.090입니다.",
        "For V ≠ 0, UV² = (F + k)V gives U = (F + k)/V. Substituting into F(1 − U) = UV² gives (F + k)V² − FV + F(F + k) = 0, whose real roots (discriminant ≥ 0) require F ≥ 4(F + k)². 4(F + 0.06)² = F → 4F² − 0.52F + 0.0144 = 0 → F = (0.52 ± 0.20)/8, so 0.040 ≤ F ≤ 0.090."),
    },
    {
      q: t("P4. 격자 기체 모델에서 T_c = 400 K인 혼합물을 320 K로 급랭했다. 바이노달·스피노달 조성은? φ₀ = 0.2인 혼합물은 어떻게 상분리하는가?",
        "P4. A lattice-gas mixture with T_c = 400 K is quenched to 320 K. Find the binodal and spinodal compositions. How does a mixture with φ₀ = 0.2 separate?"),
      s: t("χ = κ/(k_B T) = 2T_c/T = 2.5입니다. 스피노달: 2χφ(1 − φ) = 1 → φ = 0.276, 0.724. 바이노달: 2.5(1 − 2φ) + ln[φ/(1 − φ)] = 0 → φ = 0.145, 0.855. φ₀ = 0.2는 0.145와 0.276 사이(준안정)이므로 핵생성·성장으로 상분리합니다.",
        "χ = κ/(k_B T) = 2T_c/T = 2.5. Spinodal: 2χφ(1 − φ) = 1 → φ = 0.276, 0.724. Binodal: 2.5(1 − 2φ) + ln[φ/(1 − φ)] = 0 → φ = 0.145, 0.855. φ₀ = 0.2 lies between 0.145 and 0.276 (metastable), so it separates by nucleation and growth."),
    },
    {
      q: t("P5. χ = 3인 고분자 블렌드(격자 간격 h = 0.5 nm, K = χh²/2)에서 φ₀ = 0.5와 φ₀ = 0.3일 때 스피노달 분해 초기 도메인 크기 λ_m은?",
        "P5. For a polymer blend with χ = 3 (lattice spacing h = 0.5 nm, K = χh²/2), find the initial spinodal domain size λ_m for φ₀ = 0.5 and φ₀ = 0.3."),
      s: t("q_m = (1/h)[1 − 1/(2χφ₀(1 − φ₀))]^(1/2). φ₀ = 0.5: q_m = (1/h)(1 − 1/1.5)^(1/2) = 0.577/h, λ_m = 2π/q_m = 10.9h = 5.4 nm. φ₀ = 0.3: q_m = (1/h)(1 − 1/1.26)^(1/2) = 0.454/h, λ_m = 13.8h = 6.9 nm. 스피노달 경계에 가까울수록 f₀″이 0에 가까워져 λ_m이 커집니다.",
        "q_m = (1/h)[1 − 1/(2χφ₀(1 − φ₀))]^(1/2). φ₀ = 0.5: q_m = (1/h)(1 − 1/1.5)^(1/2) = 0.577/h and λ_m = 2π/q_m = 10.9h = 5.4 nm. φ₀ = 0.3: q_m = (1/h)(1 − 1/1.26)^(1/2) = 0.454/h and λ_m = 13.8h = 6.9 nm. Closer to the spinodal f₀″ approaches 0 and λ_m grows."),
    },
    {
      q: t("P6. 무차원 Cahn–Hilliard 식 ∂c/∂t = ∇²(c³ − c − γ∇²c), γ = 1에서 c₀ = −0.3일 때 가장 빠른 모드의 파장과 성장률은? 그 진폭이 100배가 되는 데 걸리는 시간은?",
        "P6. For the dimensionless Cahn–Hilliard equation ∂c/∂t = ∇²(c³ − c − γ∇²c) with γ = 1 and c₀ = −0.3, find the wavelength and growth rate of the fastest mode. How long until its amplitude grows 100-fold?"),
      s: t("선형화하면 ω(q) = q²(1 − 3c₀²) − γq⁴이고, 1 − 3c₀² = 0.73입니다. q_m² = 0.73/2 = 0.365 → q_m = 0.604, λ_m = 10.4. ω_max = 0.73²/4 = 0.133. 진폭 100배: t = ln 100/0.133 = 34.6. 이후에는 비선형 항이 성장을 멈추고 조대화가 시작됩니다.",
        "Linearizing gives ω(q) = q²(1 − 3c₀²) − γq⁴ with 1 − 3c₀² = 0.73. q_m² = 0.73/2 = 0.365 → q_m = 0.604 and λ_m = 10.4. ω_max = 0.73²/4 = 0.133. A 100-fold growth takes t = ln 100/0.133 = 34.6, after which nonlinear terms stop the growth and coarsening begins."),
    },
    {
      q: t("P7. 상분리 시뮬레이터에서 c₀ = 0으로 Cahn–Hilliard와 Allen–Cahn을 돌리면 평균 c가 어떻게 달라지는가? 그 이유를 식으로 설명하라.",
        "P7. Run Cahn–Hilliard and Allen–Cahn with c₀ = 0 in the phase-separation simulator. How does the mean of c behave in each? Explain from the equations."),
      s: t("CH에서는 ∂c/∂t = ∇²μ를 전 영역에 대해 적분하면 주기 경계에서 ∫∇²μ dV = 0이므로 평균 c가 변하지 않습니다(코드 결과: t = 200까지 −0.000015로 일정). AC에서는 ∂c/∂t = −μ의 적분이 0일 이유가 없어 평균이 흐릅니다(코드 결과: t = 200에서 −0.52). 조성은 보존 변수라 CH, 결정 방향·규칙도는 비보존 변수라 AC를 씁니다.",
        "In CH, integrating ∂c/∂t = ∇²μ over the periodic domain gives ∫∇²μ dV = 0, so the mean of c is fixed (code: −0.000015 up to t = 200). In AC the integral of ∂c/∂t = −μ need not vanish, so the mean drifts (code: −0.52 at t = 200). Composition is conserved, hence CH; orientation or long-range order is not, hence AC."),
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
    topic1: "week15_topic1_turing_stability",
    topic2: "week15_topic2_gray_scott",
    topic3: "week15_topic3_lattice_gas_spinodal",
    topic4: "week15_topic4_cahn_hilliard_allen_cahn",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK15_CODES[topic][lang];
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
              {WEEK15_CODES[tp].title}
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
            "Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 두 시뮬레이션(주제 2, 4)은 같은 32비트 선형 합동 난수와 같은 연산 순서를 써서 결과 무늬까지 같습니다. 확인한 값: 주제 1은 Lengyel–Epstein 예(a = 12, b = 0.3, σ = 50)에서 k* = 0.925, k_m = 0.861, 임계 비 d_c = 37.9를 줍니다. 주제 2는 F = 0.06, k = 0.062의 균일 상태 V = 0.2675, 0.2243을 줍니다. 주제 3은 χ = 2.5의 바이노달(0.145, 0.855)과 스피노달(0.276, 0.724)을 주고, 강의의 q_C 식이 q_m과 같음을 확인합니다. 주제 4는 Cahn–Hilliard의 평균 c가 t = 200까지 일정함을 확인합니다. MATLAB과 Julia는 같은 계산을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "The Python and C++ versions were run and their outputs compared; for all four topics they agree digit for digit. The two simulations (topics 2 and 4) use the same 32-bit linear congruential generator and the same operation order, so even the final patterns match. Checks: topic 1 gives k* = 0.925, k_m = 0.861 and the critical ratio d_c = 37.9 for the Lengyel–Epstein example (a = 12, b = 0.3, σ = 50). Topic 2 gives the uniform states V = 0.2675 and 0.2243 at F = 0.06, k = 0.062. Topic 3 gives the binodal (0.145, 0.855) and spinodal (0.276, 0.724) at χ = 2.5 and confirms that the lecture's q_C formula equals q_m. Topic 4 confirms that the Cahn–Hilliard mean of c stays constant up to t = 200. The MATLAB and Julia versions port the same calculations but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week15App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("선형 안정성", "Linear stability"), comp: <TabStability t={t} /> },
    { label: t("Turing 불안정성", "Turing instability"), comp: <TabTuring t={t} /> },
    { label: t("반응-확산 시뮬레이터", "RD simulator"), comp: <TabRDSim t={t} /> },
    { label: t("격자 기체 모델", "Lattice gas"), comp: <TabLatticeGas t={t} /> },
    { label: t("Cahn–Hilliard 이론", "Cahn–Hilliard theory"), comp: <TabCHTheory t={t} /> },
    { label: t("상분리 시뮬레이터", "Phase-separation simulator"), comp: <TabPhaseSim t={t} /> },
    { label: t("실험과 응용", "Experiments & uses"), comp: <TabApplications t={t} /> },
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
                Heat & Mass Transfer · Week 15
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("불안정성과 상분리에 의한 무늬 형성", "Pattern Formation by Instability & Phase Separation")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("선형 안정성(T–Δ 평면) · Turing 불안정성 · Gray–Scott·Lengyel–Epstein·Gierer–Meinhardt 모델 · 격자 기체 모델 · 스피노달 분해 · Cahn–Hilliard와 Allen–Cahn 식",
                   "Linear stability (T–Δ plane) · Turing instability · Gray–Scott, Lengyel–Epstein & Gierer–Meinhardt models · lattice-gas model · spinodal decomposition · Cahn–Hilliard & Allen–Cahn equations")}
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
