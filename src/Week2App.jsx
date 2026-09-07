// ============================================================
// Week2App.jsx — The Physics of Heat Conduction
// 화공열및물질전달 Week 2 — 무엇이 열을 나르는가
// SKKU School of Chemical Engineering — SPMDL
// Prof. S. Joon Kwon
// ------------------------------------------------------------
// Based on: Wk02_HeatMassTransport_Part01/Part02 slides
//   • Thermal management applications (electronics, packaging)
//   • Drude model for free electrons: v_d = -eEτ/m, σ = ne²τ/m
//   • Scattering, mean free path/time, Matthiessen's rule
//   • Classical √T failure → quantum picture (Fermi v, phonons)
//   • Wiedemann–Franz law κ/σ = LT (Lorenz number)
//   • Phonons: diatomic lattice, acoustic/optical dispersion
//   • k = C_V l v / 3, k(T) peak; gas conduction (P-independent!)
//   • Knudsen regime; convection (Newton) & radiation (Planck)
// ============================================================
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  PY_DRUDE, ML_DRUDE, JL_DRUDE, CPP_DRUDE,
  PY_PHONON, ML_PHONON, JL_PHONON, CPP_PHONON,
  PY_WF, ML_WF, JL_WF, CPP_WF,
  PY_PLANCK, ML_PLANCK, JL_PLANCK, CPP_PLANCK,
} from "./Week2Codes";

// ── i18n ─────────────────────────────────────────────────────
const i18n = {
  ko: {
    weekTitle: "Week 2 — 열전도의 물리학",
    subtitle: "무엇이 열을 나르는가: 자유전자(Drude) · 포논 · 기체 분자 — 그리고 대류와 복사의 첫 만남",
    tabs: {
      overview: "개요",
      drude: "Drude 모형",
      scatter: "산란과 온도",
      wf: "Wiedemann–Franz",
      phonon: "포논 전도",
      gas: "기체 열전도",
      convrad: "대류·복사 맛보기",
      practice: "연습문제",
      codes: "Raw 코드",
    },
    run: "▶ 실행", stop: "■ 정지", reset: "↺ 초기화",
  },
  en: {
    weekTitle: "Week 2 — The Physics of Heat Conduction",
    subtitle: "What carries heat: free electrons (Drude) · phonons · gas molecules — plus a first look at convection & radiation",
    tabs: {
      overview: "Overview",
      drude: "Drude Model",
      scatter: "Scattering & T",
      wf: "Wiedemann–Franz",
      phonon: "Phonon Conduction",
      gas: "Gas Conduction",
      convrad: "Convection & Radiation",
      practice: "Practice",
      codes: "Raw Codes",
    },
    run: "▶ Run", stop: "■ Stop", reset: "↺ Reset",
  },
};

// ── Style tokens (identical to Week 1) ───────────────────────
const C = {
  bg: "#0b0f17",
  panel: "#111827",
  card: "#1f2937",
  border: "#374151",
  text: "#e5e7eb",
  textDim: "#9ca3af",
  accent: "#3b82f6",
  accentSoft: "#60a5fa",
  warn: "#f59e0b",
  ok: "#10b981",
  err: "#ef4444",
  purple: "#a78bfa",
  cyan: "#22d3ee",
  pink: "#f472b6",
};
const MOM = "#60a5fa";
const HEAT = "#f87171";
const MASS = "#34d399";

