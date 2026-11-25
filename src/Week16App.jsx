// Week16App.jsx — Heat & Mass Transfer, Week 16: Final-exam review (Weeks 8–14)
// Key equations and assumptions per week, interactive calculators, problem-type tables,
// formula sheet, worked practice problems with step-by-step solutions, self-check quiz.
// Content of the summary and practice tabs is generated from the KR/EN final-review lecture notes.

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import WEEK16_CODES from "./Week16Codes";
import WEEK16_DATA from "./Week16Data";

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

/* ---------------------------------- markup & math rendering ---------------------------------- */
// Markup used in the review notes: _{sub}, ^{sup}, **bold**
function Mk({ text }) {
  if (text == null) return null;
  const toks = String(text).split(/(_\{[^}]*\}|\^\{[^}]*\}|\*\*)/);
  const out = [];
  let bold = false;
  toks.forEach((tk, i) => {
    if (tk === "**") { bold = !bold; return; }
    if (!tk) return;
    let el;
    if (tk.startsWith("_{")) el = <sub key={i}>{tk.slice(2, -1)}</sub>;
    else if (tk.startsWith("^{")) el = <sup key={i}>{tk.slice(2, -1)}</sup>;
    else el = <span key={i}>{tk}</span>;
    out.push(bold ? <b key={"b" + i}>{el}</b> : el);
  });
  return <>{out}</>;
}

function TeX({ src, label, star }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(src, { displayMode: true, throwOnError: false, strict: "ignore" });
    } catch (e) {
      return src;
    }
  }, [src]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
      <div style={{ flex: 1, overflowX: "auto", border: star ? `2px solid ${C.ink}` : "none", borderRadius: 6, padding: star ? "0 8px" : 0, background: star ? C.copperPale : "transparent" }}
        dangerouslySetInnerHTML={{ __html: html }} />
      {label ? <span style={{ fontSize: 12.5, color: C.inkSoft, minWidth: 48, textAlign: "right" }}>{label}</span> : null}
    </div>
  );
}

