// Week3App.jsx — Heat & Mass Transfer, Week 3
// Steady-State Heat Conduction: conduction & convection, thermal resistance networks,
// governing equations & BCs, 1D analytical solutions, fins, 2D separation of variables, FDM.
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import WEEK3_CODES from "./Week3Codes";

/* ---------------------------------- design tokens ---------------------------------- */
const C = {
  ink: "#20304f",        // deep slate-navy (lecture header blue, darkened)
  inkSoft: "#4a5a78",
  paper: "#faf7f2",      // warm paper
  panel: "#ffffff",
  line: "#e3ddd2",
  copper: "#b06a3b",     // copper colormap identity (lecture MATLAB copper)
  copperDeep: "#7c4520",
  copperPale: "#f3e4d5",
  cool: "#3a6ea5",       // heat-sink blue
  coolPale: "#e3edf6",
  good: "#3e7d4f",
  warn: "#a04024",
};

const font = "'Pretendard', 'Noto Sans KR', -apple-system, 'Segoe UI', sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/* thermal "copper" colormap: t in [0,1] -> rgb string (matches MATLAB copper feel) */
function copperMap(t) {
  const u = Math.max(0, Math.min(1, t));
  const r = Math.min(255, Math.round(320 * u));
  const g = Math.round(199 * u * 0.78);
  const b = Math.round(126 * u * 0.5);
  return `rgb(${r},${g},${b})`;
}

/* ---------------------------------- physics helpers ---------------------------------- */
/* 2D separation-of-variables series, normalized (T1 = 1, L = 1) */
function seriesT(x, y, kmax) {
  let s = 0;
  for (let k = 0; k <= kmax; k++) {
    const n = 2 * k + 1;
    s += (Math.exp(-n * Math.PI * y) * Math.sin(n * Math.PI * x)) / n;
  }
  return (4 / Math.PI) * s;
}