// =============================================================
// MAIN COMPONENT
// =============================================================
export default function Week2App({ onBack, lang: langProp, onLangChange }) {
  const [lang, setLangState] = useState(langProp || "ko");
  const [tab, setTab] = useState("overview");
  useEffect(() => { if (langProp) setLangState(langProp); }, [langProp]);
  const setLang = (l) => {
    setLangState(l);
    if (onLangChange) onLangChange(l);
  };
  const t = i18n[lang];
  const handleBack = onBack || (() => {});

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0a0e15 100%)`,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px",
    }}>
      <header style={{
        maxWidth: 1400, margin: "0 auto 16px auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px",
        background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(59,130,246,0.05))",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.textDim, letterSpacing: 2 }}>
            SKKU · CHEM. ENG. · SPMDL
          </div>
          <h1 style={{ margin: "6px 0 2px 0", fontSize: 24, fontWeight: 700, color: C.text }}>
            {t.weekTitle}
          </h1>
          <div style={{ fontSize: 13, color: C.textDim }}>{t.subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleBack} style={btnStyle(false)}>← {lang === "ko" ? "홈" : "Home"}</button>
          <button onClick={() => setLang("ko")} style={btnStyle(lang === "ko")}>한국어</button>
          <button onClick={() => setLang("en")} style={btnStyle(lang === "en")}>English</button>
        </div>
      </header>

      <nav style={{
        maxWidth: 1400, margin: "0 auto 16px auto",
        display: "flex", flexWrap: "wrap", gap: 6,
        padding: 8,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        {Object.entries(t.tabs).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={tabBtnStyle(tab === k)}>{label}</button>
        ))}
      </nav>

      <main style={{ maxWidth: 1400, margin: "0 auto" }}>
        {tab === "overview" && <Overview lang={lang} />}
        {tab === "drude" && <Drude lang={lang} t={t} />}
        {tab === "scatter" && <Scattering lang={lang} />}
        {tab === "wf" && <WiedemannFranz lang={lang} />}
        {tab === "phonon" && <Phonon lang={lang} />}
        {tab === "gas" && <GasConduction lang={lang} />}
        {tab === "convrad" && <ConvRad lang={lang} />}
        {tab === "practice" && <Practice lang={lang} />}
        {tab === "codes" && <RawCodes lang={lang} />}
      </main>

      <footer style={{
        maxWidth: 1400, margin: "24px auto 0 auto",
        padding: "16px 24px", textAlign: "center",
        fontSize: 12, color: C.textDim,
        borderTop: `1px solid ${C.border}`,
      }}>
        © Prof. S. Joon Kwon · SPMDL · SKKU. {lang === "ko"
          ? "교육 목적의 인터랙티브 학습 자료입니다."
          : "Interactive learning material for educational use."}
      </footer>
    </div>
  );
}

// =============================================================
// SHARED HELPERS (identical style to Week 1)
// =============================================================
function btnStyle(active = false) {
  return {
    padding: "7px 14px",
    borderRadius: 8,
    border: `1px solid ${active ? C.accent : C.border}`,
    background: active ? "rgba(59,130,246,0.15)" : "transparent",
    color: active ? "#93c5fd" : C.textDim,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
function tabBtnStyle(active) {
  return {
    padding: "9px 16px",
    borderRadius: 8,
    border: "none",
    background: active ? C.accent : "transparent",
    color: active ? "#fff" : C.textDim,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 600,
  };
}
function Card({ children, style }) {
  return (
    <section style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: "20px 22px",
      marginBottom: 16,
      ...style,
    }}>{children}</section>
  );
}
function Eq({ children, style }) {
  return (
    <div style={{
      background: "#0d1220",
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "12px 16px",
      fontFamily: "'Cambria Math', 'STIX Two Math', 'Times New Roman', serif",
      fontSize: 17,
      textAlign: "center",
      margin: "10px 0",
      overflowX: "auto",
      ...style,
    }}>{children}</div>
  );
}
function Slider({ label, value, min, max, step, onChange, unit, color, fmt }) {
  const shown = fmt ? fmt(value) : value;
  return (
    <label style={{ display: "block", fontSize: 12.5, color: C.textDim, minWidth: 170 }}>
      <span style={{ color: color || C.text }}>{label}</span>
      {" — "}
      <b style={{ color: color || C.accentSoft }}>{shown}{unit || ""}</b>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || C.accent }}
      />
    </label>
  );
}
function H2({ children }) {
  return <h2 style={{ margin: "0 0 10px 0", fontSize: 18, fontWeight: 700, color: C.text }}>{children}</h2>;
}
function H3({ children, color }) {
  return <h3 style={{ margin: "14px 0 8px 0", fontSize: 15, fontWeight: 700, color: color || C.accentSoft }}>{children}</h3>;
}
function P({ children }) {
  return <p style={{ fontSize: 13.5, lineHeight: 1.85, color: C.text, margin: "8px 0" }}>{children}</p>;
}

// =============================================================
// TAB 1 — OVERVIEW
// =============================================================
function Overview({ lang }) {
  const isKo = lang === "ko";

  const carriers = [
    {
      color: MOM,
      name: isKo ? "자유전자 (금속)" : "Free electrons (metals)",
      pic: "e⁻",
      law: "σ = ne²τ/m · κ/σ = LT",
      desc: isKo
        ? "금속에서는 전하와 열을 같은 자유전자가 나릅니다. 그래서 전기 잘 통하는 금속이 열도 잘 통합니다 (구리·은)."
        : "In metals the same free electrons carry both charge and heat — which is why good electrical conductors (Cu, Ag) are also good thermal conductors.",
    },
    {
      color: HEAT,
      name: isKo ? "포논 (부도체·반도체)" : "Phonons (insulators)",
      pic: "〰",
      law: "k = C\u1D65 l v / 3",
      desc: isKo
        ? "격자 진동의 양자(포논)가 준입자처럼 열을 운반합니다. 다이아몬드가 금속보다 열전도가 좋은 이유 — 강한 결합, 빠른 음속, 긴 평균자유행로."
        : "Quantized lattice vibrations (phonons) carry heat as quasi-particles. Diamond out-conducts metals: stiff bonds, fast sound, long mean free path.",
    },
    {
      color: MASS,
      name: isKo ? "기체 분자" : "Gas molecules",
      pic: "◦◦◦",
      law: "k = f k_B n l v / 6",
      desc: isKo
        ? "분자 충돌이 에너지를 릴레이합니다. 놀랍게도 k는 압력과 무관 — n이 커지면 l이 정확히 그만큼 짧아지기 때문입니다."
        : "Molecular collisions relay energy. Remarkably, k is pressure-independent: raising n shortens l by exactly the same factor.",
    },
  ];

  const apps = [
    { icon: "🚀", name: isKo ? "발사체 열보호" : "Launch-vehicle TPS", desc: isKo ? "극한 열유속에서 구조를 지키는 단열·방열 설계" : "Insulation & heat rejection under extreme flux" },
    { icon: "💻", name: isKo ? "전자기기 방열" : "Electronics cooling", desc: isKo ? "칩 → TIM → 히트싱크 → 팬: 전도·대류·복사의 직렬 연결" : "Chip → TIM → heat sink → fan: all modes in series" },
    { icon: "📦", name: isKo ? "반도체 패키징" : "Semiconductor packaging", desc: isKo ? "방열 소재 시장 — 접착·성형·도포·패턴 소재의 열설계" : "Thermal-material market: adhesives, molds, spreaders" },
    { icon: "🧊", name: isKo ? "에어로젤 단열" : "Aerogel insulation", desc: isKo ? "기공을 평균자유행로보다 작게 — Knudsen 영역으로 열차단" : "Pores below the mean free path — Knudsen suppression" },
    { icon: "🏠", name: isKo ? "복사 냉각 필름" : "Radiative-cooling film", desc: isKo ? "대기창(8–13 μm)으로 열을 우주로 방출, 냉방비 절감" : "Reject heat to space via the sky window (8–13 μm)" },
    { icon: "🌡️", name: isKo ? "열전 소재" : "Thermoelectrics", desc: isKo ? "전자는 통과, 포논은 산란 — κ와 σ를 분리하는 설계" : "Pass electrons, scatter phonons — decoupling κ from σ" },
  ];

  return (
    <>
      <Card>
        <H2>{isKo ? "이번 주의 질문: 열은 '무엇을 타고' 이동하는가?" : "This Week's Question: What Does Heat Ride On?"}</H2>
        <P>
          {isKo
            ? "1주차에서 Fourier의 법칙 q = −k∇T 를 만났습니다. 그런데 열전도도 k는 어디서 오는 걸까요? 다이아몬드(부도체)의 k는 구리의 5배가 넘고, 은과 스테인리스강은 같은 금속인데 k가 25배나 차이 납니다. 이번 주에는 k의 미시적 기원을 세 가지 운반자 — 자유전자, 포논, 기체 분자 — 로 나눠 파헤치고, 마지막에 대류와 복사의 기본 법칙을 만납니다."
            : "Week 1 gave us Fourier's law q = −k∇T. But where does the thermal conductivity k come from? Diamond (an electrical insulator!) conducts heat 5× better than copper, and silver beats stainless steel by 25× though both are metals. This week we dissect the microscopic origin of k through three carriers — free electrons, phonons, gas molecules — then meet the basic laws of convection and radiation."}
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 12 }}>
          {carriers.map((p, i) => (
            <div key={i} style={{
              background: C.card, border: `1px solid ${p.color}44`,
              borderTop: `3px solid ${p.color}`,
              borderRadius: 12, padding: "14px 16px",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: p.color }}>
                <span style={{ fontFamily: "monospace", marginRight: 8 }}>{p.pic}</span>{p.name}
              </div>
              <Eq style={{ fontSize: 15, margin: "10px 0" }}>{p.law}</Eq>
              <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.75 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <H2>{isKo ? "왜 화학공학·소재공학에서 중요한가" : "Why It Matters in ChemE & Materials"}</H2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
          {apps.map((a, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{a.icon} {a.name}</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 6, lineHeight: 1.7 }}>{a.desc}</div>
            </div>
          ))}
        </div>
        <P>
          {isKo
            ? "이 주의 흐름: Drude 모형으로 σ = ne²τ/m 을 유도 → 산란 시간 τ의 정체와 온도의존성 → 전하·열의 이중 운반이 낳는 Wiedemann–Franz 법칙 → 부도체의 포논 전도와 격자 분산관계 → 기체 열전도의 압력 무관성과 Knudsen 영역 → Newton 냉각 법칙과 Planck→Stefan–Boltzmann 복사."
            : "The arc of the week: derive σ = ne²τ/m from the Drude model → unpack the scattering time τ and its T-dependence → the dual charge/heat transport behind Wiedemann–Franz → phonon conduction and lattice dispersion in insulators → pressure-independent gas conduction and the Knudsen regime → Newton's cooling law and Planck → Stefan–Boltzmann radiation."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 2 — DRUDE MODEL (Monte-Carlo animation)
// =============================================================
function Drude({ lang, t }) {
  const isKo = lang === "ko";
  const NE = 400;
  const U0 = 2.4;
  const [aE, setAE] = useState(0.5);   // qE/m
  const [tau, setTau] = useState(1.0);
  const [running, setRunning] = useState(false);
  const stateRef = useRef(null);
  const canvasRef = useRef(null);
  const [vdAvg, setVdAvg] = useState(0);

  const init = useCallback(() => {
    const vx = new Float64Array(NE), vy = new Float64Array(NE);
    const x = new Float64Array(NE), y = new Float64Array(NE);
    for (let i = 0; i < NE; i++) {
      const th = Math.random() * 2 * Math.PI;
      vx[i] = U0 * Math.cos(th); vy[i] = U0 * Math.sin(th);
      x[i] = Math.random(); y[i] = Math.random();
    }
    stateRef.current = { x, y, vx, vy, vdRun: 0, n: 0 };
    setVdAvg(0);
  }, []);
  useEffect(() => { init(); }, [init]);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !stateRef.current) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    // ion lattice (faint)
    ctx.fillStyle = "rgba(148,163,184,0.18)";
    for (let ix = 0; ix < 12; ix++) for (let iy = 0; iy < 6; iy++) {
      ctx.beginPath();
      ctx.arc((ix + 0.5) * W / 12, (iy + 0.5) * H / 6, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
    const st = stateRef.current;
    ctx.fillStyle = MOM;
    for (let i = 0; i < NE; i++) {
      ctx.beginPath();
      ctx.arc(st.x[i] * W, st.y[i] * H, 2.1, 0, 2 * Math.PI);
      ctx.fill();
    }
    // field arrow
    ctx.strokeStyle = C.warn; ctx.fillStyle = C.warn; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, 22); ctx.lineTo(20 + 40 + aE * 60, 22); ctx.stroke();
    ctx.beginPath();
    const tip = 20 + 40 + aE * 60;
    ctx.moveTo(tip, 22); ctx.lineTo(tip - 9, 17); ctx.lineTo(tip - 9, 27); ctx.fill();
    ctx.font = "12px monospace";
    ctx.fillText("E-field (a = qE/m)", 24, 42);
    // drift arrow (mean velocity, amplified)
    let mvx = 0; for (let i = 0; i < NE; i++) mvx += st.vx[i];
    mvx /= NE;
    const cx = W / 2, cy = H - 30, len = mvx * 120;
    ctx.strokeStyle = HEAT; ctx.fillStyle = HEAT; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + len, cy); ctx.stroke();
    if (Math.abs(len) > 6) {
      const s = Math.sign(len);
      ctx.beginPath();
      ctx.moveTo(cx + len, cy);
      ctx.lineTo(cx + len - s * 10, cy - 5);
      ctx.lineTo(cx + len - s * 10, cy + 5);
      ctx.fill();
    }
    ctx.fillText("<v>", cx - 30, cy + 4);
  }, [aE]);

  useEffect(() => { draw(); }, [draw, vdAvg]);

  useEffect(() => {
    if (!running) return;
    const dt = 0.02, sub = 4;
    const id = setInterval(() => {
      const st = stateRef.current;
      if (!st) return;
      for (let s = 0; s < sub; s++) {
        let mvx = 0;
        for (let i = 0; i < NE; i++) {
          if (Math.random() < dt / tau) {
            const th = Math.random() * 2 * Math.PI;
            st.vx[i] = U0 * Math.cos(th);
            st.vy[i] = U0 * Math.sin(th);
          } else {
            st.vx[i] += aE * dt;
          }
          st.x[i] += st.vx[i] * dt * 0.06;
          st.y[i] += st.vy[i] * dt * 0.06;
          if (st.x[i] < 0) st.x[i] += 1; if (st.x[i] > 1) st.x[i] -= 1;
          if (st.y[i] < 0) st.y[i] += 1; if (st.y[i] > 1) st.y[i] -= 1;
          mvx += st.vx[i];
        }
        st.vdRun = 0.995 * st.vdRun + 0.005 * (mvx / NE);
        st.n++;
      }
      setVdAvg(st.vdRun);
    }, 33);
    return () => clearInterval(id);
  }, [running, aE, tau]);

  return (
    <>
      <Card>
        <H2>{isKo ? "Drude 모형: 혼돈 속에서 태어나는 표류 속도" : "The Drude Model: Drift Born from Chaos"}</H2>
        <P>
          {isKo
            ? "1900년 Paul Drude의 가정은 대담하게 단순합니다 — ① 이온핵은 고정, 전자만 움직인다 ② 전자는 무작위 속도로 자유롭게 날아다닌다 ③ 주기적으로 산란하며 속도가 다시 무작위화된다 (평균자유시간 τ) ④ 전기장이 없으면 표류속도는 0. 전기장을 켜면 산란 사이사이에 전자가 가속되어, 무작위 운동 위에 아주 작은 '표류'가 얹힙니다."
            : "Paul Drude's 1900 assumptions are boldly simple: ① ion cores are fixed, only electrons move; ② electrons fly freely with random velocities; ③ they scatter periodically, re-randomizing velocity (mean free time τ); ④ with no field, the drift velocity is zero. Turn on a field and electrons accelerate between scatterings — a tiny drift rides on top of the chaos."}
        </P>
        <Eq style={{ fontSize: 17 }}>
          m dv/dt = −eE → v(t) = v₀ − eEt/m,{"   "}P(t) = (1/τ)e^(−t/τ)
          {"   "}⟹{"   "}
          <span style={{ color: C.warn }}>v_d = −eEτ/m</span>,{"   "}
          <span style={{ color: C.warn }}>σ = ne²τ/m</span>
        </Eq>
        <P>
          {isKo
            ? "아래 시뮬레이션이 정확히 그 계산입니다: 전자 400개가 무작위로 날아다니다 확률 dt/τ로 산란(속도 재추첨)하고, 그 외에는 전기장 방향으로 가속됩니다. 개별 전자는 여전히 미친 듯이 움직이지만, 앙상블 평균 ⟨v⟩(빨간 화살표)는 정확히 aτ = eEτ/m 로 수렴합니다."
            : "The simulation below is exactly that calculation: 400 electrons fly randomly, scatter with probability dt/τ (velocity redrawn), and otherwise accelerate along the field. Each electron still moves wildly — but the ensemble average ⟨v⟩ (red arrow) converges precisely to aτ = eEτ/m."}
        </P>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: "1 1 200px" }}>
            <Slider label={isKo ? "전기장 가속 a = qE/m" : "Field accel a = qE/m"}
              value={aE} min={0} max={1.5} step={0.05} onChange={setAE} color={C.warn} />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <Slider label={isKo ? "평균자유시간 τ" : "Mean free time τ"}
              value={tau} min={0.2} max={3} step={0.1} onChange={setTau} color={MOM} />
          </div>
          <button onClick={() => setRunning(!running)} style={btnStyle(running)}>{running ? t.stop : t.run}</button>
          <button onClick={() => { setRunning(false); init(); }} style={btnStyle(false)}>{t.reset}</button>
        </div>
        <canvas ref={canvasRef} width={900} height={340}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, fontFamily: "monospace", fontSize: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            ⟨v⟩ ({isKo ? "시뮬레이션" : "simulated"}) = <b style={{ color: HEAT }}>{vdAvg.toFixed(3)}</b>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            v_d = aτ ({isKo ? "이론" : "theory"}) = <b style={{ color: C.warn }}>{(aE * tau).toFixed(3)}</b>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            σ ∝ nτ → τ {isKo ? "2배" : "×2"} = σ {isKo ? "2배" : "×2"}
          </div>
        </div>
        <P>
          {isKo
            ? "τ를 키우면(산란이 드물면) 표류속도와 전도도가 정비례로 커집니다 — σ = ne²τ/m 에서 물질마다 다른 것은 n(자유전자 밀도)과 τ뿐이고, e와 m은 기본상수입니다. 즉 '왜 은이 납보다 전기를 잘 통하는가'는 결국 'τ가 왜 다른가'의 질문이 됩니다. 다음 탭에서 τ의 정체를 파헤칩니다."
            : "Increase τ (rarer scattering) and both drift and conductivity grow in direct proportion — in σ = ne²τ/m, only n (free-electron density) and τ vary between materials; e and m are fundamental constants. 'Why does silver conduct better than lead?' reduces to 'why is τ different?' — the subject of the next tab."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 3 — SCATTERING & TEMPERATURE (Matthiessen)
// =============================================================
function Scattering({ lang }) {
  const isKo = lang === "ko";
  const [imp, setImp] = useState(1.0); // impurity %
  const canvasRef = useRef(null);

  // teaching model: rho_ph(T) = a*T*(1 - exp(-T/60)), rho_imp = 1.25*imp
  const rhoPh = (T) => 0.0064 * T * (1 - Math.exp(-T / 60));
  const rhoImp = 1.25 * imp;

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 52;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    const Tmax = 300, Rmax = 4;
    const xOf = (T) => pad + (W - pad - 20) * T / Tmax;
    const yOf = (r) => (H - pad) - (H - pad - 20) * r / Rmax;
    // axes + grid
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 14); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText(isKo ? "비저항 ρ [10⁻⁸ Ωm]" : "resistivity ρ [1e-8 Ωm]", pad + 6, 18);
    ctx.fillText("T [K]", W - 54, H - pad + 28);
    for (let g = 0; g <= 4; g++) {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath(); ctx.moveTo(pad, yOf(g)); ctx.lineTo(W - 14, yOf(g)); ctx.stroke();
      ctx.fillStyle = C.textDim;
      ctx.fillText(String(g), pad - 18, yOf(g) + 4);
    }
    [0, 100, 200, 300].forEach((T) => {
      ctx.fillText(String(T), xOf(T) - 10, H - pad + 16);
    });
    const plot = (fn, color, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.6;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      for (let T = 0; T <= Tmax; T += 2) {
        const x = xOf(T), y = yOf(Math.min(fn(T), Rmax));
        if (T === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    };
    plot((T) => rhoPh(T), MOM);                    // pure
    plot((T) => rhoPh(T) + rhoImp, C.warn);        // with impurities
    ctx.fillStyle = MOM; ctx.fillText(isKo ? "순수 금속" : "pure metal", xOf(230), yOf(rhoPh(230)) - 8);
    ctx.fillStyle = C.warn;
    ctx.fillText(`+${imp.toFixed(1)}% ${isKo ? "불순물" : "impurity"}`, xOf(140), yOf(rhoPh(140) + rhoImp) - 8);
  }, [imp, isKo]);
  useEffect(() => { draw(); }, [draw]);

  return (
    <>
      <Card>
        <H2>{isKo ? "τ의 정체: 전자는 무엇에 부딪히는가?" : "What Is τ, Really? What Do Electrons Hit?"}</H2>
        <Eq style={{ fontSize: 16 }}>
          P(z) = exp(−σ_ion n_ion z) = e^(−z/λ),{"   "}λ = 1/(σ_ion n_ion),{"   "}τ = λ/u
        </Eq>
        <P>
          {isKo
            ? "산란 단면적 σ_ion(전자가 산란되는 투영 면적)과 산란자 밀도 n_ion이 평균자유행로 λ를 결정합니다. 그런데 여기서 고전물리학이 실험과 충돌합니다: 실험은 σ ∝ 1/T (즉 τ ∝ 1/T)인데, Maxwell–Boltzmann 속도 u = √(3k_BT/m)를 쓰면 τ = λ/u ∝ 1/√T 가 나옵니다."
            : "The scattering cross-section σ_ion (the projected area within which an electron scatters) and the scatterer density n_ion set the mean free path λ. But here classical physics collides with experiment: measurements give σ ∝ 1/T (so τ ∝ 1/T), while the Maxwell–Boltzmann speed u = √(3k_BT/m) predicts τ = λ/u ∝ 1/√T."}
        </P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          <div style={{ background: C.card, border: `1px solid ${C.err}44`, borderTop: `3px solid ${C.err}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, color: C.err }}>{isKo ? "고전적 계산 (틀림)" : "Classical estimate (wrong)"}</div>
            <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.8, marginTop: 8, fontFamily: "monospace" }}>
              σ_ion ~ π(1 Å)² ~ 3×10⁻²⁰ m²<br />
              u = √(3k_BT/m) ≈ 1.2×10⁵ m/s<br />
              τ = λ/u ~ 3×10⁻¹⁵ s, τ ∝ 1/√T ✗
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.ok}44`, borderTop: `3px solid ${C.ok}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, color: C.ok }}>{isKo ? "양자역학적 그림 (맞음)" : "Quantum picture (right)"}</div>
            <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.8, marginTop: 8, fontFamily: "monospace" }}>
              {isKo ? "전자속도 = Fermi 속도" : "electron speed = Fermi velocity"} v_F ≈ 1.6×10⁶ m/s ({isKo ? "T와 거의 무관" : "nearly T-independent"})<br />
              {isKo ? "완전 결정에서는 산란 없음! 이온이 열진동으로 이탈할 때만 산란" : "No scattering off a perfect crystal — only off thermally displaced ions"}<br />
              σ_ion = πk_BT/k → τ ∝ 1/T ✓ (~1.7×10⁻¹⁴ s, {isKo ? "실험" : "expt"} 2.5×10⁻¹⁴ s)
            </div>
          </div>
        </div>
        <P>
          {isKo
            ? "전자는 입자가 아니라 파동이어서 완벽한 주기 격자를 '알고' 지나갑니다. 산란은 격자가 이상 위치에서 벗어날 때 — 즉 열진동(포논!)과 불순물·결함 — 에서만 일어납니다. 열진동의 진폭² ∝ T 이므로 σ_ion ∝ T, τ ∝ 1/T. 크기(10⁻¹⁴ s)와 온도의존성이 모두 맞아떨어집니다."
            : "Electrons are waves: they glide through a perfect periodic lattice unscattered. Scattering happens only where the lattice deviates from ideal — thermal vibrations (phonons!) and impurities/defects. Since vibration amplitude² ∝ T, we get σ_ion ∝ T and τ ∝ 1/T — both the magnitude (10⁻¹⁴ s) and the T-dependence come out right."}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "Matthiessen 법칙 — 불순물 슬라이더로 확인" : "Matthiessen's Rule — Drag the Impurity Slider"}</H2>
        <Eq style={{ fontSize: 16 }}>
          1/τ = 1/τ_T + 1/τ_I{"   "}⟹{"   "}ρ(T) = ρ_impurity + ρ_phonon(T)
        </Eq>
        <div style={{ maxWidth: 420, marginBottom: 8 }}>
          <Slider label={isKo ? "불순물 농도 (예: Cu에 Ni)" : "Impurity level (e.g., Ni in Cu)"}
            value={imp} min={0} max={2.5} step={0.1} onChange={setImp} unit=" %" color={C.warn} />
        </div>
        <canvas ref={canvasRef} width={900} height={340}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <P>
          {isKo
            ? "산란 채널은 확률이므로 산란률(1/τ)이 더해집니다. 포논 산란은 T에 비례해 커지지만, 불순물 산란은 T와 무관한 상수 — 그래서 불순물은 곡선 전체를 위로 '평행이동'시킵니다 (강의 슬라이드의 Cu + 1%/2% Ni 그래프 그대로). T → 0에서 남는 잔류 비저항(residual resistivity)은 시료의 순도 지표로 쓰입니다."
            : "Scattering channels are probabilities, so the rates (1/τ) add. Phonon scattering grows with T, but impurity scattering is a T-independent constant — impurities shift the whole curve upward in parallel (exactly the Cu + 1%/2% Ni plot from the slides). The residual resistivity left as T → 0 is used as a purity metric."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 4 — WIEDEMANN–FRANZ
// =============================================================
function WiedemannFranz({ lang }) {
  const isKo = lang === "ko";
  const canvasRef = useRef(null);
  const T = 293, L0 = 2.44e-8;

  const metals = [
    ["Ag", 6.30e7, 429], ["Cu", 5.96e7, 401], ["Au", 4.52e7, 317],
    ["Al", 3.77e7, 237], ["W", 1.79e7, 173], ["Zn", 1.69e7, 116],
    ["Ni", 1.43e7, 91], ["Fe", 1.00e7, 80], ["Pt", 0.94e7, 72], ["Pb", 0.455e7, 35],
  ];

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 56;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    const xmax = 480, ymax = 480;
    const xOf = (v) => pad + (W - pad - 20) * v / xmax;
    const yOf = (v) => (H - pad) - (H - pad - 20) * v / ymax;
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 14); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText("L₀σT [W/mK]", W - 130, H - pad + 28);
    ctx.fillText(isKo ? "실측 κ [W/mK]" : "measured κ [W/mK]", pad + 6, 18);
    [100, 200, 300, 400].forEach((v) => {
      ctx.fillText(String(v), xOf(v) - 12, H - pad + 16);
      ctx.fillText(String(v), pad - 34, yOf(v) + 4);
    });
    // y = x line
    ctx.strokeStyle = HEAT; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0)); ctx.lineTo(xOf(460), yOf(460)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = HEAT;
    ctx.fillText("κ = L₀σT", xOf(320), yOf(360));
    // points
    metals.forEach(([name, s, k]) => {
      const x = xOf(L0 * s * T), y = yOf(k);
      ctx.fillStyle = MOM;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = C.text;
      ctx.fillText(name, x + 8, y - 4);
    });
  }, [isKo]);
  useEffect(() => { draw(); }, [draw]);

  return (
    <>
      <Card>
        <H2>{isKo ? "하나의 운반자, 두 개의 전류 — Wiedemann–Franz 법칙" : "One Carrier, Two Currents — the Wiedemann–Franz Law"}</H2>
        <Eq style={{ fontSize: 18 }}>
          κ/σ = (8k_B²/πq²)·T = L·T,{"   "}L ≈ 2.44×10⁻⁸ V²K⁻²{" "}
          <span style={{ color: C.textDim }}>({isKo ? "Lorenz 수" : "Lorenz number"})</span>
        </Eq>
        <P>
          {isKo
            ? "Drude의 통찰: 금속에서 전하를 나르는 자유전자가 열도 나른다. σ = nq²τ/m 과 기체운동론의 κ = c_V m n u λ/3 을 나누면 재료 고유의 양(n, τ, λ)이 전부 소거되고, 기본상수만 남습니다. 놀랍게도 이 비율은 온도에만 비례하며 금속의 종류와 무관 — 좋은 전기 도체는 반드시 좋은 열 도체입니다."
            : "Drude's insight: the free electrons that carry charge in a metal also carry its heat. Divide σ = nq²τ/m by the kinetic-theory κ = c_V m n u λ/3 and every material-specific quantity (n, τ, λ) cancels — only fundamental constants survive. The ratio depends solely on T, independent of which metal: a good electrical conductor must be a good thermal conductor."}
        </P>
        <canvas ref={canvasRef} width={880} height={420}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {[isKo ? "금속" : "Metal", "σ [S/m]", "κ [W/mK]", "L = κ/(σT)", "L/L₀"].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "7px 10px", borderBottom: `2px solid ${C.border}`, color: C.accentSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metals.map(([name, s, k], i) => {
                const L = k / (s * T);
                return (
                  <tr key={i} style={{ background: i % 2 ? "rgba(59,130,246,0.04)" : "transparent" }}>
                    <td style={tdS()}>{name}</td>
                    <td style={tdS()}>{s.toExponential(2)}</td>
                    <td style={tdS()}>{k}</td>
                    <td style={tdS()}>{L.toExponential(2)}</td>
                    <td style={{ ...tdS(), color: Math.abs(L / L0 - 1) < 0.15 ? C.ok : C.warn }}>{(L / L0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <P>
          {isKo
            ? "실측 데이터(10개 금속)가 L/L₀ ≈ 0.9–1.1 범위에 몰려 있습니다 — 1853년 실험 법칙을 1900년 Drude 모형이 상수까지 맞춰 설명한, 고체물리학 초기의 대성공입니다. 응용: 합금의 κ는 측정이 어렵지만 σ는 쉬우므로, 데이터시트의 κ는 흔히 σ에서 W–F로 환산한 값입니다 (강의 슬라이드의 구리합금 산점도). 반도체에서는 σ = e(n_eμ_e + n_hμ_h)로 일반화되며, 이동도 μ = |q|τ/m 가 등장합니다."
            : "Real data (10 metals) cluster at L/L₀ ≈ 0.9–1.1 — an 1853 empirical law explained, constant included, by Drude's 1900 model: an early triumph of solid-state physics. In practice κ is hard to measure but σ is easy, so datasheet κ values for alloys are often converted from σ via W–F (the copper-alloy scatter plot in the slides). For semiconductors this generalizes to σ = e(n_eμ_e + n_hμ_h) with the mobility μ = |q|τ/m."}
        </P>
      </Card>
    </>
  );
}

function tdS() {
  return { padding: "7px 10px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 12 };
}

// =============================================================
// TAB 5 — PHONON CONDUCTION (dispersion + k(T))
// =============================================================
function Phonon({ lang }) {
  const isKo = lang === "ko";
  const [ratio, setRatio] = useState(2.0);  // m2/m1
  const [spring, setSpring] = useState(1.0);
  const [defect, setDefect] = useState(30); // l_imp
  const dispRef = useRef(null);
  const ktRef = useRef(null);

  // dispersion drawing
  const drawDisp = useCallback(() => {
    const cv = dispRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 50;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    const m1 = 1, m2 = ratio, Cs = spring;
    const s = 1 / m1 + 1 / m2;
    const wmax = Math.sqrt(2 * Cs * s) * 1.08;
    const xOf = (ka) => pad + (W - pad - 20) * (ka + Math.PI / 2) / Math.PI;
    const yOf = (w) => (H - pad) - (H - pad - 20) * w / wmax;
    // gap band
    const wAcEdge = Math.sqrt(2 * Cs / Math.max(m1, m2));
    const wOpEdge = Math.sqrt(2 * Cs / Math.min(m1, m2));
    if (ratio > 1.001) {
      ctx.fillStyle = "rgba(245,158,11,0.10)";
      ctx.fillRect(pad, yOf(wOpEdge), W - pad - 20, yOf(wAcEdge) - yOf(wOpEdge));
      ctx.fillStyle = C.warn; ctx.font = "12px monospace";
      ctx.fillText(isKo ? "밴드 갭 (진동 금지 대역)" : "band gap (forbidden)", W / 2 - 70, (yOf(wAcEdge) + yOf(wOpEdge)) / 2 + 4);
    }
    // axes
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 14); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText("ω", pad + 6, 18);
    ctx.fillText("ka", W - 34, H - pad + 26);
    ctx.fillText("−π/2", pad - 10, H - pad + 16);
    ctx.fillText("0", xOf(0) - 4, H - pad + 16);
    ctx.fillText("π/2", xOf(Math.PI / 2) - 14, H - pad + 16);
    const branch = (sign, color, label, lx) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const ka = -Math.PI / 2 + Math.PI * i / 300;
        const root = Math.sqrt(Math.max(s * s - 4 * Math.sin(ka) ** 2 / (m1 * m2), 0));
        const w = Math.sqrt(Cs * (s + sign * root));
        const x = xOf(ka), y = yOf(w);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, lx, yOf(sign > 0 ? Math.sqrt(2 * Cs * s) : 0.35 * wAcEdge) - 8);
    };
    branch(-1, C.cyan, isKo ? "음향 (acoustic)" : "acoustic", xOf(0.55));
    branch(+1, C.pink, isKo ? "광학 (optical)" : "optical", xOf(-1.35));
  }, [ratio, spring, isKo]);
  useEffect(() => { drawDisp(); }, [drawDisp]);

  // k(T) drawing
  const drawKT = useCallback(() => {
    const cv = ktRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 52;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    const theta = 40;
    const cV = (T) => Math.pow(T / theta, 3) / (1 + Math.pow(T / theta, 3));
    const ell = (T) => 1 / (T / 300 + 1 / defect);
    const kmodel = (T) => 60 * cV(T) * ell(T);
    // log-log: T 1..1000, k 0.01..1000
    const xOf = (T) => pad + (W - pad - 20) * Math.log10(T) / 3;
    const yOf = (k) => (H - pad) - (H - pad - 18) * (Math.log10(k) + 1) / 4;
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 12); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText(isKo ? "k (상대값, log)" : "k (relative, log)", pad + 6, 16);
    ctx.fillText("T [K] (log)", W - 100, H - pad + 28);
    [1, 10, 100, 1000].forEach((T) => ctx.fillText(String(T), xOf(T) - 8, H - pad + 16));
    ctx.strokeStyle = HEAT; ctx.lineWidth = 2.8;
    ctx.beginPath();
    let first = true;
    for (let i = 0; i <= 300; i++) {
      const T = Math.pow(10, 3 * i / 300);
      const k = Math.max(kmodel(T), 0.01);
      const x = xOf(T), y = yOf(Math.min(k, 1000));
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // asymptote labels
    ctx.fillStyle = C.cyan; ctx.fillText("~T³ (c\u1D65)", xOf(3), yOf(kmodel(3)) - 12);
    ctx.fillStyle = C.warn; ctx.fillText("~1/T (l)", xOf(500), yOf(kmodel(500)) - 12);
  }, [defect, isKo]);
  useEffect(() => { drawKT(); }, [drawKT]);

  const m2 = ratio, Cs = spring;
  const gapLo = Math.sqrt(2 * Cs / m2), gapHi = Math.sqrt(2 * Cs);

  return (
    <>
      <Card>
        <H2>{isKo ? "부도체의 열: 포논이 나른다" : "Heat in Insulators: Phonons Carry It"}</H2>
        <P>
          {isKo
            ? "유전체 고체에는 자유전자가 없지만 다이아몬드는 구리보다 열을 잘 전도합니다. 운반자는 격자의 양자화된 탄성 진동 — 포논입니다. 포논은 준입자처럼 행동하는 '포논 기체'로 취급할 수 있고, 뜨거운 포논이 충돌로 에너지를 전달합니다. 기체운동론을 그대로 적용하면:"
            : "Dielectric solids have no free electrons, yet diamond out-conducts copper. The carriers are quantized elastic lattice vibrations — phonons. They behave as a gas of quasi-particles; 'hot' phonons hand energy on through collisions. Kinetic theory applies directly:"}
        </P>
        <Eq style={{ fontSize: 18 }}>
          k = C\u1D65 l v / 3{"   "}
          <span style={{ color: C.textDim, fontSize: 14 }}>
            (C\u1D65: {isKo ? "단위부피 열용량" : "heat capacity per volume"}, l: {isKo ? "평균자유행로" : "mean free path"}, v: {isKo ? "음속" : "sound speed"})
          </span>
        </Eq>
        <H3>{isKo ? "1D 이원자 사슬의 분산관계 — 질량비와 스프링을 조절해 보세요" : "Dispersion of the 1D Diatomic Chain — Tune Mass Ratio & Spring"}</H3>
        <Eq style={{ fontSize: 15 }}>
          ω² = C(1/m₁ + 1/m₂) ± C√[(1/m₁ + 1/m₂)² − 4sin²(ka)/(m₁m₂)]
        </Eq>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "질량비 m₂/m₁" : "Mass ratio m₂/m₁"}
              value={ratio} min={1} max={6} step={0.1} onChange={setRatio} color={C.pink} />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "스프링 상수 C (결합 강성)" : "Spring constant C (bond stiffness)"}
              value={spring} min={0.3} max={3} step={0.1} onChange={setSpring} color={C.cyan} />
          </div>
        </div>
        <canvas ref={dispRef} width={880} height={360}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <P>
          {isKo
            ? `관찰 포인트: ① 음향 가지의 k→0 기울기가 음속 v이며, C를 키우면(강한 결합) v가 커져 k = C\u1D65lv/3 도 커집니다 — 다이아몬드의 비밀. ② 질량비가 1에서 멀어지면 두 가지 사이에 밴드 갭(현재 ω = ${gapLo.toFixed(2)}–${gapHi.toFixed(2)})이 열립니다. 같은 질량(m₂/m₁ = 1)이면 갭이 닫히며 단원자 사슬로 되돌아갑니다. ③ 광학 가지는 두 원자가 반대 위상으로 진동하는 모드로, 이온 결정에서 빛(적외선)과 결합해 '광학'이라 불립니다.`
            : `Watch for: ① the slope of the acoustic branch at k→0 is the sound speed v; stiffer bonds (larger C) raise v and hence k = C\u1D65lv/3 — diamond's secret. ② Moving the mass ratio away from 1 opens a band gap (currently ω = ${gapLo.toFixed(2)}–${gapHi.toFixed(2)}); at m₂/m₁ = 1 the gap closes and the monatomic chain is recovered. ③ In the optical branch the two atoms vibrate in anti-phase — in ionic crystals this couples to infrared light, hence "optical."`}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "k(T)의 산봉우리 — c\u1D65와 l의 줄다리기" : "The Peak in k(T) — a Tug-of-War Between c\u1D65 and l"}</H2>
        <P>
          {isKo
            ? "저온에서는 열용량이 c\u1D65 ~ T³로 자라며 k를 끌어올리고, 고온에서는 포논끼리의 산란이 심해져 l ~ 1/T로 줄며 k를 끌어내립니다. 그 사이에 산봉우리가 생깁니다. 결함(불순물) 슬라이더를 움직여 보세요 — 결함 산란은 l의 상한을 정해 봉우리를 깎아내립니다 (전자의 Matthiessen 법칙과 완전히 같은 논리!)."
            : "At low T the heat capacity grows as c\u1D65 ~ T³, pulling k up; at high T phonon–phonon scattering shortens l ~ 1/T, pulling k down. A peak forms in between. Drag the defect slider — defect scattering caps l and shaves the peak (exactly the same logic as Matthiessen's rule for electrons!)."}
        </P>
        <div style={{ maxWidth: 420, marginBottom: 8 }}>
          <Slider label={isKo ? "결정 품질 (결함↓ = 값↑)" : "Crystal quality (fewer defects = higher)"}
            value={defect} min={3} max={100} step={1} onChange={setDefect} color={HEAT} />
        </div>
        <canvas ref={ktRef} width={880} height={330}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
      </Card>
    </>
  );
}

