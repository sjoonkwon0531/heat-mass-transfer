// Week8App.jsx — Heat & Mass Transfer, Week 8
// Part 1 — Control of heat exchangers: stirred-tank energy balance → first-order
// transfer functions (K/(τs+1)), Laplace transforms, FOPDT model & two-point
// fitting (τp = 21.3 s, θp = 14.7 s), P/PI/PID feedback control, ITAE tuning,
// feedforward control (MATLAB heatex demo).
// Part 2 — Radiation heat transfer: thermal radiation & intensity, Planck's law
// (mode counting → Rayleigh-Jeans catastrophe → quantization), Stefan-Boltzmann
// σT⁴, Wien λ_C·T = 2898 μm·K, view factors (reciprocity, charts, formulas),
// gray-surface radiosity networks, radiation heat-transfer coefficient.
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useCallback } from "react";
import WEEK8_CODES from "./Week8Codes";

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
/* FOPDT step response */
function fopdtStep(t, Kp, du, tau, theta) {
  if (t < theta) return 0;
  return (1 - Math.exp(-(t - theta) / tau)) * Kp * du;
}

/* discrete closed-loop simulation of G = Kp e^{-θp s}/(τp s+1), Gd = e^{-θd s}/(τd s+1) */
function closedLoop({ Kc, tauI, tauD = 0, Tend = 250, dt = 0.05, setpoint = 1, disturb = 0, ff = "none" }) {
  const tauP = 21.3, thetaP = 14.7, Kp = 1.0;
  const tauDist = 25.0, thetaDist = 35.0;
  const n = Math.round(Tend / dt);
  const dp = Math.round(thetaP / dt), dd = Math.round(thetaDist / dt);
  const dst = Math.round(25.0 / dt), dll = Math.round((thetaDist - thetaP) / dt);
  const ubuf = new Float64Array(n + dp + 1);
  const dbuf = new Float64Array(n + dd + 1);
  const fbuf = new Float64Array(n + Math.max(dst, dll) + 1);
  let xff = 0, yp = 0, yd = 0, y = 0, I = 0, ePrev = setpoint;
  const ys = new Float64Array(n), us = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const e = setpoint - y;
    I += e * dt;
    let u = Kc * (e + (tauI > 0 ? I / tauI : 0) + (tauD * (e - ePrev)) / dt);
    ePrev = e;
    if (ff === "static") {
      fbuf[k + dst] = -disturb;
      u += fbuf[k];
    } else if (ff === "leadlag") {
      xff += (dt * (disturb - xff)) / tauDist;
      fbuf[k + dll] = -((tauP * (disturb - xff)) / tauDist + xff);
      u += fbuf[k];
    }
    ubuf[k + dp] = u;
    dbuf[k + dd] = disturb;
    yp += (dt * (-yp + Kp * ubuf[k])) / tauP;
    yd += (dt * (-yd + dbuf[k])) / tauDist;
    y = yp + yd;
    ys[k] = y;
    us[k] = u;
  }
  return { ys, us, dt, n };
}

/* Planck spectral emissive power, W/m² per μm of wavelength (lam in μm) */
const PH = 6.62607015e-34, PC = 2.99792458e8, PKB = 1.380649e-23;
const SIGMA = 5.670e-8;
const WIEN_B = 2897.8; // μm·K
function planckLam(lamUm, T) {
  const lam = lamUm * 1e-6;
  const x = (PH * PC) / (lam * PKB * T);
  if (x > 500) return 0;
  return ((2 * Math.PI * PH * PC * PC) / Math.pow(lam, 5) / Math.expm1(x)) * 1e-6;
}
function rayleighJeansLam(lamUm, T) {
  const lam = lamUm * 1e-6;
  return ((2 * Math.PI * PC * PKB * T) / Math.pow(lam, 4)) * 1e-6;
}

/* view factors */
function fRect(X, Y) {
  const x2 = 1 + X * X, y2 = 1 + Y * Y;
  let s = Math.log(Math.sqrt((x2 * y2) / (1 + X * X + Y * Y)));
  s += X * Math.sqrt(y2) * Math.atan(X / Math.sqrt(y2));
  s += Y * Math.sqrt(x2) * Math.atan(Y / Math.sqrt(x2));
  s -= X * Math.atan(X) + Y * Math.atan(Y);
  return (2 / (Math.PI * X * Y)) * s;
}
function fDisks(r1, r2, D) {
  const R1 = r1 / D, R2 = r2 / D;
  const X = 1 + (1 + R2 * R2) / (R1 * R1);
  return 0.5 * (X - Math.sqrt(X * X - 4 * (r2 / r1) * (r2 / r1)));
}