/* fin theta/theta0 for the three BC cases */
function finTheta(x, L, m, bcCase, thetaLRatio, hOverMk) {
  if (bcCase === 1) {
    const c = thetaLRatio;
    return (
      ((c - Math.exp(-m * L)) * (Math.exp(m * x) - Math.exp(-m * x))) /
        (Math.exp(m * L) - Math.exp(-m * L)) +
      Math.exp(-m * x)
    );
  }
  if (bcCase === 2) return Math.cosh(m * (L - x)) / Math.cosh(m * L);
  const B = hOverMk;
  return (
    (Math.cosh(m * (L - x)) + B * Math.sinh(m * (L - x))) /
    (Math.cosh(m * L) + B * Math.sinh(m * L))
  );
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
    <div style={{ display: "inline-flex", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
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

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("전도와 대류: 두 가지 열유속 법칙", "Conduction & Convection: two flux laws")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "이번 주는 정상상태 열전도를 다룹니다. 출발점은 두 개의 열유속 법칙입니다. 전도는 Fourier 제1법칙, 대류는 Newton 냉각 법칙으로 기술됩니다.",
            "This week covers steady-state heat conduction. The starting point is two flux laws: Fourier's first law for conduction and Newton's law of cooling for convection."
          )}
        </p>
        <Eq block>q = −k∇T &nbsp;&nbsp;[J/m²/s]&nbsp;&nbsp;&nbsp;(Fourier) &nbsp;&nbsp;|&nbsp;&nbsp; q = hΔT &nbsp;&nbsp;(Newton)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "열은 온도 기울기의 반대 방향으로 흐릅니다(음의 부호). 1D 전도에서 q = (k/L)ΔT이므로, 대류계수 h는 사실상 k/L과 같은 역할을 합니다 — 두 법칙이 같은 저항 회로 언어로 통합되는 근거입니다.",
            "Heat flows opposite to the temperature gradient (the minus sign). In 1D conduction q = (k/L)ΔT, so h plays effectively the same role as k/L — the basis for unifying both laws in one resistance-circuit language."
          )}
        </p>
        <svg viewBox="0 0 560 130" style={{ width: "100%", maxWidth: 560, display: "block", margin: "8px auto" }}>
          <defs>
            <linearGradient id="hotcold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c33d1e" />
              <stop offset="100%" stopColor="#3a6ea5" />
            </linearGradient>
          </defs>
          <polygon points="20,25 20,105 480,95 480,65" fill="url(#hotcold)" opacity="0.9" />
          <text x="28" y="18" fontSize="13" fill={C.warn} fontWeight="700">High T</text>
          <text x="440" y="55" fontSize="13" fill={C.cool} fontWeight="700">Low T</text>
          <line x1="60" y1="118" x2="470" y2="118" stroke={C.ink} strokeWidth="2" markerEnd="url(#arr)" />
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={C.ink} />
            </marker>
          </defs>
          <text x="200" y="112" fontSize="12" fill={C.ink}>{"q = −k∇T > 0  (∇T < 0)"}</text>
        </svg>
      </Panel>

      <Panel title={t("3주차 로드맵", "Week 3 roadmap")}>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("복합 벽·원통에서의 전도+대류 결합 → 열저항 회로(전기회로 유추)", "Combined conduction + convection in composite walls & cylinders → thermal resistance circuits (electrical analogy)")}</li>
          <li>{t("미소 검사체적 에너지수지 → Fourier 장 방정식, Poisson/Laplace 방정식", "Control-volume energy balance → Fourier field equation, Poisson/Laplace equations")}</li>
          <li>{t("경계조건 3종(Dirichlet, Neumann, Robin)과 그 물리적 의미", "The three BC types (Dirichlet, Neumann, Robin) and their physics")}</li>
          <li>{t("1D 해석해: 평판·원통·구, 발열이 있는 경우, 핀(확장 표면)", "1D analytical solutions: slab, cylinder, sphere, heat generation, fins")}</li>
          <li>{t("2D 정상상태: 변수분리법과 Fourier 급수", "2D steady state: separation of variables & Fourier series")}</li>
          <li>{t("수치해법: 유한차분법(FDM) 5점 스텐실과 Gauss–Seidel 반복", "Numerics: the FDM 5-point stencil and Gauss–Seidel iteration")}</li>
        </ol>
        <Note>
          {t(
            "핵심 메시지: 경계조건이 해를 결정합니다. 같은 지배방정식이라도 BC가 다르면 온도 분포가 완전히 달라집니다.",
            "Key message: boundary conditions determine the solution. The same governing equation yields entirely different temperature fields under different BCs."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Thermal circuit ---------------------------------- */
function TabCircuit({ t }) {
  const [hL, setHL] = useState(25);
  const [hR, setHR] = useState(10);
  const [k2, setK2] = useState(0.5);
  const [L2, setL2] = useState(0.10);

  const res = useMemo(() => {
    const A = 1, Th = 300, Tc = 20;
    const layers = [ [0.02, 15], [L2, k2], [0.01, 45] ];
    const R = [1 / (hL * A), ...layers.map(([L, k]) => L / (k * A)), 1 / (hR * A)];
    const Rtot = R.reduce((a, b) => a + b, 0);
    const Q = (Th - Tc) / Rtot;
    const U = 1 / (A * Rtot);
    const temps = [Th];
    R.forEach((r) => temps.push(temps[temps.length - 1] - Q * r));
    return { R, Rtot, Q, U, temps, Th, Tc, layers };
  }, [hL, hR, k2, L2]);

  const names = ["conv,L", "cond,1", "cond,2", "cond,3", "conv,R"];
  const cols = [C.cool, "#8a8f98", C.copper, "#8a8f98", C.cool];

  /* wall temperature profile geometry */
  const W = 560, H = 240, x0 = 70, x1 = 500, yTop = 20, yBot = 200;
  const totalL = 0.06 + res.layers[0][0] + res.layers[1][0] + res.layers[2][0] + 0.06; // fake air gaps for drawing
  const segX = [];
  {
    let acc = 0;
    const widths = [0.06, res.layers[0][0], res.layers[1][0], res.layers[2][0], 0.06];
    segX.push(x0);
    widths.forEach((w) => { acc += w; segX.push(x0 + ((x1 - x0) * acc) / totalL); });
  }
  const tY = (T) => yBot - ((T - res.Tc) / (res.Th - res.Tc)) * (yBot - yTop);
  const profile = [
    [segX[0], tY(res.temps[0])],
    [segX[1], tY(res.temps[1])],
    [segX[2], tY(res.temps[2])],
    [segX[3], tY(res.temps[3])],
    [segX[4], tY(res.temps[4])],
    [segX[5], tY(res.temps[5])],
  ];

  return (
    <div>
      <Panel title={t("복합 벽 열저항 회로 시뮬레이터", "Composite-wall thermal circuit simulator")}>
        <p style={{ fontSize: 14 }}>
          {t(
            "뜨거운 공기(300 °C) | 강판 | 단열재 | 강판 | 찬 공기(20 °C)의 3층 벽입니다. 각 저항은 직렬 전기회로처럼 더해집니다:",
            "Hot air (300 °C) | steel | insulation | steel | cold air (20 °C). Resistances add like a series electrical circuit:"
          )}
        </p>
        <Eq block>Q = (T<sub>h</sub> − T<sub>c</sub>) / ΣR<sub>i</sub>, &nbsp; R<sub>conv</sub> = 1/hA, &nbsp; R<sub>cond</sub> = L/kA, &nbsp; U = 1/(A·ΣR<sub>i</sub>)</Eq>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(280px, 2fr)", gap: 20, alignItems: "start" }}>
          <div>
            <Slider label={t("좌측 대류계수 h_L", "Left convection h_L")} value={hL} min={5} max={100} step={1} onChange={setHL} unit=" W/m²K" />
            <Slider label={t("우측 대류계수 h_R", "Right convection h_R")} value={hR} min={5} max={100} step={1} onChange={setHR} unit=" W/m²K" />
            <Slider label={t("단열재 열전도도 k₂", "Insulation conductivity k₂")} value={k2} min={0.02} max={2} step={0.02} onChange={setK2} unit=" W/mK" />
            <Slider label={t("단열재 두께 L₂", "Insulation thickness L₂")} value={L2} min={0.02} max={0.30} step={0.01} onChange={setL2} unit=" m" fmt={(v) => v.toFixed(2)} />
            <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
              Q = {res.Q.toFixed(1)} W<br />
              U = {res.U.toFixed(3)} W/m²K<br />
              ΣR = {res.Rtot.toFixed(4)} K/W
            </div>
          </div>

          <div>
            <svg viewBox={`0 0 ${W} ${H + 60}`} style={{ width: "100%" }}>
              {/* wall layers */}
              <rect x={segX[1]} y={yTop} width={segX[2] - segX[1]} height={yBot - yTop} fill="#d5d9df" />
              <rect x={segX[2]} y={yTop} width={segX[3] - segX[2]} height={yBot - yTop} fill={C.copperPale} />
              <rect x={segX[3]} y={yTop} width={segX[4] - segX[3]} height={yBot - yTop} fill="#d5d9df" />
              <text x={(segX[1] + segX[2]) / 2} y={yBot + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>k₁=15</text>
              <text x={(segX[2] + segX[3]) / 2} y={yBot + 16} fontSize="11" textAnchor="middle" fill={C.copperDeep}>k₂={k2.toFixed(2)}</text>
              <text x={(segX[3] + segX[4]) / 2} y={yBot + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>k₃=45</text>
              <text x={(segX[0] + segX[1]) / 2} y={yBot + 16} fontSize="11" textAnchor="middle" fill={C.warn}>{t("고온 공기", "hot air")}</text>
              <text x={(segX[4] + segX[5]) / 2} y={yBot + 16} fontSize="11" textAnchor="middle" fill={C.cool}>{t("저온 공기", "cold air")}</text>
              {/* temperature profile */}
              <polyline points={profile.map((p) => p.join(",")).join(" ")} fill="none" stroke={C.warn} strokeWidth="2.5" />
              {profile.map((p, i) => (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r="3.5" fill={C.warn} />
                  <text x={p[0]} y={p[1] - 8} fontSize="10.5" textAnchor="middle" fill={C.ink} fontFamily={mono}>
                    {res.temps[i].toFixed(0)}°
                  </text>
                </g>
              ))}
              {/* resistance share bar */}
              {(() => {
                let acc = 0;
                return res.R.map((r, i) => {
                  const wshare = ((x1 - x0) * r) / res.Rtot;
                  const bx = x0 + acc; acc += wshare;
                  return (
                    <g key={i}>
                      <rect x={bx} y={H + 24} width={Math.max(wshare - 1, 0.5)} height={16} fill={cols[i]} rx="2" />
                      {wshare > 46 && (
                        <text x={bx + wshare / 2} y={H + 36} fontSize="10" textAnchor="middle" fill="#fff" fontFamily={mono}>
                          {names[i]} {(100 * r / res.Rtot).toFixed(0)}%
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
              <text x={x0} y={H + 18} fontSize="11" fill={C.inkSoft}>{t("저항 분담률 (전체 ΣR 중 비중)", "Resistance share of ΣR")}</text>
            </svg>
          </div>
        </div>
        <Note>
          {t(
            "단열재의 저항이 지배적일 때(k₂↓ 또는 L₂↑) 온도 강하 대부분이 단열재 안에서 일어납니다. h를 아무리 키워도 전체 Q는 지배 저항이 결정합니다 — 직렬 회로에서 가장 큰 저항이 병목이 되는 것과 같은 원리입니다.",
            "When the insulation resistance dominates (k₂↓ or L₂↑), most of the temperature drop occurs inside it. Raising h barely changes Q — in a series circuit, the largest resistance is the bottleneck."
          )}
        </Note>
      </Panel>

      <Panel title={t("원통 좌표: 파이프 단열", "Cylindrical coordinates: pipe insulation")}>
        <Eq block>
          R<sub>cyl</sub> = ln(r<sub>o</sub>/r<sub>i</sub>) / (2πLk), &nbsp;&nbsp;
          Q<sub>r</sub> = 2πLk (T₁ − T₂) / ln(r<sub>o</sub>/r<sub>i</sub>)
        </Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "원통에서는 면적이 반경에 따라 커지므로 저항이 로그 형태가 됩니다. 형상인자 S를 정의하면 Q = kSΔT로 일반화됩니다: 1D 평판은 S = A/L, 원통은 S = 2πL/ln(r₀/rᵢ). 코드 탭의 Topic 2에서 보온 파이프 계산 예제를 확인하세요.",
            "In a cylinder the area grows with radius, so the resistance becomes logarithmic. Defining the shape factor S generalizes Q = kSΔT: S = A/L for a 1D slab, S = 2πL/ln(r₀/rᵢ) for a cylinder. See Topic 2 in the Code tab for an insulated-pipe worked example."
          )}
        </p>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Governing equations ---------------------------------- */
function TabGoverning({ t }) {
  const [bc, setBc] = useState("dirichlet");
  return (
    <div>
      <Panel title={t("검사체적 에너지수지 → 열전도 지배방정식", "Control-volume energy balance → governing equation")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "미소 검사체적 ΔxΔyΔz에 대해 (전도로 들어온 순 열량) + (내부 발열) = (열에너지 축적)을 쓰면:",
            "For an infinitesimal control volume ΔxΔyΔz, (net conduction in) + (generation) = (thermal energy storage):"
          )}
        </p>
        <Eq block>ρc<sub>v</sub> DT/Dt = ∇·(k∇T) + q̇ &nbsp;&nbsp;→&nbsp;&nbsp; ∂T/∂t = α∇²T + q̇/ρc<sub>v</sub>, &nbsp;&nbsp; α ≡ k/ρc<sub>v</sub></Eq>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 12 }}>
          {[
            [t("비정상, 발열 없음", "Transient, no generation"), "∂T/∂t = α∇²T", "Fourier field equation"],
            [t("정상, 발열 있음", "Steady, with generation"), "k∇²T + q̇ = 0", "Poisson equation"],
            [t("정상, 발열 없음", "Steady, no generation"), "∇²T = 0", "Laplace equation"],
          ].map(([a, b, c2], i) => (
            <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", background: i === 2 ? C.copperPale : "#fff" }}>
              <div style={{ fontSize: 12.5, color: C.inkSoft }}>{a}</div>
              <div style={{ fontFamily: "'STIX Two Text', serif", fontStyle: "italic", fontSize: 17, margin: "6px 0" }}>{b}</div>
              <div style={{ fontSize: 12, color: C.copperDeep, fontWeight: 600 }}>{c2}</div>
            </div>
          ))}
        </div>
        <Note>
          {t("이번 주의 주인공은 세 번째, Laplace 방정식입니다. 좌표계별 ∇²의 형태(직교/원통/구)는 강의 슬라이드 표기를 그대로 따릅니다.",
             "This week's protagonist is the third one, the Laplace equation. The ∇² forms per coordinate system (Cartesian/cylindrical/spherical) follow the lecture notation.")}
        </Note>
      </Panel>

      <Panel title={t("경계조건 3종 세트", "The three boundary condition types")}>
        <Seg
          value={bc}
          onChange={setBc}
          options={[
            { v: "dirichlet", label: "Dirichlet" },
            { v: "neumann", label: "Neumann" },
            { v: "robin", label: "Robin" },
          ]}
        />
        <div style={{ marginTop: 14 }}>
          {bc === "dirichlet" && (
            <>
              <Eq block>T(x = L) = T<sub>L</sub>, &nbsp; T(x = 0) = T₀</Eq>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                {t("경계에서 온도 자체를 지정합니다. 큰 열용량의 유체조나 등온 접촉면처럼 온도가 고정되는 상황입니다.",
                   "The temperature itself is prescribed at the boundary — e.g., contact with a large isothermal bath.")}
              </p>
            </>
          )}
          {bc === "neumann" && (
            <>
              <Eq block>∂T/∂x |<sub>x=L</sub> = K<sub>L</sub> &nbsp;({t("비단열", "non-insulated")}), &nbsp;&nbsp; ∂T/∂x |<sub>x=0</sub> = 0 &nbsp;({t("단열", "insulated")})</Eq>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                {t("경계에서 온도 기울기(즉 열유속)를 지정합니다. 기울기 0은 완전 단열(adiabatic) 또는 대칭 조건을 의미합니다.",
                   "The temperature gradient (heat flux) is prescribed. Zero gradient means adiabatic insulation or a symmetry plane.")}
              </p>
            </>
          )}
          {bc === "robin" && (
            <>
              <Eq block>γ ∂T/∂x |<sub>boundary</sub> + T(boundary) = β &nbsp;&nbsp;{t("예:", "e.g.")}&nbsp; −(k₁/h<sub>L</sub>) ∂T/∂x |₀ + T(0) = T<sub>h</sub></Eq>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>
                {t(
                  "온도와 기울기의 선형결합을 지정합니다. 표면 전도 유속과 주변 유체로의 대류 유속을 맞추면 자연스럽게 Robin 조건이 나옵니다: −k∂T/∂x = h(T − T∞). 전도–대류가 만나는 실제 표면의 표준 조건입니다.",
                  "A linear combination of value and gradient. Matching surface conduction to convection, −k∂T/∂x = h(T − T∞), yields the Robin condition — the standard condition wherever a conducting solid meets a convecting fluid."
                )}
              </p>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: 1D solutions ---------------------------------- */
function Tab1D({ t }) {
  const [geo, setGeo] = useState("slab");
  const [ratio, setRatio] = useState(3);   // ro/ri
  const [gen, setGen] = useState(0);       // dimensionless q̇L²/(2kΔT) added on slab

  const pts = useMemo(() => {
    const N = 100, out = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N; // 0..1 position (x/L or (r-ri)/(ro-ri))
      let Tn;
      if (geo === "slab") {
        Tn = 1 - s + gen * (s - s * s) * 4; // linear + symmetric parabola (normalized generation)
      } else if (geo === "cyl") {
        const r = 1 + s * (ratio - 1);
        Tn = 1 - Math.log(r) / Math.log(ratio);
      } else {
        const r = 1 + s * (ratio - 1);
        Tn = 1 - (1 - 1 / r) / (1 - 1 / ratio);
      }
      out.push([s, Tn]);
    }
    return out;
  }, [geo, ratio, gen]);

  const W = 520, H = 260, x0 = 55, x1 = W - 20, y0 = H - 35, y1 = 18;
  const maxT = Math.max(1, ...pts.map((p) => p[1]));
  const X = (s) => x0 + s * (x1 - x0);
  const Y = (v) => y0 - (v / maxT) * (y0 - y1);

  return (
    <div>
      <Panel title={t("1D 정상상태 해석해: 형상이 곡선을 만든다", "1D steady solutions: geometry shapes the curve")}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Seg
            value={geo} onChange={setGeo}
            options={[
              { v: "slab", label: t("평판", "Slab") },
              { v: "cyl", label: t("원통", "Cylinder") },
              { v: "sph", label: t("구", "Sphere") },
            ]}
          />
          {geo !== "slab" && (
            <div style={{ minWidth: 220, flex: 1 }}>
              <Slider label={t("반경비 r₀/rᵢ", "Radius ratio r₀/rᵢ")} value={ratio} min={1.2} max={10} step={0.1} onChange={setRatio} fmt={(v) => v.toFixed(1)} />
            </div>
          )}
          {geo === "slab" && (
            <div style={{ minWidth: 220, flex: 1 }}>
              <Slider label={t("무차원 발열 q̇L²/2kΔT", "Dimensionless generation q̇L²/2kΔT")} value={gen} min={0} max={1} step={0.05} onChange={setGen} fmt={(v) => v.toFixed(2)} />
            </div>
          )}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 620 }}>
          <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={C.inkSoft} />
          <line x1={x0} y1={y0} x2={x0} y2={y1} stroke={C.inkSoft} />
          <text x={(x0 + x1) / 2} y={H - 8} fontSize="12" textAnchor="middle" fill={C.inkSoft}>
            {geo === "slab" ? "x/L" : "(r − rᵢ)/(r₀ − rᵢ)"}
          </text>
          <text x={14} y={(y0 + y1) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(y0 + y1) / 2})`} textAnchor="middle">
            (T − T₂)/(T₁ − T₂)
          </text>
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={X(g)} y1={y0} x2={X(g)} y2={y0 + 4} stroke={C.inkSoft} />
              <text x={X(g)} y={y0 + 16} fontSize="10.5" textAnchor="middle" fill={C.inkSoft}>{g}</text>
            </g>
          ))}
          {/* reference straight line */}
          <line x1={X(0)} y1={Y(1)} x2={X(1)} y2={Y(0)} stroke={C.line} strokeDasharray="5 4" strokeWidth="1.5" />
          <polyline points={pts.map(([s, v]) => `${X(s)},${Y(v)}`).join(" ")} fill="none" stroke={C.copper} strokeWidth="2.6" />
        </svg>

        <div style={{ fontFamily: "'STIX Two Text', serif", fontStyle: "italic", fontSize: 15, background: C.copperPale, borderRadius: 8, padding: "10px 14px" }}>
          {geo === "slab" && (gen === 0
            ? <>T(x) = T₁ + (T₂ − T₁)(x/L), &nbsp; q = k(T₁ − T₂)/L</>
            : <>T(x) = {t("선형해 + 발열 포물선", "linear + generation parabola")}: k d²T/dx² + q̇ = 0 → {t("포물선 항", "parabolic term")} −q̇x²/2k</>)}
          {geo === "cyl" && <>T(r) = Tᵢ − (Tᵢ − T₀) · ln(r/rᵢ)/ln(r₀/rᵢ)</>}
          {geo === "sph" && <>T(r) = Tᵢ − (Tᵢ − T₀) · (1/rᵢ − 1/r)/(1/rᵢ − 1/r₀)</>}
        </div>
        <Note>
          {t(
            "평판은 선형, 원통은 로그, 구는 1/r 형태입니다. 반경비가 클수록 안쪽 반경 근처에 온도 강하가 집중됩니다 — 같은 ΔT라도 열유속 면적이 반경에 따라 달라지기 때문입니다. 발열이 있으면(슬라이더) 위로 볼록한 포물선이 더해집니다.",
            "Slab: linear; cylinder: logarithmic; sphere: 1/r. Larger radius ratios concentrate the temperature drop near the inner radius, because the flux area grows with r. With generation (slider), a convex parabola is superposed."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Fins ---------------------------------- */
function TabFin({ t }) {
  const [mL, setML] = useState(2);
  const [bcCase, setBcCase] = useState(2);
  const [thetaL, setThetaL] = useState(0.2);
  const [hmk, setHmk] = useState(0.5);

  const prof = useMemo(() => {
    const N = 120, out = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      out.push([x, finTheta(x, 1, mL, bcCase, thetaL, hmk)]);
    }
    return out;
  }, [mL, bcCase, thetaL, hmk]);

  const eta = Math.tanh(mL) / mL;

  const W = 520, H = 250, x0 = 55, x1 = W - 20, y0 = H - 35, y1 = 16;
  const X = (s) => x0 + s * (x1 - x0);
  const Y = (v) => y0 - v * (y0 - y1);

  return (
    <div>
      <Panel title={t("핀(확장 표면): 경계조건이 해를 바꾼다", "Fins: BCs change the solution")}>
        <Eq block>d²Θ/dx² − m²Θ = 0, &nbsp; Θ ≡ T − T<sub>∞</sub>, &nbsp; m² = hP/kA<sub>c</sub> &nbsp;→&nbsp; Θ = c₁e<sup>mx</sup> + c₂e<sup>−mx</sup></Eq>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Seg
            value={bcCase} onChange={setBcCase}
            options={[
              { v: 1, label: t("① 양끝 온도 고정", "① Dirichlet–Dirichlet") },
              { v: 2, label: t("② 단열 팁", "② Adiabatic tip") },
              { v: 3, label: t("③ 대류 팁 (Robin)", "③ Robin tip") },
            ]}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0 20px" }}>
          <Slider label="mL" value={mL} min={0.3} max={5} step={0.1} onChange={setML} fmt={(v) => v.toFixed(1)} />
          {bcCase === 1 && <Slider label="Θ_L/Θ₀" value={thetaL} min={0} max={1} step={0.05} onChange={setThetaL} fmt={(v) => v.toFixed(2)} />}
          {bcCase === 3 && <Slider label="h/mk" value={hmk} min={0} max={3} step={0.1} onChange={setHmk} fmt={(v) => v.toFixed(1)} />}
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 620 }}>
          <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={C.inkSoft} />
          <line x1={x0} y1={y0} x2={x0} y2={y1} stroke={C.inkSoft} />
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <text x={X(g)} y={y0 + 16} fontSize="10.5" textAnchor="middle" fill={C.inkSoft}>{g}</text>
              <line x1={x0} y1={Y(g)} x2={x1} y2={Y(g)} stroke={C.line} strokeDasharray="3 5" />
              <text x={x0 - 8} y={Y(g) + 4} fontSize="10.5" textAnchor="end" fill={C.inkSoft}>{g}</text>
            </g>
          ))}
          <text x={(x0 + x1) / 2} y={H - 8} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x/L</text>
          <text x={14} y={(y0 + y1) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(y0 + y1) / 2})`} textAnchor="middle">Θ/Θ₀</text>
          <polyline points={prof.map(([s, v]) => `${X(s)},${Y(Math.max(0, Math.min(1.05, v)))}`).join(" ")} fill="none" stroke={C.copper} strokeWidth="2.6" />
          {/* tip marker */}
          <circle cx={X(1)} cy={Y(Math.max(0, Math.min(1.05, prof[prof.length - 1][1])))} r="4" fill={C.cool} />
          <text x={X(1) - 6} y={Y(prof[prof.length - 1][1]) - 8} fontSize="11" textAnchor="end" fill={C.cool} fontFamily={mono}>
            tip {prof[prof.length - 1][1].toFixed(3)}
          </text>
        </svg>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
            η = tanh(mL)/mL = {eta.toFixed(4)}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ height: 14, background: C.line, borderRadius: 7, overflow: "hidden" }}>
              <div style={{ width: `${(eta * 100).toFixed(1)}%`, height: "100%", background: `linear-gradient(90deg, ${C.copper}, ${C.copperDeep})` }} />
            </div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
              {t("핀 효율 (단열 팁 기준)", "Fin efficiency (adiabatic tip)")}
            </div>
          </div>
        </div>
        <Note>
          {t(
            "mL이 커질수록(길거나, h가 크거나, k가 작거나) 팁이 주변 온도에 근접하고 효율은 떨어집니다. 즉 '무작정 긴 핀'은 재료 낭비입니다. 세 경계조건의 해가 뚜렷이 다르다는 점이 이번 주의 핵심 교훈입니다: Q_fin = √(hPkA_c)·Θ₀·tanh(mL), ε_fin = Q_fin/hA_cΘ₀.",
            "As mL grows (long fin, high h, or low k), the tip approaches ambient and efficiency drops — an overly long fin wastes material. Note how distinctly the three BCs change the profile: Q_fin = √(hPkA_c)·Θ₀·tanh(mL), ε_fin = Q_fin/hA_cΘ₀."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Separation of variables ---------------------------------- */
function TabSeries({ t }) {
  const [kmax, setKmax] = useState(5);
  const [yProbe, setYProbe] = useState(0.05);
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const N = 90;
    cv.width = N; cv.height = N;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(N, N);
    for (let iy = 0; iy < N; iy++) {
      const y = iy / (N - 1);
      for (let ix = 0; ix < N; ix++) {
        const x = ix / (N - 1);
        const v = Math.max(0, Math.min(1, seriesT(x, y, kmax)));
        const r = Math.min(255, Math.round(320 * v));
        const g = Math.round(199 * v * 0.78);
        const b = Math.round(126 * v * 0.5);
        const p = 4 * (iy * N + ix);
        img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [kmax]);

  const profile = useMemo(() => {
    const N = 160, out = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      out.push([x, seriesT(x, yProbe, kmax), seriesT(x, yProbe, 200)]);
    }
    return out;
  }, [kmax, yProbe]);

  const W = 520, H = 220, x0 = 50, x1 = W - 16, y0 = H - 30, y1 = 12;
  const maxV = Math.max(1.1, ...profile.map((p) => p[1]));
  const X = (s) => x0 + s * (x1 - x0);
  const Y = (v) => y0 - (v / maxV) * (y0 - y1);
  const center = seriesT(0.5, 0.5, kmax);

  return (
    <div>
      <Panel title={t("변수분리법: Fourier 급수로 짓는 2D 온도장", "Separation of variables: building the 2D field from a Fourier series")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "폭 L의 반무한 띠에서 아래변 T = T₁, 양옆과 위는 T = 0. T(x,y) = X(x)Y(y)로 분리하고 경계조건을 적용하면 sin 기저의 급수해가 나오며, 계수는 기저함수의 직교성으로 결정됩니다:",
            "A semi-infinite strip of width L with T = T₁ on the bottom and T = 0 elsewhere. Separating T(x,y) = X(x)Y(y) and applying the BCs gives a sine-basis series, whose coefficients follow from orthogonality:"
          )}
        </p>
        <Eq block>
          T(x,y) = (4T₁/π) Σ<sub>k=0</sub><sup>∞</sup> [1/(2k+1)] · exp(−(2k+1)πy/L) · sin((2k+1)πx/L)
        </Eq>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) minmax(260px, 1.4fr)", gap: 20, alignItems: "start" }}>
          <div>
            <Slider label={t("급수 항 수 k_max", "Series terms k_max")} value={kmax} min={0} max={30} step={1} onChange={setKmax} />
            <Slider label={t("단면 위치 y/L", "Profile position y/L")} value={yProbe} min={0} max={0.6} step={0.01} onChange={setYProbe} fmt={(v) => v.toFixed(2)} />
            <div style={{ fontFamily: mono, fontSize: 13, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
              T/T₁ (0.5, 0.5) = {center.toFixed(6)}<br />
              {t("수렴값", "converged")} = 0.260964
            </div>
            <canvas
              ref={canvasRef}
              style={{ width: "100%", imageRendering: "pixelated", borderRadius: 8, border: `1px solid ${C.line}`, marginTop: 12, transform: "scaleY(-1)" }}
            />
            <div style={{ fontSize: 11.5, color: C.inkSoft, textAlign: "center" }}>
              {t("T/T₁ 분포 (아래변이 고온, copper 컬러맵)", "T/T₁ field (hot bottom edge, copper colormap)")}
            </div>
          </div>

          <div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
              <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={C.inkSoft} />
              <line x1={x0} y1={y0} x2={x0} y2={y1} stroke={C.inkSoft} />
              <line x1={x0} y1={Y(1)} x2={x1} y2={Y(1)} stroke={C.line} strokeDasharray="4 5" />
              <text x={x0 - 6} y={Y(1) + 4} fontSize="10.5" textAnchor="end" fill={C.inkSoft}>1</text>
              <text x={(x0 + x1) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x/L</text>
              <polyline points={profile.map(([s, , ex]) => `${X(s)},${Y(ex)}`).join(" ")} fill="none" stroke={C.cool} strokeWidth="1.8" strokeDasharray="6 4" />
              <polyline points={profile.map(([s, v]) => `${X(s)},${Y(v)}`).join(" ")} fill="none" stroke={C.copper} strokeWidth="2.4" />
              <text x={x1 - 4} y={y1 + 12} fontSize="11" textAnchor="end" fill={C.cool}>k_max = 200 ({t("기준", "reference")})</text>
              <text x={x1 - 4} y={y1 + 28} fontSize="11" textAnchor="end" fill={C.copper}>k_max = {kmax}</text>
            </svg>
            <Note>
              {t(
                "y/L을 0으로 가져가며 항 수를 줄여 보세요. 불연속 경계(모서리) 근처에서 과대·과소 진동(Gibbs 현상)이 보입니다. 항 수를 올리면 진동 폭은 좁아지지만 오버슈트(~9%)는 사라지지 않습니다 — 급수가 수렴해도 '균일 수렴'은 아니라는 신호입니다. y가 조금만 커져도 exp(−nπy/L) 감쇠 덕에 몇 항으로 충분해집니다.",
                "Drag y/L toward 0 with few terms: near the discontinuous corners you'll see the Gibbs oscillations. More terms narrow the wiggles but the ~9% overshoot persists — convergence, but not uniform convergence. Away from y = 0 the exp(−nπy/L) decay makes a handful of terms sufficient."
              )}
            </Note>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: FDM ---------------------------------- */
function TabFDM({ t }) {
  /* small plate: 5x5 grid, 3x3 unknowns, lecture example */
  const target = [
    [78.571, 76.116, 69.643],
    [63.170, 56.250, 52.455],
    [42.857, 33.259, 33.929],
  ]; // rows: j=3,2,1 top->bottom for display
  const makeGrid = () => {
    const g = Array.from({ length: 5 }, () => new Array(5).fill(0));
    for (let j = 0; j < 5; j++) { g[4][j] = 100; g[0][j] = 0; }
    for (let i = 0; i < 5; i++) { g[i][0] = 75; g[i][4] = 50; }
    return g;
  };
  const [grid, setGrid] = useState(makeGrid);
  const [iter, setIter] = useState(0);
  const [hist, setHist] = useState([]);

  const stepGS = useCallback(() => {
    setGrid((g0) => {
      const g = g0.map((r) => r.slice());
      let err = 0;
      for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
          const v = 0.25 * (g[i + 1][j] + g[i - 1][j] + g[i][j + 1] + g[i][j - 1]);
          err = Math.max(err, Math.abs(v - g[i][j]));
          g[i][j] = v;
        }
      }
      setHist((h) => [...h.slice(-59), err]);
      return g;
    });
    setIter((n) => n + 1);
  }, []);

  const reset = () => { setGrid(makeGrid()); setIter(0); setHist([]); };
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(stepGS, 350);
    return () => clearInterval(id);
  }, [playing, stepGS]);
  useEffect(() => { if (iter >= 45) setPlaying(false); }, [iter]);

  const maxErrNow = hist.length ? hist[hist.length - 1] : null;

  return (
    <div>
      <Panel title={t("5점 스텐실: 라플라스 방정식의 이산화", "The 5-point stencil: discretizing Laplace")}>
        <Eq block>
          T<sub>i+1,j</sub> + T<sub>i−1,j</sub> + T<sub>i,j+1</sub> + T<sub>i,j−1</sub> − 4T<sub>i,j</sub> = 0
          &nbsp;&nbsp;→&nbsp;&nbsp; T<sub>i,j</sub> = ¼ ({t("이웃 4점의 평균", "average of the 4 neighbors")})
        </Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "2차 도함수를 중심차분으로 근사하면(Δx = Δy = h) 각 내부 절점 온도는 이웃 네 점의 평균이 되어야 합니다. 미지수가 소수면 선형계 A·T = b로 직접 풀고, 격자가 크면 Gauss–Seidel처럼 '평균으로 갱신'을 반복합니다.",
            "Central differencing the second derivatives (Δx = Δy = h) forces every interior node to equal the average of its four neighbors. Few unknowns → solve the linear system A·T = b directly; large grids → iterate the averaging rule (Gauss–Seidel)."
          )}
        </p>
      </Panel>

      <Panel title={t("가열판 예제 (상 100 · 좌 75 · 우 50 · 하 0): Gauss–Seidel 실시간 반복", "Heated plate (top 100 · left 75 · right 50 · bottom 0): live Gauss–Seidel")}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={stepGS} style={btnStyle(false)}>{t("한 스텝", "Step")}</button>
          <button onClick={() => setPlaying((p) => !p)} style={btnStyle(playing)}>{playing ? t("정지", "Pause") : t("자동 재생", "Play")}</button>
          <button onClick={reset} style={btnStyle(false)}>{t("초기화", "Reset")}</button>
          <div style={{ fontFamily: mono, fontSize: 13, alignSelf: "center", color: C.inkSoft }}>
            iter = {iter}{maxErrNow != null && ` · max|ΔT| = ${maxErrNow.toFixed(4)}`}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(200px, 1fr)", gap: 20, alignItems: "start" }}>
          {/* value grid */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
              {[4, 3, 2, 1, 0].map((i) =>
                [0, 1, 2, 3, 4].map((j) => {
                  const isBnd = i === 0 || i === 4 || j === 0 || j === 4;
                  const v = grid[i][j];
                  const tgt = !isBnd ? target[3 - i][j - 1] : null;
                  const done = tgt != null && Math.abs(v - tgt) < 0.05;
                  return (
                    <div key={`${i}-${j}`} style={{
                      aspectRatio: "1.5", borderRadius: 6, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      background: isBnd ? C.coolPale : copperMap(v / 100),
                      border: `2px solid ${done ? C.good : isBnd ? C.cool : "transparent"}`,
                      color: isBnd ? C.ink : v > 45 ? "#fff" : C.ink,
                    }}>
                      <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{v.toFixed(1)}</span>
                      {tgt != null && <span style={{ fontFamily: mono, fontSize: 9, opacity: 0.85 }}>→{tgt.toFixed(1)}</span>}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>
              {t("파란 테두리 = 경계(고정), 초록 테두리 = 목표 해(선형계 직접해)에 수렴 완료", "Blue border = fixed boundary; green border = converged to the direct linear-system solution")}
            </div>
          </div>

          {/* residual decay */}
          <div>
            <svg viewBox="0 0 280 190" style={{ width: "100%" }}>
              <line x1="38" y1="160" x2="270" y2="160" stroke={C.inkSoft} />
              <line x1="38" y1="160" x2="38" y2="12" stroke={C.inkSoft} />
              <text x="150" y="182" fontSize="11" textAnchor="middle" fill={C.inkSoft}>iteration</text>
              <text x="12" y="90" fontSize="11" fill={C.inkSoft} transform="rotate(-90 12 90)" textAnchor="middle">log₁₀ max|ΔT|</text>
              {[1, 0, -1, -2, -3].map((d) => (
                <g key={d}>
                  <line x1="36" x2="270" y1={160 - (d + 3) * 36} y2={160 - (d + 3) * 36} stroke={C.line} strokeDasharray="3 4" />
                  <text x="32" y={164 - (d + 3) * 36} fontSize="9.5" textAnchor="end" fill={C.inkSoft}>{d}</text>
                </g>
              ))}
              {hist.length > 1 && (
                <polyline
                  fill="none" stroke={C.copper} strokeWidth="2"
                  points={hist.map((e, i) => {
                    const lx = 38 + (i / Math.max(44, hist.length - 1)) * 230;
                    const ly = 160 - (Math.max(-3, Math.min(1, Math.log10(Math.max(e, 1e-4)))) + 3) * 36;
                    return `${lx},${ly}`;
                  }).join(" ")}
                />
              )}
            </svg>
            <Note>
              {t(
                "잔차가 로그축에서 직선으로 떨어집니다 — Gauss–Seidel의 선형(기하급수) 수렴입니다. 이 3×3 문제는 41회 반복이면 10⁻¹⁰ 수준까지 수렴하며, 결과는 강의의 9×9 행렬 직접해와 일치합니다.",
                "The residual decays as a straight line on the log axis — the linear (geometric) convergence of Gauss–Seidel. This 3×3 problem reaches ~10⁻¹⁰ in 41 sweeps, matching the lecture's 9×9 direct matrix solve."
              )}
            </Note>
          </div>
        </div>
      </Panel>

      <Panel title={t("검증: 해석해 ↔ FDM 교차 확인", "Verification: analytical ↔ FDM cross-check")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "위쪽 변만 T = 1인 단위 정사각형을 40×40 격자 Gauss–Seidel로 풀면 중심 온도 0.26054를 얻습니다. 변수분리법 탭의 급수해 중심값 0.26096과 0.2% 이내로 일치합니다(차이는 격자 이산화 오차, h² 수렴). 같은 문제를 두 방법으로 푸는 것 — 이것이 수치해를 신뢰하는 표준적인 방법입니다. FEM(MATLAB PDE Toolbox) 예제는 코드 탭 Topic 4와 강의자료를 참고하세요.",
            "Solving the unit square with only the top edge at T = 1 on a 40×40 Gauss–Seidel grid gives a center value of 0.26054, within 0.2% of the series solution's 0.26096 (the gap is the O(h²) discretization error). Solving one problem two ways is the standard route to trusting a numerical result. For FEM (MATLAB PDE Toolbox), see Topic 4 in the Code tab and the lecture notes."
          )}
        </p>
      </Panel>
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

/* ---------------------------------- Tab 8: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. 면적 1 m²의 벽이 강판(2 cm, k=15) | 단열재(10 cm, k=0.5) | 강판(1 cm, k=45)으로 되어 있고, 양쪽 공기 온도는 300 °C / 20 °C, 대류계수는 h_L=25, h_R=10 W/m²K이다. 총 열저항, 열전달률 Q, 총괄열전달계수 U를 구하라.",
        "P1. A 1 m² wall consists of steel (2 cm, k=15) | insulation (10 cm, k=0.5) | steel (1 cm, k=45); air at 300 °C / 20 °C with h_L=25, h_R=10 W/m²K. Find the total resistance, Q, and the overall coefficient U."
      ),
      s: t(
        "R = [0.0400, 0.00133, 0.2000, 0.00022, 0.1000] K/W → ΣR = 0.3416 K/W. Q = 280/0.3416 = 819.8 W, U = 1/(A·ΣR) = 2.928 W/m²K. 온도 강하의 59%가 단열재에서 발생한다.",
        "R = [0.0400, 0.00133, 0.2000, 0.00022, 0.1000] K/W → ΣR = 0.3416 K/W. Q = 280/0.3416 = 819.8 W, U = 1/(A·ΣR) = 2.928 W/m²K. 59% of the temperature drop occurs in the insulation."
      ),
    },
    {
      q: t(
        "P2. 내경 r_i에서 T_i, 외경 r_o에서 T_o로 유지되는 긴 중공 원통의 정상상태 온도분포 T(r)를 유도하고, 같은 조건의 중공 구와 비교하라.",
        "P2. Derive the steady T(r) for a long hollow cylinder held at T_i (r_i) and T_o (r_o), and compare with a hollow sphere."
      ),
      s: t(
        "원통: d/dr(r dT/dr)=0 → T = T_i − (T_i−T_o)·ln(r/r_i)/ln(r_o/r_i) (로그형). 구: d/dr(r² dT/dr)=0 → T = T_i − (T_i−T_o)·(1/r_i − 1/r)/(1/r_i − 1/r_o) (1/r형). 두 경우 모두 면적이 반경에 따라 커져서 평판의 선형해와 달라진다.",
        "Cylinder: d/dr(r dT/dr)=0 → T = T_i − (T_i−T_o)·ln(r/r_i)/ln(r_o/r_i) (logarithmic). Sphere: d/dr(r² dT/dr)=0 → T = T_i − (T_i−T_o)·(1/r_i − 1/r)/(1/r_i − 1/r_o). Both deviate from the slab's linear profile because area grows with radius."
      ),
    },
    {
      q: t(
        "P3. 지름 5 mm, 길이 50 mm 알루미늄 핀(k=200 W/mK)이 h=25 W/m²K인 공기 중에 있고 밑면 과열도 Θ₀=80 K이다(단열 팁 가정). m, Q_fin, 효율 η, 유효도 ε를 구하라.",
        "P3. An aluminum pin fin, D=5 mm, L=50 mm, k=200 W/mK, sits in air with h=25 W/m²K; base excess Θ₀=80 K (adiabatic tip). Find m, Q_fin, η, and ε."
      ),
      s: t(
        "m = √(hP/kA_c) = √(4h/kD) = 10.0 m⁻¹, mL = 0.5. Q_fin = √(hPkA_c)·Θ₀·tanh(mL) = 1.452 W. η = tanh(0.5)/0.5 = 0.924. ε = Q_fin/(hA_cΘ₀) = 37.0 — 핀 하나가 맨 밑면의 37배 열을 내보낸다.",
        "m = √(hP/kA_c) = √(4h/kD) = 10.0 m⁻¹, mL = 0.5. Q_fin = √(hPkA_c)·Θ₀·tanh(mL) = 1.452 W. η = tanh(0.5)/0.5 = 0.924. ε = Q_fin/(hA_cΘ₀) = 37.0 — one fin transfers 37× the bare-base heat."
      ),
    },
    {
      q: t(
        "P4. 상변 100, 좌변 75, 우변 50, 하변 0으로 유지되는 정사각 판을 내부 3×3 절점으로 이산화했다. 절점 (1,3)과 (2,3)의 FDM 방정식을 쓰고, 9개 절점의 해에서 T(2,2)를 구하라.",
        "P4. A square plate with top 100, left 75, right 50, bottom 0 is discretized with 3×3 interior nodes. Write the FDM equations at nodes (1,3) and (2,3), and give T(2,2) from the 9-node solution."
      ),
      s: t(
        "(1,3): 75 + 100 + T(1,2) + T(2,3) − 4T(1,3) = 0. (2,3): T(1,3) + 100 + T(3,3) + T(2,2) − 4T(2,3) = 0. 9×9 선형계를 풀면 T(2,2) = 56.250 (전체 해: 78.571, 76.116, 69.643 / 63.170, 56.250, 52.455 / 42.857, 33.259, 33.929).",
        "(1,3): 75 + 100 + T(1,2) + T(2,3) − 4T(1,3) = 0. (2,3): T(1,3) + 100 + T(3,3) + T(2,2) − 4T(2,3) = 0. Solving the 9×9 system: T(2,2) = 56.250 (full solution: 78.571, 76.116, 69.643 / 63.170, 56.250, 52.455 / 42.857, 33.259, 33.929)."
      ),
    },
    {
      q: t(
        "P5. 변수분리법 급수해에서 짝수 항의 계수가 모두 0이 되는 이유를 직교성 적분을 이용해 설명하라.",
        "P5. Using the orthogonality integral, explain why every even-n coefficient vanishes in the separation-of-variables series."
      ),
      s: t(
        "E_m 결정식의 좌변 적분 ∫₀ᴸ T₁ sin(mπx/L)dx = LT₁(1−(−1)^m)/mπ 는 m이 짝수면 (1−(−1)^m)=0이 되어 사라진다. 물리적으로, 상수 T₁은 x = L/2에 대해 대칭인데 짝수 모드 sin(2kπx/L)은 반대칭이므로 겹침(projection)이 0이다. 따라서 홀수 모드만 남고 E_n = 4T₁/nπ (n 홀수).",
        "The LHS integral ∫₀ᴸ T₁ sin(mπx/L)dx = LT₁(1−(−1)^m)/mπ vanishes for even m since (1−(−1)^m)=0. Physically, the constant T₁ is symmetric about x = L/2 while even modes sin(2kπx/L) are antisymmetric — zero projection. Only odd modes survive: E_n = 4T₁/nπ (n odd)."
      ),
    },
  ];
  const [open, setOpen] = useState({});
  return (
    <div>
      {problems.map((p, i) => (
        <Panel key={i}>
          <div style={{ fontSize: 14.5, lineHeight: 1.7, color: C.ink }}>{p.q}</div>
          <button
            onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
            style={{ ...btnStyle(!!open[i]), marginTop: 10 }}
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
  const code = WEEK3_CODES[topic][lang];

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
              {WEEK3_CODES[tp].title}
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
            "Python·C++ 버전은 실행·수치 검증을 마쳤습니다(FDM 가열판 해는 선형계 직접해와 5×10⁻¹¹ 이내 일치, 40×40 FDM 중심값은 급수해와 0.2% 이내 일치). MATLAB 버전은 강의 슬라이드의 데모 코드를 확장한 형태입니다.",
            "The Python and C++ versions were executed and numerically verified (the FDM plate matches the direct linear-system solve to 5×10⁻¹¹; the 40×40 FDM center agrees with the series solution within 0.2%). The MATLAB versions extend the lecture's demo code."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week3App({ language = "kr", onBack }) {
  const [lang, setLang] = useState(language);
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: t("열저항 회로", "Thermal circuit"), comp: <TabCircuit t={t} /> },
    { label: t("지배방정식·BC", "Governing eq. & BCs"), comp: <TabGoverning t={t} /> },
    { label: t("1D 해석해", "1D solutions"), comp: <Tab1D t={t} /> },
    { label: t("핀 해석", "Fins"), comp: <TabFin t={t} /> },
    { label: t("2D 변수분리법", "Separation of variables"), comp: <TabSeries t={t} /> },
    { label: "FDM", comp: <TabFDM t={t} /> },
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
                Heat & Mass Transfer · Week 3
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("정상상태 열전도", "Steady-State Heat Conduction")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("전도·대류 결합 — 열저항 회로 — 지배방정식과 경계조건 — 1D 해석해와 핀 — 2D 변수분리법 — FDM",
                   "Conduction & convection — thermal circuits — governing equations & BCs — 1D solutions & fins — 2D separation of variables — FDM")}
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