// =============================================================
// TAB 6 — GAS CONDUCTION + KNUDSEN
// =============================================================
function GasConduction({ lang }) {
  const isKo = lang === "ko";
  const kB = 1.381e-23, amu = 1.661e-27;
  const [gas, setGas] = useState("N2");
  const [T, setT] = useState(300);
  const [pore, setPore] = useState(200);   // nm
  const [pressure, setPressure] = useState(1.0); // atm

  const gases = {
    H2: { label: "H₂", d: 273, M: 2, f: 5, kexp: 0.187 },
    He: { label: "He", d: 219, M: 4, f: 3, kexp: 0.152 },
    Ne: { label: "Ne", d: 258, M: 20, f: 3, kexp: 0.049 },
    N2: { label: isKo ? "N₂ (≈공기)" : "N₂ (≈air)", d: 370, M: 28, f: 5, kexp: 0.026 },
    Ar: { label: "Ar", d: 340, M: 40, f: 3, kexp: 0.018 },
    CH4: { label: "CH₄", d: 380, M: 16, f: 6, kexp: 0.034 },
  };
  const g = gases[gas];
  const d = g.d * 1e-12, m = g.M * amu;
  const kGas = g.f / (3 * d * d) * Math.sqrt(Math.pow(kB, 3) * T / (Math.pow(Math.PI, 3) * m));

  // Knudsen
  const n = pressure * 101325 / (kB * T);
  const lmfp = 1 / (Math.SQRT2 * n * Math.PI * d * d);
  const Kn = lmfp / (pore * 1e-9);
  const kRatio = 1 / (1 + 2 * Kn); // simple interpolation

  const fmtK = (v) => v >= 0.1 ? v.toFixed(3) : v.toPrecision(2);

  return (
    <>
      <Card>
        <H2>{isKo ? "기체 열전도: 압력과 무관하다?!" : "Gas Conduction: Independent of Pressure?!"}</H2>
        <Eq style={{ fontSize: 17 }}>
          k = f k_B n l v / 6{"  "}={"  "}
          <span style={{ color: C.warn }}>(f / 3d²) √(k_B³T / π³m)</span>
          {"   "}
          <span style={{ color: C.textDim, fontSize: 13 }}>
            (l = 1/√2·n·πd² {isKo ? "이므로 n이 소거!" : "so n cancels!"})
          </span>
        </Eq>
        <P>
          {isKo
            ? "압력을 올리면 운반자(분자)는 많아지지만, 평균자유행로가 정확히 그만큼 짧아져 상쇄됩니다 — 기체의 k는 압력과 무관하고, √T/m 과 1/d²에만 의존합니다. 가볍고 작은 분자(H₂, He)가 최고의 기체 열전도체인 이유입니다."
            : "Raise the pressure and you get more carriers — but the mean free path shrinks by exactly the same factor. Gas conductivity is pressure-independent, depending only on √(T/m) and 1/d². That's why light, small molecules (H₂, He) are the best gaseous conductors."}
        </P>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {Object.entries(gases).map(([k2, v]) => (
            <button key={k2} onClick={() => setGas(k2)} style={btnStyle(gas === k2)}>{v.label} (f={v.f})</button>
          ))}
        </div>
        <div style={{ maxWidth: 420 }}>
          <Slider label={isKo ? "온도 T" : "Temperature T"} value={T} min={100} max={1000} step={10} onChange={setT} unit=" K" color={HEAT} />
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontFamily: "monospace", fontSize: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            k ({isKo ? "운동론 모형" : "kinetic model"}) = <b style={{ color: C.warn }}>{fmtK(kGas)}</b> W/mK
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            k ({isKo ? "실험, 300 K" : "experiment, 300 K"}) = <b style={{ color: C.ok }}>{g.kexp}</b> W/mK
          </div>
        </div>
        <P>
          {isKo
            ? "단순 모형이라 절대값은 2–4배 작지만, 경향은 전부 맞습니다: k ∝ √T (온도를 올려 보세요), 가벼운 분자일수록 큼 (H₂ > He > N₂ > Ar), 자유도 f가 크면 큼. 단단한 구 모형의 한계는 3주차 이후 엄밀한 Chapman–Enskog 이론이 보완합니다."
            : "The crude model runs 2–4× low in absolute value, but every trend is right: k ∝ √T (try the slider), lighter molecules conduct better (H₂ > He > N₂ > Ar), more degrees of freedom f help. The hard-sphere limitations are fixed later by rigorous Chapman–Enskog theory."}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "Knudsen 영역 — 에어로젤이 최고의 단열재인 이유" : "The Knudsen Regime — Why Aerogel Insulates So Well"}</H2>
        <Eq style={{ fontSize: 16 }}>
          Kn = l/δ,{"   "}l ≫ δ {isKo ? "이면" : "⟹"} k = f k_B n δ v / 6{"  "}
          <span style={{ color: C.textDim, fontSize: 13 }}>({isKo ? "벽 충돌이 지배 — 이제 압력·기공 크기에 의존!" : "wall collisions dominate — now n and δ matter!"})</span>
        </Eq>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "기공/간극 크기 δ" : "Pore / gap size δ"}
              value={pore} min={10} max={1000} step={10} onChange={setPore} unit=" nm" color={MASS} />
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Slider label={isKo ? "압력" : "Pressure"}
              value={pressure} min={0.01} max={1} step={0.01} onChange={setPressure} unit=" atm" color={C.cyan} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontFamily: "monospace", fontSize: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            l = <b style={{ color: MOM }}>{(lmfp * 1e9).toFixed(0)}</b> nm
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            Kn = l/δ = <b style={{ color: C.warn }}>{Kn.toFixed(2)}</b>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            k_eff/k_bulk ≈ <b style={{ color: Kn > 1 ? C.ok : HEAT }}>{(kRatio * 100).toFixed(0)}%</b>
          </div>
        </div>
        <P>
          {isKo
            ? "상온·1기압 공기의 l ≈ 65 nm. 기공을 이보다 작게 만들면(δ < l) 분자는 서로 부딪히기 전에 벽에 부딪히고, 유효 자유행로가 δ로 제한되어 k가 급락합니다. 실리카 에어로젤(기공 ~20–50 nm)이 정지 공기보다도 단열이 좋은 이유이며, 진공 단열재가 압력을 낮춰 같은 효과(l 증가 → Kn 증가)를 얻는 원리입니다."
            : "For air at 1 atm, l ≈ 65 nm. Make pores smaller than this (δ < l) and molecules hit the walls before hitting each other — the effective free path is capped at δ and k collapses. This is why silica aerogel (pores ~20–50 nm) insulates better than still air, and why vacuum panels lower pressure to boost l (and hence Kn) for the same effect."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 7 — CONVECTION & RADIATION PREVIEW (Planck interactive)
// =============================================================
function ConvRad({ lang }) {
  const isKo = lang === "ko";
  const [Tp, setTp] = useState(5000);
  const canvasRef = useRef(null);
  const h = 6.626e-34, cl = 2.998e8, kB = 1.381e-23, SB = 5.670e-8;

  const hRanges = [
    { name: isKo ? "자연대류, 공기" : "Free convection, air", lo: 5, hi: 50 },
    { name: isKo ? "강제대류, 공기" : "Forced convection, air", lo: 25, hi: 250 },
    { name: isKo ? "강제대류, 물" : "Forced convection, water", lo: 250, hi: 15000 },
    { name: isKo ? "비등하는 물" : "Boiling water", lo: 2500, hi: 25000 },
    { name: isKo ? "응축하는 수증기" : "Condensing water vapor", lo: 5000, hi: 100000 },
  ];

  const planck = (lamM, T) => {
    const x = h * cl / (lamM * kB * T);
    return 2 * Math.PI * h * cl * cl / Math.pow(lamM, 5) / (Math.exp(x) - 1);
  };

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height, pad = 50;
    ctx.fillStyle = "#0d1220"; ctx.fillRect(0, 0, W, H);
    const lamMaxPlot = 3e-6;
    // visible band
    const xOf = (lam) => pad + (W - pad - 16) * lam / lamMaxPlot;
    ctx.fillStyle = "rgba(234,179,8,0.10)";
    ctx.fillRect(xOf(0.38e-6), 14, xOf(0.75e-6) - xOf(0.38e-6), H - pad - 14);
    ctx.fillStyle = C.warn; ctx.font = "11px monospace";
    ctx.fillText(isKo ? "가시광" : "visible", xOf(0.40e-6), 26);
    // find max for scaling
    let bmax = 0;
    for (let i = 1; i <= 300; i++) {
      const lam = lamMaxPlot * i / 300;
      bmax = Math.max(bmax, planck(lam, Tp));
    }
    const yOf = (B) => (H - pad) - (H - pad - 30) * B / (bmax * 1.05);
    // axes
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(pad, 12); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 14, H - pad); ctx.stroke();
    ctx.fillStyle = C.textDim; ctx.font = "12px monospace";
    ctx.fillText(isKo ? "분광 방사도" : "spectral exitance", pad + 6, 22);
    ctx.fillText("λ [μm]", W - 62, H - pad + 28);
    [0.5, 1, 1.5, 2, 2.5, 3].forEach((um) => {
      ctx.fillText(um.toFixed(1), xOf(um * 1e-6) - 10, H - pad + 16);
    });
    // reference curves at fixed T (faint)
    [2000, 3000, 4000].forEach((Tref) => {
      if (Math.abs(Tref - Tp) < 100) return;
      ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 1; i <= 300; i++) {
        const lam = lamMaxPlot * i / 300;
        const y = yOf(Math.min(planck(lam, Tref), bmax * 1.05));
        const x = xOf(lam);
        if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    // main curve
    ctx.strokeStyle = HEAT; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 1; i <= 300; i++) {
      const lam = lamMaxPlot * i / 300;
      const x = xOf(lam), y = yOf(planck(lam, Tp));
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Wien peak
    const lamW = 2.898e-3 / Tp;
    if (lamW < lamMaxPlot) {
      ctx.strokeStyle = C.warn; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xOf(lamW), H - pad); ctx.lineTo(xOf(lamW), yOf(planck(lamW, Tp))); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.warn;
      ctx.fillText(`λmax = ${(lamW * 1e6).toFixed(2)} μm`, xOf(lamW) + 6, yOf(planck(lamW, Tp)) + 16);
    }
  }, [Tp, isKo]);
  useEffect(() => { draw(); }, [draw]);

  const q = SB * Math.pow(Tp, 4);

  return (
    <>
      <Card>
        <H2>{isKo ? "대류: Newton의 냉각 법칙과 h의 스펙트럼" : "Convection: Newton's Law of Cooling & the Spectrum of h"}</H2>
        <Eq style={{ fontSize: 17 }}>
          q = h ΔT{"   "}
          <span style={{ color: C.textDim, fontSize: 13 }}>
            (h [W/m²K]: {isKo ? "물성이 아니라 유동이 정하는 공학 계수" : "an engineering coefficient set by the flow, not a material property"})
          </span>
        </Eq>
        <div style={{ display: "grid", gap: 8 }}>
          {hRanges.map((r, i) => {
            const loPct = 100 * Math.log10(r.lo / 5) / Math.log10(100000 / 5);
            const hiPct = 100 * Math.log10(r.hi / 5) / Math.log10(100000 / 5);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 190, fontSize: 12.5, color: C.text }}>{r.name}</div>
                <div style={{ flex: 1, height: 16, background: "#0d1220", borderRadius: 6, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: `${loPct}%`, width: `${hiPct - loPct}%`,
                    height: "100%", borderRadius: 6,
                    background: `linear-gradient(90deg, ${C.cyan}88, ${C.cyan})`,
                  }} />
                </div>
                <div style={{ width: 150, fontSize: 12, fontFamily: "monospace", color: C.textDim }}>
                  {r.lo.toLocaleString()}–{r.hi.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
        <P>
          {isKo
            ? "h는 5(고요한 공기)에서 100,000(응축 수증기)까지 4만 배를 넘나듭니다 — 상변화(비등·응축)가 압도적인 이유는 잠열 때문입니다. 자연대류는 온도차만으로, 강제대류는 팬·펌프 같은 외부 요인으로 유동이 만들어집니다. 온도차가 만든 부력이 점성 마찰을 이기는 순간 자발적으로 대칭이 깨지며 벌집 패턴이 나타나는 Rayleigh–Bénard 대류, 밀도 역전이 만드는 Rayleigh–Taylor 불안정성은 15주차 '패턴 형성'에서 다시 만납니다."
            : "h spans over four decades — 5 (still air) to 100,000 (condensing steam); phase change dominates because of latent heat. Natural convection is driven by ΔT alone; forced convection by fans and pumps. When buoyancy from ΔT overcomes viscous friction, symmetry breaks spontaneously into honeycomb cells (Rayleigh–Bénard convection) — and density inversion drives the Rayleigh–Taylor instability. Both return in Week 15, Pattern Formation."}
        </P>
      </Card>

      <Card>
        <H2>{isKo ? "복사: Planck 스펙트럼에서 σT⁴까지" : "Radiation: From the Planck Spectrum to σT⁴"}</H2>
        <Eq style={{ fontSize: 16 }}>
          P/A = ∫I(ν)dν·∫cosθ dΩ = (2πh/c²)(k_BT/h)⁴·(π⁴/15) = σT⁴,{"   "}σ = 2π⁵k_B⁴/15c²h³
        </Eq>
        <P>
          {isKo
            ? "복사는 매질 없이(완전 진공에서도) 전자기파로 열을 나릅니다. Planck의 흑체 스펙트럼을 모든 진동수와 반구 입체각에 대해 적분하면 Stefan–Boltzmann의 T⁴ 법칙과 상수 σ = 5.67×10⁻⁸ W/m²K⁴이 기본상수만으로 유도됩니다. 온도를 움직여 보세요:"
            : "Radiation carries heat by electromagnetic waves — no medium required (perfect vacuum works). Integrating Planck's blackbody spectrum over all frequencies and the hemisphere yields Stefan–Boltzmann's T⁴ law with σ = 5.67×10⁻⁸ W/m²K⁴ built purely from fundamental constants. Slide the temperature:"}
        </P>
        <div style={{ maxWidth: 460, marginBottom: 8 }}>
          <Slider label={isKo ? "흑체 온도" : "Blackbody temperature"}
            value={Tp} min={1000} max={6000} step={50} onChange={setTp} unit=" K" color={HEAT} />
        </div>
        <canvas ref={canvasRef} width={880} height={340}
          style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontFamily: "monospace", fontSize: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            q = σT⁴ = <b style={{ color: HEAT }}>{q >= 1e6 ? (q / 1e6).toFixed(1) + " MW" : (q / 1e3).toFixed(0) + " kW"}</b>/m²
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px" }}>
            λ_max = 2898/T = <b style={{ color: C.warn }}>{(2898 / Tp).toFixed(2)}</b> μm (Wien)
          </div>
        </div>
        <P>
          {isKo
            ? "5778 K(태양 표면)에서 봉우리가 정확히 가시광 한복판(0.50 μm)에 옵니다 — 우리 눈이 태양 스펙트럼에 맞춰 진화한 결과입니다. 2000 K로 내리면 봉우리는 적외선으로 밀려나고 총량은 (5778/2000)⁴ ≈ 70배 줄어듭니다. 응용: 지구 대기의 8–13 μm '하늘 창'으로 선택적으로 방사하는 복사냉각 필름은 전기 없이 지붕을 식혀 냉방 전력을 22–65% 절감합니다 (강의 슬라이드)."
            : "At 5778 K (the solar surface) the peak lands exactly mid-visible (0.50 μm) — our eyes evolved to match the solar spectrum. Drop to 2000 K and the peak slides into the infrared while total power falls by (5778/2000)⁴ ≈ 70×. Application: radiative-cooling films that emit selectively through the atmosphere's 8–13 μm 'sky window' cool roofs with zero electricity, cutting AC consumption by 22–65% (lecture slide)."}
        </P>
      </Card>
    </>
  );
}

// =============================================================
// TAB 8 — PRACTICE PROBLEMS
// =============================================================
function Practice({ lang }) {
  const isKo = lang === "ko";
  const [open, setOpen] = useState({});
  const toggle = (i) => setOpen((o) => ({ ...o, [i]: !o[i] }));

  const problems = [
    {
      q: isKo
        ? "1. 구리의 σ = 6×10⁷ (Ωm)⁻¹, 자유전자 밀도 n = 8.5×10²⁸ m⁻³이다. Drude 모형으로 평균자유시간 τ를 구하시오. (e = 1.6×10⁻¹⁹ C, mₑ = 9.1×10⁻³¹ kg)"
        : "1. Copper has σ = 6×10⁷ (Ωm)⁻¹ and free-electron density n = 8.5×10²⁸ m⁻³. Find the mean free time τ from the Drude model. (e = 1.6×10⁻¹⁹ C, mₑ = 9.1×10⁻³¹ kg)",
      a: isKo
        ? "σ = ne²τ/m → τ = σm/(ne²) = (6×10⁷ × 9.1×10⁻³¹)/(8.5×10²⁸ × (1.6×10⁻¹⁹)²) ≈ 2.5×10⁻¹⁴ s. 격자 진동 1주기(~10⁻¹³ s)보다 짧은, 10 fs 수준의 시간이다."
        : "σ = ne²τ/m → τ = σm/(ne²) = (6×10⁷ × 9.1×10⁻³¹)/(8.5×10²⁸ × (1.6×10⁻¹⁹)²) ≈ 2.5×10⁻¹⁴ s — a few tens of femtoseconds, shorter than one lattice-vibration period (~10⁻¹³ s).",
    },
    {
      q: isKo
        ? "2. 완전한 결정의 금속에서 비저항이 온도에 비례하는 이유와, 불순물을 넣으면 ρ–T 곡선이 '평행이동'하는 이유를 산란률의 덧셈(Matthiessen 법칙)으로 설명하시오."
        : "2. Explain, via additive scattering rates (Matthiessen's rule), why resistivity in a perfect metal is proportional to T, and why impurities shift the ρ–T curve upward in parallel.",
      a: isKo
        ? "전자파는 완전 격자에서 산란하지 않고, 열진동으로 이탈한 이온에서만 산란한다. 변위² ∝ k_BT/k 이므로 산란단면적 σ_ion = πk_BT/k ∝ T → 1/τ_T ∝ T → ρ ∝ T. 불순물 산란은 T와 무관한 1/τ_I를 더할 뿐이므로 ρ = ρ_I + ρ_T(T): 곡선이 위로 평행이동한다. 1/τ = 1/τ_T + 1/τ_I."
        : "Electron waves don't scatter off a perfect lattice — only off thermally displaced ions. Displacement² ∝ k_BT/k gives σ_ion = πk_BT/k ∝ T, so 1/τ_T ∝ T and ρ ∝ T. Impurities add a T-independent rate 1/τ_I, hence ρ = ρ_I + ρ_T(T): a parallel upward shift. 1/τ = 1/τ_T + 1/τ_I.",
    },
    {
      q: isKo
        ? "3. Wiedemann–Franz 법칙으로 구리(σ = 5.96×10⁷ S/m)의 293 K 열전도도를 예측하고 실측값 401 W/mK와 비교하시오. (L = 2.44×10⁻⁸ V²K⁻²)"
        : "3. Use Wiedemann–Franz to predict copper's thermal conductivity at 293 K (σ = 5.96×10⁷ S/m) and compare with the measured 401 W/mK. (L = 2.44×10⁻⁸ V²K⁻²)",
      a: isKo
        ? "κ = LσT = 2.44×10⁻⁸ × 5.96×10⁷ × 293 ≈ 426 W/mK. 실측 401 W/mK와 약 6% 이내 일치 — 전하와 열을 같은 전자가 나른다는 증거다."
        : "κ = LσT = 2.44×10⁻⁸ × 5.96×10⁷ × 293 ≈ 426 W/mK, within ~6% of the measured 401 W/mK — evidence that the same electrons carry both charge and heat.",
    },
    {
      q: isKo
        ? "4. 다이아몬드는 전기 부도체(σ ~ 10⁻¹² S/m)인데 열전도도는 ~2200 W/mK로 구리의 5배가 넘는다. k = C\u1D65lv/3 의 세 인자로 설명하시오."
        : "4. Diamond is an electrical insulator (σ ~ 10⁻¹² S/m) yet conducts heat at ~2200 W/mK — over 5× copper. Explain using the three factors in k = C\u1D65lv/3.",
      a: isKo
        ? "다이아몬드의 열은 전자가 아니라 포논이 나른다. ① C–C 공유결합이 극도로 강해(스프링 상수↑) 음속 v가 ~18,000 m/s로 매우 크고 ② 가볍고 완벽한 결정이라 포논 평균자유행로 l이 길며 ③ Debye 온도가 높아 상온에서도 포논 산란이 적다. Wiedemann–Franz는 '전자 전도' 금속에만 적용됨에 유의."
        : "Diamond's heat rides on phonons, not electrons. ① Extremely stiff C–C bonds (large spring constant) give a huge sound speed v ≈ 18,000 m/s; ② a light, near-perfect crystal gives a long phonon mean free path l; ③ its high Debye temperature suppresses phonon–phonon scattering at room T. Note W–F applies only to electron conductors.",
    },
    {
      q: isKo
        ? "5. 기체의 열전도도가 압력과 무관한 이유를 k = fk_B n l v/6 에서 보이고, 이 법칙이 깨지는 두 상황(초저압 진공 단열재, 나노기공 에어로젤)의 공통 원리를 설명하시오."
        : "5. Show from k = fk_B n l v/6 why gas conductivity is pressure-independent, and explain the shared principle behind the two cases where it fails (high-vacuum insulation, nanoporous aerogel).",
      a: isKo
        ? "l = 1/(√2·nπd²) ∝ 1/n 이므로 곱 n·l이 상수 → k는 n(압력)과 무관. 그러나 분자-분자 충돌보다 분자-벽 충돌이 먼저 일어나면(l ≥ δ, Kn ≥ 1) 유효 자유행로가 기하 크기 δ로 제한되어 k = fk_B n δ v/6 ∝ n·δ가 된다. 진공 단열재는 n을 낮춰 l을 키우고, 에어로젤은 δ를 l보다 작게 만든다 — 둘 다 Kn ≫ 1을 노리는 같은 전략이다."
        : "Since l = 1/(√2·nπd²) ∝ 1/n, the product n·l is constant → k is independent of n (pressure). But once molecule–wall collisions precede molecule–molecule ones (l ≥ δ, Kn ≥ 1), the effective path is capped at the geometry δ, giving k = fk_B n δ v/6 ∝ n·δ. Vacuum panels lower n to enlarge l; aerogels shrink δ below l — the same strategy: drive Kn ≫ 1.",
    },
    {
      q: isKo
        ? "6. 1D 이원자 사슬(m₁, m₂, 스프링 C)에서 영역 경계 ka = π/2일 때 음향/광학 가지의 진동수를 구하고, m₁ = m₂이면 밴드 갭이 닫힘을 보이시오."
        : "6. For the 1D diatomic chain (m₁, m₂, spring C), find the acoustic and optical frequencies at the zone boundary ka = π/2, and show the band gap closes when m₁ = m₂.",
      a: isKo
        ? "sin²(ka) = 1에서 근호 = √[(1/m₁+1/m₂)² − 4/(m₁m₂)] = |1/m₁ − 1/m₂|. 따라서 ω_ac = √(2C/m_큰쪽), ω_op = √(2C/m_작은쪽). m₁ = m₂ = m이면 두 값 모두 √(2C/m)으로 같아져 갭 = 0 — 단원자 사슬의 접힌 분산관계와 일치한다."
        : "With sin²(ka) = 1 the root becomes √[(1/m₁+1/m₂)² − 4/(m₁m₂)] = |1/m₁ − 1/m₂|, so ω_ac = √(2C/m_heavier) and ω_op = √(2C/m_lighter). If m₁ = m₂ = m, both equal √(2C/m): the gap closes, recovering the folded monatomic dispersion.",
    },
    {
      q: isKo
        ? "7. 태양 표면 온도 5778 K를 흑체로 보고 ① Wien 법칙으로 봉우리 파장 ② Stefan–Boltzmann으로 표면 방사 열유속을 구하시오. 결과가 인간의 시각과 어떤 관련이 있는가?"
        : "7. Treating the solar surface (5778 K) as a blackbody, find ① the Wien peak wavelength and ② the surface radiative flux via Stefan–Boltzmann. How does the result relate to human vision?",
      a: isKo
        ? "① λ_max = 2898 μm·K / 5778 K ≈ 0.50 μm(초록빛 가시광 중심). ② q = σT⁴ = 5.67×10⁻⁸ × 5778⁴ ≈ 6.3×10⁷ W/m² = 63 MW/m². 인간의 눈은 태양 스펙트럼의 봉우리 근방(0.4–0.7 μm)에 최대 감도를 갖도록 진화했다."
        : "① λ_max = 2898 μm·K / 5778 K ≈ 0.50 μm (green, mid-visible). ② q = σT⁴ = 5.67×10⁻⁸ × 5778⁴ ≈ 6.3×10⁷ W/m² = 63 MW/m². Human eyes evolved peak sensitivity right around the solar spectral peak (0.4–0.7 μm).",
    },
    {
      q: isKo
        ? "8. AC 전기장 E(t) = E₀e^(−iωt)에서 Drude 전도도는 σ(ω) = σ₀/(1 − iωτ)이다. ① ωτ ≪ 1 극한과 ② ωτ ≫ 1 극한의 물리적 의미를 논하시오."
        : "8. Under an AC field E(t) = E₀e^(−iωt), the Drude conductivity is σ(ω) = σ₀/(1 − iωτ). Discuss the physics of the limits ① ωτ ≪ 1 and ② ωτ ≫ 1.",
      a: isKo
        ? "① ωτ ≪ 1 (낮은 주파수): σ ≈ σ₀ — 전자가 장 주기마다 여러 번 산란하며 DC처럼 응답한다. ② ωτ ≫ 1 (높은 주파수): σ ≈ iσ₀/(ωτ) — 순허수, 즉 전류가 장과 90° 위상차를 갖고 산란 없이 관성으로만 응답(무손실 진동). 이 전이가 금속의 플라즈마 주파수·광학 반사 특성의 기초가 된다. 참고로 ω→0에서 (1−e^(−iωt))/iω → t 로 DC 결과가 회복된다."
        : "① ωτ ≪ 1 (low frequency): σ ≈ σ₀ — electrons scatter many times per field cycle and respond as in DC. ② ωτ ≫ 1 (high frequency): σ ≈ iσ₀/(ωτ) — purely imaginary: the current runs 90° out of phase, responding inertially without scattering (lossless oscillation). This crossover underlies the plasma frequency and optical reflectivity of metals. (As ω→0, (1−e^(−iωt))/iω → t recovers the DC result.)",
    },
  ];

  return (
    <Card>
      <H2>{isKo ? "연습문제 (풀이 토글)" : "Practice Problems (toggle solutions)"}</H2>
      {problems.map((p, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>{p.q}</div>
          <button onClick={() => toggle(i)} style={{ ...btnStyle(open[i]), marginTop: 10 }}>
            {open[i] ? (isKo ? "풀이 숨기기" : "Hide solution") : (isKo ? "풀이 보기" : "Show solution")}
          </button>
          {open[i] && (
            <div style={{
              marginTop: 10, padding: "12px 14px",
              background: "rgba(16,185,129,0.07)",
              border: `1px solid ${C.ok}44`, borderRadius: 8,
              fontSize: 13, lineHeight: 1.85, color: C.text,
            }}>{p.a}</div>
          )}
        </div>
      ))}
    </Card>
  );
}

// =============================================================
// TAB 9 — RAW CODES
// =============================================================
function RawCodes({ lang }) {
  const isKo = lang === "ko";
  const [topic, setTopic] = useState("drude");
  const [language, setLanguage] = useState("python");

  const codes = useMemo(() => ({
    drude: {
      python: { filename: "wk02_drude_mc.py", code: PY_DRUDE },
      matlab: { filename: "wk02_drude_mc.m", code: ML_DRUDE },
      julia: { filename: "wk02_drude_mc.jl", code: JL_DRUDE },
      cpp: { filename: "wk02_drude_mc.cpp", code: CPP_DRUDE },
    },
    phonon: {
      python: { filename: "wk02_phonon_dispersion.py", code: PY_PHONON },
      matlab: { filename: "wk02_phonon_dispersion.m", code: ML_PHONON },
      julia: { filename: "wk02_phonon_dispersion.jl", code: JL_PHONON },
      cpp: { filename: "wk02_phonon_dispersion.cpp", code: CPP_PHONON },
    },
    wf: {
      python: { filename: "wk02_wiedemann_franz.py", code: PY_WF },
      matlab: { filename: "wk02_wiedemann_franz.m", code: ML_WF },
      julia: { filename: "wk02_wiedemann_franz.jl", code: JL_WF },
      cpp: { filename: "wk02_wiedemann_franz.cpp", code: CPP_WF },
    },
    planck: {
      python: { filename: "wk02_planck_stefan.py", code: PY_PLANCK },
      matlab: { filename: "wk02_planck_stefan.m", code: ML_PLANCK },
      julia: { filename: "wk02_planck_stefan.jl", code: JL_PLANCK },
      cpp: { filename: "wk02_planck_stefan.cpp", code: CPP_PLANCK },
    },
  }), []);

  const item = codes[topic][language];

  const download = () => {
    const blob = new Blob([item.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = () => { navigator.clipboard?.writeText(item.code); };

  return (
    <>
      <Card>
        <H2>{isKo ? "다운로드 가능한 실습 코드" : "Downloadable Practice Code"}</H2>
        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          {isKo
            ? "동일한 알고리즘을 4가지 언어로 제공합니다. 본인의 환경에 맞춰 다운로드 후 실행해 보세요."
            : "The same algorithms in 4 languages. Download the file matching your environment."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {Object.entries({
            drude: isKo ? "Drude Monte-Carlo" : "Drude Monte-Carlo",
            phonon: isKo ? "포논 분산관계" : "Phonon dispersion",
            wf: isKo ? "Wiedemann–Franz 검증" : "Wiedemann–Franz check",
            planck: isKo ? "Planck → Stefan–Boltzmann" : "Planck → Stefan–Boltzmann",
          }).map(([k, lbl]) => (
            <button key={k} onClick={() => setTopic(k)} style={btnStyle(topic === k)}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[["python", "Python"], ["matlab", "MATLAB"], ["julia", "Julia"], ["cpp", "C++"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setLanguage(k)} style={btnStyle(language === k)}>{lbl}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "monospace", color: C.accentSoft, fontSize: 13 }}>{item.filename}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={copy} style={btnStyle(false)}>📋 Copy</button>
            <button onClick={download} style={btnStyle(false)}>⬇ {isKo ? "다운로드" : "Download"}</button>
          </div>
        </div>
        <pre style={{
          background: "#0d1220",
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 16,
          overflowX: "auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#d1d5db",
          maxHeight: 560,
        }}>{item.code}</pre>
      </Card>
    </>
  );
}
