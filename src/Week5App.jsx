// Week5App.jsx — Heat & Mass Transfer, Week 5
// Convective Heat Transfer: momentum & thermal boundary layers, Pr, dimensional
// analysis (Re, Nu, St, Gr, Pe), the Blasius similarity solution (shooting method),
// laminar flat-plate Nusselt correlations, laminar–turbulent transition, and
// forced convection in pipes (Graetz/entrance effects, Nu∞ = 3.66/4.364, Gnielinski, LMTD).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import WEEK5_CODES from "./Week5Codes";

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
};

const font = "'Pretendard', 'Noto Sans KR', -apple-system, 'Segoe UI', sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/* ---------------------------------- physics helpers ---------------------------------- */
/* Blasius: f f'' + 2 f''' = 0 — RK4 march with guessed f''(0) */
function blasiusMarch(fpp0, zmax = 10, dz = 0.005) {
  const rhs = (y) => [y[1], y[2], -0.5 * y[0] * y[2]];
  let y = [0, 0, fpp0];
  const path = [[0, ...y]];
  const n = Math.round(zmax / dz);
  for (let i = 0; i < n; i++) {
    const k1 = rhs(y);
    const y2 = y.map((v, j) => v + (dz / 2) * k1[j]);
    const k2 = rhs(y2);
    const y3 = y.map((v, j) => v + (dz / 2) * k2[j]);
    const k3 = rhs(y3);
    const y4 = y.map((v, j) => v + dz * k3[j]);
    const k4 = rhs(y4);
    y = y.map((v, j) => v + (dz / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    path.push([(i + 1) * dz, ...y]);
  }
  return path;
}

function solveBlasius() {
  let a = 0.2, b = 0.5;
  const end = (v) => {
    const p = blasiusMarch(v);
    return p[p.length - 1][2] - 1;
  };
  let ga = end(a), gb = end(b);
  for (let i = 0; i < 25; i++) {
    const c = b - (gb * (b - a)) / (gb - ga);
    const gc = end(c);
    a = b; ga = gb; b = c; gb = gc;
    if (Math.abs(gc) < 1e-10) break;
  }
  return b;
}

const nuLamPlate = (Re, Pr) => 0.664 * Math.cbrt(Pr) * Math.sqrt(Re);
const nuTurbPlate = (Re, Pr) =>
  (0.037 * Re ** 0.8 * Pr) / (1 + 2.443 * Re ** -0.1 * (Pr ** (2 / 3) - 1));
const nuCombPlate = (Re, Pr) => Math.hypot(nuLamPlate(Re, Pr), nuTurbPlate(Re, Pr));
const nuPipeLamT = (b) => Math.cbrt(49.371 + Math.pow(1.615 * Math.cbrt(b) - 0.7, 3));
const nuPipeLamQ = (b) => Math.cbrt(83.326 + Math.pow(1.953 * Math.cbrt(b) - 0.6, 3));
function nuGnielinski(Re, Pr, DoL = 0) {
  const xi = Math.pow(1.82 * Math.log10(Re) - 1.64, -2);
  return ((xi / 8) * (Re - 1000) * Pr) /
    (1 + 12.7 * Math.sqrt(xi / 8) * (Pr ** (2 / 3) - 1)) * (1 + DoL ** (2 / 3));
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

function btnStyle(active) {
  return {
    padding: "7px 16px", fontSize: 13.5, fontFamily: font, cursor: "pointer",
    borderRadius: 8, border: `1px solid ${active ? C.copperDeep : C.line}`,
    background: active ? C.copper : "#fff", color: active ? "#fff" : C.ink,
  };
}

function AxisBox({ W, H, pad, children }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, display: "block", margin: "6px auto" }}>
      <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} fill="#fff" stroke={C.line} />
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

/* fluids used across tabs */
const FLUIDS = [
  { key: "air", kr: "공기", en: "Air", nu: 15.9e-6, k: 0.0263, Pr: 0.707 },
  { key: "water", kr: "물(30°C)", en: "Water (30°C)", nu: 0.8e-6, k: 0.61, Pr: 5.4 },
  { key: "oil", kr: "경유(오일)", en: "Light oil", nu: 40e-6, k: 0.14, Pr: 100 },
];

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("대류: 흐르는 유체가 열을 나른다", "Convection: a moving fluid carries the heat")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "벽 위로 유체가 흐르면 벽 근처에 두 개의 층이 자랍니다 — 속도가 느려지는 운동량 경계층과 온도가 바뀌는 열 경계층. 벽 바로 위 유체는 정지해 있으므로(no-slip), 벽에서의 열전달은 결국 유체의 전도입니다:",
            "Fluid streaming over a wall grows two layers — a momentum boundary layer where velocity slows, and a thermal boundary layer where temperature adjusts. The fluid touching the wall is at rest (no-slip), so heat crosses the wall by conduction through the fluid:"
          )}
        </p>
        <Eq block>q = −k<sub>fluid</sub>·∂T/∂y|<sub>y=0</sub> = h(T<sub>s</sub> − T<sub>∞</sub>) &nbsp;&nbsp;⇒&nbsp;&nbsp; h {t("는 경계층이 결정한다", "is set by the boundary layer")}</Eq>
        <svg viewBox="0 0 560 150" style={{ width: "100%", maxWidth: 560, display: "block", margin: "8px auto" }}>
          <rect x="20" y="120" width="520" height="14" fill={C.copperPale} stroke={C.copper} />
          <text x="280" y="146" fontSize="11.5" textAnchor="middle" fill={C.copperDeep}>{t("가열 벽 T_s", "heated wall T_s")}</text>
          <path d="M 40 120 Q 200 70 540 40" fill="none" stroke={C.cool} strokeWidth="2" strokeDasharray="6 4" />
          <text x="440" y="34" fontSize="12" fill={C.cool}>{t("경계층 두께 δ(x) ∝ √x", "boundary layer δ(x) ∝ √x")}</text>
          {[80, 200, 330, 470].map((x0, i) => {
            const d = 24 + i * 18;
            const arrows = [];
            for (let j = 0; j <= 4; j++) {
              const yy = 118 - (j * d) / 4;
              const len = 12 + 38 * Math.pow(j / 4, 0.6);
              arrows.push(<line key={j} x1={x0} y1={yy} x2={x0 + len} y2={yy} stroke={C.ink} strokeWidth="1.6" markerEnd="url(#arr5)" />);
            }
            return <g key={i}>{arrows}</g>;
          })}
          <defs>
            <marker id="arr5" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L5,2.5 L0,5 z" fill={C.ink} />
            </marker>
          </defs>
        </svg>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "강제 대류는 펌프·바람이 흐름을 만들고(속도장을 먼저 풀고 온도장을 나중에), 자연 대류는 온도차가 만든 밀도차(부력)가 흐름 자체를 만듭니다 — 그래서 자연 대류에서는 열과 운동량이 얽혀 있습니다.",
            "In forced convection a pump or wind drives the flow (solve velocity first, temperature after); in natural convection the temperature-induced density difference is the flow's engine — heat and momentum are coupled."
          )}
        </p>
      </Panel>

      <Panel title={t("무차원수 지도 — 이번 주의 등장인물", "The dimensionless cast of this week")}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr style={{ background: C.copperPale }}>
                {[t("이름", "Name"), t("정의", "Definition"), t("의미", "Meaning")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "7px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Re", "vL/ν", t("관성 / 점성 — 층류·난류 판정", "inertia / viscosity — laminar vs turbulent")],
                ["Pr", "ν/α", t("운동량 확산 / 열 확산 — 유체의 성격", "momentum vs heat diffusion — the fluid's personality")],
                ["Nu", "hL/k_fluid", t("유체 내 전도저항 / 대류저항 — 결과물", "conduction vs convection resistance in the fluid — the answer")],
                ["Pe", "vL/α = Re·Pr", t("대류 수송 / 확산 수송", "convective vs diffusive transport")],
                ["Gr", "βΔT g L³/ν²", t("부력 / 점성력 — 자연 대류의 Re 역할", "buoyancy vs viscous force — natural convection's Re")],
                ["St", "h/(ρvc_p) = Nu/(Re·Pr)", t("실제 전달 / 수송 용량", "actual transfer vs carrying capacity")],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ border: `1px solid ${C.line}`, padding: "7px 10px", fontFamily: j === 1 ? mono : font }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          {t(
            "주의 — Nu ≠ Bi! 생김새(hL/k)는 같지만 분모의 k가 다릅니다. Nu의 k는 유체(경계층 안 전도), Bi의 k는 고체(물체 내부 전도)입니다. Nu는 '대류가 얼마나 잘 되나'의 답이고, Bi는 '고체 내부를 무시해도 되나'의 판정 기준입니다.",
            "Careful — Nu ≠ Bi! Same shape (hL/k), different k. Nu uses the fluid's k (conduction inside the boundary layer); Bi uses the solid's k (conduction inside the body). Nu answers 'how good is the convection'; Bi judges 'may I ignore the solid's interior'."
          )}
        </Note>
      </Panel>

      <Panel title={t("5주차 로드맵", "Week 5 roadmap")}>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("Pr 수 — 두 경계층의 두께 경쟁 (δ/δt ~ Pr^{1/3})", "The Prandtl number — the two layers' thickness contest (δ/δt ~ Pr^{1/3})")}</li>
          <li>{t("차원해석(Buckingham π): 강제 대류 Nu = f(Re, Pr), 자연 대류 Nu = f(Gr, Pr)", "Dimensional analysis (Buckingham π): forced Nu = f(Re, Pr), natural Nu = f(Gr, Pr)")}</li>
          <li>{t("Blasius 자기유사 해 — f f″ + 2f‴ = 0, 슈팅법으로 f″(0) = 0.332", "The Blasius similarity solution — f f″ + 2f‴ = 0, shooting gives f″(0) = 0.332")}</li>
          <li>{t("층류 평판: Nu_x = 0.332 Pr^{1/3} √Re_x (적분법은 0.36 — 8% 오차)", "Laminar plate: Nu_x = 0.332 Pr^{1/3} √Re_x (integral method: 0.36 — 8% off)")}</li>
          <li>{t("난류 천이: Re_crit = 5×10⁵, 결합식 √(Nu_lam² + Nu_turb²)", "Transition: Re_crit = 5×10⁵ and the blend √(Nu_lam² + Nu_turb²)")}</li>
          <li>{t("관내 강제 대류: 입구영역·Graetz, Nu_∞ = 3.66/4.364, Gnielinski, LMTD", "Pipe convection: entrance/Graetz, Nu_∞ = 3.66/4.364, Gnielinski, LMTD")}</li>
        </ol>
        <Note>
          {t("핵심 메시지: 4주차의 전도 해석이 '벽 안'이었다면, 이번 주는 '벽 바로 밖 유체'로 시선을 옮겨 h를 계산 가능한 양으로 만듭니다 — 3주차부터 써 온 그 h가 드디어 유도됩니다.",
            "Key message: Week 4 looked inside the wall; this week we step just outside, into the fluid, and make h computable — the very h we have been borrowing since Week 3 finally gets derived.")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Prandtl ---------------------------------- */
function TabPrandtl({ t }) {
  const [logPr, setLogPr] = useState(Math.log10(0.707));
  const Pr = 10 ** logPr;
  const ratio = Math.cbrt(Pr); // delta_M / delta_T ~ Pr^(1/3) (laminar, Pr >~ 0.6)

  const W = 620, H = 250, pad = { l: 20, r: 16, t: 14, b: 30 };
  const wallY = H - pad.b - 14;
  /* draw both layers growing as sqrt(x); thermal thickness scaled by 1/ratio */
  const dM = (x) => 90 * Math.sqrt(x); // px at x in [0,1]
  const mPts = [], tPts = [];
  for (let i = 0; i <= 100; i++) {
    const xf = i / 100;
    const X = pad.l + (W - pad.l - pad.r) * xf;
    mPts.push([X, wallY - Math.min(dM(xf), wallY - pad.t)]);
    tPts.push([X, wallY - Math.min(dM(xf) / Math.max(ratio, 0.2), wallY - pad.t)]);
  }

  const fluids = [
    { n: t("액체금속(수은)", "Liquid metal (Hg)"), Pr: "0.016", note: t("δt ≫ δ — 열이 훨씬 멀리 침투", "δt ≫ δ — heat outruns momentum") },
    { n: t("기체(공기)", "Gas (air)"), Pr: "0.7", note: t("두 층이 비슷", "the two layers are comparable") },
    { n: t("물(30 °C)", "Water (30 °C)"), Pr: "5.4", note: t("δ > δt", "δ > δt") },
    { n: t("해수", "Sea water"), Pr: "13", note: "" },
    { n: t("무거운 윤활유", "Heavy oil"), Pr: "~10³", note: t("δ ≫ δt — 열은 벽에 딱 붙음", "δ ≫ δt — heat hugs the wall") },
  ];

  return (
    <div>
      <Panel title={t("Prandtl 수: 유체의 '성격'", "The Prandtl number: a fluid's personality")}>
        <Eq block>Pr ≡ ν/α = {t("운동량 확산계수 / 열 확산계수", "momentum diffusivity / thermal diffusivity")} &nbsp;&nbsp;(ν = μ/ρ, α = k/ρc<sub>p</sub>)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "같은 확산이라도 '무엇이' 퍼지는가가 다릅니다. ν는 운동량이, α는 열이 퍼지는 속도입니다. 둘의 비 Pr는 물성만으로 정해지는 유체 고유의 수 — 기체는 ~1(같은 분자 충돌이 둘 다 운반), 액체는 >1, 액체금속은 ≪1(자유전자가 열만 빠르게 운반)입니다.",
            "Both are diffusivities — what differs is what diffuses. ν spreads momentum, α spreads heat. Their ratio Pr is a pure property of the fluid: gases sit near 1 (the same collisions carry both), liquids above 1, liquid metals far below 1 (free electrons rush the heat ahead)."
          )}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("층류 경계층에서 두께비는 (Pr ≳ 0.6에서) 대략", "In a laminar boundary layer the thickness ratio scales (for Pr ≳ 0.6) as")}
          {" "}<Eq>δ/δ<sub>t</sub> ≈ Pr<sup>1/3</sup></Eq>
        </p>
        <Slider
          label="log₁₀ Pr" value={logPr} min={-2} max={3} step={0.05}
          onChange={setLogPr} fmt={(v) => `Pr = ${(10 ** v).toPrecision(3)}`}
        />
        <AxisBox W={W} H={H} pad={pad}>
          <rect x={pad.l} y={wallY} width={W - pad.l - pad.r} height={12} fill={C.copperPale} stroke={C.copper} />
          {polyline(mPts, C.cool, 2.5)}
          {polyline(tPts, C.warn, 2.5, "6 4")}
          <text x={W - pad.r - 6} y={mPts[100][1] - 6} fontSize="12" textAnchor="end" fill={C.cool}>{t("운동량 경계층 δ", "momentum layer δ")}</text>
          <text x={W - pad.r - 6} y={tPts[100][1] - 6} fontSize="12" textAnchor="end" fill={C.warn}>{t("열 경계층 δt", "thermal layer δt")}</text>
          <text x={(pad.l + W - pad.r) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>{t("흐름 방향 x →", "flow direction x →")}</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
          δ/δt ≈ Pr^(1/3) = {ratio.toFixed(2)} {Pr < 0.6 ? t(" (Pr ≪ 1 영역은 별도 취급 — 액체금속)", " (Pr ≪ 1 needs separate treatment — liquid metals)") : ""}
        </div>
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr style={{ background: C.coolPale }}>
                {[t("유체", "Fluid"), "Pr", t("경계층 그림", "Boundary-layer picture")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fluids.map((f, i) => (
                <tr key={i}>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px" }}>{f.n}</td>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: mono }}>{f.Pr}</td>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px" }}>{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          {t(
            "강의의 CFD 그림이 이 표 그대로입니다: 수은(Pr = 0.016)은 두꺼운 열경계층이 관 전체를 물들이고, 공기(0.71)는 중간, 해수(13)는 벽에 얇게 붙은 붉은 띠만 보입니다.",
            "The lecture's CFD panels tell exactly this story: mercury (Pr = 0.016) floods the channel with a thick thermal layer, air (0.71) sits between, and sea water (13) shows only a thin hot ribbon glued to the wall."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Dimensional analysis ---------------------------------- */
function TabDimensional({ t }) {
  return (
    <div>
      <Panel title={t("차원해석: h를 어떤 무차원수로 묶을 것인가", "Dimensional analysis: which groups govern h?")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "강제 대류(관 내 유동)의 변수는 7개: D, ρ, μ, c_p, k, v, h. 기본 차원은 4개 — Buckingham π 정리에 따라 무차원수는 7 − 4 = 3개입니다:",
            "Forced convection in a tube involves seven variables: D, ρ, μ, c_p, k, v, h. With four base dimensions, Buckingham's π theorem leaves 7 − 4 = 3 groups:"
          )}
        </p>
        <Eq block>Nu = hD/k = f(Re, Pr), &nbsp;&nbsp; Re = Dvρ/μ, &nbsp; Pr = μc<sub>p</sub>/k &nbsp;&nbsp;({t("또는", "or")} St = h/ρvc<sub>p</sub> = g(Re, Pr))</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "자연 대류에서는 흐름을 만드는 것이 부력이므로 속도 v 대신 β(열팽창계수), g, ΔT가 등장합니다. 밀도 변화 ρ = ρ₀(1 − βΔT)에서 단위 부피당 부력 F = βρ₀ΔT·g 가 나오고, 이것과 점성력의 비가 Grashof 수입니다:",
            "In natural convection buoyancy makes the flow, so v gives way to β (thermal expansion), g, and ΔT. From ρ = ρ₀(1 − βΔT) the buoyant force per volume is F = βρ₀ΔT·g, and its ratio to viscous force is the Grashof number:"
          )}
        </p>
        <Eq block>Gr ≡ βΔT·g·L³/ν² &nbsp;&nbsp;⇒&nbsp;&nbsp; Nu = f(Pr, Gr)</Eq>
        <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: "6px 0" }}>
          <li>{t("10³ < Gr < 10⁶ : 층류 경계층", "10³ < Gr < 10⁶ : laminar boundary layer")}</li>
          <li>{t("Gr > 10⁸ : 난류 경계층", "Gr > 10⁸ : turbulent boundary layer")}</li>
        </ul>
        <Note>
          {t(
            "주의: 자연 대류의 L은 기하 치수가 아니라 '부력이 작동하는 수직 길이'입니다(강의 노트의 빨간 경고). 강제 대류의 L(관 지름 등 기하 치수)과 구별하세요.",
            "Caution: in natural convection L is the vertical length over which buoyancy acts, not a geometric size (the lecture's red note). Contrast with forced convection, where L is geometric (pipe diameter etc.)."
          )}
        </Note>
      </Panel>

      <Panel title={t("Péclet 수와 h_eff — Nu를 읽는 법", "The Péclet number and h_eff — how to read Nu")}>
        <Eq block>Pe ≡ vL/α = Re·Pr = {t("대류 수송 / 확산 수송", "convection / diffusion transport")}</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "Pe는 에너지 방정식에서 Re가 Navier–Stokes에서 하는 역할을 그대로 합니다. 그리고 Nu가 나오면 유효 대류계수는 h_eff = Nu·k_fluid/L — Nu는 물성이 아니라 유동이 결정하는 값이라는 것(강의 강조)이 핵심입니다.",
            "Pe plays in the energy equation the role Re plays in Navier–Stokes. Once Nu is known, h_eff = Nu·k_fluid/L — and the lecture's point stands: Nu is set by the flow, not a property of the material."
          )}
        </p>
        <Note>
          {t("1주차의 Peclet 수가 여기서 다시 등장합니다 — 같은 수가 열(RePr)과 물질(ReSc)에서 반복되는 것이 전달현상의 유사성입니다.",
            "Week 1's Péclet number returns — the same group recurring for heat (RePr) and mass (ReSc) is the transport-phenomena analogy at work.")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Blasius ---------------------------------- */
function TabBlasius({ t }) {
  const sol = useMemo(() => {
    const fpp0 = solveBlasius();
    const path = blasiusMarch(fpp0);
    const z99 = path.find((p) => p[2] >= 0.99)[0];
    const last = path[path.length - 1];
    return { fpp0, path, z99, beta: last[0] - last[1] };
  }, []);
  const [show, setShow] = useState("fp");

  const W = 620, H = 300, pad = { l: 52, r: 16, t: 14, b: 34 };
  const zMax = 8;
  const px = (v, vmax) => pad.l + (W - pad.l - pad.r) * (v / vmax);
  const py = (z) => H - pad.b - (H - pad.t - pad.b) * (z / zMax);

  const series = {
    f: { idx: 1, max: 6.5, col: C.cool, lab: "f(ζ)" },
    fp: { idx: 2, max: 1.05, col: C.copperDeep, lab: "f′(ζ) = vₓ/v∞" },
    fpp: { idx: 3, max: 0.36, col: C.warn, lab: "f″(ζ)" },
  };
  const s = series[show];
  const pts = sol.path.filter((p) => p[0] <= zMax).map((p) => [px(p[s.idx], s.max), py(p[0])]);

  return (
    <div>
      <Panel title={t("Blasius 방정식 — 경계층의 자기유사 해", "The Blasius equation — the boundary layer's similarity solution")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "정상 층류 평판 유동의 연속·운동량 방정식에, 4주차 반무한체와 똑같은 논리를 적용합니다: 경계층 두께 δ(x) ~ √(νx/v∞)가 유일한 길이이므로, 조합 변수 ζ = y/δ(x)와 유선함수 ψ = √(νxv∞)·f(ζ)를 도입하면 PDE 두 개가 ODE 하나로 붕괴합니다:",
            "Take the steady laminar continuity + momentum equations and reuse Week 4's semi-infinite logic: the only length is δ(x) ~ √(νx/v∞), so the composite variable ζ = y/δ(x) with stream function ψ = √(νxv∞)·f(ζ) collapses two PDEs into one ODE:"
          )}
        </p>
        <Eq block>f·f″ + 2f‴ = 0, &nbsp;&nbsp; f(0) = f′(0) = 0, &nbsp; f′(∞) = 1, &nbsp;&nbsp; v<sub>x</sub>/v<sub>∞</sub> = f′(ζ)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "비선형이라 해석해가 없어 수치로 풉니다. 초기 곡률 f″(0)을 추측해 적분하고, f′(∞) = 1이 맞도록 추측을 수정하는 슈팅법입니다. 아래 곡선은 지금 이 페이지에서 RK4 + 할선법으로 직접 계산한 결과입니다:",
            "It is nonlinear — no closed form — so we shoot: guess the initial curvature f″(0), integrate, and correct the guess until f′(∞) = 1. The curves below are computed live on this page by RK4 + secant:"
          )}
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <Seg
            options={[
              { v: "f", label: "f" },
              { v: "fp", label: "f′ (velocity)" },
              { v: "fpp", label: "f″ (shear)" },
            ]}
            value={show} onChange={setShow}
          />
        </div>
        <AxisBox W={W} H={H} pad={pad}>
          {polyline(pts, s.col, 2.5)}
          {show === "fp" && (
            <>
              <line x1={px(0.99, s.max)} y1={pad.t} x2={px(0.99, s.max)} y2={H - pad.b} stroke={C.inkSoft} strokeDasharray="4 3" />
              <line x1={pad.l} y1={py(sol.z99)} x2={W - pad.r} y2={py(sol.z99)} stroke={C.cool} strokeDasharray="4 3" />
              <text x={pad.l + 6} y={py(sol.z99) - 5} fontSize="11.5" fill={C.cool}>ζ₉₉ ≈ {sol.z99.toFixed(1)} → δ₉₉ ≈ 5x/√Re_x</text>
            </>
          )}
          {show === "fpp" && (
            <circle cx={px(sol.fpp0, s.max)} cy={py(0)} r={4} fill={C.warn} />
          )}
          {[0, 2, 4, 6, 8].map((z) => (
            <text key={z} x={pad.l - 8} y={py(z) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>{z}</text>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((fr) => (
            <text key={fr} x={px(fr * s.max, s.max)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>{(fr * s.max).toFixed(2)}</text>
          ))}
          <text x={W / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>{s.lab}</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>ζ = y/δ(x)</text>
        </AxisBox>

        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
          {t("슈팅 결과", "shooting result")}: f″(0) = {sol.fpp0.toFixed(6)} ({t("강의값", "lecture")} 0.332057) · β = lim(ζ−f) = {sol.beta.toFixed(4)} (1.720787)
        </div>
        <Eq block>τ<sub>w</sub> = 0.332·μv<sub>∞</sub>√(v<sub>∞</sub>/νx) &nbsp;⇒&nbsp; c<sub>f</sub>(x) = 0.664/√Re<sub>x</sub>, &nbsp; C<sub>f</sub> = 1.328/√Re<sub>L</sub></Eq>
        <Note>
          {t(
            "0.332라는 수 하나가 이번 주 전체를 지배합니다: 벽 전단(0.664 = 2×0.332), 그리고 다음 탭의 열전달(Nu_x = 0.332√Re_x)까지 — 운동량과 열의 유사성이 숫자로 나타난 것입니다.",
            "That single number 0.332 runs the whole week: wall shear (0.664 = 2×0.332) and, next tab, heat transfer (Nu_x = 0.332√Re_x) — the momentum–heat analogy made numerical."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Thermal BL & Nu ---------------------------------- */
function TabThermalNu({ t }) {
  const [fi, setFi] = useState(0);
  const [U, setU] = useState(5);
  const [showInt, setShowInt] = useState(false);
  const fl = FLUIDS[fi];
  const L = 0.5;

  const W = 620, H = 280, pad = { l: 56, r: 16, t: 14, b: 34 };
  const hOf = (x, pref) => (pref * Math.cbrt(fl.Pr) * Math.sqrt((U * x) / fl.nu) * fl.k) / x;
  const hMaxPlot = hOf(0.01, 0.332) * 1.05;
  const px = (x) => pad.l + (W - pad.l - pad.r) * (x / L);
  const py = (h) => H - pad.b - (H - pad.t - pad.b) * Math.min(h / hMaxPlot, 1);
  const hPts = [], iPts = [];
  for (let i = 1; i <= 150; i++) {
    const x = (L * i) / 150;
    hPts.push([px(x), py(hOf(x, 0.332))]);
    iPts.push([px(x), py(hOf(x, 0.36))]);
  }
  const ReL = (U * L) / fl.nu;
  const laminar = ReL < 5e5;
  const NuL = nuLamPlate(ReL, fl.Pr);
  const hbar = (NuL * fl.k) / L;

  return (
    <div>
      <Panel title={t("열 경계층: 같은 방정식, 같은 해", "The thermal boundary layer: same equation, same solution")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "에너지 방정식 vₓ∂T/∂x + v_y∂T/∂y = α∂²T/∂y² 은 운동량 방정식과 구조·경계조건이 같습니다. Pr = 1이면 무차원 온도 Θ = (T−Ts)/(T∞−Ts)가 속도비 f′(ζ)와 완전히 같은 함수가 되고, 벽 기울기 0.332를 그대로 물려받습니다:",
            "The energy equation vₓ∂T/∂x + v_y∂T/∂y = α∂²T/∂y² shares its structure and BCs with the momentum equation. For Pr = 1 the dimensionless temperature Θ = (T−Ts)/(T∞−Ts) is the very function f′(ζ), inheriting the wall slope 0.332:"
          )}
        </p>
        <Eq block>Nu<sub>x</sub> = h<sub>x</sub>x/k = 0.332·√Re<sub>x</sub> &nbsp;&nbsp;(Pr = 1)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("Pr ≠ 1이면 두께비 δ/δt ≈ Pr^{1/3} 보정이 붙고, 판 전체 평균은 적분으로 2배가 됩니다:",
            "For Pr ≠ 1 the thickness ratio δ/δt ≈ Pr^{1/3} enters, and integrating over the plate doubles the prefactor:")}
        </p>
        <Eq block>Nu<sub>x</sub> = 0.332·Pr<sup>1/3</sup>√Re<sub>x</sub>, &nbsp;&nbsp; ⟨Nu⟩ = 0.664·Pr<sup>1/3</sup>√Re<sub>L</sub> = 2·Nu<sub>x=L</sub></Eq>
      </Panel>

      <Panel title={t("국소 h_x 탐색기 — 왜 앞전이 제일 잘 식나", "Local h_x explorer — why the leading edge cools best")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <Seg options={FLUIDS.map((f, i) => ({ v: i, label: t(f.kr, f.en) }))} value={fi} onChange={setFi} />
          <label style={{ fontSize: 13.5, color: C.inkSoft, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={showInt} onChange={(e) => setShowInt(e.target.checked)} style={{ accentColor: C.copper }} />
            {t("적분법(0.36) 겹쳐 보기", "Overlay integral method (0.36)")}
          </label>
        </div>
        <Slider label={t("자유흐름 속도 v∞", "Free-stream speed v∞")} value={U} min={0.5} max={20} step={0.5} onChange={setU} unit=" m/s" />

        <AxisBox W={W} H={H} pad={pad}>
          {showInt && polyline(iPts, C.warn, 2, "6 4")}
          {polyline(hPts, C.copperDeep, 2.5)}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
            <text key={v} x={px(v)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>{v.toFixed(1)}</text>
          ))}
          {[0, 0.5, 1].map((fr) => (
            <text key={fr} x={pad.l - 8} y={py(fr * hMaxPlot) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>{(fr * hMaxPlot).toFixed(0)}</text>
          ))}
          <text x={W / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x [m]</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>h_x [W/m²K]</text>
        </AxisBox>

        <div style={{ fontFamily: mono, fontSize: 13.5, background: laminar ? C.copperPale : "#f9e8e2", borderRadius: 8, padding: "10px 12px" }}>
          Re_L = {ReL.toExponential(2)} {laminar ? "(< 5×10⁵ laminar)" : t("(> 5×10⁵ — 층류식 범위 밖! 다음 탭 참조)", "(> 5×10⁵ — beyond laminar! see next tab)")} · ⟨Nu⟩ = {NuL.toFixed(1)} · h̄ = {hbar.toFixed(1)} W/m²K
        </div>
        <Note>
          {t(
            "h_x ∝ x^{−1/2}: 앞전에서는 경계층이 얇아 온도 기울기가 가파르고, 하류로 갈수록 두꺼워져 무뎌집니다. 적분법(3차 다항 프로파일 가정)은 정확해의 0.332 대신 0.36을 주는데 — 오차 8%로, Blasius를 몰라도 물리 스케일링은 그대로 얻어진다는 것이 강의의 교훈입니다.",
            "h_x ∝ x^{−1/2}: near the leading edge the layer is thin and the gradient steep; downstream it thickens and dulls. The integral method (assumed cubic profile) gives 0.36 instead of 0.332 — 8% off, showing you can capture the full physics scaling without ever solving Blasius."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Transition ---------------------------------- */
function TabTransition({ t }) {
  const [Pr, setPr] = useState(0.707);
  const W = 620, H = 300, pad = { l: 56, r: 16, t: 14, b: 36 };
  const lRe = [2, 7], lNu = [0, 5]; // log ranges
  const px = (Re) => pad.l + (W - pad.l - pad.r) * ((Math.log10(Re) - lRe[0]) / (lRe[1] - lRe[0]));
  const py = (Nu) => H - pad.b - (H - pad.t - pad.b) * ((Math.log10(Math.max(Nu, 1)) - lNu[0]) / (lNu[1] - lNu[0]));

  const mk = (fn) => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const Re = 10 ** (lRe[0] + ((lRe[1] - lRe[0]) * i) / 200);
      pts.push([px(Re), py(fn(Re, Pr))]);
    }
    return pts;
  };

  return (
    <div>
      <Panel title={t("층류 → 난류: 경계층이 뒤집히면 h가 뛴다", "Laminar → turbulent: the layer trips and h jumps")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "평판 경계층은 Re_x ≈ 5×10⁵ 에서 층류 → 천이 → 난류로 바뀝니다. 난류의 소용돌이는 분자 확산보다 훨씬 효율적인 '에디' 수송을 만들고(ε_H ≫ α), 시간평균 열유속에 ρc_p⟨T′v_y′⟩ 항이 추가됩니다. 난류 Prandtl 수는 ≈ 1 — 에디는 운동량이든 열이든 같은 덩어리로 나르기 때문입니다.",
            "The plate boundary layer trips at Re_x ≈ 5×10⁵. Turbulent eddies transport far better than molecules (ε_H ≫ α), adding a ρc_p⟨T′v_y′⟩ term to the mean flux. The turbulent Prandtl number is ≈ 1 — an eddy carries momentum and heat as one parcel."
          )}
        </p>
        <Eq block>⟨Nu<sub>turb</sub>⟩ = 0.037·Re<sup>0.8</sup>Pr / [1 + 2.443·Re<sup>−0.1</sup>(Pr<sup>2/3</sup> − 1)], &nbsp;&nbsp; ⟨Nu⟩ = √(⟨Nu<sub>lam</sub>⟩² + ⟨Nu<sub>turb</sub>⟩²)</Eq>
        <Slider
          label="Pr" value={Pr} min={0.6} max={100} step={0.1}
          onChange={setPr} fmt={(v) => v.toFixed(1)}
        />
        <AxisBox W={W} H={H} pad={pad}>
          {[2, 3, 4, 5, 6, 7].map((e) => (
            <g key={e}>
              <line x1={px(10 ** e)} y1={pad.t} x2={px(10 ** e)} y2={H - pad.b} stroke={C.line} />
              <text x={px(10 ** e)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>10^{e}</text>
            </g>
          ))}
          {[0, 1, 2, 3, 4, 5].map((e) => (
            <text key={e} x={pad.l - 8} y={py(10 ** e) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>10^{e}</text>
          ))}
          <line x1={px(5e5)} y1={pad.t} x2={px(5e5)} y2={H - pad.b} stroke={C.warn} strokeDasharray="5 4" strokeWidth="1.5" />
          <text x={px(5e5) + 4} y={pad.t + 14} fontSize="11.5" fill={C.warn}>Re_crit = 5×10⁵</text>
          {polyline(mk(nuLamPlate), C.cool, 1.6, "5 4")}
          {polyline(mk(nuTurbPlate), C.warn, 1.6, "5 4")}
          {polyline(mk(nuCombPlate), C.ink, 2.8)}
          <text x={W - pad.r - 8} y={pad.t + 16} fontSize="11.5" textAnchor="end" fill={C.cool}>{t("층류 0.664√Re", "laminar 0.664√Re")}</text>
          <text x={W - pad.r - 8} y={pad.t + 31} fontSize="11.5" textAnchor="end" fill={C.warn}>{t("난류 ~Re^0.8", "turbulent ~Re^0.8")}</text>
          <text x={W - pad.r - 8} y={pad.t + 46} fontSize="11.5" textAnchor="end" fill={C.ink}>{t("결합식", "combined")}</text>
          <text x={W / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>Re</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>⟨Nu⟩</text>
        </AxisBox>
        <Note>
          {t(
            "제곱합 제곱근(√(lam² + turb²)) 결합식은 낮은 Re에서 층류선을, 높은 Re에서 난류선을 자동으로 따라가며 천이 구간(10 < Re < 10⁷, 0.6 < Pr < 2000)을 매끄럽게 잇습니다. 난류 쪽 기울기(∝Re^0.8)가 층류(∝Re^0.5)보다 가파른 것 — 난류가 '섞어주는' 만큼 h가 유속에 더 민감해집니다.",
            "The quadrature blend √(lam² + turb²) rides the laminar line at low Re and the turbulent line at high Re, bridging the transition band (10 < Re < 10⁷, 0.6 < Pr < 2000). Note the steeper turbulent slope (∝Re^0.8 vs ∝Re^0.5) — the more the flow stirs, the more h rewards extra speed."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: Pipe flow ---------------------------------- */
function TabPipe({ t }) {
  const [v, setV] = useState(0.05);
  const [Dcm, setDcm] = useState(2);
  const [L, setL] = useState(3);
  // water ~30C
  const rho = 997, cp = 4180, k = 0.61, nuw = 0.658e-6, Pr = 4.34;
  const Tw = 80, Tin = 20;

  const res = useMemo(() => {
    const D = Dcm / 100;
    const Re = (v * D) / nuw;
    const Pe = Re * Pr;
    const beta = (Pe * D) / L;
    const turb = Re > 2300;
    const Nu = turb ? nuGnielinski(Math.max(Re, 3000), Pr, D / L) : nuPipeLamT(beta);
    const h = (Nu * k) / D;
    const mdot = rho * v * Math.PI * D * D / 4;
    const A = Math.PI * D * L;
    const Tout = Tw - (Tw - Tin) * Math.exp((-h * A) / (mdot * cp));
    const dTin = Tw - Tin, dTout = Tw - Tout;
    const LMTD = (dTin - dTout) / Math.log(dTin / dTout);
    const Q = h * A * LMTD;
    return { D, Re, Pe, beta, turb, Nu, h, Tout, LMTD, Q };
  }, [v, Dcm, L]);

  /* entrance-effect curve Nu(beta) */
  const W = 620, H = 260, pad = { l: 52, r: 16, t: 14, b: 36 };
  const lB = [-1, 3];
  const px = (b) => pad.l + (W - pad.l - pad.r) * ((Math.log10(b) - lB[0]) / (lB[1] - lB[0]));
  const py = (Nu) => H - pad.b - (H - pad.t - pad.b) * Math.min(Nu / 20, 1);
  const cT = [], cQ = [];
  for (let i = 0; i <= 160; i++) {
    const b = 10 ** (lB[0] + ((lB[1] - lB[0]) * i) / 160);
    cT.push([px(b), py(nuPipeLamT(b))]);
    cQ.push([px(b), py(nuPipeLamQ(b))]);
  }

  return (
    <div>
      <Panel title={t("관내 층류: 입구영역과 두 개의 극한값", "Laminar pipe flow: the entrance region and two limits")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "완전발달 Poiseuille 유동에 벽 온도가 갑자기 T_s로 바뀌는 Graetz 문제입니다. 해는 4주차 평판처럼 고유함수 급수이고, 지배 변수는 입구 매개변수 β = Pe·D/x 하나입니다. 관이 충분히 길면(β→0) Nu가 상수로 수렴합니다:",
            "The Graetz problem: fully developed Poiseuille flow meets a suddenly hot wall. The solution is an eigenfunction series (like Week 4's slab), governed by one entrance parameter β = Pe·D/x. For long pipes (β→0) Nu saturates:"
          )}
        </p>
        <Eq block>Nu<sub>∞</sub> = 3.660 ({t("벽 온도 일정", "const wall T")}), &nbsp;&nbsp; 4.364 ({t("벽 열유속 일정", "const wall flux")})</Eq>
        <AxisBox W={W} H={H} pad={pad}>
          {[-1, 0, 1, 2, 3].map((e) => (
            <text key={e} x={px(10 ** e)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>10^{e}</text>
          ))}
          {[0, 5, 10, 15, 20].map((n) => (
            <text key={n} x={pad.l - 8} y={py(n) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>{n}</text>
          ))}
          <line x1={pad.l} y1={py(3.66)} x2={W - pad.r} y2={py(3.66)} stroke={C.cool} strokeDasharray="3 3" />
          <line x1={pad.l} y1={py(4.364)} x2={W - pad.r} y2={py(4.364)} stroke={C.warn} strokeDasharray="3 3" />
          {polyline(cT, C.cool, 2.4)}
          {polyline(cQ, C.warn, 2.4, "7 4")}
          <text x={pad.l + 8} y={py(3.66) + 14} fontSize="11.5" fill={C.cool}>3.660</text>
          <text x={pad.l + 8} y={py(4.364) - 6} fontSize="11.5" fill={C.warn}>4.364</text>
          <text x={W - pad.r - 8} y={pad.t + 16} fontSize="11.5" textAnchor="end" fill={C.cool}>{t("벽 온도 일정", "const wall T")}</text>
          <text x={W - pad.r - 8} y={pad.t + 31} fontSize="11.5" textAnchor="end" fill={C.warn}>{t("열유속 일정", "const wall flux")}</text>
          <text x={W / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>⟨β⟩ = Pe·D/L</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>⟨Nu⟩</text>
        </AxisBox>
        <Note>
          {t(
            "짧은 관(β 큼)은 입구의 얇은 열경계층 덕에 Nu가 크고, 긴 관은 프로파일이 완전발달해 상수로 떨어집니다 — 4주차의 '1항 근사'와 같은 구조입니다: 고차 모드가 죽고 최저차 고유값만 남은 것이 3.660입니다.",
            "Short pipes (large β) enjoy a thin entrance layer and high Nu; long pipes settle to the constant — structurally Week 4's one-term story again: higher modes die and 3.660 is the surviving lowest eigenvalue."
          )}
        </Note>
      </Panel>

      <Panel title={t("파이프 가열 계산기 (물, 벽 80 °C)", "Pipe-heating calculator (water, wall at 80 °C)")}>
        <Slider label={t("평균 유속 v", "Mean speed v")} value={v} min={0.01} max={2} step={0.01} onChange={setV} unit=" m/s" fmt={(x) => x.toFixed(2)} />
        <Slider label={t("지름 D", "Diameter D")} value={Dcm} min={0.5} max={5} step={0.1} onChange={setDcm} unit=" cm" fmt={(x) => x.toFixed(1)} />
        <Slider label={t("길이 L", "Length L")} value={L} min={0.5} max={10} step={0.5} onChange={setL} unit=" m" fmt={(x) => x.toFixed(1)} />

        <div style={{
          display: "inline-block", padding: "6px 14px", borderRadius: 8, marginBottom: 8,
          background: res.turb ? "#f9e8e2" : "#e8f2ea",
          border: `1px solid ${res.turb ? C.warn : C.good}`,
          color: res.turb ? C.warn : C.good, fontWeight: 700, fontSize: 13.5,
        }}>
          Re = {res.Re.toFixed(0)} — {res.turb
            ? t("난류 (Gnielinski 상관식)", "turbulent (Gnielinski)")
            : t("층류 (입구영역 상관식)", "laminar (entrance correlation)")}
        </div>

        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px", lineHeight: 1.9 }}>
          Pe = {res.Pe.toFixed(0)} · β = Pe·D/L = {res.beta.toFixed(1)}<br />
          Nu = {res.Nu.toFixed(2)} → h = {res.h.toFixed(0)} W/m²K<br />
          T<sub>out</sub> = {res.Tout.toFixed(1)} °C · LMTD = {res.LMTD.toFixed(1)} K · Q = h·A·LMTD = {res.Q.toFixed(0)} W
        </div>
        <Eq block>ΔT<sub>lm</sub> = (ΔT<sub>in</sub> − ΔT<sub>out</sub>) / ln(ΔT<sub>in</sub>/ΔT<sub>out</sub>), &nbsp;&nbsp; Q = h·A·ΔT<sub>lm</sub> = ṁc<sub>p</sub>(T<sub>out</sub> − T<sub>in</sub>)</Eq>
        <Note>
          {t(
            "유속을 층류(≲0.07 m/s)에서 난류로 올려 보세요 — h가 한 자릿수 뛰는 것을 볼 수 있습니다. LMTD는 벽 온도가 일정할 때 에너지수지와 정확히 일치하는 평균 온도차이며, 6주차 열교환기 설계의 주인공이 됩니다.",
            "Push the speed from laminar (≲0.07 m/s) into turbulence — watch h jump an order of magnitude. The LMTD is the mean temperature difference that exactly closes the energy balance for a constant-temperature wall, and it stars in Week 6's heat-exchanger design."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. 공기(ν = 15.9×10⁻⁶ m²/s, k = 0.0263 W/mK, Pr = 0.707)가 v∞ = 5 m/s로 길이 0.5 m 평판 위를 흐른다. (a) 층류 여부를 판정하라. (b) x = 0.25 m에서 경계층 두께 δ₉₉와 국소 c_f를 구하라. (c) 판이 60 °C, 공기가 20 °C일 때 폭 0.5 m 판의 총 열전달률을 구하라.",
        "P1. Air (ν = 15.9×10⁻⁶ m²/s, k = 0.0263 W/mK, Pr = 0.707) flows at v∞ = 5 m/s over a 0.5 m plate. (a) Is the flow laminar? (b) Find δ₉₉ and the local c_f at x = 0.25 m. (c) With the plate at 60 °C and air at 20 °C, find the total heat rate for a 0.5 m-wide plate."
      ),
      s: t(
        "(a) Re_L = 5×0.5/15.9×10⁻⁶ = 1.57×10⁵ < 5×10⁵ → 전체 층류. (b) Re_x = 7.86×10⁴; δ₉₉ ≈ 5x/√Re_x = 5×0.25/280.4 = 4.5 mm; c_f = 0.664/√Re_x = 2.37×10⁻³. (c) ⟨Nu⟩ = 0.664×0.707^{1/3}×√(1.57×10⁵) = 234.6 → h̄ = 234.6×0.0263/0.5 = 12.3 W/m²K → Q = 12.3×0.25×40 ≈ 123 W.",
        "(a) Re_L = 5×0.5/15.9×10⁻⁶ = 1.57×10⁵ < 5×10⁵ → laminar throughout. (b) Re_x = 7.86×10⁴; δ₉₉ ≈ 5x/√Re_x = 4.5 mm; c_f = 0.664/√Re_x = 2.37×10⁻³. (c) ⟨Nu⟩ = 0.664×0.707^{1/3}×√(1.57×10⁵) = 234.6 → h̄ = 12.3 W/m²K → Q = 12.3×(0.5×0.5)×40 ≈ 123 W."
      ),
    },
    {
      q: t(
        "P2. Nu와 Bi는 둘 다 hL/k 꼴이다. (a) 두 수의 물리적 차이를 분모의 k를 중심으로 설명하라. (b) 뜨거운 공기 중의 구리 구슬에서 Nu = 10일 때 Bi를 추정하라 (k_air = 0.026, k_Cu = 390 W/mK, 같은 L 사용).",
        "P2. Nu and Bi both look like hL/k. (a) Explain the physical difference, focusing on which k sits in the denominator. (b) For a copper bead in hot air with Nu = 10, estimate Bi (k_air = 0.026, k_Cu = 390 W/mK, same L)."
      ),
      s: t(
        "(a) Nu = hL/k_fluid: 유체 경계층 안 전도저항 대 대류저항 — 대류 성능의 결과. Bi = hL/k_solid: 고체 내부 전도저항 대 표면 대류저항 — lumped 근사 판정. (b) h = Nu·k_air/L 이므로 Bi = Nu·(k_air/k_Cu) = 10×0.026/390 = 6.7×10⁻⁴ ≪ 0.1 → 구슬 내부는 등온, 4주차 집중용량법 적용 가능.",
        "(a) Nu = hL/k_fluid: conduction vs convection resistance inside the fluid — the outcome of convection. Bi = hL/k_solid: the solid's internal conduction vs surface convection — the lumped-model test. (b) h = Nu·k_air/L, so Bi = Nu·(k_air/k_Cu) = 10×0.026/390 = 6.7×10⁻⁴ ≪ 0.1 → the bead is isothermal; Week 4's lumped model applies."
      ),
    },
    {
      q: t(
        "P3. 바람(공기)이 L = 2 m 지붕 패널 위를 10 m/s로 분다. (a) Re_L과 천이 위치 x_crit를 구하라. (b) 결합 상관식으로 ⟨Nu⟩와 h̄를 구하라. (c) 층류식만 썼다면 h를 얼마나 과소평가했겠는가?",
        "P3. Wind (air) blows at 10 m/s over an L = 2 m roof panel. (a) Find Re_L and the transition location x_crit. (b) Use the combined correlation for ⟨Nu⟩ and h̄. (c) How much would the laminar-only formula underestimate h?"
      ),
      s: t(
        "(a) Re_L = 10×2/15.9×10⁻⁶ = 1.26×10⁶ > 5×10⁵; x_crit = 5×10⁵×15.9×10⁻⁶/10 = 0.80 m — 판의 60%가 난류. (b) Nu_lam = 0.664×0.89×√(1.26×10⁶) = 663, Nu_turb = 0.037×(1.26×10⁶)^0.8×0.707/(1+2.443×(1.26×10⁶)^{-0.1}×(−0.2093)) ≈ 2266 → ⟨Nu⟩ = √(663²+2266²) ≈ 2361 → h̄ = 2361×0.0263/2 ≈ 31 W/m²K. (c) 층류식만이면 h̄ = 663×0.0263/2 ≈ 8.7 W/m²K — 3.6배 과소평가.",
        "(a) Re_L = 10×2/15.9×10⁻⁶ = 1.26×10⁶ > 5×10⁵; x_crit = 5×10⁵×15.9×10⁻⁶/10 = 0.80 m — 60% of the panel is turbulent. (b) Nu_lam = 663, Nu_turb ≈ 2266 → ⟨Nu⟩ = √(663²+2266²) ≈ 2361 → h̄ ≈ 31 W/m²K. (c) Laminar-only gives h̄ ≈ 8.7 W/m²K — an underestimate by a factor of ~3.6."
      ),
    },
    {
      q: t(
        "P4. 물(ρ = 997, c_p = 4180, k = 0.61, ν = 0.658×10⁻⁶, Pr = 4.34)이 D = 2 cm, L = 3 m 관을 v = 0.05 m/s로 흐르고 벽은 80 °C, 입구는 20 °C다. (a) Re로 층류를 확인하고 β = Pe·D/L을 구하라. (b) ⟨Nu⟩ = (49.371+(1.615β^{1/3}−0.7)³)^{1/3}로 h를 구하라. (c) 출구온도와 LMTD, Q를 구하고 에너지수지로 검산하라.",
        "P4. Water (ρ = 997, c_p = 4180, k = 0.61, ν = 0.658×10⁻⁶, Pr = 4.34) flows at v = 0.05 m/s through a D = 2 cm, L = 3 m pipe; wall at 80 °C, inlet at 20 °C. (a) Confirm laminar flow and find β = Pe·D/L. (b) Get h from ⟨Nu⟩ = (49.371+(1.615β^{1/3}−0.7)³)^{1/3}. (c) Find T_out, the LMTD, and Q; check with the energy balance."
      ),
      s: t(
        "(a) Re = 0.05×0.02/0.658×10⁻⁶ = 1520 < 2300 → 층류; Pe = Re·Pr = 6597; β = 6597×0.02/3 = 44.0. (b) β^{1/3} = 3.53 → (1.615×3.53−0.7)³ = 125.5 → ⟨Nu⟩ = (49.4+125.5)^{1/3} = 5.59 → h = 5.59×0.61/0.02 = 170 W/m²K. (c) ṁ = 997×0.05×π×10⁻⁴ = 0.01566 kg/s; hA/ṁc_p = 170×0.1885/65.4 = 0.491 → T_out = 80 − 60e^{−0.491} = 43.3 °C; LMTD = (60−36.7)/ln(60/36.7) = 47.4 K; Q = 170×0.1885×47.4 ≈ 1523 W = ṁc_pΔT ✓.",
        "(a) Re = 1520 < 2300 → laminar; Pe = 6597; β = 44.0. (b) ⟨Nu⟩ = (49.4+125.5)^{1/3} = 5.59 → h = 170 W/m²K. (c) ṁ = 0.01566 kg/s; hA/ṁc_p = 0.491 → T_out = 80 − 60e^{−0.491} = 43.3 °C; LMTD = 47.4 K; Q = h·A·LMTD ≈ 1523 W = ṁc_pΔT ✓."
      ),
    },
  ];
  const [open, setOpen] = useState(problems.map(() => false));
  return (
    <div>
      {problems.map((p, i) => (
        <Panel key={i}>
          <div style={{ fontSize: 14, lineHeight: 1.75 }}>{p.q}</div>
          <button
            onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
            style={{ ...btnStyle(open[i]), marginTop: 10 }}
          >
            {open[i] ? t("풀이 접기", "Hide solution") : t("풀이 보기", "Show solution")}
          </button>
          {open[i] && (
            <div style={{ marginTop: 10, background: C.copperPale, borderRadius: 8, padding: "12px 14px", fontSize: 14, lineHeight: 1.75 }}>
              {p.s}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---------------------------------- Tab 9: Code ---------------------------------- */
function TabCode({ t }) {
  const topics = ["topic1", "topic2", "topic3", "topic4"];
  const langs = [
    { key: "python", label: "Python" },
    { key: "matlab", label: "MATLAB" },
    { key: "julia", label: "Julia" },
    { key: "cpp", label: "C++" },
  ];
  const [topic, setTopic] = useState("topic1");
  const [lang, setLang] = useState("python");
  const [copied, setCopied] = useState(false);
  const code = WEEK5_CODES[topic][lang];

  const copy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* clipboard unavailable */ }
  };

  return (
    <div>
      <Panel title={t("실습 코드: 4개 주제 × 4개 언어", "Hands-on code: 4 topics × 4 languages")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {topics.map((tp) => (
            <button key={tp} onClick={() => setTopic(tp)} style={btnStyle(topic === tp)}>
              {WEEK5_CODES[tp].title}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <Seg options={langs.map((l) => ({ v: l.key, label: l.label }))} value={lang} onChange={setLang} />
          <button onClick={copy} style={btnStyle(copied)}>{copied ? t("복사됨 ✓", "Copied ✓") : t("코드 복사", "Copy code")}</button>
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
            "Python·C++ 버전은 실행·수치 검증을 마쳤습니다: 슈팅법이 f″(0) = 0.332057과 β = 1.720787을 강의값 그대로 재현하고, 관내 상관식의 극한 Nu → 3.660/4.364, LMTD와 에너지수지의 일치(Q = h·A·LMTD = ṁc_pΔT)도 확인했습니다. MATLAB 버전은 그림 출력을 포함합니다.",
            "The Python and C++ versions were executed and numerically verified: the shooting method reproduces f″(0) = 0.332057 and β = 1.720787 exactly; the pipe correlations reach the limits Nu → 3.660/4.364; and Q = h·A·LMTD matches ṁc_pΔT to machine precision. The MATLAB versions include the plots."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week5App({ language = "kr", onBack }) {
  const [lang, setLang] = useState(language);
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: "Pr", comp: <TabPrandtl t={t} /> },
    { label: t("차원해석", "Dimensional"), comp: <TabDimensional t={t} /> },
    { label: "Blasius", comp: <TabBlasius t={t} /> },
    { label: t("열경계층·Nu", "Thermal BL & Nu"), comp: <TabThermalNu t={t} /> },
    { label: t("난류 천이", "Transition"), comp: <TabTransition t={t} /> },
    { label: t("관내 대류", "Pipe flow"), comp: <TabPipe t={t} /> },
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
                Heat & Mass Transfer · Week 5
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("대류 열전달", "Convective Heat Transfer")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("두 경계층 — Pr·Re·Nu·Gr — Blasius 해(슈팅법) — 층류 평판 Nu — 난류 천이 — 관내 대류·LMTD",
                   "Two boundary layers — Pr·Re·Nu·Gr — Blasius (shooting) — laminar-plate Nu — transition — pipe convection & LMTD")}
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