/* 3-surface gray radiosity network (Gauss-Seidel); returns J array */
function solveRadiosity(F, eps, Eb) {
  const J = Eb.slice();
  for (let it = 0; it < 400; it++) {
    for (let i = 0; i < 3; i++) {
      const rho = 1 - eps[i];
      if (rho < 1e-9) { J[i] = Eb[i]; continue; }
      const c = eps[i] / rho;
      let s = 0;
      for (let j = 0; j < 3; j++) if (j !== i) s += F[i][j] * J[j];
      J[i] = (c * Eb[i] + s) / (1 - F[i][i] + c);
    }
  }
  return J;
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

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("이번 주: 동적 시스템 하나, 새로운 전달 모드 하나", "This week: one dynamic system, one new transfer mode")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "8주차는 두 부분입니다. ① 열교환기의 제어 — 지금까지는 열교환기를 '설계'했지만, 실제 공정에서는 외란(유입 온도 변화) 속에서 출구 온도를 원하는 값에 '유지'해야 합니다. 교반조 에너지 수지가 1차 선형계가 되고, Laplace 변환 → 전달함수 → FOPDT 모델 피팅 → PID 피드백·피드포워드 제어로 이어지는 공정제어의 핵심 흐름을 열전달 문제 위에서 배웁니다. ② 복사 열전달 — 매질 없이 전자기파로 전달되는 세 번째 모드. 플랑크의 양자화가 왜 필요했는지(자외선 파탄)부터 σT⁴, Wien 변위법칙, 형상계수, 회색체 네트워크까지 공학 계산 체계를 세웁니다.",
            "Week 8 has two parts. ① Control of heat exchangers — so far we designed exchangers; a real process must hold the outlet temperature at a setpoint despite disturbances (inflow temperature changes). The stirred-tank energy balance becomes a first-order linear system, and we follow the core process-control chain: Laplace transform → transfer function → FOPDT fitting → PID feedback & feedforward — all on a heat-transfer problem. ② Radiative heat transfer — the third mode, carried by electromagnetic waves with no medium. From why Planck had to quantize (the ultraviolet catastrophe) to σT⁴, Wien's displacement law, view factors, and gray-surface networks."
          )}
        </p>
      </Panel>

      <Panel title={t("8주차 로드맵", "Week 8 roadmap")}>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("교반조 가열계: 에너지 수지 → 편차변수 → 1차계 T′(s) = [K/(τs+1)]Q′(s) + [1/(τs+1)]T′ᵢₙ(s)", "Stirred-tank heating: energy balance → deviation variables → first order, T′(s) = [K/(τs+1)]Q′(s) + [1/(τs+1)]T′ᵢₙ(s)")}</li>
          <li>{t("FOPDT 모델과 2점 피팅: τₚ = 3(t₂−t₁)/2, θₚ = (3t₁−t₂)/2 → 21.3 s, 14.7 s", "The FOPDT model & two-point fit: τₚ = 3(t₂−t₁)/2, θₚ = (3t₁−t₂)/2 → 21.3 s, 14.7 s")}</li>
          <li>{t("피드백 제어 모드: P(오프셋) · PI(오프셋 제거) · PID — ITAE 튜닝 Kc = 1.234, τᵢ = 24.56", "Feedback control modes: P (offset) · PI (kills offset) · PID — ITAE tuning Kc = 1.234, τᵢ = 24.56")}</li>
          <li>{t("피드포워드: F = −G_d/G — 오차가 생기기 전에 외란을 상쇄", "Feedforward: F = −G_d/G — cancel the disturbance before the error appears")}</li>
          <li>{t("열복사: 방사력 E = πI, 입체각, 흑체와 Kirchhoff 법칙", "Thermal radiation: emissive power E = πI, solid angles, blackbody & Kirchhoff's law")}</li>
          <li>{t("플랑크 법칙: 모드 세기 → Rayleigh-Jeans 파탄 → Eₙ = nhν → σT⁴ · λ_C T = 2898 μm·K", "Planck's law: mode counting → Rayleigh-Jeans catastrophe → Eₙ = nhν → σT⁴ · λ_C T = 2898 μm·K")}</li>
          <li>{t("형상계수 F₁₂: 정의·상호성 A₁F₁₂ = A₂F₂₁·합산 법칙·차트와 공식", "View factor F₁₂: definition · reciprocity A₁F₁₂ = A₂F₂₁ · summation rule · charts & formulas")}</li>
          <li>{t("회색체: 라디오시티 J = ρG + εE_b → 저항 네트워크 → 3표면 예제 (328.3 → 131.2 kW)", "Gray surfaces: radiosity J = ρG + εE_b → resistance network → 3-surface example (328.3 → 131.2 kW)")}</li>
        </ol>
        <Note>
          {t(
            "두 부분을 잇는 끈: 둘 다 '저항 네트워크'로 끝납니다. 제어는 전달함수 블록 선도(직렬 = 곱), 복사는 표면저항 ρ/(εA)와 기하저항 1/(A₁F₁₂)의 직렬 연결 — 3주차 열저항 개념이 다시 등장합니다.",
            "The thread joining the two parts: both end in 'resistance networks'. Control uses transfer-function block diagrams (series = multiply); radiation strings surface resistances ρ/(εA) and geometric resistances 1/(A₁F₁₂) in series — Week 3's thermal-resistance idea returns."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Stirred tank → first order ---------------------------------- */
function TabTank({ t }) {
  const [V, setV] = useState(0.5);
  const [mdot, setMdot] = useState(0.25);
  const [dQ, setdQ] = useState(10); // kW step
  const cp = 4184, rho = 1000;
  const K = 1 / (mdot * cp);           // K per W
  const tau = (rho * V) / mdot;        // s
  const yInf = K * dQ * 1e3;           // K

  const Wd = 620, H = 270, pad = { l: 52, r: 16, t: 14, b: 36 };
  const Tend = Math.max(4 * tau, 600);
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * x) / Tend;
  const py = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / Math.max(yInf * 1.15, 1e-9);
  const pts = [];
  for (let i = 0; i <= 300; i++) {
    const tt = (Tend * i) / 300;
    pts.push([px(tt), py(yInf * (1 - Math.exp(-tt / tau)))]);
  }

  return (
    <div>
      <Panel title={t("교반조 가열계: 수지에서 전달함수까지", "The stirred-tank heater: from balance to transfer function")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("일정 홀드업 V의 교반조에 유량 ṁ, 온도 Tᵢₙ의 액체가 들어오고 히터가 Q를 공급합니다. 에너지 수지:",
             "A stirred tank of constant holdup V receives liquid at flow ṁ and temperature Tᵢₙ, heated at rate Q. Energy balance:")}
        </p>
        <Eq block>ρVc_p dT/dt = ṁc_p(T_in − T) + Q</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("정상상태를 빼서 편차변수 T′ = T − T̄ 로 쓰고 Laplace 변환하면 (초기값 0):",
             "Subtract the steady state, write deviation variables T′ = T − T̄, and Laplace-transform (zero initial value):")}
        </p>
        <Eq block>T′(s) = [K/(τs+1)] Q′(s) + [1/(τs+1)] T′_in(s),&nbsp;&nbsp; K = 1/(ṁc_p),&nbsp; τ = ρV/ṁ</Eq>
        <Note>
          {t("자유도 분석(강의): 변수 4(T; Tᵢₙ, ṁ, Q) − 식 1 = 자유도 3. Tᵢₙ·ṁ은 외란(load) 변수, Q가 조작(manipulated) 변수입니다 — 제어의 배역이 여기서 정해집니다.",
             "Degrees of freedom (lecture): 4 variables (T; Tᵢₙ, ṁ, Q) − 1 equation = 3. Tᵢₙ and ṁ are disturbance (load) variables; Q is the manipulated variable — the cast of the control problem is fixed here.")}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: 1차계 계단응답", "Interactive: first-order step response")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("홀드업 V", "Holdup V")} value={V} min={0.1} max={2} step={0.05} onChange={setV} unit=" m³" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("유량 ṁ", "Flow ṁ")} value={mdot} min={0.05} max={1} step={0.01} onChange={setMdot} unit=" kg/s" fmt={(v) => v.toFixed(2)} />
          <Slider label={t("히터 계단 ΔQ", "Heater step ΔQ")} value={dQ} min={1} max={50} step={1} onChange={setdQ} unit=" kW" />
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          {polyline(pts, C.copper, 2.5)}
          <line x1={px(0)} y1={py(yInf)} x2={px(Tend)} y2={py(yInf)} stroke={C.cool} strokeDasharray="5 4" />
          <line x1={px(tau)} y1={py(0)} x2={px(tau)} y2={py(0.632 * yInf)} stroke={C.inkSoft} strokeDasharray="3 3" />
          <circle cx={px(tau)} cy={py(0.632 * yInf)} r={3.5} fill={C.warn} />
          <text x={px(tau) + 6} y={py(0.632 * yInf) - 6} fontSize="11.5" fill={C.warn}>t = τ → 63.2%</text>
          <text x={Wd - pad.r - 4} y={py(yInf) - 6} fontSize="11.5" fill={C.cool} textAnchor="end">T′(∞) = KΔQ = {yInf.toFixed(2)} K</text>
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 8} fontSize="12" fill={C.inkSoft} textAnchor="middle">t (s)</text>
          <text x={14} y={(pad.t + H - pad.b) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`} textAnchor="middle">T′ (K)</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "8px 14px" }}>
          K = 1/(ṁc_p) = {(K * 1e3).toFixed(3)} K/kW &nbsp;·&nbsp; τ = ρV/ṁ = {tau.toFixed(0)} s &nbsp;·&nbsp; T′(∞) = {yInf.toFixed(2)} K
        </div>
        <Note>
          {t("τ = ρV/ṁ는 '체류시간'입니다 — 탱크가 클수록, 유량이 작을수록 반응이 느립니다. K = 1/(ṁc_p)는 정상상태 이득: 같은 Q라도 유량이 작으면 온도가 크게 오릅니다. 7주차 중간시험의 관류 가열 문제와 같은 구조(ODE의 시간상수)임을 확인하세요.",
             "τ = ρV/ṁ is the residence time — a bigger tank or smaller flow responds more slowly. K = 1/(ṁc_p) is the steady-state gain: the same Q heats a smaller flow further. Note it is the same structure (an ODE time constant) as the flow-heating problems of earlier weeks.")}
        </Note>
      </Panel>

      <Panel title={t("Laplace 변환 최소 상자", "A minimal Laplace toolbox")}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr style={{ background: C.copperPale }}>
                {[t("f(t)", "f(t)"), "L[f(t)] = F(s)", t("쓰임", "Used for")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["a (const)", "a/s", t("계단 입력", "step inputs")],
                ["df/dt", "sF(s) − f(0)", t("미분방정식 → 대수방정식", "ODE → algebra")],
                ["∫₀ᵗ f dτ", "F(s)/s", t("적분 제어", "integral control")],
                ["e^{−bt}", "1/(s+b)", t("1차계 응답", "first-order response")],
                ["f(t−θ)·u(t−θ)", "e^{−θs}F(s)", t("수송 지연(데드타임)", "transport delay (dead time)")],
                ["δ(t)", "1", t("임펄스 응답 = 전달함수", "impulse response = transfer function")],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: j < 2 ? mono : font, fontSize: j < 2 ? 12.5 : 13.5 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
          {t("전달함수 G(s) ≡ Y(s)/X(s)는 '원인 → 결과'의 블록입니다. 성질 세 가지: ① 정상상태 이득 κ = lim_{s→0} G(s), ② 병렬 입력은 더하고, ③ 직렬 블록은 곱합니다 — 복잡한 공정도 블록 선도로 조립됩니다.",
             "The transfer function G(s) ≡ Y(s)/X(s) is a cause → effect block. Three properties: ① steady-state gain κ = lim_{s→0} G(s); ② parallel inputs add; ③ series blocks multiply — complex processes assemble like block diagrams.")}
        </p>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: FOPDT fitting ---------------------------------- */
function TabFOPDT({ t }) {
  const [t1, setT1] = useState(21.8);
  const [t2, setT2] = useState(36.0);
  const tauP = (3 * (t2 - t1)) / 2;
  const thetaP = (3 * t1 - t2) / 2;
  const valid = tauP > 0 && thetaP >= 0;

  /* lecture-like experimental points (normalized), generated from the true model + mild noise pattern */
  const data = useMemo(() => {
    const pts = [];
    const noise = [0.01, -0.01, 0.02, -0.02, 0.01, 0.03, -0.02, 0.02, -0.01, 0.05, -0.04, 0.03, 0.01, -0.03, 0.06, -0.03, 0.02, 0.04, -0.02, 0.01, 0.03];
    for (let i = 0; i <= 20; i++) {
      const tt = i * 10;
      const y = fopdtStep(tt, 1, 1, 21.3, 14.7) + (tt > 5 ? noise[i] : 0);
      pts.push([tt, Math.max(0, y)]);
    }
    return pts;
  }, []);

  const Wd = 620, H = 290, pad = { l: 52, r: 16, t: 14, b: 36 };
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * x) / 200;
  const py = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / 1.2;
  const fit = [];
  for (let i = 0; i <= 400; i++) {
    const tt = (200 * i) / 400;
    fit.push([px(tt), py(valid ? fopdtStep(tt, 1, 1, tauP, thetaP) : 0)]);
  }

  return (
    <div>
      <Panel title={t("FOPDT: 1차계 + 데드타임", "FOPDT: first order plus dead time")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("실제 열교환기의 밸브 → 온도 응답은 순수 1차계보다 늦게 '출발'합니다 — 증기가 배관을 지나 열이 측정점에 닿기까지의 수송 지연 θₚ 때문입니다. 그래서 산업 표준 근사는:",
             "A real exchanger's valve → temperature response starts late — the transport delay θₚ for steam to travel the piping and heat to reach the sensor. Hence the industry-standard approximation:")}
        </p>
        <Eq block>τ_p dy/dt = −y(t) + K_p u(t − θ_p) &nbsp;&nbsp;⇔&nbsp;&nbsp; G(s) = K_p e^{"{−θ_p s}"}/(τ_p s + 1)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("계단 응답에서 y/y∞ = 0.283이 되는 시각 t₁과 0.632가 되는 시각 t₂만 읽으면:", "Read just two times off the step response — t₁ where y/y∞ = 0.283 and t₂ where it is 0.632:")}
        </p>
        <Eq block>τ_p = 3(t₂ − t₁)/2, &nbsp;&nbsp; θ_p = (3t₁ − t₂)/2</Eq>
        <Note>
          {t("왜 0.283과 0.632인가? t₂ = θₚ + τₚ에서 1 − e⁻¹ = 0.632, t₁ = θₚ + τₚ/3에서 1 − e^(−1/3) = 0.283이 되도록 고른 것입니다 — 두 식을 연립하면 위의 공식이 나옵니다.",
             "Why 0.283 and 0.632? They are chosen so t₂ = θₚ + τₚ gives 1 − e⁻¹ = 0.632 and t₁ = θₚ + τₚ/3 gives 1 − e^(−1/3) = 0.283 — solve the pair and the formulas above drop out.")}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: 강의 실험 데이터 2점 피팅", "Interactive: two-point fit of the lecture's experimental data")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0 18px" }}>
          <Slider label={t("t₁ (y/y∞ = 0.283 시각)", "t₁ (time of y/y∞ = 0.283)")} value={t1} min={10} max={35} step={0.1} onChange={setT1} unit=" s" fmt={(v) => v.toFixed(1)} />
          <Slider label={t("t₂ (y/y∞ = 0.632 시각)", "t₂ (time of y/y∞ = 0.632)")} value={t2} min={20} max={60} step={0.1} onChange={setT2} unit=" s" fmt={(v) => v.toFixed(1)} />
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          <line x1={px(0)} y1={py(1)} x2={px(200)} y2={py(1)} stroke={C.cool} strokeDasharray="5 4" />
          <line x1={px(0)} y1={py(0.632)} x2={px(200)} y2={py(0.632)} stroke={C.inkSoft} strokeDasharray="2 4" />
          <line x1={px(0)} y1={py(0.283)} x2={px(200)} y2={py(0.283)} stroke={C.inkSoft} strokeDasharray="2 4" />
          {data.map(([x, y], i) => <circle key={i} cx={px(x)} cy={py(y)} r={3.2} fill={C.warn} />)}
          {valid && polyline(fit, C.copper, 2.5)}
          <line x1={px(t1)} y1={py(0)} x2={px(t1)} y2={py(0.283)} stroke={C.good} strokeDasharray="3 3" />
          <line x1={px(t2)} y1={py(0)} x2={px(t2)} y2={py(0.632)} stroke={C.good} strokeDasharray="3 3" />
          <text x={px(t1)} y={py(0) + 14} fontSize="11.5" fill={C.good} textAnchor="middle">t₁</text>
          <text x={px(t2)} y={py(0) + 14} fontSize="11.5" fill={C.good} textAnchor="middle">t₂</text>
          <text x={px(3)} y={py(0.632) - 4} fontSize="10.5" fill={C.inkSoft}>0.632</text>
          <text x={px(3)} y={py(0.283) - 4} fontSize="10.5" fill={C.inkSoft}>0.283</text>
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 8} fontSize="12" fill={C.inkSoft} textAnchor="middle">t (s)</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: valid ? C.copperPale : "#fde8e8", borderRadius: 8, padding: "8px 14px" }}>
          {valid
            ? <>τ_p = 3(t₂−t₁)/2 = {tauP.toFixed(1)} s · θ_p = (3t₁−t₂)/2 = {thetaP.toFixed(1)} s {Math.abs(tauP - 21.3) < 0.75 && Math.abs(thetaP - 14.7) < 0.75 ? t(" → 강의값 21.3 / 14.7 재현 ✓", " → lecture's 21.3 / 14.7 reproduced ✓") : ""}</>
            : t("θ_p < 0: t₂ > 3t₁이면 비물리적 — t₁·t₂를 다시 읽으세요", "θ_p < 0: t₂ > 3t₁ is unphysical — re-read t₁ and t₂")}
        </div>
        <Note>
          {t("빨간 점이 강의의 '증기 밸브 전압 계단에 대한 탱크 온도' 측정 데이터(정규화)입니다. t₁ = 21.8, t₂ = 36.0으로 맞추면 피팅 곡선이 데이터를 관통합니다 — 모델 2개 파라미터로 잡음 낀 실험 전체를 요약하는 것이 FOPDT의 힘입니다.",
             "The red dots are the lecture's measured tank-temperature response to a steam-valve voltage step (normalized). Set t₁ = 21.8, t₂ = 36.0 and the fitted curve threads the data — two parameters summarizing a noisy experiment is the power of FOPDT.")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: PID control ---------------------------------- */
function TabPID({ t }) {
  const [mode, setMode] = useState("PI");
  const [Kc, setKc] = useState(1.23);
  const [tauI, setTauI] = useState(24.6);
  const [tauD, setTauD] = useState(0);
  const [scenario, setScenario] = useState("setpoint");
  const [ff, setFF] = useState("none");

  const sim = useMemo(() => {
    const tI = mode === "P" ? 0 : tauI;
    const tD = mode === "PID" ? tauD : 0;
    const sp = scenario === "setpoint" ? 1 : 0;
    const d = scenario === "setpoint" ? 0 : 1;
    return closedLoop({ Kc, tauI: tI, tauD: tD, setpoint: sp, disturb: d, ff: scenario === "disturb" ? ff : "none" });
  }, [Kc, tauI, tauD, mode, scenario, ff]);

  const Wd = 640, H = 300, pad = { l: 52, r: 16, t: 14, b: 36 };
  const Tend = 250;
  let ymin = 0, ymax = 1.4;
  for (let k = 0; k < sim.n; k++) { ymin = Math.min(ymin, sim.ys[k]); ymax = Math.max(ymax, sim.ys[k]); }
  ymax = Math.min(Math.max(ymax * 1.08, 0.2), 3); ymin = Math.max(Math.min(ymin * 1.08, 0), -1.5);
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * x) / Tend;
  const py = (v) => H - pad.b - ((H - pad.t - pad.b) * (Math.max(ymin, Math.min(ymax, v)) - ymin)) / (ymax - ymin);
  const pts = [];
  for (let k = 0; k < sim.n; k += 4) pts.push([px(k * sim.dt), py(sim.ys[k])]);
  const target = scenario === "setpoint" ? 1 : 0;
  let peak = 0, tpk = 0, yss = sim.ys[sim.n - 1];
  for (let k = 0; k < sim.n; k++) { const a = Math.abs(sim.ys[k] - (scenario === "setpoint" ? 0 : 0)); if (scenario === "setpoint" ? sim.ys[k] > peak : a > peak) { peak = scenario === "setpoint" ? sim.ys[k] : a; tpk = k * sim.dt; } }
  const diverged = !isFinite(yss) || Math.abs(yss) > 10;

  const itae = () => { setKc(1.2341); setTauI(24.5582); setMode("PI"); };

  return (
    <div>
      <Panel title={t("피드백 제어: P → PI → PID", "Feedback control: P → PI → PID")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("오차 e(t) = y_sp − y_m 에 대해 제어기 출력은:", "For the error e(t) = y_sp − y_m the controller output is:")}
        </p>
        <Eq block>p(t) = p̄ + K_c [ e(t) + (1/τ_I) ∫₀ᵗ e dt′ + τ_D de/dt ]</Eq>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 540 }}>
            <thead>
              <tr style={{ background: C.copperPale }}>
                {[t("모드", "Mode"), t("전달함수", "Transfer fn"), t("특징 (강의 요약)", "Character (lecture)")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["P", "K_c", t("튜닝 최간단 — 지속 외란·설정변경에 오프셋 잔존", "simplest to tune — offset remains under sustained load/setpoint change")],
                ["PI", "K_c(1 + 1/τ_I s)", t("오프셋 제거 — 가장 널리 쓰이는 FB 제어기", "kills offset — the most popular feedback controller")],
                ["PD", "K_c(1 + τ_D s)", t("예측(감쇠) 효과 — 잡음에 민감", "anticipatory damping — noise-sensitive")],
                ["PID", "K_c(1 + 1/τ_I s + τ_D s)", t("최고 성능·튜닝 3개 — 미분항은 잡음 주의", "best performance, 3 knobs — derivative amplifies noise")],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: j === 1 ? mono : font, fontSize: j === 1 ? 12.5 : 13.5 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={t("인터랙티브: 열교환기 폐루프 시뮬레이터", "Interactive: heat-exchanger closed-loop simulator")}>
        <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6 }}>
          {t("플랜트는 강의의 FOPDT 피팅 결과 G = e^(−14.7s)/(21.3s+1), 외란 경로는 G_d = e^(−35s)/(25s+1)입니다.",
             "The plant is the lecture's fitted FOPDT G = e^(−14.7s)/(21.3s+1); the disturbance path is G_d = e^(−35s)/(25s+1).")}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
          <Seg value={mode} onChange={setMode} options={[{ v: "P", label: "P" }, { v: "PI", label: "PI" }, { v: "PID", label: "PID" }]} />
          <Seg value={scenario} onChange={setScenario} options={[{ v: "setpoint", label: t("설정값 계단", "Setpoint step") }, { v: "disturb", label: t("외란 계단", "Disturbance step") }]} />
          {scenario === "disturb" && (
            <Seg value={ff} onChange={setFF} options={[
              { v: "none", label: t("FB만", "FB only") },
              { v: "static", label: t("정적 FF+FB", "static FF+FB") },
              { v: "leadlag", label: t("정밀 FF+FB", "exact FF+FB") },
            ]} />
          )}
          <button onClick={itae} style={btnStyle(false)}>{t("ITAE 튜닝 적용 (Kc=1.234, τI=24.56)", "Apply ITAE tuning (Kc=1.234, τI=24.56)")}</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0 18px" }}>
          <Slider label="K_c" value={Kc} min={0.1} max={4} step={0.01} onChange={setKc} fmt={(v) => v.toFixed(2)} />
          {mode !== "P" && <Slider label="τ_I" value={tauI} min={5} max={100} step={0.5} onChange={setTauI} unit=" s" fmt={(v) => v.toFixed(1)} />}
          {mode === "PID" && <Slider label="τ_D" value={tauD} min={0} max={15} step={0.25} onChange={setTauD} unit=" s" fmt={(v) => v.toFixed(2)} />}
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          <line x1={px(0)} y1={py(target)} x2={px(Tend)} y2={py(target)} stroke={C.cool} strokeDasharray="5 4" />
          {ymin < 0 && <line x1={px(0)} y1={py(0)} x2={px(Tend)} y2={py(0)} stroke={C.line} />}
          {polyline(pts, diverged ? C.warn : C.copper, 2.5)}
          <text x={Wd - pad.r - 4} y={py(target) - 6} fontSize="11.5" fill={C.cool} textAnchor="end">{scenario === "setpoint" ? "y_sp = 1" : "y_sp = 0"}</text>
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 8} fontSize="12" fill={C.inkSoft} textAnchor="middle">t (s)</text>
          <text x={14} y={(pad.t + H - pad.b) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`} textAnchor="middle">y</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: diverged ? "#fde8e8" : C.copperPale, borderRadius: 8, padding: "8px 14px" }}>
          {diverged
            ? t("발산! — 데드타임이 있는 루프에서 이득이 너무 큽니다 (한계 이득 K_u ≈ 2.95)", "Diverged! — gain too high for a dead-time loop (ultimate gain K_u ≈ 2.95)")
            : scenario === "setpoint"
              ? <>peak = {peak.toFixed(3)} @ t = {tpk.toFixed(0)} s · y(250 s) = {yss.toFixed(3)} {mode === "P" ? t(`· 오프셋 = ${(1 - yss).toFixed(3)} (이론 1/(1+Kc) = ${(1 / (1 + Kc)).toFixed(3)})`, `· offset = ${(1 - yss).toFixed(3)} (theory 1/(1+Kc) = ${(1 / (1 + Kc)).toFixed(3)})`) : t("· 오프셋 없음 (적분 작용)", "· no offset (integral action)")}</>
              : <>max |y| = {peak.toFixed(3)} {ff === "none" ? t("(강의 그림 ~0.53)", "(lecture ~0.53)") : ff === "static" ? t("(heatex 데모 구성, 강의 그림 ~0.17)", "(heatex demo config, lecture ~0.17)") : t("(F = −G_d/G: 완전 상쇄)", "(F = −G_d/G: full cancellation)")}</>}
        </div>
        <Note>
          {t("ITAE 튜닝(강의): Kc = 0.859(θ/τ)^(−0.977) = 1.2341, τI = (τ/0.674)(θ/τ)^0.680 = 24.56. 설정값 계단에서 피크 ~1.26(t ≈ 46 s)이 강의 그림 그대로 재현됩니다. 피드포워드 F = −G_d/G는 외란이 오차를 만들기 전에 상쇄합니다 — θ_d > θ_p라서 인과적으로 구현 가능하고, MATLAB heatex 데모의 '정적 FF'(이득 −1, 지연 25 s)는 ~0.17의 잔차를 남깁니다.",
             "ITAE tuning (lecture): Kc = 0.859(θ/τ)^(−0.977) = 1.2341, τI = (τ/0.674)(θ/τ)^0.680 = 24.56. The setpoint step reproduces the lecture's ~1.26 peak near t ≈ 46 s. Feedforward F = −G_d/G cancels the disturbance before any error forms — causal here because θ_d > θ_p; the MATLAB heatex demo's static FF (gain −1, delay 25 s) leaves the ~0.17 residual.")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Planck ---------------------------------- */
function TabPlanck({ t }) {
  const [T, setT] = useState(5800);
  const [showRJ, setShowRJ] = useState(true);
  const lamC = WIEN_B / T; // μm
  const Fb = SIGMA * Math.pow(T, 4);
  const peakVal = planckLam(lamC, T);

  const Wd = 640, H = 300, pad = { l: 58, r: 16, t: 14, b: 38 };
  const lamMax = Math.min(Math.max(lamC * 4.5, 1.5), 50);
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * x) / lamMax;
  const py = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / (peakVal * 1.12);
  const pts = [], rj = [];
  for (let i = 1; i <= 400; i++) {
    const lam = (lamMax * i) / 400;
    pts.push([px(lam), py(planckLam(lam, T))]);
    const r = rayleighJeansLam(lam, T);
    if (r < peakVal * 1.12) rj.push([px(lam), py(r)]);
    else if (rj.length === 0 || rj[rj.length - 1][1] > pad.t) rj.push([px(lam), pad.t]);
  }
  /* visible band 0.38-0.76 μm */
  const visL = px(Math.min(0.38, lamMax)), visR = px(Math.min(0.76, lamMax));

  return (
    <div>
      <Panel title={t("자외선 파탄에서 플랑크 법칙으로", "From the ultraviolet catastrophe to Planck's law")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("공동(cavity) 안 정상파 모드 수를 세면 진동수 ν 근방의 상태밀도가 g(ν)dν = 8πVν²/c³ dν입니다. 고전 등분배 ⟨E⟩ = k_BT를 곱하면 Rayleigh-Jeans 법칙 — λ → 0에서 에너지가 발산합니다(자외선 파탄). 플랑크의 해결: 진동 에너지가 Eₙ = nhν로 양자화되어 있다면, 분배함수로부터",
             "Counting standing-wave modes in a cavity gives the density of states g(ν)dν = 8πVν²/c³ dν. Classical equipartition ⟨E⟩ = k_BT then yields Rayleigh-Jeans — diverging as λ → 0 (the ultraviolet catastrophe). Planck's fix: if vibration energies are quantized, Eₙ = nhν, the partition function gives")}
        </p>
        <Eq block>⟨E⟩ = hν / (e^{"{hν/k_BT}"} − 1) &nbsp;→&nbsp; F_λ = (2πhc²/λ⁵) / (e^{"{hc/λk_BT}"} − 1)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("hν ≪ k_BT에서는 Rayleigh-Jeans로 수렴(대응원리), hν ≫ k_BT에서는 지수적으로 소멸 — 파탄이 사라집니다. 전 파장 적분은 Bose-Einstein 적분 ∫x³/(eˣ−1)dx = π⁴/15를 거쳐:",
             "For hν ≪ k_BT it reduces to Rayleigh-Jeans (correspondence principle); for hν ≫ k_BT it dies exponentially — no catastrophe. Integrating over wavelength via ∫x³/(eˣ−1)dx = π⁴/15:")}
        </p>
        <Eq block>F = σT⁴, &nbsp; σ = 2π⁵k_B⁴/(15h³c²) = 5.670×10⁻⁸ W/m²K⁴</Eq>
      </Panel>

      <Panel title={t("인터랙티브: 흑체 스펙트럼", "Interactive: the blackbody spectrum")}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Slider label={t("온도 T", "Temperature T")} value={T} min={300} max={8000} step={50} onChange={setT} unit=" K" />
          </div>
          <label style={{ fontSize: 13.5, color: C.inkSoft }}>
            <input type="checkbox" checked={showRJ} onChange={(e) => setShowRJ(e.target.checked)} style={{ accentColor: C.copper, marginRight: 6 }} />
            {t("Rayleigh-Jeans 겹쳐 보기", "Overlay Rayleigh-Jeans")}
          </label>
        </div>
        <AxisBox W={Wd} H={H} pad={pad}>
          {visR > visL + 1 && <rect x={visL} y={pad.t} width={visR - visL} height={H - pad.t - pad.b} fill="#fdf3cf" opacity="0.8" />}
          {showRJ && polyline(rj, C.inkSoft, 1.8, "6 4")}
          {polyline(pts, C.copper, 2.5)}
          <line x1={px(lamC)} y1={py(0)} x2={px(lamC)} y2={py(peakVal)} stroke={C.warn} strokeDasharray="3 3" />
          <circle cx={px(lamC)} cy={py(peakVal)} r={4} fill={C.warn} />
          <text x={px(lamC) + 6} y={py(peakVal) - 8} fontSize="11.5" fill={C.warn}>λ_C = {lamC.toFixed(2)} μm</text>
          {visR > visL + 1 && <text x={(visL + visR) / 2} y={pad.t + 14} fontSize="10.5" fill={C.inkSoft} textAnchor="middle">{t("가시광", "visible")}</text>}
          {showRJ && rj.length > 4 && <text x={rj[Math.min(40, rj.length - 1)][0] + 6} y={Math.max(rj[Math.min(40, rj.length - 1)][1], pad.t + 22)} fontSize="11" fill={C.inkSoft}>Rayleigh-Jeans ∝ λ⁻⁴</text>}
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 8} fontSize="12" fill={C.inkSoft} textAnchor="middle">λ (μm)</text>
          <text x={14} y={(pad.t + H - pad.b) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`} textAnchor="middle">F_λ (W/m²·μm)</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "8px 14px" }}>
          λ_C·T = {WIEN_B.toFixed(0)} μm·K → λ_C = {lamC.toFixed(2)} μm · F = σT⁴ = {Fb >= 1e6 ? (Fb / 1e6).toFixed(2) + " MW/m²" : (Fb / 1e3).toFixed(2) + " kW/m²"}
        </div>
        <Note>
          {t("T = 5800 K(태양)에서 λ_C ≈ 0.50 μm — 정확히 가시광 한가운데입니다(우리 눈이 태양 스펙트럼에 맞춰 진화). 310 K(체온)는 λ_C ≈ 9.3 μm(적외선), 1500 K(가열로)는 1.9 μm. Wien 피크의 초월방정식 xeˣ/(eˣ−1) = 5의 해가 x = 4.965이고, 진동수 기준(=3)이면 x = 2.821 — 피크 위치가 표현(λ vs ν)에 따라 다른 점에 주의하세요.",
             "At T = 5800 K (the Sun) λ_C ≈ 0.50 μm — dead center of the visible band (our eyes evolved to match). At 310 K (body temperature) λ_C ≈ 9.3 μm (IR); a 1500 K furnace peaks at 1.9 μm. The Wien transcendental xeˣ/(eˣ−1) = 5 gives x = 4.965; the frequency form (= 3) gives x = 2.821 — note the peak location depends on the representation (λ vs ν).")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: View factors ---------------------------------- */
function TabView({ t }) {
  const [geom, setGeom] = useState("rect");
  const [side, setSide] = useState(1.0);   // side/distance for squares
  const [rr, setRr] = useState(1.0);       // r/D for disks
  const [ratio, setRatio] = useState(0.5); // r1/r2 for spheres

  let F12, F21, note;
  if (geom === "rect") {
    F12 = fRect(side, side);
    F21 = F12;
    note = t("정면으로 마주 본 같은 크기 정사각형 (변/거리 = " + side.toFixed(2) + ")", "directly opposed equal squares (side/distance = " + side.toFixed(2) + ")");
  } else if (geom === "disk") {
    F12 = fDisks(rr, rr, 1);
    F21 = F12;
    note = t("동축 평행 원판 (r/D = " + rr.toFixed(2) + ")", "coaxial parallel disks (r/D = " + rr.toFixed(2) + ")");
  } else {
    F12 = 1;
    F21 = ratio * ratio;
    note = t("동심 구 (r₁/r₂ = " + ratio.toFixed(2) + "): F₁₂ = 1, F₂₁ = (r₁/r₂)², F₂₂ = 1 − (r₁/r₂)²", "concentric spheres (r₁/r₂ = " + ratio.toFixed(2) + "): F₁₂ = 1, F₂₁ = (r₁/r₂)², F₂₂ = 1 − (r₁/r₂)²");
  }

  /* chart: F vs ratio for current geometry */
  const Wd = 620, H = 270, pad = { l: 52, r: 16, t: 14, b: 38 };
  const xMax = geom === "sphere" ? 1 : 4;
  const px = (x) => pad.l + ((Wd - pad.l - pad.r) * x) / xMax;
  const py = (v) => H - pad.b - (H - pad.t - pad.b) * Math.min(1, v);
  const curve = [];
  for (let i = 1; i <= 240; i++) {
    const x = (xMax * i) / 240;
    let f;
    if (geom === "rect") f = fRect(x, x);
    else if (geom === "disk") f = fDisks(x, x, 1);
    else f = x * x;
    curve.push([px(x), py(f)]);
  }
  const curX = geom === "rect" ? side : geom === "disk" ? rr : ratio;
  const curF = geom === "sphere" ? F21 : F12;

  return (
    <div>
      <Panel title={t("형상계수: 복사의 기하학", "The view factor: radiation's geometry")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("흑체 표면 A₁에서 떠난 에너지 중 A₂에 도달하는 비율이 형상계수입니다:", "The fraction of energy leaving blackbody surface A₁ that lands on A₂ is the view factor:")}
        </p>
        <Eq block>F₁₂ = (1/A₁)∫∫ (cosθ₁cosθ₂/πr²) dA₁dA₂, &nbsp; q₁⇄₂ = A₁F₁₂(E_b1 − E_b2)</Eq>
        <ul style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 20, margin: "6px 0" }}>
          <li>{t("상호성: A₁F₁₂ = A₂F₂₁ — 한 방향만 계산하면 반대는 공짜", "Reciprocity: A₁F₁₂ = A₂F₂₁ — compute one direction, get the other free")}</li>
          <li>{t("합산: 닫힌 공간에서 Σⱼ Fᵢⱼ = 1 (자기 자신 포함)", "Summation: Σⱼ Fᵢⱼ = 1 in an enclosure (self included)")}</li>
          <li>{t("Fᵢᵢ = 0 (평면·볼록면), Fᵢᵢ > 0 (오목면 — 자신을 봄)", "Fᵢᵢ = 0 for plane/convex faces; Fᵢᵢ > 0 for concave ones (they see themselves)")}</li>
        </ul>
        <Note>
          {t("강의의 1분 예제: 반구(1)가 바닥 원판(2)을 보는 형상계수. F₂₁ = 1(원판은 반구만 봄), A₂F₂₁ = A₁F₁₂에서 F₁₂ = A₂/A₁ = πr²/2πr² = ½. 합산으로 F₁₁ = ½ — 반구는 자기 자신을 절반이나 봅니다.",
             "The lecture's one-minute example: hemisphere (1) over its base disk (2). F₂₁ = 1 (the disk sees only the dome), so reciprocity A₂F₂₁ = A₁F₁₂ gives F₁₂ = A₂/A₁ = πr²/2πr² = ½, and summation gives F₁₁ = ½ — the dome sees itself half the time.")}
        </Note>
      </Panel>

      <Panel title={t("인터랙티브: 기하별 F₁₂", "Interactive: F₁₂ by geometry")}>
        <div style={{ marginBottom: 8 }}>
          <Seg value={geom} onChange={setGeom} options={[
            { v: "rect", label: t("평행 정사각형", "Parallel squares") },
            { v: "disk", label: t("동축 원판", "Coaxial disks") },
            { v: "sphere", label: t("동심 구", "Concentric spheres") },
          ]} />
        </div>
        {geom === "rect" && <Slider label={t("변/거리", "side/distance")} value={side} min={0.1} max={4} step={0.05} onChange={setSide} fmt={(v) => v.toFixed(2)} />}
        {geom === "disk" && <Slider label="r/D" value={rr} min={0.1} max={4} step={0.05} onChange={setRr} fmt={(v) => v.toFixed(2)} />}
        {geom === "sphere" && <Slider label="r₁/r₂" value={ratio} min={0.05} max={0.98} step={0.01} onChange={setRatio} fmt={(v) => v.toFixed(2)} />}
        <AxisBox W={Wd} H={H} pad={pad}>
          {polyline(curve, C.copper, 2.5)}
          <line x1={px(curX)} y1={py(0)} x2={px(curX)} y2={py(curF)} stroke={C.warn} strokeDasharray="3 3" />
          <circle cx={px(curX)} cy={py(curF)} r={4} fill={C.warn} />
          <text x={(pad.l + Wd - pad.r) / 2} y={H - 8} fontSize="12" fill={C.inkSoft} textAnchor="middle">
            {geom === "rect" ? t("변/거리", "side/distance") : geom === "disk" ? "r/D" : "r₁/r₂"}
          </text>
          <text x={14} y={(pad.t + H - pad.b) / 2} fontSize="12" fill={C.inkSoft} transform={`rotate(-90 14 ${(pad.t + H - pad.b) / 2})`} textAnchor="middle">{geom === "sphere" ? "F₂₁" : "F₁₂"}</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "8px 14px" }}>
          F₁₂ = {F12.toFixed(4)} · F₂₁ = {F21.toFixed(4)} — {note}
        </div>
        <Note>
          {t("가까워질수록(비율 ↑) F₁₂ → 1: 상대가 시야를 가득 채웁니다. 강의 차트의 '정사각형, 변/거리 = 1 → F ≈ 0.20', '= 2 → ≈ 0.41'이 공식 계산과 일치함을 확인해 보세요. 복잡한 기하는 수치 적분(view3d 같은 도구)으로 갑니다.",
             "As surfaces approach (ratio ↑), F₁₂ → 1: the other surface fills the view. Check the lecture chart's 'squares, side/distance = 1 → F ≈ 0.20' and '= 2 → ≈ 0.41' against the formula. Complex geometries go to numerical integration (tools like view3d).")}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: Gray-surface network ---------------------------------- */
function TabGray({ t }) {
  const [e1, setE1] = useState(0.4);
  const [e2, setE2] = useState(0.8);
  const [e3, setE3] = useState(1.0);
  const sigL = 5.676e-8; // lecture (classic Welty) value — reproduces 328.3/131.2 kW
  const T = [1100, 550, 0];
  const F = [[0, 0.2, 0.3], [0.2, 0, 0.8], [0.2, 0.2, 0.6]];
  const A1 = 4;
  const Eb = T.map((Ti) => sigL * Math.pow(Ti, 4));
  const J = solveRadiosity(F, [e1, e2, e3], Eb);
  const q1 = e1 > 0.999
    ? A1 * (J[0] - F[0][1] * J[1] - F[0][2] * J[2])
    : (A1 * e1 / (1 - e1)) * (Eb[0] - J[0]);

  /* radiation h coefficient mini-tool */
  const [T1h, setT1h] = useState(400);
  const [T2h, setT2h] = useState(300);
  const hr = 4 * SIGMA * Math.pow(T1h, 3);
  const qEx = SIGMA * (Math.pow(T1h, 4) - Math.pow(T2h, 4));
  const qLin = hr * (T1h - T2h);

  return (
    <div>
      <Panel title={t("회색체: 라디오시티와 저항 네트워크", "Gray surfaces: radiosity & the resistance network")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("실제 표면은 ε < 1. 표면을 떠나는 총 복사(방출 + 반사)를 라디오시티라 합니다:", "Real surfaces have ε < 1. The total radiation leaving a surface (emitted + reflected) is the radiosity:")}
        </p>
        <Eq block>J = ρG + εE_b &nbsp;→&nbsp; q_net = (εA/ρ)(E_b − J)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("Ohm 법칙 비유로: 전위 E_b와 J 사이에 표면저항 ρ/(εA), 두 표면의 J 사이에 기하저항 1/(A₁F₁₂)이 직렬로 연결됩니다. 두 회색 표면이면:",
             "In the Ohm's-law analogy: a surface resistance ρ/(εA) sits between the potentials E_b and J, and a geometric resistance 1/(A₁F₁₂) between the two surfaces' J's. For two gray surfaces:")}
        </p>
        <Eq block>q = (E_b1 − E_b2) / [ρ₁/(ε₁A₁) + 1/(A₁F₁₂) + ρ₂/(ε₂A₂)]</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("n-표면계는 각 표면의 라디오시티에 대한 연립 선형방정식이 됩니다:", "An n-surface system becomes a linear system for the radiosities:")}
        </p>
        <Eq block>(1 − F_ii + ε_i/ρ_i) J_i − Σ_j≠i J_j F_ij = (ε_i/ρ_i) E_bi</Eq>
      </Panel>

      <Panel title={t("인터랙티브: 강의 3표면 예제", "Interactive: the lecture's 3-surface example")}>
        <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6 }}>
          {t("T₁ = 1100 K, T₂ = 550 K, T₃ = 0 K · A₁ = 4 m² · F₁₂ = 0.2, F₁₃ = 0.3, F₂₃ = 0.8, F₃₃ = 0.6. ε를 움직여 보세요.",
             "T₁ = 1100 K, T₂ = 550 K, T₃ = 0 K · A₁ = 4 m² · F₁₂ = 0.2, F₁₃ = 0.3, F₂₃ = 0.8, F₃₃ = 0.6. Drag the emissivities.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0 18px" }}>
          <Slider label="ε₁ (1100 K)" value={e1} min={0.05} max={1} step={0.01} onChange={setE1} fmt={(v) => v.toFixed(2)} />
          <Slider label="ε₂ (550 K)" value={e2} min={0.05} max={1} step={0.01} onChange={setE2} fmt={(v) => v.toFixed(2)} />
          <Slider label="ε₃ (0 K)" value={e3} min={0.05} max={1} step={0.01} onChange={setE3} fmt={(v) => v.toFixed(2)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "4px 0 10px" }}>
          <button onClick={() => { setE1(1); setE2(1); setE3(1); }} style={btnStyle(e1 === 1 && e2 === 1 && e3 === 1)}>{t("전부 흑체 (강의 a: 328.3 kW)", "All black (lecture a: 328.3 kW)")}</button>
          <button onClick={() => { setE1(0.4); setE2(0.8); setE3(1); }} style={btnStyle(e1 === 0.4 && e2 === 0.8 && e3 === 1)}>{t("회색 0.4/0.8/1 (강의 c: 131.2 kW)", "Gray 0.4/0.8/1 (lecture c: 131.2 kW)")}</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460, fontFamily: mono }}>
            <thead>
              <tr style={{ background: C.copperPale, fontFamily: font }}>
                {[t("표면", "Surface"), "E_b (W/m²)", "J (W/m²)", t("비고", "Note")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px" }}>{i + 1} ({T[i]} K)</td>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px" }}>{Eb[i].toFixed(0)}</td>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px" }}>{J[i].toFixed(0)}</td>
                  <td style={{ border: `1px solid ${C.line}`, padding: "6px 10px", fontFamily: font, fontSize: 12.5 }}>
                    {[e1, e2, e3][i] > 0.999 ? t("흑체: J = E_b", "black: J = E_b") : t("반사 성분 포함", "includes reflection")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "8px 14px", marginTop: 10 }}>
          q₁ = {(q1 / 1e3).toFixed(1)} kW
          {e1 === 1 && e2 === 1 && e3 === 1 ? t(" — 강의 (a) 328.3 kW ✓", " — lecture (a) 328.3 kW ✓") : ""}
          {Math.abs(e1 - 0.4) < 0.005 && Math.abs(e2 - 0.8) < 0.005 && e3 === 1 ? t(" — 강의 (c) 131.2 kW ✓ (J₁ = 33,900, J₂ = 5,510)", " — lecture (c) 131.2 kW ✓ (J₁ = 33,900, J₂ = 5,510)") : ""}
        </div>
        <Note>
          {t("ε₁을 1 → 0.4로 내리면 q₁이 328 → 131 kW로 급감합니다: 표면저항 ρ/(εA)가 생겨 '전위' E_b1과 J₁ 사이가 벌어지기 때문입니다. 강의의 재복사(단열) 표면 케이스에서 보고된 187.0 kW는 표면 2가 받는 열량 |q₂|에 해당합니다(σ = 5.676×10⁻⁸, 구 문헌값 — 이 패널도 강의와 같은 값을 사용).",
             "Dropping ε₁ from 1 to 0.4 collapses q₁ from 328 to 131 kW: the surface resistance ρ/(εA) opens a gap between the potential E_b1 and J₁. In the lecture's re-radiating (adiabatic) case, the reported 187.0 kW corresponds to the heat received by surface 2, |q₂| (σ = 5.676×10⁻⁸, the classic literature value — this panel uses the lecture's value too).")}
        </Note>
      </Panel>

      <Panel title={t("복사 열전달계수 h_r — 대류와 합산하기", "The radiation coefficient h_r — adding it to convection")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("σ(T₁⁴−T₂⁴)를 T₁ 근방에서 선형화하면 h_r = 4F₁₂σT₁³ — 복사를 '또 하나의 h'로 바꿔 대류와 더할 수 있습니다: h_total = h_conv + h_rad.",
             "Linearize σ(T₁⁴−T₂⁴) about T₁ to get h_r = 4F₁₂σT₁³ — radiation becomes 'one more h' to add to convection: h_total = h_conv + h_rad.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0 18px" }}>
          <Slider label="T₁" value={T1h} min={300} max={1200} step={10} onChange={setT1h} unit=" K" />
          <Slider label="T₂" value={T2h} min={250} max={1100} step={10} onChange={setT2h} unit=" K" />
        </div>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "8px 14px" }}>
          h_r = 4σT₁³ = {hr.toFixed(1)} W/m²K · {t("정확", "exact")} σ(T₁⁴−T₂⁴) = {qEx.toFixed(0)} W/m² vs h_rΔT = {qLin.toFixed(0)} W/m²
          ({T1h > T2h ? ((qLin / qEx - 1) * 100).toFixed(0) : "—"}% {t("과대", "over")})
        </div>
        <Note>
          {t("ΔT가 T₁에 비해 작을 때만 선형화가 정확합니다(접선 근사). 400 K 벽이 300 K 주위로 복사하면 h_r ≈ 15 W/m²K — 자연대류와 같은 자릿수라서, 상온 부근에서도 복사를 무시하면 안 되는 이유입니다.",
             "The linearization is accurate only for ΔT small compared to T₁ (a tangent-line estimate). A 400 K wall radiating to 300 K surroundings has h_r ≈ 15 W/m²K — the same order as natural convection, which is why radiation can't be ignored even near room temperature.")}
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
        "P1. 교반조(V = 0.2 m³, ṁ = 0.1 kg/s, 물)의 히터를 5 kW 계단 증가시켰다. (a) 시간상수 τ와 정상상태 온도 상승을 구하라. (b) 응답이 95%에 도달하는 시간은?",
        "P1. A stirred tank (V = 0.2 m³, ṁ = 0.1 kg/s, water) gets a 5 kW heater step. (a) Find the time constant τ and the steady-state temperature rise. (b) When does the response reach 95%?"
      ),
      s: t(
        "(a) τ = ρV/ṁ = 1000·0.2/0.1 = 2000 s ≈ 33분. K = 1/(ṁc_p) = 1/(0.1·4184) = 2.39×10⁻³ K/W → ΔT∞ = K·ΔQ = 2.39×10⁻³ × 5000 = 11.95 K. (b) 1 − e^(−t/τ) = 0.95 → t = 3τ ≈ 6000 s. 큰 홀드업의 대가: 느린 응답 — 제어가 필요한 이유입니다.",
        "(a) τ = ρV/ṁ = 1000·0.2/0.1 = 2000 s ≈ 33 min. K = 1/(ṁc_p) = 1/(0.1·4184) = 2.39×10⁻³ K/W → ΔT∞ = K·ΔQ = 2.39×10⁻³ × 5000 = 11.95 K. (b) 1 − e^(−t/τ) = 0.95 → t = 3τ ≈ 6000 s. The price of a large holdup: slow response — this is why control is needed."
      ),
    },
    {
      q: t(
        "P2. 계단 실험에서 y/y∞ = 0.283, 0.632 도달 시각이 t₁ = 15.0 s, t₂ = 27.0 s였다. (a) FOPDT 파라미터를 구하라. (b) ITAE 공식(Kc = 0.859(θ/τ)^−0.977, τI = (τ/0.674)(θ/τ)^0.680)으로 PI 이득을 구하라.",
        "P2. A step test gives y/y∞ = 0.283 at t₁ = 15.0 s and 0.632 at t₂ = 27.0 s. (a) Find the FOPDT parameters. (b) Use the ITAE rules (Kc = 0.859(θ/τ)^−0.977, τI = (τ/0.674)(θ/τ)^0.680) to get PI gains."
      ),
      s: t(
        "(a) τₚ = 3(27−15)/2 = 18.0 s, θₚ = (3·15−27)/2 = 9.0 s. (b) θ/τ = 0.5 → Kc = 0.859·0.5^(−0.977) = 0.859·1.968 = 1.69, τI = (18/0.674)·0.5^0.680 = 26.7·0.624 = 16.7 s. θ/τ가 작을수록(데드타임 비중 ↓) 더 센 이득을 쓸 수 있습니다.",
        "(a) τₚ = 3(27−15)/2 = 18.0 s, θₚ = (3·15−27)/2 = 9.0 s. (b) θ/τ = 0.5 → Kc = 0.859·0.5^(−0.977) = 0.859·1.968 = 1.69, τI = (18/0.674)·0.5^0.680 = 26.7·0.624 = 16.7 s. The smaller θ/τ (less dead time), the harder you can push the gain."
      ),
    },
    {
      q: t(
        "P3. (a) 백열전구 필라멘트(T = 2900 K)의 복사 피크 파장은? 가시광(0.38–0.76 μm)에 피크가 있는가? (b) 같은 전력에서 LED가 훨씬 효율적인 이유를 Wien 법칙으로 설명하라.",
        "P3. (a) Where does a tungsten filament (T = 2900 K) radiate its peak? Is the peak inside the visible band (0.38–0.76 μm)? (b) Use Wien's law to explain why an LED is far more efficient at equal power."
      ),
      s: t(
        "(a) λ_C = 2898/2900 ≈ 1.0 μm — 근적외선. 피크가 가시광 밖이라 방사 에너지 대부분이 열로 낭비됩니다(가시광 효율 ~5%). (b) LED는 열적 방사체가 아니라 밴드갭 발광이므로 Wien 법칙의 제약을 받지 않고 스펙트럼을 가시광에 집중시킵니다 — '백열 = 흑체 스펙트럼의 숙명'이 핵심.",
        "(a) λ_C = 2898/2900 ≈ 1.0 μm — near infrared. The peak sits outside the visible band, so most radiated energy is wasted as heat (~5% luminous efficiency). (b) An LED is not a thermal emitter: band-gap emission is not bound by Wien's law, so its spectrum concentrates in the visible — 'incandescence = the fate of a blackbody spectrum' is the point."
      ),
    },
    {
      q: t(
        "P4. 두 장의 평행 무한 회색판: T₁ = 800 K(ε₁ = 0.6), T₂ = 400 K(ε₂ = 0.9), F₁₂ = 1. 단위면적당 순 복사 열전달을 구하라. (힌트: 저항 직렬 — ρ₁/ε₁ + 1 + ρ₂/ε₂)",
        "P4. Two infinite parallel gray plates: T₁ = 800 K (ε₁ = 0.6), T₂ = 400 K (ε₂ = 0.9), F₁₂ = 1. Find the net radiative flux. (Hint: series resistances — ρ₁/ε₁ + 1 + ρ₂/ε₂)"
      ),
      s: t(
        "q″ = σ(T₁⁴−T₂⁴)/(1/ε₁ + 1/ε₂ − 1) = 5.670×10⁻⁸(800⁴−400⁴)/(1/0.6 + 1/0.9 − 1) = 5.670×10⁻⁸·3.84×10¹¹/1.778 = 21.8/1.778 ≈ 12.2 kW/m². 분모 1/ε₁ + 1/ε₂ − 1은 ρ₁/ε₁ + 1/F₁₂ + ρ₂/ε₂를 F₁₂ = 1, 단위면적으로 정리한 것입니다. 흑체라면 21.8 kW/m² — 회색이 44%를 깎았습니다.",
        "q″ = σ(T₁⁴−T₂⁴)/(1/ε₁ + 1/ε₂ − 1) = 5.670×10⁻⁸(800⁴−400⁴)/(1/0.6 + 1/0.9 − 1) = 5.670×10⁻⁸·3.84×10¹¹/1.778 = 21.8/1.778 ≈ 12.2 kW/m². The denominator 1/ε₁ + 1/ε₂ − 1 is ρ₁/ε₁ + 1/F₁₂ + ρ₂/ε₂ at F₁₂ = 1 per unit area. Black plates would give 21.8 kW/m² — grayness cut 44%."
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
  const code = WEEK8_CODES[topic][lang];

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
              {WEEK8_CODES[tp].title}
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
            "Python·C++ 버전은 실행·수치 검증을 마쳤습니다: FOPDT 2점 피팅이 강의값 τₚ = 21.3 s, θₚ = 14.7 s를, ITAE가 Kc = 1.2341, τI = 24.5582를 재현하고, 폐루프 피크 1.263(t = 46 s)·외란 0.53/0.17도 강의 그림과 일치합니다. 플랑크 적분은 σ = 5.670×10⁻⁸, Wien 4.9651/2.8214를, 복사 네트워크는 강의 3표면 예제(328.3/131.2 kW, J₁ = 33,902)를 재현합니다. 강의 예제의 σ는 5.676×10⁻⁸(고전 문헌값)임을 코드 주석에 명시했습니다.",
            "The Python and C++ versions were executed and verified: the FOPDT two-point fit reproduces the lecture's τₚ = 21.3 s, θₚ = 14.7 s; ITAE gives Kc = 1.2341, τI = 24.5582; the closed loop matches the lecture's 1.263 peak at t = 46 s and the 0.53/0.17 disturbance peaks. The Planck integral yields σ = 5.670×10⁻⁸ and Wien roots 4.9651/2.8214; the radiation network reproduces the lecture 3-surface example (328.3/131.2 kW, J₁ = 33,902). The lecture example's σ is the classic 5.676×10⁻⁸ value, noted in the code comments."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week8App({ language = "kr", onBack }) {
  const [lang, setLang] = useState(language);
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: t("교반조·전달함수", "Tank & TF"), comp: <TabTank t={t} /> },
    { label: t("FOPDT 피팅", "FOPDT fit"), comp: <TabFOPDT t={t} /> },
    { label: t("PID 제어", "PID control"), comp: <TabPID t={t} /> },
    { label: t("플랑크 법칙", "Planck's law"), comp: <TabPlanck t={t} /> },
    { label: t("형상계수", "View factors"), comp: <TabView t={t} /> },
    { label: t("회색체 네트워크", "Gray network"), comp: <TabGray t={t} /> },
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
                Heat & Mass Transfer · Week 8
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("열교환기 제어 & 복사 열전달", "Heat-Exchanger Control & Radiative Heat Transfer")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("전달함수 K/(τs+1) — FOPDT 피팅 — PID·ITAE·피드포워드 — 플랑크 → σT⁴·Wien — 형상계수 — 회색체 네트워크",
                   "Transfer functions K/(τs+1) — FOPDT fitting — PID · ITAE · feedforward — Planck → σT⁴ · Wien — view factors — gray-surface networks")}
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
