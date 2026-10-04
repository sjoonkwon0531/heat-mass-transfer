// Week6App.jsx — Heat & Mass Transfer, Week 6
// Solution methods (finite Fourier transform, generalized Fourier series, Gibbs),
// phase-change heat transfer (boiling curve, Rohsenow, CHF, film boiling;
// Nusselt film condensation), and confined laminar forced convection
// (mixing-cup averages, hollow-fiber dialyzer, Lévêque entrance region,
// Graetz eigenvalues → Nu∞ = λ₁²/2 = 3.656).
// Self-contained: React only (no external chart libraries). KR/EN bilingual.

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import WEEK6_CODES from "./Week6Codes";

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
/* Fourier-sine partial sum of f(x) = 1 */
function sineSeriesOne(x, N) {
  let s = 0;
  for (let n = 1; n <= N; n += 2) s += (4 / (n * Math.PI)) * Math.sin(n * Math.PI * x);
  return s;
}

/* transient membrane Theta(x,t); steady profile 1-x */
function membraneTheta(x, t, nmax = 80) {
  let s = 1 - x;
  for (let n = 1; n <= nmax; n++) {
    s -= (2 / (n * Math.PI)) * Math.exp(-((n * Math.PI) ** 2) * t) * Math.sin(n * Math.PI * x);
  }
  return s;
}

/* water/steam at 1 atm */
const W = {
  g: 9.81, rhoL: 957.9, rhov: 0.596, muL: 2.79e-4, cpL: 4217, PrL: 1.76,
  hfg: 2.257e6, sigma: 0.0589, kL: 0.68, kv: 0.025, nuv: 2.0e-5,
};

function qRohsenow(dT, Csf = 0.013) {
  return W.muL * W.hfg * Math.sqrt((W.g * (W.rhoL - W.rhov)) / W.sigma) *
    Math.pow((W.cpL * dT) / (Csf * W.hfg * Math.pow(W.PrL, 1.7)), 3);
}
const Q_CRIT = 0.18 * W.hfg * W.rhov * Math.pow((W.g * W.sigma * (W.rhoL - W.rhov)) / W.rhov ** 2, 0.25);
function hFilmBoil(dT, D0 = 0.01) {
  return 0.62 * Math.pow((W.kv ** 3 * W.g * (W.rhoL - W.rhov) * (W.hfg + 0.4 * W.cpL * dT)) / (D0 * W.nuv * dT), 0.25);
}

function hPrime(dT) { return W.hfg + 0.375 * W.cpL * dT; }
function hCondAvg(L, dT) {
  return 0.943 * Math.pow((W.kL ** 3 * W.g * hPrime(dT) * W.rhoL * (W.rhoL - W.rhov)) / (W.muL * dT * L), 0.25);
}
function deltaCond(x, dT) {
  return Math.pow((4 * W.kL * W.muL * dT * x) / (W.g * W.rhoL * (W.rhoL - W.rhov) * hPrime(dT)), 0.25);
}

