// ============================================================
// App.jsx — Heat & Mass Transfer (화공열및물질전달) Hub
// SKKU School of Chemical Engineering — SPMDL
// Prof. S. Joon Kwon — Fall 2026
// ------------------------------------------------------------
// Same "hub + weekly module" pattern as
// Fluid-Mechanics-ChE-Undergrad:
//   ① import WeekNApp  ② weeks.KR / weeks.EN entry  ③ comps registry
// ============================================================
import { useState } from "react";
import Week1App from "./Week1App.jsx";

const C = {
  bg: "#0b0f17",
  panel: "#111827",
  card: "#1f2937",
  border: "#374151",
  text: "#e5e7eb",
  textDim: "#9ca3af",
  accent: "#3b82f6",
};

// ── Week registry ────────────────────────────────────────────
const weeks = {
  KR: [
    {
      id: 1,
      title: "Week 1",
      subtitle: "열 및 물질전달 입문",
      topics: [
        "전달현상(Transport Phenomena)이란?",
        "운동량·열·물질 전달의 유사성 (Newton · Fourier · Fick)",
        "통일된 지배방정식 — 하나의 수학, 세 가지 물리",
        "Random walk — 확산의 분자적 기원",
        "열전달 3모드 (전도·대류·복사)",
        "물질전달 모드 · Peclet 수",
      ],
      color: "#f59e0b",
      ready: true,
    },
    { id: 2,  title: "Week 2",  subtitle: "정상상태 전도",               topics: [], color: "#ef4444", ready: false },
    { id: 3,  title: "Week 3",  subtitle: "비정상상태 전도",             topics: [], color: "#f97316", ready: false },
    { id: 4,  title: "Week 4",  subtitle: "대류 열전달 (PSET #1)",       topics: [], color: "#eab308", ready: false },
    { id: 5,  title: "Week 5",  subtitle: "비등과 응축",                 topics: [], color: "#84cc16", ready: false },
    { id: 6,  title: "Week 6",  subtitle: "화학공학의 열전달 장치",       topics: [], color: "#10b981", ready: false },
    { id: 7,  title: "Week 7",  subtitle: "중간고사 리뷰 & 시험",         topics: [], color: "#14b8a6", ready: false },
    { id: 8,  title: "Week 8",  subtitle: "복사 열전달",                 topics: [], color: "#22d3ee", ready: false },
    { id: 9,  title: "Week 9",  subtitle: "물질전달의 기초",             topics: [], color: "#3b82f6", ready: false },
    { id: 10, title: "Week 10", subtitle: "정상상태 분자확산",           topics: [], color: "#6366f1", ready: false },
    { id: 11, title: "Week 11", subtitle: "비정상상태 분자확산 (PSET #2)", topics: [], color: "#8b5cf6", ready: false },
    { id: 12, title: "Week 12", subtitle: "대류 물질전달",               topics: [], color: "#a78bfa", ready: false },
    { id: 13, title: "Week 13", subtitle: "전도·확산 문제의 해법",        topics: [], color: "#d946ef", ready: false },
    { id: 14, title: "Week 14", subtitle: "심화 1 — 다상 전달 · 반도체 공정", topics: [], color: "#f472b6", ready: false },
    { id: 15, title: "Week 15", subtitle: "심화 2 — 패턴 형성 · 상분리",  topics: [], color: "#fb7185", ready: false },
    { id: 16, title: "Week 16", subtitle: "기말 리뷰 & 시험 (Term Paper)", topics: [], color: "#94a3b8", ready: false },
  ],
  EN: [
    {
      id: 1,
      title: "Week 1",
      subtitle: "Intro to Heat & Mass Transfer",
      topics: [
        "What is Transport Phenomena?",
        "Analogy of momentum · heat · mass transfer (Newton · Fourier · Fick)",
        "One unified governing equation — one math, three physics",
        "Random walk — molecular origin of diffusion",
        "Three modes of heat transfer (conduction · convection · radiation)",
        "Mass transfer modes · Peclet number",
      ],
      color: "#f59e0b",
      ready: true,
    },
    { id: 2,  title: "Week 2",  subtitle: "Steady-state conduction",              topics: [], color: "#ef4444", ready: false },
    { id: 3,  title: "Week 3",  subtitle: "Unsteady-state conduction",            topics: [], color: "#f97316", ready: false },
    { id: 4,  title: "Week 4",  subtitle: "Convective heat transfer (PSET #1)",   topics: [], color: "#eab308", ready: false },
    { id: 5,  title: "Week 5",  subtitle: "Boiling & condensation",               topics: [], color: "#84cc16", ready: false },
    { id: 6,  title: "Week 6",  subtitle: "Heat-transfer equipment in ChemE",     topics: [], color: "#10b981", ready: false },
    { id: 7,  title: "Week 7",  subtitle: "Midterm review & exam",                topics: [], color: "#14b8a6", ready: false },
    { id: 8,  title: "Week 8",  subtitle: "Radiative heat transfer",              topics: [], color: "#22d3ee", ready: false },
    { id: 9,  title: "Week 9",  subtitle: "Fundamentals of mass transfer",        topics: [], color: "#3b82f6", ready: false },
    { id: 10, title: "Week 10", subtitle: "Steady-state molecular diffusion",     topics: [], color: "#6366f1", ready: false },
    { id: 11, title: "Week 11", subtitle: "Unsteady molecular diffusion (PSET #2)", topics: [], color: "#8b5cf6", ready: false },
    { id: 12, title: "Week 12", subtitle: "Convective mass transfer",             topics: [], color: "#a78bfa", ready: false },
    { id: 13, title: "Week 13", subtitle: "Solution methods for conduction & diffusion", topics: [], color: "#d946ef", ready: false },
    { id: 14, title: "Week 14", subtitle: "Advanced 1 — Multiphase · semiconductor processes", topics: [], color: "#f472b6", ready: false },
    { id: 15, title: "Week 15", subtitle: "Advanced 2 — Pattern formation · phase separation", topics: [], color: "#fb7185", ready: false },
    { id: 16, title: "Week 16", subtitle: "Final review & exam (Term Paper due)", topics: [], color: "#94a3b8", ready: false },
  ],
};