function MkTable({ head, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.2 }}>
        <thead>
          <tr>{head.map((h, i) => <th key={i} style={{ textAlign: "left", borderBottom: `2px solid ${C.ink}`, padding: "6px 8px", color: C.ink }}><Mk text={h} /></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={{ borderBottom: `1px solid ${C.line}`, padding: "6px 8px", verticalAlign: "top" }}><Mk text={c} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Items({ items, t }) {
  return (
    <>
      {items.map((it, i) => {
        if (it.k === "p") return <p key={i} style={{ fontSize: 14, lineHeight: 1.75, margin: "6px 0" }}><Mk text={it.t} /></p>;
        if (it.k === "h") return <div key={i} style={{ fontWeight: 700, color: C.cool, margin: "10px 0 2px" }}><Mk text={it.t} /></div>;
        if (it.k === "note") return <Note key={i}><Mk text={it.t} /></Note>;
        if (it.k === "eq") return <TeX key={i} src={it.t} label={it.n} star={it.s} />;
        if (it.k === "tbl") return <MkTable key={i} head={it.h} rows={it.r} />;
        if (it.k === "b" || it.k === "a")
          return (
            <div key={i}>
              {it.k === "a" && <div style={{ fontWeight: 700, color: C.cool, margin: "8px 0 2px" }}>{t("가정", "Assumptions")}</div>}
              <ul style={{ fontSize: 14, lineHeight: 1.75, paddingLeft: 20, margin: "4px 0" }}>
                {it.t.map((x, j) => <li key={j}><Mk text={x} /></li>)}
              </ul>
            </div>
          );
        return null;
      })}
    </>
  );
}

const useSlides = (lang) => WEEK16_DATA[lang === "kr" ? "kr" : "en"];
const isExample = (s) => /^(예제|Example)/.test(s.sub);

function SlidePanel({ s, t }) {
  return (
    <Panel title={s.sub}>
      <Items items={s.items} t={t} />
    </Panel>
  );
}

/* A worked example rendered as a problem card: statement visible, solution on demand */
function ExampleCard({ s, t, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const statement = s.items.filter((it) => it.k === "p");
  const solution = s.items.filter((it) => it.k !== "p");
  return (
    <Panel title={s.sub}>
      <Items items={statement} t={t} />
      <button onClick={() => setOpen((o) => !o)} style={btnStyle(open)}>
        {open ? t("풀이 접기", "Hide solution") : t("풀이 보기", "Show solution")}
      </button>
      {open && (
        <div style={{ marginTop: 10, background: C.coolPale, borderRadius: 8, padding: "6px 14px" }}>
          <Items items={solution} t={t} />
        </div>
      )}
    </Panel>
  );
}

/* index ranges of the review-note slides */
const RANGES = {
  guide: [0, 1], w8: [2, 7], w9: [8, 12], w10: [13, 18], w11: [19, 23], w12: [24, 27], w13: [28, 32], w14: [33, 37],
  strategy: [38, 40], sheet: [41, 43], selfQ: [44, 44], selfA: [45, 45], refs: [46, 46],
};
const pick = (slides, key) => slides.slice(RANGES[key][0], RANGES[key][1] + 1);

/* ---------------------------------- Tab: overview ---------------------------------- */
function TabOverview({ t, lang }) {
  const S = useSlides(lang);
  const weeks = [
    ["8", t("열교환기 제어(FOPDT, PID), 흑체·회색체 복사", "heat-exchanger control (FOPDT, PID), blackbody and gray-body radiation")],
    ["9", t("플럭스와 기준 속도, 확산계수 추정, 지배방정식과 경계조건", "fluxes and reference frames, estimating D, governing equation and BCs")],
    ["10", t("Stefan 관, 유사 정상상태, 확산–반응 직렬, Hatta 수", "Stefan tube, pseudo-steady state, diffusion–reaction in series, Hatta number")],
    ["11", t("반무한 erfc 해, 고유함수 전개, 반응이 있는 구", "semi-infinite erfc, eigenfunction expansions, reacting sphere")],
    ["12", t("Blasius, Sh–Re–Sc, 유사성, 침투 이론, 습구 온도", "Blasius, Sh–Re–Sc, analogies, penetration theory, wet bulb")],
    ["13", t("상관식 선택, 두 막 저항, 충전탑 HTU × NTU", "choosing correlations, two-film resistances, packed tower HTU × NTU")],
    ["14", t("결합 플럭스, Stefan–Maxwell, 열역학 인자, 촉매의 Da·φ·η·Ω", "coupled fluxes, Stefan–Maxwell, thermodynamic factor, catalyst Da·φ·η·Ω")],
  ];
  return (
    <div>
      <Panel title={t("16주차: 8–14주차 기말 리뷰", "Week 16: final review of Weeks 8–14")}>
        <P>
          {t(
            "이 모듈은 기말고사 범위(8–14주차)를 한곳에 모았습니다. 주차별 탭에는 꼭 외울 식과 가정, 그리고 바로 숫자를 넣어 볼 수 있는 계산기가 있습니다. '연습문제' 탭에는 22개의 시험형 예제가 있고, 풀이는 버튼을 눌러야 보입니다. 먼저 스스로 풀어 보세요.",
            "This module gathers the final-exam scope (Weeks 8–14) in one place. Each week's tab lists the equations and assumptions to know plus a calculator for trying numbers. The Practice tab holds 22 exam-style problems whose solutions open only on request, so try them first."
          )}
        </P>
        <Table head={[t("주차", "Week"), t("핵심 내용", "Core content")]} rows={weeks} />
      </Panel>
      {pick(S, "guide").map((s, i) => <SlidePanel key={i} s={s} t={t} />)}
      <Panel title={t("추천 공부 순서", "Suggested study order")}>
        <ol style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 22, margin: 0 }}>
          <li>{t("주차 탭에서 핵심 식을 읽고, 계산기로 매개변수를 바꿔 보며 '무엇이 무엇에 비례하는지' 감을 잡습니다.", "Read the key equations in each week's tab and move the calculator sliders to feel what scales with what.")}</li>
          <li>{t("'연습문제' 탭에서 풀이를 열기 전에 직접 풀어 봅니다.", "Solve the Practice problems before opening the solutions.")}</li>
          <li>{t("'문제 유형' 탭으로 문제 문장에서 쓸 식을 고르는 연습을 합니다.", "Use the Problem types tab to practise picking the equation from the wording.")}</li>
          <li>{t("시험 직전에는 '공식 시트'와 '자가 점검'으로 마무리합니다.", "Finish with the Formula sheet and Self-check right before the exam.")}</li>
        </ol>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab: practice (all worked examples) ---------------------------------- */
function TabPracticeAll({ t, lang }) {
  const S = useSlides(lang);
  const [wk, setWk] = useState("all");
  const groups = ["w8", "w9", "w10", "w11", "w12", "w13", "w14"];
  const shown = (wk === "all" ? groups : [wk]).flatMap((g) => pick(S, g).filter(isExample));
  return (
    <div>
      <Panel title={t("시험형 연습문제 22개", "22 exam-style problems")}>
        <P>{t("주차를 골라 볼 수 있습니다. 모든 숫자는 코드로 다시 계산해 확인했습니다.", "Filter by week. Every number was recomputed in code.")}</P>
        <Seg value={wk} onChange={setWk}
          options={[{ v: "all", label: t("전체", "All") }].concat(groups.map((g) => ({ v: g, label: t(`${g.slice(1)}주차`, `Wk ${g.slice(1)}`) })))} />
      </Panel>
      {shown.map((s) => <ExampleCard key={s.sub} s={s} t={t} />)}
    </div>
  );
}

/* ---------------------------------- Tab: problem types & mistakes ---------------------------------- */
function TabStrategy({ t, lang }) {
  const S = useSlides(lang);
  return <div>{pick(S, "strategy").map((s, i) => <SlidePanel key={i} s={s} t={t} />)}</div>;
}

/* ---------------------------------- Tab: formula sheet ---------------------------------- */
function TabSheet({ t, lang }) {
  const S = useSlides(lang);
  return (
    <div>
      {pick(S, "sheet").map((s, i) => <SlidePanel key={i} s={s} t={t} />)}
      {pick(S, "refs").map((s, i) => <SlidePanel key={"r" + i} s={s} t={t} />)}
    </div>
  );
}

/* ---------------------------------- Tab: self-check ---------------------------------- */
function TabSelfCheck({ t, lang }) {
  const S = useSlides(lang);
  const qs = pick(S, "selfQ")[0].items.find((it) => it.k === "b").t;
  const as = pick(S, "selfA")[0].items.find((it) => it.k === "b").t;
  const [open, setOpen] = useState({});
  return (
    <div>
      <Panel title={t("자가 점검: 1분 문제 7개", "Self-check: seven one-minute questions")}>
        <P>{t("계산기 없이 어림으로 답해 보세요. 이 어림이 맞으면 큰 실수를 피할 수 있습니다.", "Answer by estimation, without a calculator; getting these right prevents big mistakes.")}</P>
        {qs.map((q, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${C.line}`, padding: "10px 0" }}>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}><Mk text={q} /></div>
            <button onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} style={btnStyle(!!open[i])}>
              {open[i] ? t("답 접기", "Hide answer") : t("답 보기", "Show answer")}
            </button>
            {open[i] && <div style={{ marginTop: 6, fontSize: 14, color: C.copperDeep }}><Mk text={as[i]} /></div>}
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ---------------------------------- week tabs: key slides + calculator ---------------------------------- */
function WeekTab({ t, lang, wk, calc }) {
  const S = useSlides(lang);
  const sl = pick(S, wk);
  const keys = sl.filter((s) => !isExample(s));
  const ex = sl.filter(isExample);
  return (
    <div>
      {keys.map((s, i) => <SlidePanel key={i} s={s} t={t} />)}
      {calc}
      <Panel title={t(`이 주차의 연습문제 (${ex.length}개)`, `Practice problems for this week (${ex.length})`)}>
        <P>{t("풀이는 버튼을 눌러야 보입니다. 먼저 직접 풀어 보세요.", "Solutions open on request; try first.")}</P>
      </Panel>
      {ex.map((s) => <ExampleCard key={s.sub} s={s} t={t} />)}
    </div>
  );
}

const SIG = 5.670e-8;
const fx = (v, d = 3) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? sci(v, d) : v.toFixed(d));

/* Week 8 calculator: stirred tank, FOPDT/ITAE and radiation shields */
function Calc8({ t }) {
  const [V, setV] = useState(0.5);
  const [m, setM] = useState(0.25);
  const [t1, setT1] = useState(20);
  const [t2, setT2] = useState(50);
  const [T1, setT1K] = useState(800);
  const [T2, setT2K] = useState(400);
  const [es, setEs] = useState(0.05);
  const [n, setN] = useState(1);
  const tau = (1000 * V) / m, K = 1 / (m * 4184);
  const tp = 1.5 * (t2 - t1), th = (3 * t1 - t2) / 2, r = th / tp;
  const ok = th > 0;
  const eps = [0.6].concat(Array(n).fill(es)).concat([0.9]);
  const R = eps.slice(0, -1).map((e, i) => 1 / e + 1 / eps[i + 1] - 1);
  const q = (SIG * (T1 ** 4 - T2 ** 4)) / R.reduce((a, b) => a + b, 0);
  const q0 = (SIG * (T1 ** 4 - T2 ** 4)) / (1 / 0.6 + 1 / 0.9 - 1);
  const ts = lin(0, 4 * tau, 120);
  return (
    <Panel title={t("계산기: 교반조, PI 동조, 복사 차폐판", "Calculator: stirred tank, PI tuning, radiation shields")}>
      <Grid2>
        <div>
          <Slider label={t("조 부피 V", "tank volume V")} value={V} min={0.05} max={2} step={0.05} onChange={setV} unit=" m³" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("유량 ṁ", "flow ṁ")} value={m} min={0.05} max={1} step={0.01} onChange={setM} unit=" kg/s" fmt={(v) => v.toFixed(2)} />
          <Readout>τ = {tau.toFixed(0)} s, K = {sci(K, 3)} K/W → {t("10 kW 계단의 최종 상승", "final rise for a 10 kW step")} = {(K * 1e4).toFixed(2)} K</Readout>
          <Slider label="t₁ (28.3%)" value={t1} min={1} max={100} step={1} onChange={setT1} unit=" s" />
          <Slider label="t₂ (63.2%)" value={t2} min={2} max={200} step={1} onChange={setT2} unit=" s" />
          <Readout>
            {ok ? <>τ_p = {tp.toFixed(1)} s, θ_p = {th.toFixed(1)} s, θ/τ = {r.toFixed(3)}<br />ITAE PI: K_cK_p = {(0.859 * r ** -0.977).toFixed(2)}, τ_I = {((tp / 0.674) * r ** 0.68).toFixed(1)} s</>
              : t("θ_p ≤ 0: t₂ < 3t₁이어야 합니다.", "θ_p ≤ 0: need t₂ < 3t₁.")}
          </Readout>
        </div>
        <Chart xr={[0, 4 * tau]} yr={[0, 1.05]} xl="t (s)" yl="T′/(KΔQ)"
          series={[{ pts: ts.map((x) => [x, 1 - Math.exp(-x / tau)]), color: C.copper, width: 2.6 }]}
          vlines={[{ x: tau, color: C.cool }, { x: 3 * tau, color: C.warn }]}
          labels={[{ x: tau, y: 0.3, text: "τ: 63.2%", dx: 4, color: C.cool }, { x: 3 * tau, y: 0.5, text: "3τ: 95%", dx: 4, color: C.warn }]} />
      </Grid2>
      <Grid2>
        <div>
          <Slider label="T₁ (ε₁ = 0.6)" value={T1} min={300} max={1500} step={10} onChange={setT1K} unit=" K" />
          <Slider label="T₂ (ε₂ = 0.9)" value={T2} min={250} max={1000} step={10} onChange={setT2K} unit=" K" />
          <Slider label={t("차폐판 방사율 ε_s", "shield emissivity ε_s")} value={es} min={0.02} max={1} step={0.01} onChange={setEs} fmt={(v) => v.toFixed(2)} />
          <Slider label={t("차폐판 수 N", "number of shields N")} value={n} min={0} max={5} step={1} onChange={setN} />
        </div>
        <Readout>
          q″ ({t("차폐 없음", "no shield")}) = {q0.toFixed(0)} W/m²<br />
          q″ (N = {n}) = {q.toFixed(1)} W/m² → {t("감소율", "reduction")} {(q0 / q).toFixed(1)}×
        </Readout>
      </Grid2>
    </Panel>
  );
}

/* Week 9 calculator: Knudsen and effective diffusivity */
function Calc9({ t }) {
  const [dnm, setD] = useState(20);
  const [T, setT] = useState(400);
  const [M, setM] = useState(2.016);
  const [DAB, setDAB] = useState(1.25);
  const [alpha, setAlpha] = useState(0);
  const [epsP, setEps] = useState(0.4);
  const DK = 4850 * dnm * 1e-7 * Math.sqrt(T / M);
  const DAe = 1 / ((1 - alpha * 0.5) / DAB + 1 / DK);
  return (
    <Panel title={t("계산기: Knudsen 확산과 유효 확산계수", "Calculator: Knudsen and effective diffusivity")}>
      <Grid2>
        <div>
          <Slider label={t("세공 지름", "pore diameter")} value={dnm} min={2} max={2000} step={1} onChange={setD} unit=" nm" />
          <Slider label="T" value={T} min={250} max={1200} step={10} onChange={setT} unit=" K" />
          <Slider label={t("분자량 M_A", "molar mass M_A")} value={M} min={2} max={200} step={0.5} onChange={setM} unit=" g/mol" fmt={(v) => v.toFixed(1)} />
          <Slider label="D_AB" value={DAB} min={0.01} max={2} step={0.01} onChange={setDAB} unit=" cm²/s" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("α = 1 + N_B/N_A (y_A = 0.5에서)", "α = 1 + N_B/N_A (at y_A = 0.5)")} value={alpha} min={-1} max={1} step={0.1} onChange={setAlpha} fmt={(v) => v.toFixed(1)} />
          <Slider label={t("기공률 ε", "porosity ε")} value={epsP} min={0.1} max={0.8} step={0.05} onChange={setEps} fmt={(v) => v.toFixed(2)} />
        </div>
        <Readout>
          D_K = 4850 d (T/M)^½ = {fx(DK, 4)} cm²/s<br />
          D_Ae = {fx(DAe, 4)} cm²/s, D′_Ae = ε²D_Ae = {fx(epsP * epsP * DAe, 4)} cm²/s<br />
          {DK < 0.2 * DAB ? t("→ Knudsen 지배 (압력 무관)", "→ Knudsen-controlled (pressure-independent)") : DK > 5 * DAB ? t("→ 분자 확산 지배", "→ molecular diffusion controls") : t("→ 전이 영역", "→ transition regime")}
        </Readout>
      </Grid2>
    </Panel>
  );
}

/* Week 10 calculator: log-mean correction and Deal–Grove time */
function Calc10({ t }) {
  const [y1, setY1] = useState(0.0773);
  const [x, setX] = useState(0.1);
  const ys = lin(0.001, 0.9, 150);
  const kB = 8.617e-5;
  const temps = lin(900, 1200, 31);
  const tDG = (Tc) => {
    const Tk = Tc + 273.15, B = 772 * Math.exp(-1.23 / (kB * Tk)), BA = 6.23e6 * Math.exp(-2.0 / (kB * Tk));
    return (x * x + (B / BA) * x) / B;
  };
  return (
    <Panel title={t("계산기: 벌크 흐름 보정과 Deal–Grove 산화 시간", "Calculator: bulk-flow correction and Deal–Grove oxidation time")}>
      <Grid2>
        <div>
          <Slider label="y_A1" value={y1} min={0.001} max={0.9} step={0.001} onChange={setY1} fmt={(v) => v.toFixed(3)} />
          <Readout>{t("정체 B 보정", "stagnant-B correction")} ln[1/(1 − y_A1)]/y_A1 = {(Math.log(1 / (1 - y1)) / y1).toFixed(4)}<br />
            {t("Fick 근사의 오차", "error of the Fick approximation")} = {(100 * (1 - y1 / Math.log(1 / (1 - y1)))).toFixed(1)}%</Readout>
          <Chart W={420} H={240} xr={[0, 0.9]} yr={[1, 3]} xl="y_A1" yl={t("보정 인자", "correction")}
            series={[{ pts: ys.map((y) => [y, Math.log(1 / (1 - y)) / y]), color: C.copper, width: 2.4 }]} dots={[{ x: y1, y: Math.log(1 / (1 - y1)) / y1 }]} />
        </div>
        <div>
          <Slider label={t("목표 산화막 두께 x", "target oxide thickness x")} value={x} min={0.01} max={1} step={0.01} onChange={setX} unit=" μm" fmt={(v) => v.toFixed(2)} />
          <Readout>{t("건식 O₂, (111) Si, τ = 0", "dry O₂, (111) Si, τ = 0")}: 1000 °C → {tDG(1000).toFixed(2)} h, 1100 °C → {tDG(1100).toFixed(2)} h</Readout>
          <Chart W={420} H={240} xr={[900, 1200]} yr={[0.01, 1000]} ylog xl="T (°C)" yl={t("시간 (h)", "time (h)")}
            series={[{ pts: temps.map((T) => [T, tDG(T)]), color: C.cool, width: 2.4 }]} />
        </div>
      </Grid2>
    </Panel>
  );
}

/* Week 11 calculator: junction depth and sphere release */
function erfcInv(y) {
  let lo = 0, hi = 6;
  for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (1 - erf(m) > y) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}
function sphereLeft(tau) {
  let s = 0;
  for (let n = 1; n < 300; n++) s += Math.exp(-n * n * Math.PI * Math.PI * tau) / (n * n);
  return (6 / (Math.PI * Math.PI)) * s;
}
function Calc11({ t }) {
  const [lcs, setLcs] = useState(Math.log10(2.5e20));
  const [lcb, setLcb] = useState(17);
  const [lD, setLD] = useState(Math.log10(6.5e-13));
  const [tm, setTm] = useState(30);
  const [Rmm, setR] = useState(0.5);
  const [lDb, setLDb] = useState(-11);
  const cs = 10 ** lcs, cb = 10 ** lcb, D = 10 ** lD, tt = tm * 60;
  const phi = cb < cs ? erfcInv(cb / cs) : NaN;
  const z = 2 * phi * Math.sqrt(D * tt) * 1e4;
  const Db = 10 ** lDb, R = Rmm * 1e-3, scale = (R * R) / Db / 60;
  const taus = lin(0.0005, 0.4, 160);
  return (
    <Panel title={t("계산기: 도핑 접합 깊이와 구형 비드의 방출", "Calculator: junction depth and release from a sphere")}>
      <Grid2>
        <div>
          <Slider label="log₁₀ c_s (cm⁻³)" value={lcs} min={18} max={21} step={0.05} onChange={setLcs} fmt={() => sci(cs, 2)} />
          <Slider label="log₁₀ c_B (cm⁻³)" value={lcb} min={14} max={19} step={0.05} onChange={setLcb} fmt={() => sci(cb, 2)} />
          <Slider label="log₁₀ D (cm²/s)" value={lD} min={-15} max={-11} step={0.05} onChange={setLD} fmt={() => sci(D, 2)} />
          <Slider label={t("확산 시간", "diffusion time")} value={tm} min={1} max={240} step={1} onChange={setTm} unit=" min" />
          <Readout>{isFinite(phi) ? <>erfc(φ) = c_B/c_s → φ = {phi.toFixed(3)}<br />z_j = 2φ√(Dt) = {z.toFixed(3)} μm, √(Dt) = {(Math.sqrt(D * tt) * 1e4).toFixed(3)} μm</> : t("c_B < c_s이어야 합니다.", "Need c_B < c_s.")}</Readout>
        </div>
        <div>
          <Slider label={t("비드 반지름 R", "bead radius R")} value={Rmm} min={0.05} max={2} step={0.05} onChange={setR} unit=" mm" fmt={(v) => v.toFixed(2)} />
          <Slider label="log₁₀ D (m²/s)" value={lDb} min={-13} max={-9} step={0.1} onChange={setLDb} fmt={() => sci(Db, 2)} />
          <Readout>R²/D = {(scale).toFixed(1)} min → t₅₀ = {(0.0305 * scale).toFixed(1)} min, t₉₀ = {(0.183 * scale).toFixed(1)} min</Readout>
          <Chart W={420} H={240} xr={[0, 0.4 * scale]} yr={[0, 1]} xl={t("시간 (분)", "time (min)")} yl={t("방출 분율", "fraction released")}
            series={[{ pts: taus.map((x) => [x * scale, 1 - sphereLeft(x)]), color: C.copper, width: 2.4 }]}
            hlines={[{ y: 0.5, color: C.inkSoft }, { y: 0.9, color: C.inkSoft }]} />
        </div>
      </Grid2>
    </Panel>
  );
}

/* Week 12 calculator: flat plate */
function Calc12({ t }) {
  const [U, setU] = useState(2);
  const [L, setL] = useState(0.3);
  const [lnu, setLnu] = useState(Math.log10(1.55e-5));
  const [lD, setLD] = useState(Math.log10(2.6e-5));
  const nu = 10 ** lnu, D = 10 ** lD;
  const Re = (U * L) / nu, Sc = nu / D, lam = Re < 2e5;
  const Sh = lam ? 0.664 * Math.sqrt(Re) * Math.cbrt(Sc) : 0.0365 * Re ** 0.8 * Math.cbrt(Sc);
  const kc = (Sh * D) / L;
  const xs = lin(0.005, L, 120);
  const local = (x) => { const Rx = (U * x) / nu; return Rx < 2e5 ? (0.332 * Math.sqrt(Rx) * Math.cbrt(Sc) * D) / x : (0.0292 * Rx ** 0.8 * Math.cbrt(Sc) * D) / x; };
  return (
    <Panel title={t("계산기: 평판 위의 대류 물질전달", "Calculator: convective mass transfer over a flat plate")}>
      <Grid2>
        <div>
          <Slider label={t("유속 U", "velocity U")} value={U} min={0.05} max={30} step={0.05} onChange={setU} unit=" m/s" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("판 길이 L", "plate length L")} value={L} min={0.05} max={3} step={0.05} onChange={setL} unit=" m" fmt={(v) => v.toFixed(2)} />
          <Slider label="log₁₀ ν (m²/s)" value={lnu} min={-7} max={-4} step={0.02} onChange={setLnu} fmt={() => sci(nu, 3)} />
          <Slider label="log₁₀ D (m²/s)" value={lD} min={-10} max={-4} step={0.02} onChange={setLD} fmt={() => sci(D, 3)} />
          <Readout>Re_L = {sci(Re, 3)} ({lam ? t("층류", "laminar") : t("난류", "turbulent")}), Sc = {Sc.toFixed(3)}<br />
            Sh_L = {Sh.toFixed(1)}, k̄_c = {sci(kc, 3)} m/s<br />δ/δ_c ≈ Sc^(1/3) = {Math.cbrt(Sc).toFixed(2)}</Readout>
          <Note>{t("기본값은 예제 12-1(25 °C 공기, 수증기)입니다. 물 속 용질(ν = 10⁻⁶, D = 10⁻⁹)로 바꾸면 Sc ≈ 1000, 농도 경계층이 10배 얇아집니다.", "Defaults are Example 12-1 (water vapour in air at 25 °C). Switch to a solute in water (ν = 10⁻⁶, D = 10⁻⁹): Sc ≈ 1000 and the concentration layer is ten times thinner.")}</Note>
        </div>
        <Chart xr={[0, L]} yr={[0, Math.min(local(xs[0]), kc * 6)]} xl="x (m)" yl={t("국소 k_c (m/s)", "local k_c (m/s)")}
          series={[{ pts: xs.map((x) => [x, local(x)]), color: C.copper, width: 2.4 }]} hlines={[{ y: kc, color: C.cool }]}
          labels={[{ x: L * 0.55, y: kc, text: t("평균 k̄_c", "mean k̄_c"), dy: -6, color: C.cool }]} />
      </Grid2>
    </Panel>
  );
}

/* Week 13 calculator: sphere correlation check and absorber */
function Calc13({ t }) {
  const [U, setU] = useState(1);
  const [dmm, setDmm] = useState(10);
  const [yb, setYb] = useState(0.02);
  const [rec, setRec] = useState(0.9);
  const [m, setM] = useState(1);
  const [f, setF] = useState(1.5);
  const [HTU, setHTU] = useState(0.6);
  const nu = 1.55e-5, D = 6.1e-6, d = dmm * 1e-3;
  const Re = (U * d) / nu, Sc = nu / D, inR = Re > 2 && Re < 800 && Sc > 0.6 && Sc < 2.7;
  const Sh = 2 + 0.552 * Math.sqrt(Re) * Math.cbrt(Sc);
  const ya = yb * (1 - rec), LVmin = (yb - ya) / (yb / m), A = (f * LVmin) / m;
  const NTU = Math.abs(A - 1) < 1e-9 ? (yb - ya) / ya : Math.log((1 - 1 / A) * (yb / ya) + 1 / A) / (1 - 1 / A);
  return (
    <Panel title={t("계산기: 구의 상관식 범위 점검과 흡수탑 높이", "Calculator: sphere-correlation range check and absorber height")}>
      <Grid2>
        <div>
          <Slider label={t("공기 유속 U (25 °C)", "air velocity U (25 °C)")} value={U} min={0.01} max={5} step={0.01} onChange={setU} unit=" m/s" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("구 지름 d (나프탈렌)", "sphere diameter d (naphthalene)")} value={dmm} min={0.1} max={50} step={0.1} onChange={setDmm} unit=" mm" fmt={(v) => v.toFixed(1)} />
          <Readout>Re = {Re.toFixed(1)}, Sc = {Sc.toFixed(2)} → {inR ? t("Frössling 범위 안", "inside Frössling range") : t("범위 밖! 다른 상관식 검토", "outside the range: consider another correlation")}<br />
            Sh = 2 + 0.552Re^½Sc^⅓ = {Sh.toFixed(2)}, k_c = {sci((Sh * D) / d, 3)} m/s</Readout>
        </div>
        <div>
          <Slider label="y_b" value={yb} min={0.005} max={0.1} step={0.001} onChange={setYb} fmt={(v) => v.toFixed(3)} />
          <Slider label={t("회수율", "recovery")} value={rec} min={0.5} max={0.995} step={0.005} onChange={setRec} fmt={(v) => v.toFixed(3)} />
          <Slider label="m" value={m} min={0.2} max={5} step={0.1} onChange={setM} fmt={(v) => v.toFixed(1)} />
          <Slider label={t("L/V ÷ 최소값", "L/V ÷ minimum")} value={f} min={1.05} max={3} step={0.05} onChange={setF} fmt={(v) => v.toFixed(2)} />
          <Slider label="HTU_OG" value={HTU} min={0.2} max={2} step={0.05} onChange={setHTU} unit=" m" fmt={(v) => v.toFixed(2)} />
          <Readout>(L/V)_min = {LVmin.toFixed(3)}, A = {A.toFixed(3)}, NTU_OG = {NTU.toFixed(3)}, Z = {(HTU * NTU).toFixed(2)} m</Readout>
        </div>
      </Grid2>
    </Panel>
  );
}

/* Week 14 calculator: catalyst diagnosis */
function Calc14({ t }) {
  const [U, setU] = useState(0.1);
  const [dpmm, setDp] = useState(10);
  const [lD, setLD] = useState(-10);
  const [lkr, setLkr] = useState(-5);
  const [Rmm, setR] = useState(3);
  const [lDe, setLDe] = useState(-9);
  const [k, setK] = useState(0.5);
  const nu = 5e-7, D = 10 ** lD, dp = dpmm * 1e-3, kr = 10 ** lkr, De = 10 ** lDe;
  const Re = (U * dp) / nu, Sc = nu / D, Sh = 2 + 0.6 * Math.sqrt(Re) * Math.cbrt(Sc), kc = (Sh * D) / dp;
  const Da = kr / kc, phi = Rmm * 1e-3 * Math.sqrt(k / De);
  const eta = phi < 1e-6 ? 1 : (3 / (phi * phi)) * (phi / Math.tanh(phi) - 1);
  const phis = logspace(-1, 2.5, 120);
  return (
    <Panel title={t("계산기: 촉매 반응기 진단 (Da, φ, η)", "Calculator: catalytic reactor diagnosis (Da, φ, η)")}>
      <Grid2>
        <div>
          <Slider label="U" value={U} min={0.01} max={1} step={0.01} onChange={setU} unit=" m/s" fmt={(v) => v.toFixed(2)} />
          <Slider label="d_p" value={dpmm} min={1} max={30} step={0.5} onChange={setDp} unit=" mm" fmt={(v) => v.toFixed(1)} />
          <Slider label="log₁₀ D (m²/s)" value={lD} min={-11} max={-5} step={0.05} onChange={setLD} fmt={() => sci(D, 2)} />
          <Slider label="log₁₀ k_r (m/s)" value={lkr} min={-8} max={-2} step={0.05} onChange={setLkr} fmt={() => sci(kr, 2)} />
          <Readout>Re = {Re.toFixed(0)}, Sc = {sci(Sc, 3)}, Sh = {Sh.toFixed(1)}, k_c = {sci(kc, 3)} m/s<br />
            Da = k_r/k_c = {sci(Da, 3)} → {Da > 10 ? t("외부 막 율속", "external-film control") : Da < 0.1 ? t("표면 반응 율속", "surface-reaction control") : t("혼합 영역", "mixed regime")}<br />
            c_As/c_Ab = {(1 / (1 + Da)).toFixed(4)}</Readout>
          <Note>{t("강의(14주차) 꼴 Sh = 2 + 0.6Re^½Sc^⅓을 씁니다. 13주차 Frössling 식(0.552)의 범위는 2 < Re < 800, 0.6 < Sc < 2.7입니다.", "Uses the Week 14 lecture form Sh = 2 + 0.6Re^½Sc^⅓; the Week 13 Frössling form (0.552) is stated for 2 < Re < 800, 0.6 < Sc < 2.7.")}</Note>
        </div>
        <div>
          <Slider label={t("펠릿 반지름 R", "pellet radius R")} value={Rmm} min={0.05} max={10} step={0.05} onChange={setR} unit=" mm" fmt={(v) => v.toFixed(2)} />
          <Slider label="log₁₀ D_e (m²/s)" value={lDe} min={-12} max={-6} step={0.05} onChange={setLDe} fmt={() => sci(De, 2)} />
          <Slider label="ρ_cS_ak₁" value={k} min={0.01} max={10} step={0.01} onChange={setK} unit=" s⁻¹" fmt={(v) => v.toFixed(2)} />
          <Readout>φ₁ = {phi.toFixed(2)}, η = {eta.toFixed(4)}{phi > 3 ? `, 3/φ = ${(3 / phi).toFixed(4)}` : ""}</Readout>
          <Chart W={420} H={240} xr={[0.1, 300]} yr={[0.008, 1.2]} xlog ylog xl="φ₁" yl="η"
            series={[{ pts: phis.map((p) => [p, (3 / (p * p)) * (p / Math.tanh(p) - 1)]), color: C.copper, width: 2.4 }]}
            dots={[{ x: Math.max(0.1, phi), y: eta }]} />
        </div>
      </Grid2>
    </Panel>
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
    topic1: "week16_topic1_control_radiation",
    topic2: "week16_topic2_diffusion",
    topic3: "week16_topic3_convection_interphase",
    topic4: "week16_topic4_reaction_engineering",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK16_CODES[topic][lang];
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
              {WEEK16_CODES[tp].title}
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
            "네 코드는 연습문제의 숫자를 다시 계산하는 리뷰용 스크립트입니다. Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 확인한 값: 주제 1은 교반조 τ = 2000 s, ITAE PI K_cK_p = 7.35, 차폐판 1장일 때 534 W/m²를 줍니다. 주제 2는 Stefan 관 5.14×10⁻⁴ mol/m²·s, Deal–Grove 0.775 h, 접합 깊이 1.71 μm를 줍니다. 주제 3은 흡수탑 NTU = 4.64와 Z = 2.79 m를 줍니다. 주제 4는 k_c = 4.61×10⁻⁶ m/s, η = 0.0441, 탄소 연소 1.66 s를 줍니다. MATLAB과 Julia는 같은 계산을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "These four scripts recompute the numbers of the practice problems. The Python and C++ versions were run and compared; for all four topics they agree digit for digit. Checks: topic 1 gives the tank τ = 2000 s, ITAE PI K_cK_p = 7.35 and 534 W/m² with one shield. Topic 2 gives the Stefan-tube flux 5.14×10⁻⁴ mol/m²·s, Deal–Grove 0.775 h and a 1.71 μm junction. Topic 3 gives the absorber NTU = 4.64 and Z = 2.79 m. Topic 4 gives k_c = 4.61×10⁻⁶ m/s, η = 0.0441 and a 1.66 s carbon burnout. The MATLAB and Julia versions port the same calculations but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week16App({ lang: langProp, language, onBack, onLangChange }) {
  const initial = langProp === "en" || language === "en" ? "en" : "kr";
  const [lang, setLangState] = useState(initial);
  const setLang = (l) => {
    setLangState(l);
    if (onLangChange) onLangChange(l === "kr" ? "ko" : "en");
  };
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} lang={lang} /> },
    { label: t("8주차", "Week 8"), comp: <WeekTab t={t} lang={lang} wk="w8" calc={<Calc8 t={t} />} /> },
    { label: t("9주차", "Week 9"), comp: <WeekTab t={t} lang={lang} wk="w9" calc={<Calc9 t={t} />} /> },
    { label: t("10주차", "Week 10"), comp: <WeekTab t={t} lang={lang} wk="w10" calc={<Calc10 t={t} />} /> },
    { label: t("11주차", "Week 11"), comp: <WeekTab t={t} lang={lang} wk="w11" calc={<Calc11 t={t} />} /> },
    { label: t("12주차", "Week 12"), comp: <WeekTab t={t} lang={lang} wk="w12" calc={<Calc12 t={t} />} /> },
    { label: t("13주차", "Week 13"), comp: <WeekTab t={t} lang={lang} wk="w13" calc={<Calc13 t={t} />} /> },
    { label: t("14주차", "Week 14"), comp: <WeekTab t={t} lang={lang} wk="w14" calc={<Calc14 t={t} />} /> },
    { label: t("문제 유형", "Problem types"), comp: <TabStrategy t={t} lang={lang} /> },
    { label: t("연습문제", "Practice"), comp: <TabPracticeAll t={t} lang={lang} /> },
    { label: t("공식 시트", "Formula sheet"), comp: <TabSheet t={t} lang={lang} /> },
    { label: t("자가 점검", "Self-check"), comp: <TabSelfCheck t={t} lang={lang} /> },
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
                Heat & Mass Transfer · Week 16
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("기말 리뷰: 8–14주차", "Final-Exam Review: Weeks 8–14")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("주차별 핵심 식·가정 · 계산기 · 문제 유형 판별표 · 공식 시트 · 시험형 연습문제 22개 · 자가 점검",
                   "Key equations and assumptions by week · calculators · problem-type tables · formula sheet · 22 exam-style problems · self-check")}
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