const NU_INF = 3.656; // = lambda1^2/2, lambda1 = 2.7044
const nuLeveque = (zR, Pe) => 1.357 * Math.cbrt(Pe / zR);

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
      <Panel title={t("이번 주: 도구 하나, 현상 둘, 이론 하나", "This week: one tool, two phenomena, one theory")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "6주차는 세 부분으로 구성됩니다. ① 유한 푸리에 변환(FFT) — 지금까지 사례별로 쓰던 변수분리법을 '직교 기저함수에 투영하면 선형 PDE가 모드별 ODE가 된다'는 하나의 체계로 승격시키는 해법 도구입니다. ② 상변화 열전달 — 비등과 응축. 끓는 물 냄비부터 발전소 응축기까지, h가 수만 W/m²K에 이르는 가장 강력한 열전달 모드입니다. ③ 밀폐 층류 유동의 강제대류 이론 — 5주차 상관식들의 이론적 기원(Lévêque, Graetz)을 유도합니다.",
            "Week 6 has three parts. ① The finite Fourier transform (FFT) — promoting separation of variables from a case-by-case trick to one system: project a linear PDE onto orthonormal basis functions and get one ODE per mode. ② Phase-change heat transfer — boiling and condensation, the most powerful transfer modes (h up to tens of kW/m²K), from a kettle to a power-plant condenser. ③ The theory of confined laminar forced convection — deriving where Week 5's correlations came from (Lévêque, Graetz)."
          )}
        </p>
      </Panel>

      <Panel title={t("6주차 로드맵", "Week 6 roadmap")}>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("직교정규 기저함수와 일반화 Fourier 급수 — Gibbs 현상", "Orthonormal basis functions & generalized Fourier series — the Gibbs phenomenon")}</li>
          <li>{t("FFT 해법: ψₙ = ⟨Φₙ, Θ⟩ → PDE가 모드별 ODE로 (비균질 BC·Robin BC·모서리 효과)", "The FFT method: ψₙ = ⟨Φₙ, Θ⟩ turns the PDE into per-mode ODEs (nonhomogeneous & Robin BCs, edge effects)")}</li>
          <li>{t("과도 문제: 정상상태 도달 시간 t ≈ 0.3 L²/D — 그리고 정상상태가 없는 경우", "Transients: steady state at t ≈ 0.3 L²/D — and when no steady state exists")}</li>
          <li>{t("비등 곡선: 핵비등(Rohsenow) → 임계열유속 → Leidenfrost → 막비등", "The boiling curve: nucleate (Rohsenow) → critical heat flux → Leidenfrost → film boiling")}</li>
          <li>{t("Nusselt 응축막 모델: h = 0.943[...]^{1/4}, 원통 0.725, n-튜브 뱅크", "Nusselt film condensation: h = 0.943[...]^{1/4}, cylinders (0.725), n-tube banks")}</li>
          <li>{t("혼합컵 평균과 중공사 투석기 — 전체 물질전달계수 ⟨k⟩", "Mixing-cup averages & the hollow-fiber dialyzer — the overall coefficient ⟨k⟩")}</li>
          <li>{t("입구영역(Lévêque, Nu ~ z^{-1/3})과 Graetz 고유값 → Nu∞ = λ₁²/2 = 3.656", "Entrance region (Lévêque, Nu ~ z^{-1/3}) & Graetz eigenvalues → Nu∞ = λ₁²/2 = 3.656")}</li>
        </ol>
        <Note>
          {t(
            "핵심 메시지: 5주차에서 '받아 쓴' 숫자들 — 3.66, 입구영역의 급락 — 이 이번 주에 유도됩니다. 공학 상관식 뒤에는 언제나 고유값 문제가 있습니다.",
            "Key message: the numbers Week 5 borrowed — 3.66, the entrance-region plunge — get derived this week. Behind every engineering correlation sits an eigenvalue problem."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Series & Gibbs ---------------------------------- */
function TabSeries({ t }) {
  const [N, setN] = useState(9);
  const Wd = 620, H = 280, pad = { l: 48, r: 16, t: 14, b: 34 };
  const px = (x) => pad.l + (Wd - pad.l - pad.r) * x;
  const py = (v) => H - pad.b - (H - pad.t - pad.b) * Math.max(0, Math.min(1.3, v)) / 1.3;
  const pts = [];
  let peak = 0;
  for (let i = 0; i <= 600; i++) {
    const x = i / 600;
    const v = sineSeriesOne(x, N);
    peak = Math.max(peak, v);
    pts.push([px(x), py(v)]);
  }

  return (
    <div>
      <Panel title={t("기저함수: 경계조건이 고른다", "Basis functions: the BCs choose them")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "구간 [0, L]에서 정의된 함수는 완비 직교정규열 Φₙ으로 전개할 수 있습니다: f(x) = Σcₙ Φₙ(x), cₙ = ⟨Φₙ, f⟩. 어떤 Φₙ을 쓰는지는 경계조건이 결정합니다 (Dirichlet/Neumann 조합 4가지):",
            "Any function on [0, L] expands in a complete orthonormal sequence Φₙ: f(x) = Σcₙ Φₙ(x), cₙ = ⟨Φₙ, f⟩. Which Φₙ? The boundary conditions decide (four Dirichlet/Neumann combinations):"
          )}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 540 }}>
            <thead>
              <tr style={{ background: C.copperPale }}>
                {[t("경계조건", "BCs"), t("기저함수 Φₙ", "Basis Φₙ"), t("비고", "Note")].map((h) => (
                  <th key={h} style={{ border: `1px solid ${C.line}`, padding: "6px 10px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Φ(0) = Φ(L) = 0", "√(2/L)·sin(nπx/L)", t("양끝 고정 (막·평판)", "both ends pinned (membrane, slab)")],
                ["Φ′(0) = Φ(L) = 0", "√(2/L)·cos((n+½)πx/L)", t("왼쪽 단열", "left end insulated")],
                ["Φ(0) = Φ′(L) = 0", "√(2/L)·sin((n+½)πx/L)", t("오른쪽 단열", "right end insulated")],
                ["Φ′(0) = Φ′(L) = 0", "√(2/L)·cos(nπx/L), Φ₀ = 1/√L", t("양끝 단열 — 상수 모드 포함!", "both insulated — includes the constant mode!")],
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
        <Note>
          {t("마지막 행의 상수 모드 Φ₀가 3번 탭의 '정상상태가 없는 문제'의 복선입니다 — 양끝이 단열이면 열이 빠져나갈 곳이 없어 평균 온도가 쌓입니다.",
            "That constant mode Φ₀ in the last row foreshadows the no-steady-state problem of the next tab — with both ends insulated, heat has nowhere to leave, so the mean just accumulates.")}
        </Note>
      </Panel>

      <Panel title={t("일반화 Fourier 급수 실험실 — f(x) = 1을 사인으로 그리기", "Series lab — drawing f(x) = 1 with sines")}>
        <Eq block>1 = 2·Σ<sub>n</sub> [1 − (−1)ⁿ]·sin(nπx)/(nπ) &nbsp;&nbsp;({t("홀수 n만 생존", "odd n only survive")})</Eq>
        <Slider
          label={t("급수 항 수 (홀수 n ≤ N)", "Series terms (odd n ≤ N)")}
          value={N} min={1} max={199} step={2} onChange={setN} fmt={(v) => `N = ${v}`}
        />
        <AxisBox W={Wd} H={H} pad={pad}>
          <line x1={pad.l} y1={py(1)} x2={Wd - pad.r} y2={py(1)} stroke={C.inkSoft} strokeDasharray="5 4" />
          <line x1={pad.l} y1={py(1.179)} x2={Wd - pad.r} y2={py(1.179)} stroke={C.warn} strokeDasharray="3 3" />
          <text x={Wd - pad.r - 6} y={py(1.179) - 5} fontSize="11" textAnchor="end" fill={C.warn}>1.179 (Gibbs)</text>
          {polyline(pts, C.copperDeep, 2)}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={px(v)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>{v}</text>
          ))}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={pad.l - 8} y={py(v) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>{v}</text>
          ))}
          <text x={Wd / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
          max = {peak.toFixed(4)} — {t("N을 늘려도 오버슈트는 사라지지 않고 경계로 몰릴 뿐", "raising N never kills the overshoot; it only squeezes toward the jump")}
        </div>
        <Note>
          {t(
            "Gibbs 현상: 불연속(여기선 홀수 확장이 끝에서 2만큼 점프)을 매끈한 사인으로 그리면 점프 폭의 약 9%만큼 항상 넘칩니다 (1 + 2×0.0895 ≈ 1.179). 4주차 변수분리법에서 Fo가 아주 작을 때 보였던 그 진동의 정체입니다.",
            "The Gibbs phenomenon: drawing a discontinuity (the odd extension jumps by 2 here) with smooth sines always overshoots by ~9% of the jump (1 + 2×0.0895 ≈ 1.179). This is the wiggle you saw at tiny Fo in Week 4's separation-of-variables tab."
          )}
        </Note>
      </Panel>

      <Panel title={t("FFT 레시피: PDE → 모드별 ODE", "The FFT recipe: PDE → one ODE per mode")}>
        <Eq block>Θ(x, y) = Σ ψ<sub>n</sub>(y)·Φ<sub>n</sub>(x), &nbsp; ψ<sub>n</sub>(y) = ⟨Φ<sub>n</sub>, Θ⟩ &nbsp;⇒&nbsp; d²ψ<sub>n</sub>/dy² − (nπ)²ψ<sub>n</sub> = C<sub>n</sub>(y) − H<sub>n</sub>(y)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "지배방정식에 Φₙ을 곱해 적분(투영)하면, 부분적분이 경계항을 통해 비균질 BC까지 자동으로 끌어들이며 각 모드가 독립된 2계 ODE가 됩니다. 변수분리가 '되는' 문제만 풀던 방법이, 비균질 항·Robin 조건(λₙ = −Bi·tan λₙ)·모서리 효과까지 다루는 범용 알고리즘이 되는 순간입니다. 2D 예제의 결론 하나: 모서리 효과는 두께의 ~1.3배 거리에서 95% 소멸 — '두께 2배면 잊어도 된다'는 설계 감각이 나옵니다.",
            "Multiply the governing equation by Φₙ and integrate (project): integration by parts pulls nonhomogeneous BCs in through the boundary terms, and each mode becomes an independent 2nd-order ODE. Separation of variables graduates into a general algorithm handling source terms, Robin conditions (λₙ = −Bi·tan λₙ), and edge effects. One design-worthy 2D result: edge effects die to 5% within ~1.3 thicknesses — two thicknesses away, forget the edge."
          )}
        </p>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 3: Transient membrane ---------------------------------- */
