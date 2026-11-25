// Week14App.jsx — Heat & Mass Transfer, Week 14: Multicomponent energy & mass transfer, and mass transfer in reaction engineering
// Part 1 — Coupled fluxes (Onsager, Soret, Dufour, thermoelectric), multicomponent energy conservation,
// simultaneous heat & mass transfer (evaporating droplet), Stefan–Maxwell equations, non-ideal diffusion.
// Part 2 — Heterogeneous reaction steps, external film, packed-bed reactors, Thiele modulus and effectiveness factor.
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK14_CODES from "./Week14Codes";

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

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 여러 성분, 여러 플럭스, 그리고 반응", "This week: many species, many fluxes, and reaction")}>
        <P>
          {t(
            "지금까지는 두 성분(A, B)이 한 가지 구동력(농도 기울기 또는 온도 기울기)에 따라 움직이는 경우를 주로 다뤘습니다. 실제 공정에서는 성분이 셋 이상이고, 온도 기울기가 물질을, 농도 기울기가 열을 움직이기도 합니다. 또 상변화와 반응이 있으면 열과 물질을 함께 풀어야 합니다.",
            "So far we mostly treated two species (A, B) moved by one driving force (a concentration or a temperature gradient). Real processes have three or more species, temperature gradients can move matter and concentration gradients can move heat, and with phase change or reaction heat and mass must be solved together."
          )}
        </P>
        <P>
          {t(
            "후반부에서는 촉매 반응을 물질전달의 눈으로 봅니다. 반응물이 촉매 표면까지 오는 과정(외부 확산)과 기공 안으로 들어가는 과정(내부 확산)이 반응 속도를 제한할 수 있습니다.",
            "The second half looks at catalytic reaction through the lens of mass transfer. Getting the reactant to the catalyst surface (external diffusion) and into its pores (internal diffusion) can limit the reaction rate."
          )}
        </P>
      </Panel>

      <Panel title={t("14주차 로드맵", "Week 14 roadmap")}>
        <Table
          head={[t("탭", "Tab"), t("핵심 질문", "Key question"), t("핵심 결과", "Key result")]}
          rows={[
            [t("결합 플럭스", "Coupled fluxes"), t("온도 기울기가 물질을 움직일 수 있나?", "Can a temperature gradient move matter?"), "f⁽ⁱ⁾ = Σ L_ij X⁽ʲ⁾, L_ij = L_ji"],
            [t("Soret 분리", "Soret separation"), t("가열한 두 판 사이에서 조성이 얼마나 갈리나?", "How far does composition split between a hot and a cold plate?"), "Δx_A ≈ −x_A x_B α_A ln(T_L/T_0)"],
            [t("다성분 에너지", "Multicomponent energy"), t("성분마다 엔탈피가 다르면 에너지 수지는?", "What is the energy balance when each species carries its own enthalpy?"), "e = Σ N_i H_i − k∇T"],
            [t("물방울 증발", "Droplet evaporation"), t("물방울 표면의 온도와 수명은?", "What are the surface temperature and lifetime of a droplet?"), t("d² 법칙", "d² law")],
            [t("Stefan–Maxwell", "Stefan–Maxwell"), t("셋 이상의 성분은 어떻게 확산하나?", "How do three or more species diffuse?"), "∇x_i = Σ (x_i N_j − x_j N_i)/(C D_ij)"],
            [t("비이상 확산", "Non-ideal diffusion"), t("농도가 높은 쪽으로 확산할 수 있나?", "Can species diffuse uphill?"), "D* = (1 + dlnγ/dlnx) D"],
            [t("외부 물질전달", "External transfer"), t("반응과 확산 중 무엇이 느린가?", "Which is slower, reaction or transport?"), "r″ = k_r k_c c_Ab/(k_r + k_c)"],
            [t("충전층 반응기", "Packed-bed reactor"), t("확산 율속 반응기는 얼마나 길어야 하나?", "How long must a transport-limited bed be?"), "c_A/c_A0 = exp(−k_c a_c z/U)"],
            [t("내부 확산", "Internal diffusion"), t("촉매 안쪽은 얼마나 일하나?", "How much of the pellet interior works?"), "η = (3/φ²)(φ coth φ − 1)"],
          ]}
        />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Coupled fluxes ---------------------------------- */