// ── Component registry ───────────────────────────────────────
const comps = {
  KR: { 1: Week1App },
  EN: { 1: Week1App },
};

export default function App() {
  const [lang, setLang] = useState("KR");
  const [activeWeek, setActiveWeek] = useState(null);
  const list = weeks[lang];
  const isKo = lang === "KR";

  if (activeWeek != null) {
    const Comp = comps[lang][activeWeek];
    if (Comp) return <Comp onBack={() => setActiveWeek(null)} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0a0e15 100%)`,
      color: C.text,
      fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 20px",
    }}>
      {/* Header */}
      <header style={{
        maxWidth: 1200, margin: "0 auto 24px auto",
        padding: "28px 28px",
        background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(59,130,246,0.06))",
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.textDim, letterSpacing: 2 }}>
            SKKU · SCHOOL OF CHEMICAL ENGINEERING · SPMDL
          </div>
          <h1 style={{ margin: "8px 0 4px 0", fontSize: 30, fontWeight: 800 }}>
            Heat &amp; Mass Transfer
          </h1>
          <div style={{ fontSize: 16, color: C.textDim }}>
            {isKo ? "화공열및물질전달 — 인터랙티브 스터디 컴패니언" : "Interactive Study Companion"}
          </div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 10 }}>
            Prof. S. Joon Kwon · Smart Process &amp; Materials Design Lab (SPMDL)
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["KR", "EN"].map((L) => (
            <button key={L} onClick={() => setLang(L)} style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${lang === L ? C.accent : C.border}`,
              background: lang === L ? "rgba(59,130,246,0.15)" : "transparent",
              color: lang === L ? "#93c5fd" : C.textDim,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>{L === "KR" ? "한국어" : "English"}</button>
          ))}
        </div>
      </header>

      {/* Week cards */}
      <main style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}>
        {list.map((w) => (
          <div
            key={w.id}
            onClick={() => w.ready && setActiveWeek(w.id)}
            style={{
              background: C.panel,
              border: `1px solid ${w.ready ? w.color + "55" : C.border}`,
              borderRadius: 16,
              padding: "20px 22px",
              cursor: w.ready ? "pointer" : "default",
              opacity: w.ready ? 1 : 0.45,
              transition: "transform 0.15s, border-color 0.15s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => { if (w.ready) e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: w.color,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: w.color, letterSpacing: 1 }}>
                {w.title}
              </div>
              {!w.ready && (
                <span style={{ fontSize: 11, color: C.textDim }}>
                  {isKo ? "준비 중" : "Coming soon"}
                </span>
              )}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, margin: "6px 0 10px 0" }}>
              {w.subtitle}
            </div>
            {w.topics.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.textDim, lineHeight: 1.8 }}>
                {w.topics.map((tp, i) => <li key={i}>{tp}</li>)}
              </ul>
            )}
          </div>
        ))}
      </main>

      <footer style={{
        maxWidth: 1200, margin: "28px auto 0 auto",
        padding: "16px 24px", textAlign: "center",
        fontSize: 12, color: C.textDim,
        borderTop: `1px solid ${C.border}`,
      }}>
        © Prof. S. Joon Kwon · SPMDL · SKKU — {isKo
          ? "교육 목적의 인터랙티브 학습 자료입니다. (교재: Welty 7th ed. · Deen 2nd ed. · Holman 10th ed.)"
          : "Interactive learning material for educational use. (Texts: Welty 7th ed. · Deen 2nd ed. · Holman 10th ed.)"}
      </footer>
    </div>
  );
}