function TabTransient({ t }) {
  const [logT, setLogT] = useState(Math.log10(0.02));
  const tt = 10 ** logT;
  const Wd = 620, H = 280, pad = { l: 48, r: 16, t: 14, b: 34 };
  const px = (x) => pad.l + (Wd - pad.l - pad.r) * x;
  const py = (v) => H - pad.b - (H - pad.t - pad.b) * Math.max(0, Math.min(1.05, v)) / 1.05;
  const cur = [], steady = [];
  for (let i = 0; i <= 200; i++) {
    const x = i / 200;
    cur.push([px(x), py(membraneTheta(x, tt))]);
    steady.push([px(x), py(1 - x)]);
  }
  const firstMode = Math.exp(-(Math.PI ** 2) * tt);

  return (
    <div>
      <Panel title={t("과도 확산: 막이 정상상태를 찾아가는 길", "A transient: the membrane finds its steady state")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "왼쪽 면 Θ = 1, 오른쪽 면 Θ = 0, 초기 Θ = 0인 막(강의 Ex3). FFT로 풀면:",
            "A membrane with Θ = 1 on the left face, 0 on the right, starting at Θ = 0 (lecture Ex3). The FFT gives:"
          )}
        </p>
        <Eq block>Θ(x,t) = (1 − x) − 2Σ exp[−(nπ)²t]·sin(nπx)/(nπ)</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("정상해(1−x)에 감쇠하는 급수가 얹힌 구조 — 시간을 움직여 보세요:",
            "The steady profile (1−x) plus a decaying series — move the clock:")}
        </p>
        <Slider
          label={t("log₁₀ t (단위: L²/D)", "log₁₀ t (units of L²/D)")} value={logT} min={-3} max={0} step={0.02}
          onChange={setLogT} fmt={(v) => `t = ${(10 ** v).toFixed(3)}`}
        />
        <AxisBox W={Wd} H={H} pad={pad}>
          {polyline(steady, C.inkSoft, 1.6, "6 4")}
          {polyline(cur, C.copperDeep, 2.5)}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={px(v)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>{v}</text>
          ))}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={pad.l - 8} y={py(v) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>{v}</text>
          ))}
          <text x={Wd / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x</text>
          <text x={Wd - pad.r - 8} y={py(0.95)} fontSize="11.5" textAnchor="end" fill={C.inkSoft}>{t("점선: 정상해 1−x", "dashed: steady 1−x")}</text>
        </AxisBox>
        <div style={{
          display: "inline-block", padding: "6px 14px", borderRadius: 8, margin: "4px 0 8px",
          background: firstMode < 0.05 ? "#e8f2ea" : C.coolPale,
          border: `1px solid ${firstMode < 0.05 ? C.good : C.cool}`,
          color: firstMode < 0.05 ? C.good : C.cool, fontWeight: 700, fontSize: 13.5, fontFamily: mono,
        }}>
          exp(−π²t) = {firstMode.toFixed(3)} {firstMode < 0.05
            ? t("→ 사실상 정상상태 (95% 도달)", "→ effectively steady (95% there)")
            : t("→ 아직 과도 상태", "→ still transient")}
        </div>
        <Note>
          {t(
            "가장 느린 모드 exp(−π²t)가 0.05가 되는 t = 3/π² ≈ 0.3. 그래서 '정상상태 도달 시간 ≈ 0.3 L²/D'가 강의의 실전 규칙입니다. 4주차의 Fo ≳ 0.2 1항 근사 조건과 같은 혈통의 숫자입니다.",
            "The slowest mode exp(−π²t) hits 0.05 at t = 3/π² ≈ 0.3 — hence the lecture's working rule 'steady state at ≈ 0.3 L²/D'. Same bloodline as Week 4's one-term condition Fo ≳ 0.2."
          )}
        </Note>
      </Panel>

      <Panel title={t("정상상태가 없는 문제 (Ex4)", "The problem with no steady state (Ex4)")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "양끝이 Neumann 조건인 막 — 왼쪽에서 일정 열유속 공급(Θ′ = −1), 오른쪽 단열(Θ′ = 0). 기저에 상수 모드 Φ₀ = 1이 포함되고, 그 모드의 ODE는 dψ₀/dt = 1 → ψ₀ = t. 해는",
            "A membrane with two Neumann conditions — constant flux in on the left (Θ′ = −1), insulated on the right (Θ′ = 0). The basis now includes the constant mode Φ₀ = 1, whose ODE reads dψ₀/dt = 1 → ψ₀ = t. So"
          )}
        </p>
        <Eq block>Θ(x,t) = t + 2Σ[1 − exp(−(nπ)²t)]·cos(nπx)/(nπ)² &nbsp;→&nbsp; {t("정상상태 없음!", "no steady state!")}</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "들어오는 열은 있는데 나갈 곳이 없으니 평균 온도가 선형으로 계속 상승 — 공간 '모양'은 수렴하지만 전체 수위는 올라갑니다. 수학이 아니라 에너지 보존이 내린 결론입니다.",
            "Heat comes in and has nowhere to go, so the mean temperature climbs linearly forever — the spatial shape converges, but the water level keeps rising. Energy conservation, not mathematics, wrote this ending."
          )}
        </p>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 4: Boiling ---------------------------------- */