function TabCoupled({ t }) {
  return (
    <div>
      <Panel title={t("힘과 플럭스: Onsager의 상반 관계", "Forces and fluxes: Onsager's reciprocal relations")}>
        <P>
          {t(
            "비평형 열역학은 평형에서 조금 벗어난 계에서 각 플럭스가 모든 구동력의 선형 결합이라고 가정합니다. 독립 플럭스의 수는 독립 구동력의 수와 같고, n성분 계에서는 에너지와 물질 플럭스를 합쳐 n개입니다.",
            "Nonequilibrium thermodynamics postulates that, near equilibrium, every flux is a linear combination of all driving forces. The number of independent fluxes equals the number of independent forces, which is n for the energy and mass fluxes of an n-species system."
          )}
        </P>
        <Eq block>f⁽ⁱ⁾ = Σⱼ L_ij X⁽ʲ⁾, &nbsp;&nbsp; L_ij = L_ji &nbsp;({t("Onsager 상반 관계", "Onsager reciprocity")})</Eq>
        <P>
          {t(
            "대각 성분은 우리가 아는 법칙입니다(Fourier, Fick). 비대각 성분이 '교차 효과'이고, L_ij = L_ji 때문에 한쪽 효과가 있으면 반대쪽 효과도 반드시 있습니다.",
            "The diagonal terms are the familiar laws (Fourier, Fick). The off-diagonal terms are the cross effects, and because L_ij = L_ji, if one cross effect exists its partner must exist too."
          )}
        </P>
        <Table
          head={[t("플럭스", "Flux"), t("열적 구동력 (∇T)", "thermal force (∇T)"), t("분자적 구동력 (∇x)", "molecular force (∇x)")]}
          rows={[
            [t("에너지", "energy"), t("Fourier 법칙 (k)", "Fourier's law (k)"), t("Dufour 효과 (D_A^(T))", "Dufour effect (D_A^(T))")],
            [t("물질", "molecules"), t("Soret 효과 (D_A^(T))", "Soret effect (D_A^(T))"), t("Fick 법칙 (D_AB)", "Fick's law (D_AB)")],
          ]}
        />
        <Note>
          {t(
            "같은 계수 D_A^(T)가 표의 두 비대각 칸에 모두 나오는 것이 상반 관계의 구체적인 모습입니다.",
            "The same coefficient D_A^(T) appearing in both off-diagonal cells is reciprocity made concrete."
          )}
        </Note>
      </Panel>

      <Panel title={t("Soret 효과와 Dufour 효과", "The Soret and Dufour effects")}>
        <P>
          {t(
            "Soret 효과(열확산): 농도 기울기가 없어도 온도 기울기가 물질 플럭스를 만듭니다. 이성분 혼합물에서는 질량 평균 속도 기준으로 다음과 같습니다.",
            "Soret effect (thermal diffusion): a temperature gradient drives a mass flux even without a concentration gradient. For a binary mixture, relative to the mass-average velocity:"
          )}
        </P>
        <Eq block>j_A⁽ᵀ⁾ = −D_A⁽ᵀ⁾ ∇ln T, &nbsp;&nbsp; D_A⁽ᵀ⁾ = −D_B⁽ᵀ⁾</Eq>
        <P>
          {t(
            "보통 무거운 성분(M_A > M_B)은 D_A⁽ᵀ⁾ > 0이어서 차가운 쪽으로 모입니다. Dufour 효과는 그 반대로, 농도 기울기(성분의 상대 속도)가 에너지 플럭스를 만듭니다.",
            "Usually the heavier species (M_A > M_B) has D_A⁽ᵀ⁾ > 0 and gathers on the cold side. The Dufour effect is the reverse: a concentration gradient (the relative velocity of the species) drives an energy flux:"
          )}
        </P>
        <Eq block>q⁽ˣ⁾ = (RT D_A⁽ᵀ⁾ / D_AB)(x_A/M_B + x_B/M_A)(v_A − v_B)</Eq>
        <Note>
          {t(
            "두 효과는 보통 작습니다. 그래도 Soret 효과는 동위원소 분리에 쓰이고, 다공성 매질의 자연대류처럼 온도와 농도 기울기가 함께 클 때는 무시할 수 없습니다(강의의 Du, Sr 수).",
            "Both effects are usually small. Still, the Soret effect is used for isotope separation, and it cannot be ignored when temperature and concentration gradients are both large, as in natural convection in porous media (the lecture's Du and Sr numbers)."
          )}
        </Note>
      </Panel>

      <Panel title={t("열전 효과: 전하와 열의 결합", "Thermoelectric effects: coupling charge and heat")}>
        <P>
          {t(
            "같은 구조가 전하와 열 사이에도 있습니다. 서로 다른 두 금속(또는 반도체)의 접합부에 온도 차를 주면 전압이 생기고(Seebeck 효과), 반대로 전류를 흘리면 접합부에서 열이 흡수되거나 방출됩니다(Peltier 효과).",
            "The same structure links charge and heat. A temperature difference across junctions of two different metals (or semiconductors) produces a voltage (Seebeck effect); conversely, a current absorbs or releases heat at a junction (Peltier effect)."
          )}
        </P>
        <Table
          head={[t("효과", "Effect"), t("원인 → 결과", "cause → result"), t("응용", "application")]}
          rows={[
            ["Seebeck", t("온도 차 → 전압", "temperature difference → voltage"), t("열전대, 열전 발전(폐열 회수)", "thermocouples, thermoelectric generators (waste-heat recovery)")],
            ["Peltier", t("전류 → 접합부 열 이동", "current → heat moved at a junction"), t("열전 냉각기, 레이저 다이오드 온도 제어", "Peltier coolers, laser-diode temperature control")],
          ]}
        />
        <Note>
          {t(
            "Seebeck 계수 S와 Peltier 계수 Π는 Kelvin 관계 Π = S T로 묶입니다. 이것도 Onsager 상반 관계의 한 예입니다.",
            "The Seebeck coefficient S and the Peltier coefficient Π are tied by the Kelvin relation Π = S T, another instance of Onsager reciprocity."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Soret separation ---------------------------------- */
function TabSoret({ t }) {
  const [alpha, setAlpha] = useState(0.3);
  const [ratio, setRatio] = useState(1.5);
  const [xA, setXA] = useState(0.5);
  const [n, setN] = useState(10);
  const shift = -xA * (1 - xA) * alpha * Math.log(ratio);
  const q = Math.pow(ratio, alpha);
  const ys = lin(0, 1, 60);
  // linear temperature profile between plates, exact composition from dx/dlnT = -alpha x(1-x) with mean xA
  const prof = ys.map((y) => {
    const T = 1 + (ratio - 1) * y;
    return [y, -alpha * xA * (1 - xA) * (Math.log(T) - Math.log(Math.sqrt(ratio)))];
  });
  return (
    <div>
      <Panel title={t("유도: 두 판 사이의 열확산", "Derivation: thermal diffusion between two plates")}>
        <P>
          {t(
            "이성분 기체가 온도 T_0(아래, y = 0)와 T_L(위, y = L)인 두 판 사이에 갇혀 있습니다. 1단계. 판은 막혀 있으므로 연속 방정식에서 v_y = 0이고, 정상상태에서 A의 순 플럭스도 0입니다.",
            "A binary gas is trapped between plates at T_0 (bottom, y = 0) and T_L (top, y = L). Step 1. The plates are impermeable, so continuity gives v_y = 0, and at steady state the net flux of A is zero too."
          )}
        </P>
        <P>
          {t(
            "2단계. 남은 두 플럭스, Fick 확산과 열확산의 합이 0입니다. 질량분율을 몰분율로 바꾸고(dω_A = M_A M_B C²/ρ² dx_A), 열확산 인자 α_A를 정의합니다.",
            "Step 2. The two remaining fluxes, Fickian and thermal diffusion, cancel. Convert mass to mole fraction (dω_A = M_A M_B C²/ρ² dx_A) and define the thermal diffusion factor α_A:"
          )}
        </P>
        <Eq block>J_Ay = −(ρD_AB/M_A) dω_A/dy − (D_A⁽ᵀ⁾/M_A) d ln T/dy = 0 &nbsp;⇒&nbsp; dx_A = −x_A x_B α_A d ln T, &nbsp; α_A = ρD_A⁽ᵀ⁾/(M_A M_B C² x_A x_B D_AB)</Eq>
        <P>
          {t(
            "3단계. α_A는 조성에 거의 무관하고, 조성 변화가 작으면 x_A x_B를 상수로 두고 적분합니다.",
            "Step 3. α_A hardly depends on composition, and if the composition changes little x_A x_B can be held constant while integrating:"
          )}
        </P>
        <Eq block>x_A(L) − x_A(0) ≈ −x_A x_B α_A ln(T_L/T_0)</Eq>
        <Note>
          {t(
            "강의 예(α_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5)의 크기는 0.030입니다. 부호까지 쓰면 −0.030으로, α_A > 0인 A는 차가운 아래판(y = 0) 쪽에 더 많습니다.",
            "The lecture example (α_A = 0.3, T_L = 300 K, T_0 = 200 K, x_A = x_B = 0.5) has magnitude 0.030. With its sign it is −0.030: species A with α_A > 0 is richer at the cold bottom plate (y = 0)."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 한 단의 분리와 여러 단의 분리", "Simulation: one stage and a cascade")}>
        <Grid2>
          <div>
            <Slider label={t("열확산 인자 α_A", "thermal diffusion factor α_A")} value={alpha} min={0.01} max={0.6} step={0.01} onChange={setAlpha} fmt={(v) => v.toFixed(2)} />
            <Slider label="T_L / T_0" value={ratio} min={1.05} max={4} step={0.05} onChange={setRatio} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("평균 조성 x_A", "mean composition x_A")} value={xA} min={0.05} max={0.95} step={0.01} onChange={setXA} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("단 수 n", "number of stages n")} value={n} min={1} max={60} step={1} onChange={setN} />
            <Readout>
              x_A(L) − x_A(0) ≈ {shift.toFixed(4)}<br />
              {t("단당 분리 인자", "separation factor per stage")} q = (T_L/T_0)^α = {q.toFixed(4)}<br />
              {t("n단", "n stages")}: q^n = {sci(Math.pow(q, n), 3)}
            </Readout>
            <Note>
              {t(
                "한 단의 분리는 몇 %에 불과하지만, 같은 장치를 여러 단 이으면 분리 인자가 곱해집니다. 열확산 칼럼이 질량 차가 작은 동위원소를 분리할 수 있는 이유입니다.",
                "One stage separates only a few percent, but chaining stages multiplies the separation factor. That is how thermal diffusion columns separate isotopes with tiny mass differences."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[-0.12, 0.12]} xl={t("위치 y/L (차가운 판 → 뜨거운 판)", "position y/L (cold → hot plate)")} yl="x_A − x̄_A"
            series={[{ pts: prof, color: C.copper, width: 2.6 }]}
            hlines={[{ y: 0, color: C.inkSoft }]} />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: multicomponent energy balance ---------------------------------- */
function TabEnergy({ t }) {
  return (
    <div>
      <Panel title={t("유도: 다성분 계의 에너지 플럭스", "Derivation: the energy flux of a multicomponent system")}>
        <P>
          {t(
            "1단계. 혼합물의 열 플럭스에는 전도 외에 '확산하는 성분이 실어 나르는 엔탈피'가 더해집니다. H_i는 부분 몰 엔탈피, q⁽ˣ⁾는 Dufour 효과입니다.",
            "Step 1. In a mixture, the heat flux carries, besides conduction, the enthalpy borne by each diffusing species. H_i is the partial molar enthalpy and q⁽ˣ⁾ the Dufour contribution:"
          )}
        </P>
        <Eq block>q = −k∇T + Σᵢ J_i H_i + q⁽ˣ⁾</Eq>
        <P>
          {t(
            "2단계. 엔탈피 형태의 에너지 식에서 ρĤ = Σ C_i H_i를 쓰고, 대류로 실려 가는 엔탈피 vΣC_iH_i와 q를 묶습니다. J_i = C_i(v_i − v)이므로 v C_i + J_i = N_i입니다.",
            "Step 2. In the enthalpy form of the energy equation use ρĤ = Σ C_i H_i and group the convected enthalpy vΣC_iH_i with q. Since J_i = C_i(v_i − v), v C_i + J_i = N_i:"
          )}
        </P>
        <Eq block>e ≡ v Σ C_i H_i + q = Σ (vC_i + J_i) H_i − k∇T + q⁽ˣ⁾ = Σ N_i H_i − k∇T + q⁽ˣ⁾</Eq>
        <P>
          {t(
            "3단계. 정상상태에서 압력 일(v·∇P)과 점성 소산(τ:∇v)이 작고 체적력이 중력뿐이면 Σ j_i·g = (Σ j_i)·g = 0입니다. 그래서 다성분 에너지 수지는 아주 간단해집니다.",
            "Step 3. At steady state with negligible pressure work (v·∇P) and viscous dissipation (τ:∇v), and gravity as the only body force, Σ j_i·g = (Σ j_i)·g = 0. The multicomponent energy balance becomes simply"
          )}
        </P>
        <Eq block>∇·e = 0, &nbsp;&nbsp; e ≈ Σ N_i H_i − k∇T &nbsp;({t("Dufour 무시", "Dufour neglected")})</Eq>
        <Note>
          {t(
            "핵심은 '열 플럭스'를 물질 플럭스와 떼어 쓸 수 없다는 점입니다. 물질이 계면을 지나면 그 물질의 엔탈피도 함께 지나갑니다.",
            "The key point: the heat flux cannot be written separately from the mass fluxes. When matter crosses an interface, its enthalpy crosses with it."
          )}
        </Note>
      </Panel>

      <Panel title={t("계면 에너지 수지: 상변화와 표면 반응", "Interface energy balances: phase change and surface reaction")}>
        <P>
          {t(
            "계면 양쪽에서 e의 법선 성분이 같아야 합니다. 응축이나 증발에서는 양쪽 엔탈피 차가 잠열 λ_i = H_i⁽ᴳ⁾ − H_i⁽ᴸ⁾입니다.",
            "The normal component of e must match across an interface. In condensation or evaporation the enthalpy difference across it is the latent heat λ_i = H_i⁽ᴳ⁾ − H_i⁽ᴸ⁾:"
          )}
        </P>
        <Eq block>(−k∇T)ₙ⁽ᴸ⁾ = (−k∇T)ₙ⁽ᴳ⁾ + Σ N_i,n⁽ᴳ⁾ λ_i</Eq>
        <P>
          {t(
            "고체 촉매 표면의 반응에서는 고체로 들어가는 물질이 없으므로 고체 쪽에는 전도만 남습니다. 계면의 화학량론 N_i,n/ξ_i = N_j,n/ξ_j를 쓰면 엔탈피 항이 반응열 ΔH_R = Σ ξ_i H_i로 묶입니다.",
            "For reaction on a solid catalyst nothing enters the solid, so only conduction remains on the solid side. Using the interface stoichiometry N_i,n/ξ_i = N_j,n/ξ_j, the enthalpy terms combine into the heat of reaction ΔH_R = Σ ξ_i H_i:"
          )}
        </P>
        <Eq block>(−k∇T)ₙ⁽ˢ⁾ = (−k∇T)ₙ⁽ᴳ⁾ + (N_A,n⁽ᴳ⁾/ξ_A) ΔH_R</Eq>
        <Table head={[t("반응", "Reaction"), t("속도가 나타나는 곳", "where the rate appears")]}
          rows={[
            [t("균일 반응 (기상 안)", "homogeneous (in the gas)"), t("화학종 보존식의 생성항", "the source term of the species equation")],
            [t("불균일 반응 (표면)", "heterogeneous (at a surface)"), t("경계 조건", "a boundary condition")],
          ]} />
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: evaporating droplet ---------------------------------- */
const psatBuck = (Tc) => 611.21 * Math.exp((18.678 - Tc / 234.5) * (Tc / (257.14 + Tc)));
function dropletState(Tinf, xinf, kG, D, cpW, lam, C) {
  const P = 101325, a = kG / (C * cpW * D);
  const f = (T) => Math.log((1 - xinf) / (1 - psatBuck(T) / P)) - a * Math.log(1 + (cpW * (Tinf - T)) / lam);
  let lo = -40, hi = Math.min(Tinf, 99.9);
  if (f(lo) * f(hi) > 0) return null;
  for (let k = 0; k < 80; k++) { const m = 0.5 * (lo + hi); if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
  const TR = 0.5 * (lo + hi);
  return { TR, xR: psatBuck(TR) / P, a };
}

function TabDroplet({ t }) {
  const [Tinf, setTinf] = useState(25);
  const [xinf, setXinf] = useState(0);
  const [dum, setDum] = useState(100);
  const kG = 0.026, D = 2.6e-5, cpW = 34, lam = 44000, CL = 55500, Cg = 101325 / (8.314 * 298.15);
  const st = dropletState(Tinf, xinf, kG, D, cpW, lam, Cg);
  const R0 = dum * 0.5e-6;
  const L = st ? Math.log((1 - xinf) / (1 - st.xR)) : NaN;
  const life = st && L > 0 ? (CL * R0 * R0) / (2 * Cg * D * L) : NaN;
  const ts = lin(0, 1, 60);
  const Tgrid = lin(5, 200, 60);
  const TRcurve = Tgrid.map((T) => { const s = dropletState(T, 0, kG, D, cpW, lam, Cg); return s ? [T, s.TR] : null; }).filter(Boolean);
  return (
    <div>
      <Panel title={t("유도: 질소 속에서 증발하는 물방울", "Derivation: a water droplet evaporating in nitrogen")}>
        <P>
          {t(
            "가정: 물방울은 구형이고 N₂는 정지해 있습니다(Pe → 0). 물방울이 줄어드는 속도는 기상 확산보다 훨씬 느려 기상은 준정상입니다. N₂는 물에 녹지 않습니다.",
            "Assumptions: the droplet is spherical and the N₂ is stagnant (Pe → 0). The droplet shrinks far more slowly than the gas diffuses, so the gas is pseudo-steady. N₂ does not dissolve in water."
          )}
        </P>
        <P>
          {t(
            "1단계(물질). 구 대칭 정상 확산에서 r²N_W가 일정합니다. N₂는 정지해 있으므로(N_N = 0) 10주차의 '정지한 B를 통한 확산'과 같은 꼴이 됩니다.",
            "Step 1 (mass). In spherically symmetric steady diffusion r²N_W is constant. N₂ is stagnant (N_N = 0), so the problem takes the 'diffusion through stagnant B' form of Week 10:"
          )}
        </P>
        <Eq block>N_W(R) = (C D_WN / R) ln[(1 − x_W∞)/(1 − x_W(R))]</Eq>
        <P>
          {t(
            "2단계(에너지). ∇·e = 0에서 r²e_r이 일정하고, e = N_W H_W − k_G dT/dr입니다. 표면에서는 기상 전도가 증발 잠열을 공급합니다: k_G dT/dr|_R = λ N_W(R). 적분하면 에너지 쪽 플럭스가 나옵니다.",
            "Step 2 (energy). From ∇·e = 0, r²e_r is constant with e = N_W H_W − k_G dT/dr. At the surface gas-phase conduction supplies the latent heat: k_G dT/dr|_R = λ N_W(R). Integrating gives the energy-side flux:"
          )}
        </P>
        <Eq block>N_W(R) = (k_G / (c_pW R)) ln[1 + c_pW (T∞ − T(R)) / λ]</Eq>
        <P>
          {t(
            "3단계. 두 식을 같게 놓고 x_W(R) = p_sat(T(R))/P를 넣으면 T(R) 하나에 대한 식이 됩니다. 이를 수치로 풉니다.",
            "Step 3. Equating the two and inserting x_W(R) = p_sat(T(R))/P leaves one equation in T(R), solved numerically:"
          )}
        </P>
        <Eq block>(1 − x_W∞)/(1 − x_W(R)) = [1 + c_pW (T∞ − T(R))/λ]^(a*), &nbsp; a* = k_G / (C c_pW D_WN)</Eq>
        <P>
          {t(
            "4단계(수명). 액체의 물질수지 −C_L dR/dt = N_W(R)에 1단계를 넣으면 R dR이 상수 비율로 줄어듭니다. 지름의 제곱이 시간에 비례해 줄어드는 'd² 법칙'입니다.",
            "Step 4 (lifetime). The liquid balance −C_L dR/dt = N_W(R) with Step 1 makes R dR fall at a constant rate: the square of the diameter shrinks linearly in time, the 'd² law':"
          )}
        </P>
        <Eq block>R² = R₀² − (2 C D_WN / C_L) ln[(1 − x_W∞)/(1 − x_W(R))] t &nbsp;⇒&nbsp; t_life = C_L R₀² / (2 C D_WN ln[…])</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 표면 온도와 수명", "Simulation: surface temperature and lifetime")}>
        <Grid2>
          <div>
            <Slider label={t("기체 온도 T∞", "gas temperature T∞")} value={Tinf} min={5} max={200} step={1} onChange={setTinf} unit=" °C" />
            <Slider label={t("기체 속 수증기 x_W∞", "vapor in the gas x_W∞")} value={xinf} min={0} max={0.03} step={0.001} onChange={setXinf} fmt={(v) => v.toFixed(3)} />
            <Slider label={t("처음 지름 d₀", "initial diameter d₀")} value={dum} min={5} max={1000} step={5} onChange={setDum} unit=" μm" />
            <Readout>
              {st ? (<>
                a* = {st.a.toFixed(3)}<br />
                T(R) = {st.TR.toFixed(2)} °C, &nbsp;x_W(R) = {st.xR.toFixed(5)}<br />
                {L > 0 ? <>{t("수명", "lifetime")} t_life = {life < 1 ? `${(life * 1000).toFixed(1)} ms` : `${life.toFixed(2)} s`}</> : t("기체가 포화에 가까워 증발하지 않습니다.", "The gas is near saturation; no net evaporation.")}
              </>) : t("해가 없습니다(기체가 과포화).", "No solution (supersaturated gas).")}
            </Readout>
            <Note>
              {t(
                "표면 온도는 기체 온도보다 한참 낮습니다. 증발 잠열을 기체 전도가 공급하려면 온도 차가 필요하기 때문입니다. 습구 온도(12주차)와 같은 물리이며, 성질 값은 설명용입니다.",
                "The surface sits well below the gas temperature, because conduction from the gas must supply the latent heat. It is the wet-bulb physics of Week 12; property values are illustrative."
              )}
            </Note>
          </div>
          <div>
            <Chart xr={[0, 1]} yr={[0, 1.05]} xl="t / t_life" yl="(d/d₀)²"
              series={[{ pts: ts.map((s) => [s, 1 - s]), color: C.copper, width: 2.6 }, { pts: ts.map((s) => [s, Math.sqrt(Math.max(0, 1 - s))]), color: C.cool, width: 2, dash: "6 4" }]}
              legend={[{ label: "(d/d₀)²", color: C.copper }, { label: "d/d₀", color: C.cool, dash: "6 4" }]} legendAt="tr" />
            <Chart xr={[0, 200]} yr={[0, 60]} xl={t("기체 온도 T∞ (°C, 건조)", "gas temperature T∞ (°C, dry)")} yl="T(R) (°C)"
              series={[{ pts: TRcurve, color: C.copper, width: 2.4 }, { pts: [[0, 0], [60, 60]], color: C.inkSoft, width: 1, dash: "4 3" }]}
              dots={st ? [{ x: Tinf, y: st.TR }] : []} />
          </div>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Stefan–Maxwell ---------------------------------- */
function solveNA(xA0, xBL, xCL, L, Cc, DAB, DAC) {
  const resid = (N) => 1 - xBL * Math.exp((-N * L) / (Cc * DAB)) - xCL * Math.exp((-N * L) / (Cc * DAC)) - xA0;
  let lo = 0, hi = 1e-3;
  let k = 0;
  while (resid(hi) < 0 && k < 60) { hi *= 2; k++; }
  for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (resid(m) < 0) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

function TabStefanMaxwell({ t }) {
  const [xA0, setXA0] = useState(0.2);
  const [xCL, setXCL] = useState(0.5);
  const [ratio, setRatio] = useState(3.5);
  const Cc = 40.9, L = 0.1, DAB = 2.6e-5, DAC = DAB * ratio;
  const N = solveNA(xA0, 1 - xCL, xCL, L, Cc, DAB, DAC);
  const Nbin = ((Cc * DAB) / L) * Math.log(1 / (1 - xA0));
  const zs = lin(0, 1, 60);
  const xB = (z) => (1 - xCL) * Math.exp((-N * L * (1 - z)) / (Cc * DAB));
  const xC = (z) => xCL * Math.exp((-N * L * (1 - z)) / (Cc * DAC));
  return (
    <div>
      <Panel title={t("Stefan–Maxwell 식", "The Stefan–Maxwell equations")}>
        <P>
          {t(
            "Fick 법칙은 두 성분에서는 충분하지만, 셋 이상이면 성분 i의 확산이 다른 모든 성분과의 '마찰'에 달려 있습니다. 이상 기체에서 그 힘의 균형이 Stefan–Maxwell 식입니다(온도·압력 기울기 무시).",
            "Fick's law suffices for two species, but with three or more, the diffusion of species i depends on its 'friction' with every other species. For ideal gases that force balance is the Stefan–Maxwell equation (temperature and pressure gradients neglected):"
          )}
        </P>
        <Eq block>∇x_i = Σ_(j≠i) (x_i x_j / D_ij)(v_j − v_i) = Σ_(j≠i) (x_i N_j − x_j N_i) / (C D_ij)</Eq>
        <P>
          {t(
            "왼쪽은 성분 i를 미는 구동력이고, 오른쪽은 i가 다른 성분들과 상대적으로 움직일 때 받는 저항입니다. D_ij는 이성분 자료에서 따로 구하며 조성에 무관합니다.",
            "The left side is the force pushing species i; the right side is the drag it feels moving relative to the others. Each D_ij comes from binary data and does not depend on composition."
          )}
        </P>
        <P>
          {t(
            "이성분 검산: x_B = 1 − x_A로 두고 정리하면 익숙한 식이 나옵니다.",
            "Binary check: with x_B = 1 − x_A, rearranging recovers the familiar result:"
          )}
        </P>
        <Eq block>∇x_A = (x_A N_B − x_B N_A)/(C D_AB) &nbsp;⇒&nbsp; N_A = x_A(N_A + N_B) − C D_AB ∇x_A</Eq>
      </Panel>

      <Panel title={t("예: 정지한 B + C 혼합물을 지나는 A (3성분 Stefan 관)", "Example: A through a stagnant B + C mixture (ternary Stefan tube)")}>
        <P>
          {t(
            "관 바닥(z = 0)의 액체에서 A가 증발해 위(z = L)로 확산하고, B와 C는 정지해 있습니다(N_B = N_C = 0). 그러면 B와 C의 식이 서로 분리됩니다.",
            "A evaporates from liquid at the bottom (z = 0) and diffuses up to z = L, while B and C stay put (N_B = N_C = 0). The B and C equations then decouple:"
          )}
        </P>
        <Eq block>dx_B/dz = x_B N_A/(C D_AB), &nbsp; dx_C/dz = x_C N_A/(C D_AC) &nbsp;⇒&nbsp; x_B(z) = x_B(L) e^(−N_A(L−z)/(C D_AB))</Eq>
        <P>
          {t(
            "N_A는 바닥 조건 x_A(0) = 1 − x_B(0) − x_C(0)을 맞추도록 정합니다(수치 해). A가 묽으면 유효 확산계수 D_A,mix = (1 − x_A)/(x_B/D_AB + x_C/D_AC)로 근사할 수 있습니다.",
            "N_A is chosen to meet the bottom condition x_A(0) = 1 − x_B(0) − x_C(0) (solved numerically). For dilute A, an effective diffusivity D_A,mix = (1 − x_A)/(x_B/D_AB + x_C/D_AC) approximates it."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("바닥 조성 x_A(0)", "bottom composition x_A(0)")} value={xA0} min={0.02} max={0.8} step={0.01} onChange={setXA0} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("위쪽 기체 중 C의 비율 x_C(L)", "fraction of C in the top gas x_C(L)")} value={xCL} min={0} max={1} step={0.01} onChange={setXCL} fmt={(v) => v.toFixed(2)} />
            <Slider label="D_AC / D_AB" value={ratio} min={0.2} max={6} step={0.1} onChange={setRatio} fmt={(v) => v.toFixed(1)} />
            <Readout>
              N_A ({t("3성분", "ternary")}) = {sci(N, 4)} mol/m²·s<br />
              N_A ({t("B만 있을 때", "B alone")}) = {sci(Nbin, 4)} mol/m²·s<br />
              {t("비", "ratio")} = {(N / Nbin).toFixed(3)}
            </Readout>
            <Note>
              {t(
                "C가 빠른 동반자(D_AC > D_AB)이면 A가 더 쉽게 빠져나갑니다. 또 x_B/x_C가 일정하지 않습니다. 느린 동반자 B가 액체 근처에서 더 많이 밀려나기 때문이며, 이는 이성분 Fick 법칙으로는 설명할 수 없습니다.",
                "When C is the faster partner (D_AC > D_AB), A escapes more easily. Also x_B/x_C is not constant: the slow partner B is pushed away from the liquid more strongly, something binary Fick's law cannot describe."
              )}
            </Note>
          </div>
          <Chart xr={[0, 1]} yr={[0, 1]} xl="z / L" yl={t("몰분율", "mole fraction")}
            series={[
              { pts: zs.map((z) => [z, 1 - xB(z) - xC(z)]), color: C.copper, width: 2.6 },
              { pts: zs.map((z) => [z, xB(z)]), color: C.cool, width: 2.2 },
              { pts: zs.map((z) => [z, xC(z)]), color: C.good, width: 2.2 },
            ]}
            legend={[{ label: "x_A", color: C.copper }, { label: "x_B", color: C.cool }, { label: "x_C", color: C.good }]} legendAt="tr" />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: non-ideal diffusion ---------------------------------- */
function TabNonideal({ t }) {
  const [A, setA] = useState(1.5);
  const xs = lin(0.001, 0.999, 200);
  const G = (x) => 1 - 2 * A * x * (1 - x);
  const spin = A > 2 ? 0.5 * (1 - Math.sqrt(1 - 2 / A)) : null;
  // Gibbs energy of mixing per RT
  const gmix = (x) => x * Math.log(x) + (1 - x) * Math.log(1 - x) + A * x * (1 - x);
  return (
    <div>
      <Panel title={t("일반화된 구동력: 화학 퍼텐셜의 기울기", "Generalized driving force: the gradient of chemical potential")}>
        <P>
          {t(
            "확산의 진짜 구동력은 농도가 아니라 화학 퍼텐셜 μ_i의 기울기입니다. 묽은 혼합물에서 성분 i를 미는 단위 부피당 힘 CRT d_i에는 조성, 압력, 체적력 항이 들어갑니다.",
            "The true driving force for diffusion is the gradient of chemical potential μ_i, not of concentration. In a dilute mixture, the force per unit volume CRT d_i pushing species i contains composition, pressure and body-force terms:"
          )}
        </P>
        <Eq block>CRT d_i = C_i ∇_(T,P) μ_i + (C_i V̄_i − ω_i) ∇P − ρ_i (g_i − Σ ω_k g_k), &nbsp; J_i = −D_i C d_i − (D_i⁽ᵀ⁾/M_i) ∇ln T</Eq>
        <P>
          {t(
            "온도·압력 기울기가 없고 체적력이 중력뿐이면, ∇_(T,P)μ_i = RT∇ln(γ_i x_i)이므로 플럭스는 활동도의 기울기에 비례합니다. 이성분 용액에서 정리하면 다음과 같습니다.",
            "With no temperature or pressure gradient and gravity as the only body force, ∇_(T,P)μ_i = RT∇ln(γ_i x_i), so the flux follows the activity gradient. For a binary solution:"
          )}
        </P>
        <Eq block>J_i = −D_i C_i ∇ln(γ_i x_i) = −D_i* ∇C_i, &nbsp;&nbsp; D_i* = (1 + d ln γ_i / d ln x_i) D_i</Eq>
        <Note>
          {t(
            "괄호 안의 '열역학 인자' 때문에 측정되는 D*는 실제 이동도에 해당하는 D보다 조성에 훨씬 민감합니다. 이상 용액(γ_i = 1)이면 D* = D입니다.",
            "Because of the bracketed 'thermodynamic factor', the measured D* is far more composition-sensitive than the mobility-based D. For an ideal solution (γ_i = 1), D* = D."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 열역학 인자와 오르막 확산", "Simulation: the thermodynamic factor and uphill diffusion")}>
        <P>
          {t(
            "2항 Margules 모델 ln γ₁ = A x₂²를 쓰면 d ln γ₁/d ln x₁ = −2A x₁x₂이므로 D*/D = 1 − 2A x₁x₂입니다. A > 2이면 가운데 조성에서 D* < 0이 되어, 물질이 농도가 높은 쪽으로 확산합니다(스피노달 분해).",
            "With the two-suffix Margules model ln γ₁ = A x₂², d ln γ₁/d ln x₁ = −2A x₁x₂, so D*/D = 1 − 2A x₁x₂. For A > 2, D* < 0 at intermediate compositions and matter diffuses toward higher concentration (spinodal decomposition)."
          )}
        </P>
        <Grid2>
          <div>
            <Slider label={t("Margules 상수 A", "Margules constant A")} value={A} min={0} max={3} step={0.05} onChange={setA} fmt={(v) => v.toFixed(2)} />
            <Readout>
              x₁ = 0.5: D*/D = {G(0.5).toFixed(3)}<br />
              {spin ? <>{t("스피노달 영역", "spinodal region")}: {spin.toFixed(3)} &lt; x₁ &lt; {(1 - spin).toFixed(3)}</> : t("스피노달 영역 없음 (A ≤ 2)", "no spinodal region (A ≤ 2)")}
            </Readout>
            <Note>
              {t(
                "D* = 0이 되는 곳은 혼합 Gibbs 에너지 곡선의 변곡점(d²g/dx² = 0)과 같습니다. 고분자 블렌드나 합금의 상분리, 포토레지스트 현상 공정의 조성 불균일이 이 원리로 설명됩니다.",
                "D* = 0 coincides with the inflection points of the Gibbs energy of mixing (d²g/dx² = 0). Phase separation in polymer blends and alloys, and composition non-uniformity in photoresist development, follow this principle."
              )}
            </Note>
          </div>
          <div>
            <Chart xr={[0, 1]} yr={[-1, 1.05]} xl="x₁" yl="D*/D"
              series={[{ pts: xs.map((x) => [x, G(x)]), color: C.copper, width: 2.6 }]}
              hlines={[{ y: 0, color: C.inkSoft }]}
              vlines={spin ? [{ x: spin, color: C.warn }, { x: 1 - spin, color: C.warn }] : []} />
            <Chart xr={[0, 1]} yr={[-0.75, 0.35]} xl="x₁" yl="Δg_mix / RT"
              series={[{ pts: xs.map((x) => [x, gmix(x)]), color: C.cool, width: 2.4 }]}
              hlines={[{ y: 0, color: C.inkSoft }]}
              vlines={spin ? [{ x: spin, color: C.warn }, { x: 1 - spin, color: C.warn }] : []} />
          </div>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: external mass transfer ---------------------------------- */
function CatalystSteps({ t }) {
  const W = 520, H = 210;
  const steps = [
    [t("1. A가 표면으로 (외부 확산)", "1. A to the surface (external)"), 18, 28],
    [t("2. 기공 속으로 (내부 확산)", "2. A into the pores (internal)"), 18, 70],
    [t("3. 흡착", "3. adsorption"), 18, 112],
    [t("4. 표면 반응", "4. surface reaction"), 18, 154],
    [t("5. B 탈착", "5. desorption of B"), 352, 154],
    [t("6. 기공 밖으로", "6. B out of the pores"), 352, 112],
    [t("7. B가 본체로", "7. B to the bulk"), 352, 70],
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <circle cx={260} cy={110} r={78} fill="none" stroke={C.cool} strokeDasharray="5 4" />
      <circle cx={260} cy={110} r={58} fill={C.copperPale} stroke={C.copperDeep} strokeWidth={1.6} />
      {[[-20, -10], [10, 20], [25, -25], [-30, 25]].map(([dx, dy], i) => <path key={i} d={`M${260 + dx},${110 + dy} q 12,-8 24,0`} stroke={C.copperDeep} fill="none" />)}
      <text x={260} y={114} fontSize="11.5" textAnchor="middle" fill={C.ink}>{t("다공성 촉매", "porous catalyst")}</text>
      <text x={260} y={28} fontSize="11" textAnchor="middle" fill={C.cool}>{t("경계층", "boundary layer")}</text>
      {steps.map(([s, x, y], i) => <text key={i} x={x} y={y} fontSize="11.5" fill={C.ink}>{s}</text>)}
    </svg>
  );
}

function TabExternal({ t }) {
  const [logU, setLogU] = useState(-1);
  const [dpmm, setDpmm] = useState(10);
  const [logDa, setLogDa] = useState(0);
  const nu = 5e-7, D = 1e-10, cAb = 1000;
  const U = Math.pow(10, logU), dp = dpmm * 1e-3;
  const Re = (U * dp) / nu, Sc = nu / D, Sh = 2 + 0.6 * Math.sqrt(Re) * Math.cbrt(Sc), kc = (Sh * D) / dp;
  const Da = Math.pow(10, logDa), kr = Da * kc;
  const rate = ((kr * kc) / (kr + kc)) * cAb;
  const Das = logspace(-3, 3, 120);
  return (
    <div>
      <Panel title={t("불균일 촉매 반응의 일곱 단계", "Seven steps of a heterogeneous catalytic reaction")}>
        <CatalystSteps t={t} />
        <P>
          {t(
            "가장 느린 단계가 전체 속도를 정합니다. 이 탭은 단계 1(외부 확산)과 단계 4(표면 반응)의 경쟁을, 내부 확산 탭은 단계 2를 다룹니다.",
            "The slowest step sets the overall rate. This tab treats the competition between step 1 (external diffusion) and step 4 (surface reaction); the internal-diffusion tab treats step 2."
          )}
        </P>
      </Panel>

      <Panel title={t("유도: 직렬 저항으로 본 표면 반응", "Derivation: surface reaction as resistances in series")}>
        <P>
          {t(
            "1단계. 경계층을 지나는 플럭스는 n_A = k_c(c_Ab − c_As)이고, k_c는 Froessling 꼴 상관식에서 얻습니다(강의는 계수 0.6을 씁니다).",
            "Step 1. The flux across the boundary layer is n_A = k_c(c_Ab − c_As), with k_c from a Froessling-type correlation (the lecture uses the coefficient 0.6):"
          )}
        </P>
        <Eq block>Sh = k_c d_p / D_AB = 2 + 0.6 Re^(1/2) Sc^(1/3)</Eq>
        <P>
          {t(
            "2단계. 정상상태에서 표면 반응 속도(1차, −r″ = k_r c_As)는 공급 플럭스와 같습니다. c_As를 소거하면 두 저항 1/k_r과 1/k_c가 직렬로 더해집니다.",
            "Step 2. At steady state the surface rate (first order, −r″ = k_r c_As) equals the supply flux. Eliminating c_As adds the two resistances 1/k_r and 1/k_c in series:"
          )}
        </P>
        <Eq block>c_As = k_c c_Ab/(k_r + k_c), &nbsp;&nbsp; −r″ = c_Ab / (1/k_r + 1/k_c) = k_r k_c c_Ab/(k_r + k_c)</Eq>
        <Table head={[t("경우", "Case"), t("결과", "Result"), t("의미", "Meaning")]}
          rows={[
            ["k_r ≫ k_c", "−r″ ≈ k_c c_Ab, c_As → 0", t("확산 율속: 유속·입자 크기에 민감", "transport-limited: sensitive to flow and particle size")],
            ["k_r ≪ k_c", "−r″ ≈ k_r c_Ab, c_As → c_Ab", t("반응 율속: 온도(활성화 에너지)에 민감", "reaction-limited: sensitive to temperature (activation energy)")],
          ]} />
        <Note>
          {t(
            "확산 율속 영역에서 Sh ≫ 2이면 k_c ∝ U^(1/2) d_p^(−1/2) D^(2/3) ν^(−1/6)입니다. 유속을 4배로 하면 k_c가 2배가 되고, 이 민감도로 율속 단계를 실험적으로 판별합니다.",
            "In the transport-limited regime with Sh ≫ 2, k_c ∝ U^(1/2) d_p^(−1/2) D^(2/3) ν^(−1/6). Quadrupling the flow doubles k_c, and this sensitivity is how the limiting step is identified experimentally."
          )}
        </Note>
      </Panel>

      <Panel title={t("시뮬레이션: 강의 예제와 Da = k_r/k_c", "Simulation: the lecture example and Da = k_r/k_c")}>
        <Grid2>
          <div>
            <Slider label={t("유속 log₁₀ U", "flow log₁₀ U")} value={logU} min={-3} max={0.5} step={0.01} onChange={setLogU} fmt={() => `${sci(U, 3)} m/s`} />
            <Slider label={t("입자 지름 d_p", "particle diameter d_p")} value={dpmm} min={0.5} max={30} step={0.5} onChange={setDpmm} unit=" mm" />
            <Slider label="log₁₀ Da" value={logDa} min={-3} max={3} step={0.05} onChange={setLogDa} fmt={() => sci(Da, 3)} />
            <Readout>
              Re = {Re.toFixed(0)}, Sc = {Sc.toFixed(0)}, Sh = {Sh.toFixed(1)}<br />
              k_c = {sci(kc, 3)} m/s<br />
              c_As/c_Ab = {(kc / (kr + kc)).toFixed(4)}<br />
              −r″ = {sci(rate, 3)} mol/m²·s ({((100 * rate) / (kc * cAb)).toFixed(1)}% {t("의 확산 한계", "of the transport limit")})
            </Readout>
            <Note>
              {t(
                "강의 값(d_p = 1 cm, U = 0.1 m/s, D = 10⁻¹⁰ m²/s, ν = 5×10⁻⁷ m²/s)에서 Re = 2000, Sc = 5000, Sh = 461, k_c = 4.61×10⁻⁶ m/s입니다.",
                "With the lecture values (d_p = 1 cm, U = 0.1 m/s, D = 10⁻¹⁰ m²/s, ν = 5×10⁻⁷ m²/s): Re = 2000, Sc = 5000, Sh = 461 and k_c = 4.61×10⁻⁶ m/s."
              )}
            </Note>
          </div>
          <Chart xr={[1e-3, 1e3]} yr={[1e-3, 1.5]} xlog ylog xl="Da = k_r / k_c" yl="−r″ / (k_c c_Ab)"
            series={[
              { pts: Das.map((d) => [d, d / (1 + d)]), color: C.copper, width: 2.6 },
              { pts: Das.filter((d) => d < 3).map((d) => [d, d]), color: C.cool, width: 1.6, dash: "6 4" },
            ]}
            hlines={[{ y: 1, color: C.inkSoft }]}
            dots={[{ x: Da, y: Da / (1 + Da) }]}
            labels={[{ x: 2e-3, y: 4e-3, text: t("반응 율속", "reaction-limited"), color: C.cool, dx: 4, dy: -8 }, { x: 40, y: 1, text: t("확산 율속", "transport-limited"), dx: 0, dy: -8 }]} />
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 9: packed-bed reactor ---------------------------------- */
function TabPBR({ t }) {
  const [logD, setLogD] = useState(-9);
  const [U, setU] = useState(0.1);
  const [dpmm, setDpmm] = useState(5);
  const [phiB, setPhiB] = useState(0.4);
  const [Lb, setLb] = useState(2);
  const D = Math.pow(10, logD), nu = 1e-6, dp = dpmm * 1e-3;
  const Re = (U * dp) / nu, Sc = nu / D, Sh = 2 + 0.6 * Math.sqrt(Re) * Math.cbrt(Sc), kc = (Sh * D) / dp;
  const ac = (6 * (1 - phiB)) / dp;
  const X = 1 - Math.exp((-kc * ac * Lb) / U);
  const zs = lin(0, Lb, 80);
  return (
    <div>
      <Panel title={t("유도: 확산 율속 충전층 반응기", "Derivation: a transport-limited packed-bed reactor")}>
        <P>
          {t(
            "단면적 A_c인 충전층에 반응물이 속도 U로 흐릅니다. a_c는 층 부피당 촉매 외부 표면적이고, 지름 d_p인 구가 공극률 φ로 채워져 있으면 a_c = 6(1 − φ)/d_p입니다.",
            "Reactant flows at velocity U through a packed bed of cross-section A_c. a_c is the external catalyst area per bed volume; for spheres of diameter d_p at void fraction φ, a_c = 6(1 − φ)/d_p."
          )}
        </P>
        <P>
          {t(
            "1단계. 정상상태, 축 방향 분산 무시, 1차원 물질수지에서 반응 항은 '부피당 표면적 × 표면 플럭스'입니다. 2단계. 확산 율속(c_As ≈ 0)이면 선형 1계 식이 되어 지수 감소합니다.",
            "Step 1. A steady 1-D balance with axial dispersion neglected has a reaction term equal to area per volume times surface flux. Step 2. When transport limits (c_As ≈ 0) the equation is linear first order and decays exponentially:"
          )}
        </P>
        <Eq block>U dc_A/dz = −k_c a_c (c_A − c_As) ≈ −k_c a_c c_A &nbsp;⇒&nbsp; c_A/c_A0 = exp(−k_c a_c z / U)</Eq>
        <Note>
          {t(
            "k_c ∝ U^(1/2)이므로 지수 k_c a_c L/U ∝ U^(−1/2)입니다. 유속을 올리면 반응물이 층에 머무는 시간이 줄어 전환율이 오히려 떨어집니다. 반대로 입자를 작게 하면 a_c와 k_c가 함께 커지지만, 압력 손실이 늘어납니다.",
            "Since k_c ∝ U^(1/2), the exponent k_c a_c L/U ∝ U^(−1/2): a faster flow shortens the residence time and lowers conversion. Smaller particles raise both a_c and k_c, at the cost of a larger pressure drop."
          )}
        </Note>
      </Panel>
      <Panel title={t("시뮬레이션: 층 길이와 전환율", "Simulation: bed length and conversion")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ D_AB (m²/s)" value={logD} min={-10} max={-4.5} step={0.05} onChange={setLogD} fmt={() => sci(D, 2)} />
            <Slider label={t("겉보기 속도 U", "superficial velocity U")} value={U} min={0.005} max={1} step={0.005} onChange={setU} unit=" m/s" fmt={(v) => v.toFixed(3)} />
            <Slider label={t("입자 지름 d_p", "particle diameter d_p")} value={dpmm} min={0.5} max={20} step={0.5} onChange={setDpmm} unit=" mm" />
            <Slider label={t("층 공극률 φ", "bed void fraction φ")} value={phiB} min={0.3} max={0.6} step={0.01} onChange={setPhiB} fmt={(v) => v.toFixed(2)} />
            <Slider label={t("층 길이 L", "bed length L")} value={Lb} min={0.1} max={10} step={0.1} onChange={setLb} unit=" m" />
            <Readout>
              ν = 10⁻⁶ m²/s ({t("물", "water")}), Re = {Re.toFixed(0)}, Sc = {sci(Sc, 3)}, Sh = {Sh.toFixed(1)}<br />
              k_c = {sci(kc, 3)} m/s, a_c = {ac.toFixed(0)} m²/m³<br />
              {t("전환율", "conversion")} X = {(X * 100).toFixed(2)}%
            </Readout>
          </div>
          <Chart xr={[0, Lb]} yr={[0, 1.02]} xl={t("층 위치 z (m)", "bed position z (m)")} yl="c_A / c_A0"
            series={[{ pts: zs.map((z) => [z, Math.exp((-kc * ac * z) / U)]), color: C.copper, width: 2.6 }]} />
        </Grid2>
        <Note>
          {t(
            "액체(D ≈ 10⁻⁹ m²/s)에서는 확산 한계 전환율이 작습니다. 기체(D ≈ 10⁻⁵ m²/s, 슬라이더를 오른쪽으로)에서는 짧은 층에서도 거의 완전히 전환됩니다.",
            "In liquids (D ≈ 10⁻⁹ m²/s) the transport-limited conversion is small; in gases (D ≈ 10⁻⁵ m²/s, slider to the right) even a short bed converts almost fully."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 10: internal diffusion ---------------------------------- */
const etaSphere = (phi) => (phi < 1e-4 ? 1 : (3 / (phi * phi)) * (phi / Math.tanh(phi) - 1));

function TabThiele({ t }) {
  const [logPhi, setLogPhi] = useState(0.3);
  const [kRatio, setKRatio] = useState(1);
  const phi = Math.pow(10, logPhi);
  const eta = etaSphere(phi);
  const rs = lin(0.001, 1, 120);
  const prof = (p) => rs.map((r) => [r, Math.sinh(p * r) / (r * Math.sinh(p))]);
  const phis = logspace(-1, 2, 150);
  const Omega = eta / (1 + eta * kRatio);
  return (
    <div>
      <Panel title={t("유도: 구형 촉매 안의 확산과 반응", "Derivation: diffusion and reaction inside a spherical pellet")}>
        <P>
          {t(
            "1단계(껍질 수지). 반지름 r과 r + dr 사이 껍질에서 '들어온 A − 나간 A + 반응' = 0입니다. dr → 0을 취하면 다음 식이 됩니다(ρ_c: 촉매 밀도, r_A′: 촉매 질량당 속도).",
            "Step 1 (shell balance). For the shell between r and r + dr: A in − A out + reaction = 0. Letting dr → 0 (ρ_c: pellet density, r_A′: rate per catalyst mass):"
          )}
        </P>
        <Eq block>d(n_Ar r²)/dr − r_A′ ρ_c r² = 0</Eq>
        <P>
          {t(
            "2단계. 기공 속 확산은 유효 확산계수 D_e = D_AB φ_p σ_c/τ̃로 씁니다(φ_p ≈ 0.4 기공률, σ_c ≈ 0.8 수축 인자, τ̃ ≈ 3 굴곡도). 반응은 −r_A′ = k_n S_a c_A^n입니다. 3단계. r̃ = r/R, C = c_A/c_As로 무차원화하면 Thiele 계수 φ_n이 나옵니다.",
            "Step 2. Pore diffusion uses the effective diffusivity D_e = D_AB φ_p σ_c/τ̃ (porosity φ_p ≈ 0.4, constriction σ_c ≈ 0.8, tortuosity τ̃ ≈ 3); the reaction is −r_A′ = k_n S_a c_A^n. Step 3. With r̃ = r/R and C = c_A/c_As, the Thiele modulus φ_n appears:"
          )}
        </P>
        <Eq block>d²C/dr̃² + (2/r̃) dC/dr̃ − φ_n² Cⁿ = 0, &nbsp; φ_n² = k_n S_a ρ_c R² c_As^(n−1) / D_e, &nbsp; C(1) = 1, dC/dr̃(0) = 0</Eq>
        <P>
          {t(
            "4단계(n = 1). u = r̃C로 치환하면 u″ = φ₁²u가 되어 해가 sinh입니다. 중심에서 유한해야 하므로 cosh 항은 버립니다.",
            "Step 4 (n = 1). The substitution u = r̃C gives u″ = φ₁²u, solved by sinh; finiteness at the center discards the cosh term:"
          )}
        </P>
        <Eq block>C(r̃) = sinh(φ₁ r̃) / (r̃ sinh φ₁)</Eq>
        <P>
          {t(
            "5단계. 유효 인자 η는 '실제 반응 속도 ÷ 내부 전체가 c_As일 때의 속도'입니다. 실제 속도는 표면을 지나 들어오는 플럭스 4πR² D_e dc_A/dr|_R로 구합니다.",
            "Step 5. The effectiveness factor η is the actual rate divided by the rate if the whole interior were at c_As. The actual rate is the flux entering through the surface, 4πR² D_e dc_A/dr|_R:"
          )}
        </P>
        <Eq block>η = 4πR² D_e (dc_A/dr)|_R / [(4/3)πR³ ρ_c S_a k₁ c_As] = (3/φ₁²)(φ₁ coth φ₁ − 1) &nbsp;→&nbsp; 3/φ₁ &nbsp;(φ₁ ≫ 1)</Eq>
      </Panel>

      <Panel title={t("시뮬레이션: 농도 분포와 유효 인자", "Simulation: concentration profile and effectiveness factor")}>
        <Grid2>
          <div>
            <Slider label="log₁₀ φ₁" value={logPhi} min={-1} max={2} step={0.01} onChange={setLogPhi} fmt={() => `φ₁ = ${phi.toFixed(2)}`} />
            <Readout>
              η = {eta.toFixed(4)} {phi > 5 ? `(3/φ₁ = ${(3 / phi).toFixed(4)})` : ""}<br />
              {t("중심 농도", "center concentration")} C(0) = φ₁/sinh φ₁ = {(phi / Math.sinh(phi)).toExponential(3)}
            </Readout>
            <Note>
              {t(
                "φ₁이 작으면(작은 입자, 느린 반응) 반응물이 중심까지 퍼져 η → 1이고 표면 반응이 율속입니다. φ₁이 크면 반응물이 표면 근처에서 다 소모되어 η → 3/φ₁이고 내부 확산이 율속입니다. 입자 지름을 반으로 줄이면 φ₁도 반이 되어 η가 거의 2배가 됩니다.",
                "Small φ₁ (small pellet, slow reaction): reactant spreads to the center, η → 1, and the surface reaction limits. Large φ₁: reactant is consumed near the surface, η → 3/φ₁, and internal diffusion limits. Halving the diameter halves φ₁ and nearly doubles η."
              )}
            </Note>
          </div>
          <div>
            <Chart xr={[0, 1]} yr={[0, 1.02]} xl="r / R" yl="c_A / c_As"
              series={[{ pts: prof(phi), color: C.copper, width: 2.6 }, { pts: prof(1), color: C.cool, width: 1.4, dash: "5 4" }, { pts: prof(10), color: C.good, width: 1.4, dash: "5 4" }]}
              legend={[{ label: `φ₁ = ${phi.toFixed(2)}`, color: C.copper }, { label: "φ₁ = 1", color: C.cool, dash: "5 4" }, { label: "φ₁ = 10", color: C.good, dash: "5 4" }]} legendAt="tl" />
            <Chart xr={[0.1, 100]} yr={[0.02, 1.2]} xlog ylog xl="φ₁" yl="η"
              series={[{ pts: phis.map((p) => [p, etaSphere(p)]), color: C.copper, width: 2.6 }, { pts: phis.filter((p) => p > 2).map((p) => [p, 3 / p]), color: C.inkSoft, width: 1.4, dash: "5 4" }]}
              dots={[{ x: phi, y: eta }]} />
          </div>
        </Grid2>
      </Panel>

      <Panel title={t("외부 막까지 합치면: 전체 유효 인자 Ω", "Adding the external film: overall effectiveness Ω")}>
        <P>
          {t(
            "층 부피 기준으로 '표면으로 오는 양 = 안에서 반응하는 양': k_c a_c(c_Ab − c_As) = η k c_As (k = ρ_b S_a k₁). c_As를 소거하면 외부 막과 내부 확산이 함께 들어간 전체 유효 인자가 나옵니다.",
            "On a bed-volume basis, supply equals consumption: k_c a_c(c_Ab − c_As) = η k c_As with k = ρ_b S_a k₁. Eliminating c_As gives an overall effectiveness that includes both the external film and internal diffusion:"
          )}
        </P>
        <Eq block>−r_A = Ω k c_Ab, &nbsp;&nbsp; Ω = η / (1 + η k / (k_c a_c))</Eq>
        <Grid2>
          <div>
            <Slider label="k / (k_c a_c)" value={kRatio} min={0.01} max={20} step={0.01} onChange={setKRatio} fmt={(v) => v.toFixed(2)} />
            <Readout>η = {eta.toFixed(4)} → Ω = {Omega.toFixed(4)}</Readout>
          </div>
          <Note>
            {t(
              "k/(k_c a_c)가 크면 외부 막이 병목이 되어 Ω가 η보다 훨씬 작아집니다. 이때는 촉매를 바꾸기보다 유속이나 입자 크기를 바꿔야 합니다.",
              "When k/(k_c a_c) is large the external film is the bottleneck and Ω falls far below η; then changing the flow or particle size helps more than changing the catalyst."
            )}
          </Note>
        </Grid2>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 11: practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t("P1. 이성분 기체(α_A = 0.3, x_A = 0.3)가 300 K와 400 K인 두 판 사이에 있다. 정상상태에서 x_A(뜨거운 판) − x_A(차가운 판)은?",
        "P1. A binary gas (α_A = 0.3, x_A = 0.3) sits between plates at 300 K and 400 K. At steady state, what is x_A(hot plate) − x_A(cold plate)?"),
      s: t("Δx_A ≈ −x_A x_B α_A ln(T_hot/T_cold) = −0.3 × 0.7 × 0.3 × ln(4/3) = −0.063 × 0.2877 = −0.0181. 음수이므로 A는 차가운 판 쪽에 더 많습니다.",
        "Δx_A ≈ −x_A x_B α_A ln(T_hot/T_cold) = −0.3 × 0.7 × 0.3 × ln(4/3) = −0.063 × 0.2877 = −0.0181. It is negative, so A is richer at the cold plate."),
    },
    {
      q: t("P2. 2항 Margules 모델(A = 1.8)에서 x₁ = 0.5의 D*/D는? A = 2.2이면 어떻게 되는가?",
        "P2. With the two-suffix Margules model (A = 1.8), what is D*/D at x₁ = 0.5? What happens with A = 2.2?"),
      s: t("D*/D = 1 − 2A x₁x₂ = 1 − 2 × 1.8 × 0.25 = 0.10입니다. 확산이 이상 용액보다 10배 느립니다. A = 2.2이면 1 − 1.1 = −0.10으로 음수가 되어, 이 조성은 스피노달 영역 안에 있고 오르막 확산(상분리)이 일어납니다.",
        "D*/D = 1 − 2A x₁x₂ = 1 − 2 × 1.8 × 0.25 = 0.10: diffusion is ten times slower than in an ideal solution. With A = 2.2 it is 1 − 1.1 = −0.10, negative, so this composition lies inside the spinodal and uphill diffusion (phase separation) occurs."),
    },
    {
      q: t("P3. 묽은 A가 B(x_B = 0.6, D_AB = 2×10⁻⁵ m²/s)와 C(x_C = 0.4, D_AC = 6×10⁻⁵ m²/s) 혼합물 속으로 확산한다. 유효 확산계수 D_A,mix는?",
        "P3. Dilute A diffuses through a mixture of B (x_B = 0.6, D_AB = 2×10⁻⁵ m²/s) and C (x_C = 0.4, D_AC = 6×10⁻⁵ m²/s). What is the effective diffusivity D_A,mix?"),
      s: t("A가 묽으므로 1 − x_A ≈ 1입니다. D_A,mix = 1/(x_B/D_AB + x_C/D_AC) = 1/(30000 + 6667) = 2.73×10⁻⁵ m²/s. 단순 산술 평균(3.6×10⁻⁵)보다 작습니다. 저항이 더해지는 꼴이므로 느린 동반자가 결과를 좌우합니다.",
        "A is dilute, so 1 − x_A ≈ 1. D_A,mix = 1/(x_B/D_AB + x_C/D_AC) = 1/(30000 + 6667) = 2.73×10⁻⁵ m²/s, below the arithmetic mean (3.6×10⁻⁵). Resistances add, so the slow partner dominates."),
    },
    {
      q: t("P4. 25 °C의 건조한 N₂ 속에서 지름 50 μm 물방울의 수명은? (물방울 증발 탭의 성질 값 사용)",
        "P4. What is the lifetime of a 50 μm water droplet in dry N₂ at 25 °C? (Use the property values of the droplet tab.)"),
      s: t("표면 온도는 지름과 무관하게 T(R) = 7.0 °C, x_W(R) = 0.00989입니다. t_life = C_L R₀²/(2 C D ln[1/(1 − x_W(R))])에서 R₀²가 1/4이 되므로, 100 μm의 6.57 s의 1/4인 1.64 s입니다.",
        "The surface temperature does not depend on size: T(R) = 7.0 °C and x_W(R) = 0.00989. In t_life = C_L R₀²/(2 C D ln[1/(1 − x_W(R))]) R₀² falls to one quarter, so the lifetime is a quarter of the 100 μm value of 6.57 s: 1.64 s."),
    },
    {
      q: t("P5. 강의의 외부 물질전달 예제(d_p = 1 cm, U = 0.1 m/s, D = 10⁻¹⁰, ν = 5×10⁻⁷ m²/s)에서 유속을 2배로 하면 k_c는?",
        "P5. In the lecture's external-transfer example (d_p = 1 cm, U = 0.1 m/s, D = 10⁻¹⁰, ν = 5×10⁻⁷ m²/s), what is k_c if the flow is doubled?"),
      s: t("Re = 4000, Sc = 5000. Sh = 2 + 0.6 × 63.25 × 17.10 = 651. k_c = 651 × 10⁻¹⁰/0.01 = 6.51×10⁻⁶ m/s로, 4.61×10⁻⁶의 1.41배(≈ √2)입니다. Sh ≫ 2이므로 k_c ∝ U^(1/2)가 잘 맞습니다.",
        "Re = 4000 and Sc = 5000. Sh = 2 + 0.6 × 63.25 × 17.10 = 651, so k_c = 651 × 10⁻¹⁰/0.01 = 6.51×10⁻⁶ m/s, 1.41 times (≈ √2) the value 4.61×10⁻⁶. Since Sh ≫ 2, k_c ∝ U^(1/2) holds well."),
    },
    {
      q: t("P6. P5의 원래 조건(k_c = 4.61×10⁻⁶ m/s, c_Ab = 1 mol/L)에서 표면 반응 속도 상수가 k_r = 1×10⁻⁵ m/s이다. Da, 반응 속도, c_As/c_Ab는?",
        "P6. Under the original conditions of P5 (k_c = 4.61×10⁻⁶ m/s, c_Ab = 1 mol/L) the surface rate constant is k_r = 1×10⁻⁵ m/s. Find Da, the rate and c_As/c_Ab."),
      s: t("Da = k_r/k_c = 2.17. −r″ = k_r k_c c_Ab/(k_r + k_c) = (10⁻⁵ × 4.61×10⁻⁶ × 1000)/(1.461×10⁻⁵) = 3.15×10⁻³ mol/m²·s. c_As/c_Ab = k_c/(k_r + k_c) = 0.315. 두 저항이 비슷해 어느 한쪽 극한 식도 정확하지 않습니다.",
        "Da = k_r/k_c = 2.17. −r″ = k_r k_c c_Ab/(k_r + k_c) = (10⁻⁵ × 4.61×10⁻⁶ × 1000)/(1.461×10⁻⁵) = 3.15×10⁻³ mol/m²·s and c_As/c_Ab = k_c/(k_r + k_c) = 0.315. The two resistances are comparable, so neither limiting formula is accurate."),
    },
    {
      q: t("P7. 반지름 3 mm 구형 촉매에서 D_e = 10⁻⁹ m²/s, ρ_c S_a k₁ = 0.5 s⁻¹이다. φ₁과 η는? 반지름을 1.5 mm로 줄이면?",
        "P7. A spherical pellet of radius 3 mm has D_e = 10⁻⁹ m²/s and ρ_c S_a k₁ = 0.5 s⁻¹. Find φ₁ and η. What if the radius is cut to 1.5 mm?"),
      s: t("φ₁ = R√(ρ_c S_a k₁/D_e) = 0.003 × √(5×10⁸) = 67.1. η = (3/φ₁²)(φ₁ coth φ₁ − 1) = 0.0441로, 촉매의 4%만 일합니다. R = 1.5 mm이면 φ₁ = 33.5, η = 0.0868로 거의 2배가 됩니다(내부 확산 율속, η ≈ 3/φ₁).",
        "φ₁ = R√(ρ_c S_a k₁/D_e) = 0.003 × √(5×10⁸) = 67.1 and η = (3/φ₁²)(φ₁ coth φ₁ − 1) = 0.0441: only 4% of the pellet works. With R = 1.5 mm, φ₁ = 33.5 and η = 0.0868, nearly double (internal-diffusion control, η ≈ 3/φ₁)."),
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
    topic1: "week14_topic1_soret_thermo_factor",
    topic2: "week14_topic2_stefan_maxwell",
    topic3: "week14_topic3_droplet_evaporation",
    topic4: "week14_topic4_catalyst_pellet",
  };
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK14_CODES[topic][lang];
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
              {WEEK14_CODES[tp].title}
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
            "Python과 C++ 버전은 실행해 출력을 대조했고, 네 주제 모두 출력이 한 자리도 다르지 않습니다. 확인한 값: 주제 1은 강의의 Soret 예제(크기 0.030, 부호 −)와 스피노달 경계(A = 2.5에서 0.276–0.724)를 재현합니다. 주제 2는 C가 없을 때 3성분 해가 이성분 로그 식(2.373×10⁻³ mol/m²·s)과 같음을 확인합니다. 주제 3은 건조 N₂(25 °C)에서 T(R) = 7.0 °C와 100 μm 물방울 수명 6.57 s를 줍니다. 주제 4는 강의의 외부 물질전달 예제(Sh = 461, k_c = 4.61×10⁻⁶ m/s)를 재현합니다. MATLAB과 Julia는 같은 계산을 옮긴 것으로, 이 환경에서는 실행하지 못했습니다.",
            "The Python and C++ versions were run and their outputs compared; for all four topics they agree digit for digit. Checks: topic 1 reproduces the lecture's Soret example (magnitude 0.030, sign −) and the spinodal bounds (0.276–0.724 at A = 2.5). Topic 2 confirms that without C the ternary solution equals the binary log formula (2.373×10⁻³ mol/m²·s). Topic 3 gives T(R) = 7.0 °C in dry N₂ at 25 °C and a 6.57 s lifetime for a 100 μm droplet. Topic 4 reproduces the lecture's external-transfer example (Sh = 461, k_c = 4.61×10⁻⁶ m/s). The MATLAB and Julia versions port the same calculations but could not be run in this environment."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week14App({ lang: langProp, language, onBack, onLangChange }) {
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
    { label: t("결합 플럭스", "Coupled fluxes"), comp: <TabCoupled t={t} /> },
    { label: t("Soret 분리", "Soret separation"), comp: <TabSoret t={t} /> },
    { label: t("다성분 에너지", "Multicomponent energy"), comp: <TabEnergy t={t} /> },
    { label: t("물방울 증발", "Evaporating droplet"), comp: <TabDroplet t={t} /> },
    { label: "Stefan–Maxwell", comp: <TabStefanMaxwell t={t} /> },
    { label: t("비이상 확산", "Non-ideal diffusion"), comp: <TabNonideal t={t} /> },
    { label: t("외부 물질전달", "External transfer"), comp: <TabExternal t={t} /> },
    { label: t("충전층 반응기", "Packed bed"), comp: <TabPBR t={t} /> },
    { label: t("내부 확산", "Internal diffusion"), comp: <TabThiele t={t} /> },
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
                Heat & Mass Transfer · Week 14
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("결합 플럭스, 다성분 확산, 반응공학을 위한 물질전달", "Coupled Fluxes, Multicomponent Diffusion & Mass Transfer for Reaction Engineering")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("Onsager 상반 관계 · Soret/Dufour · 다성분 에너지 수지 · 물방울 증발(d² 법칙) · Stefan–Maxwell · 열역학 인자 · 외부 막 · 충전층 · Thiele 계수와 유효 인자",
                   "Onsager reciprocity · Soret/Dufour · multicomponent energy balance · droplet evaporation (d² law) · Stefan–Maxwell · thermodynamic factor · external film · packed bed · Thiele modulus & effectiveness factor")}
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