function TabBoiling({ t }) {
  const [dT, setDT] = useState(10);
  const Wd = 620, H = 320, pad = { l: 56, r: 16, t: 14, b: 36 };
  const lX = [0, 3], lY = [3, 7.3];
  const px = (d) => pad.l + (Wd - pad.l - pad.r) * ((Math.log10(d) - lX[0]) / (lX[1] - lX[0]));
  const py = (q) => H - pad.b - (H - pad.t - pad.b) * ((Math.log10(Math.max(q, 1)) - lY[0]) / (lY[1] - lY[0]));

  const dT_chf = Math.cbrt(Q_CRIT / qRohsenow(1));
  const dT_leid = 120;
  const q_leid = hFilmBoil(dT_leid) * dT_leid;

  const nuc = [], film = [], free = [], trans = [];
  for (let i = 0; i <= 80; i++) {
    const d = 10 ** (Math.log10(3) + (i / 80) * (Math.log10(dT_chf) - Math.log10(3)));
    nuc.push([px(d), py(qRohsenow(d))]);
  }
  for (let i = 0; i <= 80; i++) {
    const d = 10 ** (Math.log10(dT_leid) + (i / 80) * (3 - Math.log10(dT_leid)));
    film.push([px(d), py(hFilmBoil(d) * d)]);
  }
  for (let i = 0; i <= 30; i++) {
    const d = 10 ** ((i / 30) * Math.log10(3));
    free.push([px(d), py(600 * Math.pow(d, 1.33))]); // natural-convection sketch
  }
  trans.push([px(dT_chf), py(Q_CRIT)], [px(dT_leid), py(q_leid)]);

  const regime = dT < 5 ? t("자유 대류", "free convection")
    : dT <= dT_chf ? t("핵비등 (Rohsenow)", "nucleate (Rohsenow)")
    : dT < dT_leid ? t("천이 비등 — 불안정!", "transition — unstable!")
    : t("막비등", "film boiling");
  const qNow = dT < 5 ? 600 * Math.pow(dT, 1.33)
    : dT <= dT_chf ? qRohsenow(dT)
    : dT < dT_leid ? NaN
    : hFilmBoil(dT) * dT;

  return (
    <div>
      <Panel title={t("비등 곡선 — ΔT를 올리면 생기는 네 개의 세계", "The boiling curve — four worlds as ΔT rises")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "포화 액체에 잠긴 가열면의 열유속 q를 과열도 ΔT = T_w − T_sat에 대해 그린 것이 비등 곡선입니다(물, 1기압 기준). A: 핵비등 시작(ONB), C: 임계열유속(CHF, burn-out), D: Leidenfrost 최소점.",
            "Plot the heat flux from a submerged heater against the excess temperature ΔT = T_w − T_sat and you get the boiling curve (water, 1 atm). A: onset of nucleate boiling, C: critical heat flux (burn-out), D: the Leidenfrost minimum."
          )}
        </p>
        <Slider
          label={t("과열도 ΔT = T_w − T_sat", "Excess temperature ΔT")} value={dT} min={1} max={1000} step={1}
          onChange={setDT} unit=" K" fmt={(v) => v.toFixed(0)}
        />
        <AxisBox W={Wd} H={H} pad={pad}>
          {[0, 1, 2, 3].map((e) => (
            <text key={e} x={px(10 ** e)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>10^{e}</text>
          ))}
          {[3, 4, 5, 6, 7].map((e) => (
            <text key={e} x={pad.l - 8} y={py(10 ** e) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>10^{e}</text>
          ))}
          {polyline(free, C.good, 2)}
          {polyline(nuc, C.cool, 2.6)}
          {polyline(trans, C.inkSoft, 1.8, "5 4")}
          {polyline(film, C.warn, 2.6)}
          <circle cx={px(dT_chf)} cy={py(Q_CRIT)} r={4.5} fill={C.ink} />
          <text x={px(dT_chf) + 6} y={py(Q_CRIT) - 8} fontSize="11.5" fill={C.ink}>C: CHF = {(Q_CRIT / 1e6).toFixed(1)} MW/m²</text>
          <circle cx={px(dT_leid)} cy={py(q_leid)} r={4.5} fill={C.warn} />
          <text x={px(dT_leid) + 6} y={py(q_leid) + 16} fontSize="11.5" fill={C.warn}>D: Leidenfrost</text>
          {Number.isFinite(qNow) && (
            <circle cx={px(dT)} cy={py(qNow)} r={6} fill="none" stroke={C.copperDeep} strokeWidth="2.5" />
          )}
          <text x={Wd / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>ΔT [K]</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>q [W/m²]</text>
        </AxisBox>
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px" }}>
          {t("현재 영역", "regime")}: {regime}{Number.isFinite(qNow) ? ` · q ≈ ${(qNow / 1e3).toFixed(0)} kW/m²` : t(" · (온도 제어로만 접근 가능한 음의 기울기 구간)", " · (negative-slope branch, reachable only under temperature control)")}
        </div>
        <Note>
          {t(
            "CHF를 넘기는 순간이 위험한 이유: 열유속 제어(전열기)에서는 작동점이 C에서 같은 q의 막비등 가지로 '점프'하며 ΔT가 수백 K로 치솟아 가열면이 녹아버립니다(burn-out). D점 근방이 Leidenfrost 효과 — 뜨거운 팬 위 물방울이 증기막 위에서 미끄러지는 그 현상이고, 쇳물 손 실험의 원리입니다.",
            "Why crossing CHF is dangerous: under heat-flux control the operating point jumps from C to the film branch at the same q, ΔT leaping by hundreds of K — the heater melts (burn-out). Near D lives the Leidenfrost effect: the droplet skating on its own vapor cushion on a hot pan, and the trick behind the molten-metal hand stunt."
          )}
        </Note>
      </Panel>

      <Panel title={t("핵비등 정량화: Rohsenow 상관식", "Quantifying nucleate boiling: the Rohsenow correlation")}>
        <Eq block>q = μ<sub>L</sub>h<sub>fg</sub>·√[g(ρ<sub>L</sub>−ρ<sub>v</sub>)/σ]·[c<sub>pL</sub>ΔT / (C<sub>sf</sub>h<sub>fg</sub>Pr<sub>L</sub><sup>1.7</sup>)]³</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "q ∝ ΔT³ — 핵비등 가지가 log-log에서 기울기 3으로 치솟는 이유입니다. 표면-유체 조합 상수 C_sf가 세제곱으로 들어가므로(물/백금 0.013, 물/황동 0.006) 표면 처리가 성능을 지배합니다. 상한은 CHF:",
            "q ∝ ΔT³ — why the nucleate branch climbs with slope 3 on the log-log plot. The surface-fluid constant C_sf enters cubed (water/platinum 0.013, water/brass 0.006), so surface finish rules. The ceiling is the CHF:"
          )}
        </p>
        <Eq block>q<sub>crit</sub> = 0.18·h<sub>fg</sub>ρ<sub>v</sub>·[gσ(ρ<sub>L</sub>−ρ<sub>v</sub>)/ρ<sub>v</sub>²]<sup>1/4</sup> ≈ {(Q_CRIT / 1e6).toFixed(2)} MW/m² ({t("물, 1기압", "water, 1 atm")})</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t("막비등(안정막)과 고온 복사 보정은 다음과 같습니다:", "Stable film boiling and its radiation correction:")}
        </p>
        <Eq block>h = 0.62·[k<sub>v</sub>³g(ρ<sub>L</sub>−ρ<sub>v</sub>)(h<sub>fg</sub>+0.4c<sub>pL</sub>ΔT)/(D₀ν<sub>v</sub>ΔT)]<sup>1/4</sup>, &nbsp; h = h<sub>r</sub> + h<sub>c</sub>(h<sub>c</sub>/h)<sup>1/3</sup></Eq>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 5: Condensation ---------------------------------- */
function TabCondensation({ t }) {
  const [dT, setDT] = useState(10);
  const [L, setL] = useState(0.5);
  const Wd = 620, H = 260, pad = { l: 56, r: 56, t: 14, b: 34 };
  const px = (x) => pad.l + (Wd - pad.l - pad.r) * (x / L);
  const dMax = deltaCond(L, dT) * 1e6 * 1.1;
  const hMax = W.kL / deltaCond(0.004, dT) * 1.05;
  const pyD = (d) => H - pad.b - (H - pad.t - pad.b) * (d / dMax);
  const pyH = (h) => H - pad.b - (H - pad.t - pad.b) * (h / hMax);
  const dPts = [], hPts = [];
  for (let i = 1; i <= 150; i++) {
    const x = (L * i) / 150;
    dPts.push([px(x), pyD(deltaCond(x, dT) * 1e6)]);
    hPts.push([px(x), pyH(W.kL / deltaCond(x, dT))]);
  }
  const havg = hCondAvg(L, dT);
  const Re = (4 * havg * dT * L) / hPrime(dT) / W.muL;
  const mdot = (havg * dT * L) / hPrime(dT) * 3600;

  return (
    <div>
      <Panel title={t("Nusselt 응축막 모델 — 중력이 끄는 Couette 흐름", "Nusselt's falling film — a gravity-driven Couette flow")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "차가운 수직벽에 증기가 응축하면 얇은 액막이 중력으로 흘러내립니다. 막 내부 힘평형(점성 vs 중력)은 유체역학의 Couette 문제와 같은 반포물선 속도 프로파일을 주고, 에너지수지(응축 잠열 = 막을 가로지르는 전도)가 막 두께의 성장 법칙을 결정합니다:",
            "Vapor condensing on a cold vertical wall feeds a thin liquid film that gravity drains. The in-film force balance (viscosity vs gravity) gives a Couette-like half-parabola, and the energy balance (latent heat released = conduction across the film) sets the film's growth law:"
          )}
        </p>
        <Eq block>δ(x) = [4kμ<sub>L</sub>ΔT·x / (gρ<sub>L</sub>(ρ<sub>L</sub>−ρ<sub>v</sub>)h′<sub>fg</sub>)]<sup>1/4</sup>, &nbsp; h<sub>x</sub> = k/δ ∝ x<sup>−1/4</sup>, &nbsp; h′<sub>fg</sub> = h<sub>fg</sub> + ⅜c<sub>pL</sub>ΔT</Eq>
        <Eq block>h<sub>Nusselt</sub> = (4/3)·h<sub>x=L</sub> = 0.943·[k³g·h′<sub>fg</sub>ρ<sub>L</sub>(ρ<sub>L</sub>−ρ<sub>v</sub>) / (μ<sub>L</sub>ΔT·L)]<sup>1/4</sup></Eq>

        <Slider label={t("과냉도 ΔT = T_sat − T_w", "Subcooling ΔT = T_sat − T_w")} value={dT} min={2} max={50} step={1} onChange={setDT} unit=" K" />
        <Slider label={t("벽 높이 L", "Wall height L")} value={L} min={0.1} max={3} step={0.1} onChange={setL} unit=" m" fmt={(v) => v.toFixed(1)} />

        <AxisBox W={Wd} H={H} pad={pad}>
          {polyline(dPts, C.cool, 2.4)}
          {polyline(hPts, C.warn, 2.4, "6 4")}
          <text x={pad.l + 8} y={pad.t + 14} fontSize="11.5" fill={C.cool}>δ(x) [μm] — {t("실선", "solid")}</text>
          <text x={pad.l + 8} y={pad.t + 29} fontSize="11.5" fill={C.warn}>h_x [W/m²K] — {t("점선", "dashed")}</text>
          {[0, L / 2, L].map((v) => (
            <text key={v} x={px(v)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>{v.toFixed(1)}</text>
          ))}
          <text x={pad.l - 8} y={pyD(dMax) + 10} fontSize="11" textAnchor="end" fill={C.cool}>{dMax.toFixed(0)}</text>
          <text x={pad.l - 8} y={pyD(0) + 4} fontSize="11" textAnchor="end" fill={C.cool}>0</text>
          <text x={Wd - pad.r + 8} y={pyH(hMax) + 10} fontSize="11" fill={C.warn}>{(hMax / 1000).toFixed(0)}k</text>
          <text x={Wd - pad.r + 8} y={pyH(0) + 4} fontSize="11" fill={C.warn}>0</text>
          <text x={Wd / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>x [m] ({t("벽 상단부터", "from the top of the wall")})</text>
        </AxisBox>

        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px", lineHeight: 1.9 }}>
          h_avg = {havg.toFixed(0)} W/m²K · q = {(havg * dT / 1e3).toFixed(1)} kW/m² · {t("응축량", "condensate")} = {mdot.toFixed(1)} kg/h·m<br />
          Re_f = 4Γ/μ = {Re.toFixed(0)} {Re < 1800 ? t("(층류 — Nusselt 모델 유효)", "(laminar — Nusselt model valid)") : t("(난류! 0.045 Re^{1/5}Pr^{1/3} 상관식 필요)", "(turbulent! use 0.045 Re^{1/5}Pr^{1/3})")}
        </div>
        <Note>
          {t(
            "h ~ ΔT^{−1/4}: 벽을 더 차갑게 하면 막이 두꺼워져 h는 오히려 줄지만, q = hΔT는 ΔT^{3/4}로 늘어납니다. 수평 원통은 계수만 0.725로 바뀌고, 수직으로 n개를 쌓은 튜브 뱅크는 위에서 떨어진 응축액이 아래 관을 적셔 h ∝ n^{−1/4}로 나빠집니다 — 셸-튜브 응축기 설계의 핵심 트레이드오프입니다.",
            "h ~ ΔT^{−1/4}: a colder wall thickens the film and lowers h, yet q = hΔT still grows as ΔT^{3/4}. A horizontal cylinder only changes the constant to 0.725, and a vertical stack of n tubes suffers h ∝ n^{−1/4} as upper-tube condensate drowns the lower rows — the key trade-off in shell-and-tube condenser design."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 6: Mixing cup & dialyzer ---------------------------------- */
function TabDialyzer({ t }) {
  const [kci, setKci] = useState(2);   // x1e-5 m/s
  const [kmi, setKmi] = useState(1);
  const [LRU, setLRU] = useState(1e5); // L/(R U) in s/m... use dimensionless group L<k>/(RU)
  const kavg = (2 * kci * kmi) / (kci + kmi); // x1e-5
  const expo = (LRU * kavg * 1e-5);
  const removal = 1 - Math.exp(-expo);

  return (
    <div>
      <Panel title={t("밀폐 유동에는 '벌크'가 없다 — 혼합컵 평균", "Confined flows have no 'bulk' — the mixing-cup average")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "외부 유동의 h는 '벽과 저 멀리 벌크'의 온도차로 정의했지만, 관 안에는 '저 멀리'가 없습니다. 대신 속도로 가중평균한 혼합컵(mixing-cup) 온도·농도를 씁니다 — 그 단면을 지나는 유체를 컵에 받아 섞었을 때의 값입니다:",
            "External-flow h was defined against a far-away bulk, but inside a tube there is no far away. Use the velocity-weighted mixing-cup temperature/concentration instead — what you would measure after catching and stirring everything crossing that section:"
          )}
        </p>
        <Eq block>T<sub>b</sub>(z) ≡ ∫T·v<sub>z</sub>dA / ∫v<sub>z</sub>dA, &nbsp;&nbsp; C<sub>ib</sub>(z) ≡ ∫C<sub>i</sub>v<sub>z</sub>dA / ∫v<sub>z</sub>dA</Eq>
      </Panel>

      <Panel title={t("중공사 투석기 — 직렬 저항의 물질전달 버전", "The hollow-fiber dialyzer — resistances in series, mass-transfer edition")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "혈액이 반투막 섬유 안을 흐르고 바깥은 투석액(강의 Ex1). 용질은 유체측 저항(k_ci)과 막 저항(k_mi)을 직렬로 통과하므로, 3주차 열저항 회로와 똑같은 논리로 전체 계수가 나옵니다:",
            "Blood flows inside a semipermeable fiber bathed in dialysate (lecture Ex1). The solute crosses the fluid-side resistance (k_ci) and the membrane (k_mi) in series — Week 3's resistance circuit, reborn for mass transfer:"
          )}
        </p>
        <Eq block>⟨k⟩ = 2k<sub>ci</sub>k<sub>mi</sub> / (k<sub>ci</sub> + k<sub>mi</sub>), &nbsp;&nbsp; [C<sub>ib</sub>(z) − C<sub>id</sub>] / [C<sub>i0</sub> − C<sub>id</sub>] = exp[−z⟨k⟩/(RU)]</Eq>

        <Slider label={t("유체측 계수 k_ci", "Fluid-side k_ci")} value={kci} min={0.2} max={10} step={0.1} onChange={setKci} unit=" ×10⁻⁵ m/s" fmt={(v) => v.toFixed(1)} />
        <Slider label={t("막 투과도 k_mi", "Membrane k_mi")} value={kmi} min={0.2} max={10} step={0.1} onChange={setKmi} unit=" ×10⁻⁵ m/s" fmt={(v) => v.toFixed(1)} />
        <Slider
          label={t("기하·운전 인자 L/(R·U)", "Geometry/operation factor L/(R·U)")}
          value={LRU} min={1e4} max={5e5} step={1e4} onChange={setLRU}
          fmt={(v) => `${(v / 1e3).toFixed(0)}×10³ s/m`}
        />
        <div style={{ fontFamily: mono, fontSize: 13.5, background: C.copperPale, borderRadius: 8, padding: "10px 12px", lineHeight: 1.9 }}>
          ⟨k⟩ = {kavg.toFixed(2)} ×10⁻⁵ m/s · L⟨k⟩/(RU) = {expo.toFixed(2)}<br />
          {t("용질 제거율", "solute removal")} = 1 − exp(−L⟨k⟩/RU) = <b>{(removal * 100).toFixed(1)}%</b>
        </div>
        <Note>
          {t(
            "조화평균 구조라 ⟨k⟩는 항상 더 작은 쪽이 지배합니다: 막이 아무리 좋아도 유체측 경계층이 두꺼우면(k_ci 작음) 소용없고, 그 반대도 마찬가지입니다. 두 슬라이더를 움직여 '병목'이 넘어가는 지점을 찾아보세요. 신장 투석기·인공폐·막분리 공정이 전부 이 한 줄 식 위에 서 있습니다.",
            "The harmonic-mean structure means the smaller coefficient always rules ⟨k⟩: a superb membrane is wasted behind a thick fluid-side boundary layer, and vice versa. Slide both and find where the bottleneck flips. Kidney dialyzers, oxygenators, and membrane separations all stand on this one line."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 7: Graetz & entrance ---------------------------------- */
function TabGraetz({ t }) {
  const [logPe, setLogPe] = useState(3);
  const Pe = 10 ** logPe;
  const Wd = 620, H = 300, pad = { l: 56, r: 16, t: 14, b: 36 };
  const lX = [-1, 4], lY = [0, 2.5];
  const px = (z) => pad.l + (Wd - pad.l - pad.r) * ((Math.log10(z) - lX[0]) / (lX[1] - lX[0]));
  const py = (nu) => H - pad.b - (H - pad.t - pad.b) * ((Math.log10(Math.max(nu, 1)) - lY[0]) / (lY[1] - lY[0]));

  const lev = [], comb = [];
  for (let i = 0; i <= 200; i++) {
    const z = 10 ** (lX[0] + ((lX[1] - lX[0]) * i) / 200);
    const nl = nuLeveque(z, Pe);
    lev.push([px(z), py(nl)]);
    comb.push([px(z), py(Math.pow(nl ** 3 + NU_INF ** 3, 1 / 3))]); // smooth blend for display
  }
  const LT = 0.1 * Pe;

  const eigsRows = [
    ["n", "1", "2", "3", "4", "5"],
    ["λₙ", "2.7044", "6.6790", "10.673", "14.671", "18.670"],
  ];

  return (
    <div>
      <Panel title={t("입구영역: Lévêque의 −1/3 법칙", "The entrance region: Lévêque's −1/3 law")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "관 입구 근처에서는 열경계층이 벽에 얇게 붙어 있어 Nu ~ L/δ(z) ≫ 1. 크기 분석으로 δ ~ ζ^{1/3} (ζ = z/(R·Pe))이고, Blasius 때처럼 자기유사 변수로 풀면 (Γ(1/3) = 2.679):",
            "Near the inlet the thermal boundary layer hugs the wall, so Nu ~ L/δ(z) ≫ 1. Order-of-magnitude analysis gives δ ~ ζ^{1/3} (ζ = z/(R·Pe)), and the similarity solution — same play as Blasius — yields (Γ(1/3) = 2.679):"
          )}
        </p>
        <Eq block>Nu(z) = 1.357·(R/z)<sup>1/3</sup>·Pe<sup>1/3</sup> &nbsp;&nbsp;({t("log-log 기울기 −1/3", "slope −1/3 on log-log")}), &nbsp;&nbsp; L<sub>T</sub>/R ≈ 0.1·Pe</Eq>
        <Slider
          label="log₁₀ Pe" value={logPe} min={1.5} max={4.5} step={0.05}
          onChange={setLogPe} fmt={(v) => `Pe = ${(10 ** v).toExponential(1)}`}
        />
        <AxisBox W={Wd} H={H} pad={pad}>
          {[-1, 0, 1, 2, 3, 4].map((e) => (
            <g key={e}>
              <line x1={px(10 ** e)} y1={pad.t} x2={px(10 ** e)} y2={H - pad.b} stroke={C.line} />
              <text x={px(10 ** e)} y={H - pad.b + 16} fontSize="11" textAnchor="middle" fill={C.inkSoft}>10^{e}</text>
            </g>
          ))}
          {[0, 1, 2].map((e) => (
            <text key={e} x={pad.l - 8} y={py(10 ** e) + 4} fontSize="11" textAnchor="end" fill={C.inkSoft}>10^{e}</text>
          ))}
          <line x1={pad.l} y1={py(NU_INF)} x2={Wd - pad.r} y2={py(NU_INF)} stroke={C.good} strokeDasharray="4 3" />
          <text x={Wd - pad.r - 6} y={py(NU_INF) - 6} fontSize="11.5" textAnchor="end" fill={C.good}>Nu∞ = 3.656</text>
          <line x1={px(LT)} y1={pad.t} x2={px(LT)} y2={H - pad.b} stroke={C.cool} strokeDasharray="5 4" />
          <text x={px(LT) + 4} y={pad.t + 14} fontSize="11.5" fill={C.cool}>L_T/R = 0.1Pe</text>
          {polyline(lev, C.warn, 1.6, "6 4")}
          {polyline(comb, C.ink, 2.8)}
          <text x={Wd - pad.r - 8} y={pad.t + 16} fontSize="11.5" textAnchor="end" fill={C.warn}>{t("Lévêque (기울기 −1/3)", "Lévêque (slope −1/3)")}</text>
          <text x={Wd / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={C.inkSoft}>z/R</text>
          <text x={16} y={H / 2} fontSize="12" textAnchor="middle" fill={C.inkSoft} transform={`rotate(-90 16 ${H / 2})`}>Nu</text>
        </AxisBox>
        <Note>
          {t(
            "Pe를 올리면 입구영역이 길어지고(L_T ∝ Pe) 같은 z에서 Nu도 커집니다 — 유속이 빠를수록 '신선한' 유체가 더 깊숙이 공급되기 때문입니다. 5주차 Graetz 그림에서 본 짧은 관의 높은 Nu가 바로 이 −1/3 가지였습니다.",
            "Raising Pe stretches the entrance region (L_T ∝ Pe) and lifts Nu at any z — faster flow keeps feeding fresh fluid deeper. The high-Nu short-pipe limit you saw in Week 5's Graetz chart was exactly this −1/3 branch."
          )}
        </Note>
      </Panel>

      <Panel title={t("완전발달: Graetz 고유값과 3.656의 탄생", "Fully developed: Graetz eigenvalues and the birth of 3.656")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "하류에서는 Sturm–Liouville 고유값 문제가 됩니다: (1/η)(ηΦ′)′ = −λ²(1−η²)Φ, Φ′(0) = 0, Φ(1) = 0. 포물선 속도(1−η²)가 가중함수로 들어간 점이 4주차 평판과 다른 전부입니다. 고유값은:",
            "Downstream it becomes a Sturm–Liouville problem: (1/η)(ηΦ′)′ = −λ²(1−η²)Φ, Φ′(0) = 0, Φ(1) = 0 — Week 4's slab, except the parabolic velocity (1−η²) now sits inside as the weight function. The eigenvalues:"
          )}
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420, fontFamily: mono }}>
            <tbody>
              {eigsRows.map((row, i) => (
                <tr key={i} style={{ background: i === 0 ? C.copperPale : "transparent" }}>
                  {row.map((c, j) => (
                    <td key={j} style={{ border: `1px solid ${C.line}`, padding: "6px 12px", textAlign: "center" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Eq block>Nu(ζ→∞) = λ₁²/2 = 2.7044²/2 = 3.656</Eq>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "멀리 가면 최저차 모드만 살아남고(또 그 이야기입니다), 벽 기울기와 혼합컵 온도의 비가 상수 λ₁²/2로 고정됩니다. 5주차에서 공학 관례값 3.660을 썼는데, 같은 물리의 다른 평균 관례일 뿐입니다 — 코드 탭에서 슈팅법으로 λ₁ = 2.7044를 직접 재현합니다.",
            "Far downstream only the lowest mode survives (that story again), pinning the ratio of wall gradient to mixing-cup temperature at λ₁²/2. Week 5 quoted the engineering convention 3.660 — same physics, slightly different averaging. The Code tab reproduces λ₁ = 2.7044 by shooting."
          )}
        </p>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 8: Practice ---------------------------------- */
function TabPractice({ t }) {
  const problems = [
    {
      q: t(
        "P1. 두께 L = 0.2 mm, 확산계수 D = 1×10⁻⁹ m²/s인 막의 왼쪽 농도를 갑자기 C₀로 올렸다(오른쪽은 0 유지, 초기 0). (a) 정상상태 플럭스 도달에 걸리는 시간을 추정하라. (b) t = 0.1·L²/D에서 중앙 농도는 정상값의 몇 %인가? (급수 1항으로)",
        "P1. A membrane of thickness L = 0.2 mm, D = 1×10⁻⁹ m²/s has its left face suddenly raised to C₀ (right face at 0, initially 0). (a) Estimate the time to reach the steady flux. (b) At t = 0.1·L²/D, what fraction of the steady mid-plane concentration is reached? (one series term)"
      ),
      s: t(
        "(a) t_ss ≈ 0.3·L²/D = 0.3×(2×10⁻⁴)²/10⁻⁹ = 12 s. (b) Θ(½, t) = ½ − (2/π)e^{−π²t}sin(π/2) = ½ − 0.6366×e^{−0.987} = 0.5 − 0.237 = 0.263 → 정상값 0.5의 약 53%.",
        "(a) t_ss ≈ 0.3·L²/D = 0.3×(2×10⁻⁴)²/10⁻⁹ = 12 s. (b) Θ(½,t) = ½ − (2/π)e^{−π²t} = 0.5 − 0.6366×e^{−0.987} = 0.263 → about 53% of the steady 0.5."
      ),
    },
    {
      q: t(
        "P2. 1기압 포화수가 백금 가열면(C_sf = 0.013) 위에서 핵비등 중이다. (a) ΔT = 12 K에서 q를 구하라 (μ_L = 2.79×10⁻⁴, h_fg = 2.257×10⁶, ρ_L−ρ_v ≈ 957, σ = 0.0589, c_pL = 4217, Pr_L = 1.76). (b) 같은 조건의 황동(C_sf = 0.006)이라면? (c) CHF(≈1.5 MW/m²)와 비교해 안전 여유를 논하라.",
        "P2. Saturated water at 1 atm boils on platinum (C_sf = 0.013). (a) Find q at ΔT = 12 K (μ_L = 2.79×10⁻⁴, h_fg = 2.257×10⁶, ρ_L−ρ_v ≈ 957, σ = 0.0589, c_pL = 4217, Pr_L = 1.76). (b) Same conditions on brass (C_sf = 0.006)? (c) Compare with the CHF (≈1.5 MW/m²)."
      ),
      s: t(
        "(a) √(gΔρ/σ) = √(9.81×957/0.0589) = 399 m⁻¹; 괄호항 = 4217×12/(0.013×2.257×10⁶×1.76^{1.7}) = 0.656 → q = 2.79×10⁻⁴×2.257×10⁶×399×0.656³ ≈ 71 kW/m². (b) (0.013/0.006)³ = 10.2배 → ≈ 0.72 MW/m². (c) 백금은 CHF의 ~5%로 여유가 크지만, 황동은 ~48% — 표면 상수 하나가 burn-out 여유를 지배한다.",
        "(a) √(gΔρ/σ) = 399 m⁻¹; bracket = 4217×12/(0.013×2.257×10⁶×1.76^{1.7}) = 0.656 → q = 2.79×10⁻⁴×2.257×10⁶×399×0.656³ ≈ 71 kW/m². (b) ×(0.013/0.006)³ = 10.2 → ≈ 0.72 MW/m². (c) Platinum sits at ~5% of CHF, brass at ~48% — one surface constant dominates the burn-out margin."
      ),
    },
    {
      q: t(
        "P3. 1기압 수증기가 높이 0.5 m 수직벽(T_w = 90 °C, ΔT = 10 K)에 응축한다. (a) h_avg를 구하라 (k = 0.68, μ_L = 2.79×10⁻⁴, ρ_L = 958, h′_fg ≈ 2.273×10⁶). (b) 막이 층류인지 Re_f로 확인하라. (c) 같은 면적을 수평관 16단 뱅크(D = 25 mm)로 바꾸면 h는 어떻게 되나?",
        "P3. Steam at 1 atm condenses on a 0.5 m vertical wall (T_w = 90 °C, ΔT = 10 K). (a) Find h_avg (k = 0.68, μ_L = 2.79×10⁻⁴, ρ_L = 958, h′_fg ≈ 2.273×10⁶). (b) Check the film is laminar via Re_f. (c) If the same area becomes a 16-row bank of horizontal tubes (D = 25 mm), what happens to h?"
      ),
      s: t(
        "(a) h = 0.943[0.68³×9.81×2.273×10⁶×958×957/(2.79×10⁻⁴×10×0.5)]^{1/4} ≈ 7.8 kW/m²K. (b) Γ = hΔTL/h′_fg = 7770×10×0.5/2.273×10⁶ = 0.0171 kg/m·s → Re_f = 4Γ/μ = 245 < 1800 → 층류. (c) 0.725 계수 + n^{−1/4}: h₁₆/h₁ = 16^{−1/4} = 0.5 — 아래 관들이 위 응축액에 잠겨 성능 절반.",
        "(a) h = 0.943[0.68³×9.81×2.273×10⁶×958×957/(2.79×10⁻⁴×10×0.5)]^{1/4} ≈ 7.8 kW/m²K. (b) Γ = hΔTL/h′_fg = 0.0171 kg/m·s → Re_f = 4Γ/μ = 245 < 1800 → laminar. (c) With 0.725 and n^{−1/4}: h₁₆/h₁ = 16^{−1/4} = 0.5 — lower rows drown and the bank loses half."
      ),
    },
    {
      q: t(
        "P4. 물(α = 1.5×10⁻⁷ m²/s)이 R = 1 mm 관을 U = 0.03 m/s로 흐른다 (벽 온도 일정). (a) Pe와 열적 입구길이 L_T를 구하라. (b) z = 5 mm에서 Lévêque 식으로 Nu를 구하라. (c) 완전발달 Nu와 비교하고, 이 관(L = 0.5 m)에서 입구영역이 차지하는 비율을 구하라.",
        "P4. Water (α = 1.5×10⁻⁷ m²/s) flows in an R = 1 mm tube at U = 0.03 m/s (constant wall T). (a) Find Pe and the thermal entrance length L_T. (b) Use Lévêque at z = 5 mm. (c) Compare with the fully developed Nu and find what fraction of an L = 0.5 m tube is entrance region."
      ),
      s: t(
        "(a) Pe = 2UR/α = 2×0.03×0.001/1.5×10⁻⁷ = 400 → L_T ≈ 0.1·Pe·R = 40 mm. (b) Nu = 1.357×(R/z)^{1/3}Pe^{1/3} = 1.357×(1/5)^{1/3}×400^{1/3} = 1.357×0.585×7.37 ≈ 5.85. (c) Nu∞ = λ₁²/2 = 3.656 — 입구에서 약 1.6배; 입구영역은 40/500 = 8%로, 나머지 92%는 Nu ≈ 3.66의 완전발달 구간.",
        "(a) Pe = 2UR/α = 400 → L_T ≈ 0.1·Pe·R = 40 mm. (b) Nu = 1.357×(1/5)^{1/3}×400^{1/3} ≈ 5.85. (c) Nu∞ = λ₁²/2 = 3.656 — about 1.6× higher at the inlet; the entrance takes 40/500 = 8% of the tube, the remaining 92% runs at Nu ≈ 3.66."
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
  const code = WEEK6_CODES[topic][lang];

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
              {WEEK6_CODES[tp].title}
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
            "Python·C++ 버전은 실행·수치 검증을 마쳤습니다: Graetz 고유값 슈팅이 강의값 λ = 2.7044, 6.6790, 10.673…을 그대로 재현하고(Nu∞ = λ₁²/2 = 3.657), Lévêque 상수 1.357 = 6/[Γ(1/3)(9/2)^{1/3}], 응축막 4/3 법칙, 막의 t ≈ 0.3 정상상태 도달도 확인했습니다. 강의 슬라이드의 Rohsenow 식은 동점성(ν_L) 표기이지만, 코드는 물 데이터와 일치하는 표준 동역학점성(μ_L) 형을 사용하고 주석으로 명시했습니다.",
            "The Python and C++ versions were executed and numerically verified: the Graetz shooting reproduces the lecture's λ = 2.7044, 6.6790, 10.673… exactly (Nu∞ = λ₁²/2 = 3.657); the Lévêque constant 1.357 = 6/[Γ(1/3)(9/2)^{1/3}], the condensation 4/3 rule, and the membrane's t ≈ 0.3 steady-state rule are all confirmed. The lecture slide writes Rohsenow with ν_L; the codes use the standard μ_L form that matches classic water data, with a comment noting the difference."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week6App({ language = "kr", onBack }) {
  const [lang, setLang] = useState(language);
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: t("FFT·급수", "FFT & series"), comp: <TabSeries t={t} /> },
    { label: t("과도 문제", "Transients"), comp: <TabTransient t={t} /> },
    { label: t("비등", "Boiling"), comp: <TabBoiling t={t} /> },
    { label: t("응축", "Condensation"), comp: <TabCondensation t={t} /> },
    { label: t("혼합컵·투석기", "Mixing cup"), comp: <TabDialyzer t={t} /> },
    { label: t("Graetz·입구영역", "Graetz"), comp: <TabGraetz t={t} /> },
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
                Heat & Mass Transfer · Week 6
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("해법·상변화·밀폐유동 이론", "Solution Methods · Phase Change · Confined-Flow Theory")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("유한 푸리에 변환(FFT) — Gibbs — 비등 곡선·Rohsenow·CHF — Nusselt 응축막 — 혼합컵·투석기 — Lévêque·Graetz → Nu∞ = 3.656",
                   "Finite Fourier transform — Gibbs — boiling curve · Rohsenow · CHF — Nusselt condensation — mixing cup & dialyzer — Lévêque · Graetz → Nu∞ = 3.656")}
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
