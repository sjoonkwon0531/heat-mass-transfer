// Week7App.jsx — Heat & Mass Transfer, Week 7
// MIDTERM REVIEW: the Weeks 1-6 story in one map, formula sheet, interactive
// concept quiz, a guided walkthrough of the 2024 midterm, common pitfalls,
// and a final-day checklist. KR/EN bilingual. Self-contained (React only).

import React, { useState, useMemo, useCallback } from "react";

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
  goodPale: "#e8f2ea",
  warn: "#a04024",
  warnPale: "#f9e8e2",
};

const font = "'Pretendard', 'Noto Sans KR', -apple-system, 'Segoe UI', sans-serif";
const mono = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/* ---------------------------------- tiny UI atoms ---------------------------------- */
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
      margin: block ? "8px 0" : 0, fontSize: block ? 15.5 : "inherit", color: C.ink,
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

/* ---------------------------------- Tab 1: Overview ---------------------------------- */
function TabOverview({ t }) {
  return (
    <div>
      <Panel title={t("중간고사 안내", "About the midterm")}>
        <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>{t("범위: 1–6주차 전체 (전도 · 열방정식 · 대류 · 상변화 · 해법(FFT) · 밀폐유동)", "Scope: Weeks 1–6 (conduction · the heat equation · convection · phase change · solution methods (FFT) · confined flows)")}</li>
          <li>{t("형식: 영문 스토리형 서술 문제 + 새끼문제 (2024 기출과 같은 형식 — '기출 워크스루' 탭 참조)", "Format: story-type problems in English with sub-questions (same format as the 2024 exam — see the Walkthrough tab)")}</li>
          <li>{t("답안은 영어로 작성; 계산기·엑셀·매트랩 사용 가능(필수 아님); 모든 자료 참고 가능(오픈북)", "Answers in English; calculator/Excel/MATLAB allowed (not required); open-book")}</li>
          <li>{t("전자기기 연결 금지 · 상호 논의 금지 · 문제/답안 촬영 금지 (Honor code)", "No internet-connected devices · no discussion · no photographing (honor code)")}</li>
        </ul>
      </Panel>

      <Panel title={t("오픈북 시험 공부 전략", "How to study for an open-book exam")}>
        <p style={{ fontSize: 14, lineHeight: 1.7 }}>
          {t(
            "오픈북은 '찾는 시험'이 아니라 '아는 시험'입니다. 시험장에서 자료를 뒤질 시간은 없습니다 — 자료는 숫자(물성, 상수)를 확인하는 용도이고, 풀이의 뼈대는 머리에 있어야 합니다. 효율적인 순서:",
            "Open-book is a knowing exam, not a searching exam. There is no time to browse: materials are for looking up numbers (properties, constants); the skeleton of every solution must already be in your head. An efficient order:"
          )}
        </p>
        <ol style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: "6px 0" }}>
          <li>{t("'개념 지도' 탭으로 전체 서사를 복원한다 (무엇이 무엇으로 이어지는가)", "Rebuild the story with the Concept-map tab (what leads to what)")}</li>
          <li>{t("'공식 시트' 탭에서 각 공식의 사용 조건을 함께 외운다 — 공식만 알고 조건을 모르면 오픈북에서도 틀린다", "Learn each formula with its validity condition (Formulas tab) — knowing a formula without its condition is how open-book exams are failed")}</li>
          <li>{t("'개념 퀴즈'를 풀어 구멍을 찾는다 (16문항, 즉시 해설)", "Find your gaps with the 16-question concept quiz (instant explanations)")}</li>
          <li>{t("'기출 워크스루'로 2024년 실제 문제를 단계별로 재현해 본다 — 보기 전에 스스로 먼저!", "Re-derive the actual 2024 problems with the Walkthrough tab — try before you peek!")}</li>
          <li>{t("시험 전날 '실수 모음'과 '체크리스트'로 마무리", "Finish with Pitfalls and the Checklist the day before")}</li>
        </ol>
        <Note>
          {t(
            "모든 주차 모듈(1–6주차)은 그대로 열려 있습니다. 약한 주제를 발견하면 해당 주차의 시뮬레이션으로 돌아가 감각을 복원하세요.",
            "All weekly modules (Weeks 1–6) stay open. When you find a weak topic, go back to that week's simulations and rebuild the intuition."
          )}
        </Note>
      </Panel>
    </div>
  );
}

/* ---------------------------------- Tab 2: Concept map ---------------------------------- */
function TabConceptMap({ t }) {
  const groups = [
    {
      name: t("무차원수 — 시험의 절반은 이 표에서 나온다", "Dimensionless groups — half the exam lives in this table"),
      rows: [
        ["Bi = hL/k_solid", t("고체 내부 전도저항 / 표면 대류저항. Bi < 0.1 → 집중용량법", "solid conduction vs surface convection. Bi < 0.1 → lumped model"), "W4"],
        ["Fo = αt/L²", t("무차원 시간. Fo ≳ 0.2 → 1항 근사(Heisler)", "dimensionless time. Fo ≳ 0.2 → one-term (Heisler) regime"), "W4"],
        ["Re = vL/ν", t("관성/점성 — 층류·난류 판정 (평판 5×10⁵, 관 2300)", "inertia vs viscosity — laminar/turbulent (plate 5×10⁵, pipe 2300)"), "W5"],
        ["Pr = ν/α", t("운동량/열 확산 — δ/δt ≈ Pr^⅓ (층류)", "momentum vs heat diffusion — δ/δt ≈ Pr^⅓ (laminar)"), "W5"],
        ["Nu = hL/k_fluid", t("유체 내 전도/대류 저항 — '답'. Bi와 혼동 금지!", "conduction vs convection inside the fluid — the answer. Never confuse with Bi!"), "W5"],
        ["Pe = vL/α = RePr", t("대류 수송/확산 수송 (물질: ReSc)", "convective vs diffusive transport (mass: ReSc)"), "W1·5"],
        ["Gr = βΔTgL³/ν²", t("부력/점성 — 자연대류의 Re 역할", "buoyancy vs viscous — natural convection's Re"), "W5"],
        ["St = Nu/(RePr)", t("실제 전달/수송 용량", "actual transfer vs carrying capacity"), "W5"],
      ],
    },
    {
      name: t("주차별 한 줄 요약", "One line per week"),
      rows: [
        ["Week 1", t("운동량·열·물질은 같은 수학(구배 → 플럭스)을 공유한다", "momentum, heat and mass share one mathematics (gradient → flux)"), ""],
        ["Week 2", t("k의 미시적 기원: 전자(Wiedemann–Franz)·포논·기체", "the microscopic origin of k: electrons (Wiedemann–Franz), phonons, gases"), ""],
        ["Week 3", t("정상 전도 = 열저항 회로; BC가 해를 결정한다", "steady conduction = resistance circuits; BCs decide the solution"), ""],
        ["Week 4", t("비정상 전도: 곡률이 온도를 바꾼다; t ~ L²/α; Bi·Fo가 지배", "transients: curvature drives change; t ~ L²/α; Bi and Fo rule"), ""],
        ["Week 5", t("대류 = 경계층의 전도; Nu = f(Re, Pr); 0.332가 모든 것을 연다", "convection = conduction through the boundary layer; Nu = f(Re, Pr); 0.332 opens everything"), ""],
        ["Week 6", t("FFT로 PDE→ODE; 상변화는 h의 챔피언; Graetz → 3.66의 기원", "FFT turns PDEs into ODEs; phase change is the h champion; Graetz → where 3.66 comes from"), ""],
      ],
    },
  ];

  return (
    <div>
      <Panel title={t("여섯 주의 서사: 한 문장", "The six-week story in one sentence")}>
        <p style={{ fontSize: 14.5, lineHeight: 1.8 }}>
          {t(
            "구배가 플럭스를 만들고(1주), 물질이 k를 정하고(2주), 저항이 직렬로 더해지고(3주), 시간이 들어오면 L²/α가 시계가 되고(4주), 흐름이 생기면 경계층이 h를 정하고(5주), 이 모든 것이 하나의 해법 체계(FFT)와 상변화·밀폐유동의 실전으로 수렴한다(6주).",
            "Gradients make fluxes (W1), materials set k (W2), resistances add in series (W3), time enters with the clock L²/α (W4), flow hands h to the boundary layer (W5), and everything converges into one solution framework (FFT) plus the practice of phase change and confined flows (W6)."
          )}
        </p>
      </Panel>
      {groups.map((g, gi) => (
        <Panel key={gi} title={g.name}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560, width: "100%" }}>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? "#faf8f4" : "transparent" }}>
                    <td style={{ border: `1px solid ${C.line}`, padding: "7px 10px", fontFamily: mono, whiteSpace: "nowrap", fontSize: 12.5 }}>{r[0]}</td>
                    <td style={{ border: `1px solid ${C.line}`, padding: "7px 10px" }}>{r[1]}</td>
                    {r[2] !== "" && <td style={{ border: `1px solid ${C.line}`, padding: "7px 10px", color: C.copperDeep, fontWeight: 700, whiteSpace: "nowrap" }}>{r[2]}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
      <Note>
        {t("Nu와 Bi: 같은 생김새(hL/k), 다른 k. Nu의 k는 유체(경계층 안 전도), Bi의 k는 고체(물체 내부). 역대 중간고사에서 가장 자주 출제·오답되는 구분입니다.",
          "Nu vs Bi: same shape (hL/k), different k. Nu uses the fluid's k (conduction inside the boundary layer); Bi uses the solid's. Historically the most-tested and most-missed distinction.")}
      </Note>
    </div>
  );
}

/* ---------------------------------- Tab 3: Formula sheet ---------------------------------- */
function TabFormulas({ t }) {
  const cards = [
    {
      wk: "W3", title: t("열저항 (정상 전도)", "Thermal resistances (steady conduction)"),
      eqs: [
        "R_conv = 1/(hA)    R_slab = L/(kA)    R_cyl = ln(r₂/r₁)/(2πLk)",
        t("Q = ΔT_total / ΣR    (직렬: 저항 합, 온도 강하는 저항에 비례)", "Q = ΔT_total / ΣR    (series: resistances add; ΔT splits in proportion)"),
        t("r_cr = k_ins/h  (원통 임계 단열 반경 — r < r_cr이면 단열이 손실을 늘림)", "r_cr = k_ins/h  (critical radius — for r < r_cr insulation raises the loss)"),
      ],
      cond: t("정상상태 · 1D · 일정 물성. 온도 분포는 'Q 일정'에서 역산.", "Steady · 1-D · constant properties. March temperatures with constant Q."),
    },
    {
      wk: "W3·4", title: t("발열이 있는 전도", "Conduction with generation"),
      eqs: [
        t("평판: ΔT_max = q̇L²/(2k)    원통(와이어): T_c − T_s = q̇R²/(4k)", "slab: ΔT_max = q̇L²/(2k)    cylinder (wire): T_c − T_s = q̇R²/(4k)"),
        t("표면 수지: q̇·V = h·A_s·(T_s − T∞)  →  T_s를 미분방정식 없이 결정", "surface balance: q̇·V = h·A_s·(T_s − T∞)  →  T_s without any ODE"),
      ],
      cond: t("표면 에너지수지 먼저 → 내부 포물선은 그 다음.", "Surface balance first; the internal parabola second."),
    },
    {
      wk: "W4", title: t("집중용량법", "Lumped capacitance"),
      eqs: [
        "θ/θ₀ = exp(−t/τ) = exp(−Bi·Fo)    τ = ρcV/(hA_s)    L_c = V/A_s",
        t("구: L_c = D/6  ·  평판(두께 2L, 양면): L_c = L  ·  원통: R/2", "sphere: L_c = D/6  ·  slab (2L, both faces): L_c = L  ·  cylinder: R/2"),
      ],
      cond: t("유효 조건 Bi = hL_c/k < 0.1 — 반드시 먼저 확인!", "Valid only for Bi = hL_c/k < 0.1 — check first, always!"),
    },
    {
      wk: "W4", title: t("평판 과도 전도 (급수)", "Transient slab (series)"),
      eqs: [
        "Y = (4/π) Σ_{n odd} (1/n)·sin(nπx/L)·exp[−(nπ/2)²Fo],  Fo = αt/(L/2)²",
        t("1항 근사 (Fo ≳ 0.2): Y_c ≈ (4/π)exp[−(π/2)²Fo]  (= Heisler 차트)", "one-term (Fo ≳ 0.2): Y_c ≈ (4/π)exp[−(π/2)²Fo]  (= the Heisler chart)"),
      ],
      cond: t("양면 온도 고정(Dirichlet) 기준. 대류 BC면 고유값이 δtanδ = Bi로.", "For Dirichlet faces. Convective BCs shift the eigenvalues to δtanδ = Bi."),
    },
    {
      wk: "W4", title: t("반무한 고체", "Semi-infinite solid"),
      eqs: [
        "(T−T₀)/(T_s−T₀) = erfc(η),  η = x/(2√(αt))",
        t("침투깊이 x_d ≈ 2.8√(αt)  ·  표면 열유속 q_s = k(T_s−T₀)/√(παt)", "penetration x_d ≈ 2.8√(αt)  ·  surface flux q_s = k(T_s−T₀)/√(παt)"),
        t("적분법: (1 − x/δ)²,  δ = √(12αt)  (오차 ~4%)", "integral method: (1 − x/δ)²,  δ = √(12αt)  (~4% off)"),
      ],
      cond: t("고유 길이가 없을 때(초기 짧은 시간, 두꺼운 물체). Fo ≪ 1 영역.", "When no length scale exists (early times, thick bodies). The Fo ≪ 1 regime."),
    },
    {
      wk: "W5", title: t("층류 평판 경계층", "Laminar flat-plate boundary layer"),
      eqs: [
        "δ₉₉ ≈ 5x/√Re_x    c_f = 0.664/√Re_x    (Blasius: f″(0) = 0.332)",
        "Nu_x = 0.332·Pr^⅓·√Re_x    ⟨Nu⟩ = 0.664·Pr^⅓·√Re_L  (= 2×국소@L)",
      ],
      cond: t("Re < 5×10⁵, Pr ≳ 0.6. h_x ∝ x^(−1/2): 앞전이 가장 잘 식는다.", "Re < 5×10⁵, Pr ≳ 0.6. h_x ∝ x^(−1/2): the leading edge cools best."),
    },
    {
      wk: "W5·6", title: t("관내 강제대류", "Pipe forced convection"),
      eqs: [
        t("층류 완전발달: Nu = 3.66 (벽온도 일정) / 4.364 (열유속 일정)", "laminar fully developed: Nu = 3.66 (const wall T) / 4.364 (const flux)"),
        t("입구영역(Lévêque): Nu = 1.357(R/z)^⅓Pe^⅓  ·  L_T/R ≈ 0.1Pe", "entrance (Lévêque): Nu = 1.357(R/z)^⅓Pe^⅓  ·  L_T/R ≈ 0.1Pe"),
        "Q = h·A·ΔT_lm,  ΔT_lm = (ΔT_in − ΔT_out)/ln(ΔT_in/ΔT_out)",
      ],
      cond: t("Re < 2300 층류. LMTD는 벽온도 일정 시 에너지수지와 정확히 일치.", "Laminar for Re < 2300. LMTD closes the energy balance exactly for constant wall T."),
    },
    {
      wk: "W6", title: t("FFT 해법 레시피", "The FFT recipe"),
      eqs: [
        t("① BC가 기저를 고른다 (Dirichlet-Dirichlet: √2 sin nπx)", "① BCs choose the basis (Dirichlet-Dirichlet: √2 sin nπx)"),
        t("② ψₙ = ⟨Φₙ, Θ⟩로 투영 → 모드별 ODE (경계항이 비균질 BC를 데려온다)", "② project ψₙ = ⟨Φₙ, Θ⟩ → one ODE per mode (boundary terms carry inhomogeneous BCs)"),
        t("③ 시간문제: exp(−(nπ)²t) 감쇠 · 공간(Laplace): sinh 조합", "③ transient: exp(−(nπ)²t) decay · spatial (Laplace): sinh combinations"),
        t("④ 정상상태 도달 t ≈ 0.3 (단위 L²/D) — exp(−π²·0.3) ≈ 0.05", "④ steady state by t ≈ 0.3 (units L²/D) — exp(−π²·0.3) ≈ 0.05"),
      ],
      cond: t("선형 BVP 전용. 양끝 Neumann이면 상수 모드 → 정상상태가 없을 수 있음.", "Linear BVPs only. Two Neumann ends add the constant mode: steady state may not exist."),
    },
    {
      wk: "W6", title: t("비등·응축", "Boiling & condensation"),
      eqs: [
        "Rohsenow: q ∝ ΔT³/C_sf³  ·  CHF: q_cr = 0.18h_fg ρ_v[gσΔρ/ρ_v²]^¼",
        "Nusselt 응축: h = 0.943[k³g·h′_fg·ρΔρ/(μΔT·L)]^¼,  h′ = h_fg + ⅜c_pΔT",
        t("h_x ∝ x^(−¼) · 원통 0.725 · n-튜브 뱅크: h ∝ n^(−¼)", "h_x ∝ x^(−¼) · cylinder 0.725 · n-tube bank: h ∝ n^(−¼)"),
      ],
      cond: t("응축막 층류 Re_f = 4Γ/μ < 1800 확인. h ~ ΔT^(−¼)지만 q ~ ΔT^(¾).", "Check film Re_f = 4Γ/μ < 1800. h ~ ΔT^(−¼) yet q ~ ΔT^(¾)."),
    },
    {
      wk: "W6", title: t("혼합컵 · 물질전달 직렬저항", "Mixing cup · mass-transfer resistances"),
      eqs: [
        t("C_b ≡ ∫Cv dA / ∫v dA   (밀폐 유동엔 '벌크'가 없다)", "C_b ≡ ∫Cv dA / ∫v dA   (confined flows have no bulk)"),
        t("직렬: N = k_c(C_b−C_i) = k_m(C_i−C_d) → ⟨k⟩ = 2k_ck_m/(k_c+k_m)", "series: N = k_c(C_b−C_i) = k_m(C_i−C_d) → ⟨k⟩ = 2k_ck_m/(k_c+k_m)"),
        "(C_b−C_d)/(C₀−C_d) = exp[−⟨k⟩z/(RU)]  ·  τ = R/⟨k⟩",
      ],
      cond: t("열저항 회로와 완전히 같은 논리 — 작은 계수가 병목.", "Identical logic to thermal circuits — the smaller coefficient is the bottleneck."),
    },
  ];
  const [open, setOpen] = useState(cards.map(() => true));

  return (
    <div>
      <Note>
        {t("각 카드의 마지막 줄(사용 조건)이 핵심입니다. 시험에서 공식 선택을 틀리는 경우의 대부분은 조건 확인 생략에서 나옵니다.",
          "The last line of each card (the validity condition) is the point. Most wrong formula choices on exams come from skipping the condition check.")}
      </Note>
      {cards.map((c, i) => (
        <Panel key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: C.copperDeep, fontFamily: mono, fontSize: 12.5, marginRight: 8 }}>{c.wk}</span>
              {c.title}
            </div>
            <span style={{ color: C.inkSoft }}>{open[i] ? "▾" : "▸"}</span>
          </div>
          {open[i] && (
            <div style={{ marginTop: 10 }}>
              {c.eqs.map((e, j) => (
                <div key={j} style={{ fontFamily: mono, fontSize: 12.8, background: C.copperPale, borderRadius: 8, padding: "8px 12px", margin: "6px 0", overflowX: "auto", whiteSpace: "nowrap" }}>{e}</div>
              ))}
              <div style={{ fontSize: 13, color: C.warn, marginTop: 6 }}>⚠ {c.cond}</div>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---------------------------------- Tab 4: Quiz ---------------------------------- */
function TabQuiz({ t }) {
  const questions = [
    {
      wk: "W1", q: t("Péclet 수가 큰 유동에서 지배적인 에너지 수송은?", "In a high-Péclet flow, the dominant energy transport is"),
      opts: [t("분자 확산", "molecular diffusion"), t("대류(흐름에 실려서)", "convection (carried by the flow)"), t("복사", "radiation")],
      a: 1,
      ex: t("Pe = 대류/확산. Pe ≫ 1이면 열은 흐름에 실려 이동하고 확산은 경계층 안에서만 중요해집니다.", "Pe = convection/diffusion. For Pe ≫ 1 heat rides the flow; diffusion matters only inside boundary layers."),
    },
    {
      wk: "W2", q: t("금속에서 열전도와 전기전도가 비례하는(Wiedemann–Franz) 이유는?", "Why are thermal and electrical conduction proportional in metals (Wiedemann–Franz)?"),
      opts: [t("둘 다 포논이 운반해서", "phonons carry both"), t("둘 다 자유전자가 운반해서", "free electrons carry both"), t("우연의 일치", "coincidence")],
      a: 1,
      ex: t("같은 자유전자가 전하와 에너지를 함께 나릅니다 — κ/σ = LT.", "The same free electrons carry charge and energy — κ/σ = LT."),
    },
    {
      wk: "W3", q: t("직렬 열저항 3개(0.02, 0.2, 0.0004 m²K/W) 중 벽 성능을 바꾸려면 어디를 공략해야 하나?", "Three series resistances (0.02, 0.2, 0.0004 m²K/W): which one controls the wall?"),
      opts: ["0.02", "0.2", "0.0004"],
      a: 1,
      ex: t("직렬에서는 최대 저항이 지배합니다. 작은 저항을 아무리 줄여도 전체는 거의 변하지 않습니다.", "In series the largest resistance rules; shrinking a small one changes almost nothing."),
    },
    {
      wk: "W3", q: t("가는 전선(r₀ < k/h)에 피복을 입히면 열손실은?", "Insulating a thin wire (r₀ < k/h) makes the heat loss"),
      opts: [t("감소한다", "decrease"), t("증가할 수 있다", "possibly increase"), t("변화 없다", "stay the same")],
      a: 1,
      ex: t("임계 반경 r_cr = k/h까지는 바깥 표면적 증가(대류 저항 감소)가 전도 저항 증가를 이겨 손실이 늘어납니다.", "Up to r_cr = k/h the growing outer area (falling convective resistance) beats the added conduction resistance."),
    },
    {
      wk: "W4", q: t("Bi = 0.05인 구를 유체에 담갔다. 내부 온도 분포는?", "A sphere with Bi = 0.05 is quenched. Its internal temperature profile is"),
      opts: [t("중심이 훨씬 뜨거운 가파른 분포", "steep, center much hotter"), t("거의 균일 (등온)", "nearly uniform (isothermal)"), t("표면만 유체 온도", "only the surface at fluid T")],
      a: 1,
      ex: t("Bi < 0.1: 내부 전도가 표면 대류보다 훨씬 빨라 물체 전체가 한 온도로 움직입니다 → 집중용량법.", "Bi < 0.1: internal conduction far outruns surface convection, so the whole body moves as one temperature → lumped model."),
    },
    {
      wk: "W4", q: t("감자 지름을 2배로 하면 익는 시간은 대략?", "Double a potato's diameter; the cooking time roughly"),
      opts: [t("2배", "doubles"), t("4배", "quadruples"), t("8배", "×8")],
      a: 1,
      ex: t("확산 시간 t ~ L²/α — 길이의 제곱. 이 스케일링 하나가 4주차의 절반입니다.", "Diffusion time t ~ L²/α — the square of the length. This one scaling is half of Week 4."),
    },
    {
      wk: "W4", q: t("반무한체에서 온도 교란의 침투깊이는 시간에 대해?", "In a semi-infinite solid the penetration depth grows like"),
      opts: ["∝ t", "∝ √t", "∝ t²"],
      a: 1,
      ex: t("x_d ≈ 2.8√(αt). 표면 열유속은 반대로 1/√t로 감소합니다.", "x_d ≈ 2.8√(αt); the surface flux decays as 1/√t."),
    },
    {
      wk: "W4", q: t("명시적 FDM(s = Δτ/Δr²)이 발산하지 않을 조건은?", "The explicit FDM (s = Δτ/Δr²) stays stable when"),
      opts: ["s ≤ 1", "s ≤ 1/2", "s ≤ 2"],
      a: 1,
      ex: t("s > 1/2이면 노드가 이웃 평균을 '지나쳐' 진동 발산 — 대각 성분 1−2s가 음수가 되는 순간입니다.", "For s > 1/2 a node overshoots its neighbors' mean and oscillates — the diagonal 1−2s has gone negative."),
    },
    {
      wk: "W5", q: t("Pr ≫ 1인 오일에서 두 경계층의 관계는?", "In a Pr ≫ 1 oil, the two boundary layers satisfy"),
      opts: ["δ ≪ δt", "δ ≫ δt", "δ = δt"],
      a: 1,
      ex: t("δ/δt ≈ Pr^⅓: 운동량이 열보다 훨씬 멀리 확산 → 열경계층이 벽에 얇게 붙습니다.", "δ/δt ≈ Pr^⅓: momentum diffuses farther than heat, so the thermal layer hugs the wall."),
    },
    {
      wk: "W5", q: t("Nu = 10, k_air = 0.026, k_Cu = 390인 구리 구슬. Bi는?", "A copper bead with Nu = 10, k_air = 0.026, k_Cu = 390. Its Bi is"),
      opts: [t("10 (Nu와 같다)", "10 (same as Nu)"), t("~7×10⁻⁴ (전혀 다르다)", "~7×10⁻⁴ (completely different)"), t("계산 불가", "cannot tell")],
      a: 1,
      ex: t("Bi = Nu·(k_fluid/k_solid) = 10×0.026/390. 같은 hL 꼴이지만 분모의 k가 다릅니다 — 시험 단골.", "Bi = Nu·(k_fluid/k_solid) = 10×0.026/390. Same hL shape, different k — an exam classic."),
    },
    {
      wk: "W5", q: t("평판에서 난류 천이 후 h가 유속에 더 민감해지는 이유는?", "After transition on a plate, h becomes more speed-sensitive because"),
      opts: [t("Nu ∝ Re^0.5 → Re^0.8", "Nu ∝ Re^0.5 → Re^0.8"), t("Pr가 커져서", "Pr increases"), t("k가 커져서", "k increases")],
      a: 0,
      ex: t("난류 에디가 분자 확산을 대체 — 0.664√Re에서 0.037Re^0.8으로. 지수가 올라갑니다.", "Turbulent eddies replace molecular diffusion — from 0.664√Re to 0.037Re^0.8; the exponent climbs."),
    },
    {
      wk: "W5·6", q: t("긴 관(완전발달, 벽온도 일정)에서 Nu가 수렴하는 값은?", "In a long pipe (fully developed, constant wall T), Nu settles at"),
      opts: ["0.332", "3.66", "0.664"],
      a: 1,
      ex: t("Graetz 최저 고유값에서 λ₁²/2 = 3.656 (공학값 3.66). 열유속 일정이면 4.364.", "From the lowest Graetz eigenvalue, λ₁²/2 = 3.656 (engineering 3.66); 4.364 for constant flux."),
    },
    {
      wk: "W6", q: t("FFT에서 기저함수 Φₙ을 고르는 기준은?", "In the FFT method, the basis Φₙ is chosen by"),
      opts: [t("초기조건", "the initial condition"), t("동차(균질) 경계조건", "the homogeneous boundary conditions"), t("소스 항", "the source term")],
      a: 1,
      ex: t("동차 BC 쌍이 고유함수를 결정합니다 (Dirichlet-Dirichlet → sin). 비균질 BC·소스는 투영 후 ODE의 우변·경계값으로 들어갑니다.", "The homogeneous BC pair fixes the eigenfunctions (Dirichlet-Dirichlet → sines); inhomogeneous BCs and sources enter the per-mode ODE after projection."),
    },
    {
      wk: "W6", q: t("비등 곡선에서 임계열유속(CHF)을 열유속 제어로 넘기면?", "Crossing the CHF under heat-flux control causes"),
      opts: [t("ΔT가 조금 상승", "a small ΔT rise"), t("막비등 가지로 점프 — burn-out", "a jump to the film branch — burn-out"), t("열유속 감소", "a drop in q")],
      a: 1,
      ex: t("같은 q를 내는 다음 가지는 수백 K 떨어진 막비등 — 가열면이 녹습니다. CHF 여유 확보가 설계의 핵심.", "The next branch carrying that q is film boiling, hundreds of K away — the heater melts. Designing margin below CHF is the point."),
    },
    {
      wk: "W6", q: t("Nusselt 응축막에서 벽을 더 차갑게(ΔT↑) 하면 h는?", "In Nusselt condensation, a colder wall (larger ΔT) makes h"),
      opts: [t("증가", "increase"), t("감소 (∝ ΔT^(−¼))", "decrease (∝ ΔT^(−¼))"), t("불변", "unchanged")],
      a: 1,
      ex: t("막이 두꺼워져 h는 줄지만 q = hΔT는 ΔT^¾로 여전히 증가합니다.", "The film thickens so h falls, yet q = hΔT still grows as ΔT^¾."),
    },
    {
      wk: "W6", q: t("사인 급수로 계단함수를 그릴 때 항수를 늘리면 오버슈트는?", "Adding terms to a sine series of a step function makes the overshoot"),
      opts: [t("0으로 수렴", "vanish"), t("크기 유지, 폭만 좁아짐 (Gibbs)", "keep its height, only narrow (Gibbs)"), t("커짐", "grow")],
      a: 1,
      ex: t("Gibbs 현상: 오버슈트 높이(점프의 ~9%)는 불변, 경계로 몰릴 뿐입니다.", "Gibbs: the overshoot height (~9% of the jump) never decays; it only squeezes toward the jump."),
    },
  ];

  const [answers, setAnswers] = useState(questions.map(() => null));
  const score = answers.filter((a, i) => a === questions[i].a).length;
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div>
      <Panel title={t("개념 체크 — 16문항", "Concept check — 16 questions")}>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 8 }}>
          {t("답을 고르면 즉시 해설이 열립니다. 점수보다 해설이 목적입니다.", "Pick an answer and the explanation opens. The explanations, not the score, are the point.")}
        </div>
        <div style={{
          fontFamily: mono, fontSize: 14, fontWeight: 700, padding: "8px 14px", borderRadius: 8,
          background: answered === questions.length ? (score >= 13 ? C.goodPale : C.warnPale) : C.coolPale,
          display: "inline-block", marginBottom: 6,
        }}>
          {score} / {answered} {t("정답", "correct")} ({questions.length}{t("문항 중", " total")})
        </div>
      </Panel>
      {questions.map((qq, i) => {
        const picked = answers[i];
        return (
          <Panel key={i}>
            <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              <span style={{ color: C.copperDeep, fontFamily: mono, fontSize: 12.5, marginRight: 8 }}>{qq.wk}</span>
              <b>Q{i + 1}.</b> {qq.q}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {qq.opts.map((o, j) => {
                let bg = "#fff", bd = C.line, col = C.ink;
                if (picked !== null) {
                  if (j === qq.a) { bg = C.goodPale; bd = C.good; col = C.good; }
                  else if (j === picked) { bg = C.warnPale; bd = C.warn; col = C.warn; }
                }
                return (
                  <button key={j}
                    onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                    style={{
                      padding: "8px 14px", fontSize: 13.5, fontFamily: font, cursor: "pointer",
                      borderRadius: 8, border: `1.5px solid ${bd}`, background: bg, color: col,
                      fontWeight: picked !== null && j === qq.a ? 700 : 400,
                    }}>
                    {o}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div style={{
                marginTop: 10, fontSize: 13.5, lineHeight: 1.7, padding: "10px 12px", borderRadius: 8,
                background: picked === qq.a ? C.goodPale : C.warnPale,
                borderLeft: `3px solid ${picked === qq.a ? C.good : C.warn}`,
              }}>
                {picked === qq.a ? t("정답! ", "Correct! ") : t("오답 — ", "Not quite — ")}{qq.ex}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Tab 5: 2024 walkthrough ---------------------------------- */
function TabWalkthrough({ t }) {
  const problems = [
    {
      title: t("2024 P1 (11점) — 평판 과도 전도를 FFT로", "2024 P1 (11 pts) — Transient slab by FFT"),
      setup: t(
        "열교환기용 얇은 평판(두께 L)이 t = 0에 뜨거운 저장조(T_h)와 차가운 저장조(T_c = 초기온도)에 끼워진다. 두께 방향 온도의 시간 변화를 구하라. (1.1) 무차원 지배식·BC → (1.2) 급수 전개의 Φₙ 결정 → (1.3) Φₙ을 곱해 적분, ψₙ(t)의 ODE와 해 → (1.4) 전체 해 → (1.5) 긴 시간 후의 해.",
        "A thin heat-exchanger plate (thickness L) is placed at t = 0 between a hot reservoir (T_h) and a cold one (T_c = initial temperature). Find T(x,t). (1.1) dimensionless equation & BCs → (1.2) pick Φₙ for the expansion → (1.3) multiply by Φₙ, integrate: the ODE and solution for ψₙ(t) → (1.4) assemble → (1.5) long-time limit.",
      ),
      steps: [
        t("무차원화: Θ = (T−T_c)/(T_h−T_c), x̄ = x/L, τ = αt/L² → Θ_τ = Θ_x̄x̄, Θ(0,τ)=1, Θ(1,τ)=0, Θ(x̄,0)=0. 6주차 '과도 막' 문제와 완전히 동일한 구조입니다.",
          "Nondimensionalize: Θ = (T−T_c)/(T_h−T_c), x̄ = x/L, τ = αt/L² → Θ_τ = Θ_x̄x̄ with Θ(0,τ)=1, Θ(1,τ)=0, Θ(x̄,0)=0 — exactly Week 6's transient-membrane problem."),
        t("비균질 BC 처리: 정상해 Θ_ss = 1 − x̄를 빼면 나머지가 동차 BC → Φₙ = √2 sin(nπx̄) (직교정규).",
          "Handle the inhomogeneous BC: subtract the steady part Θ_ss = 1 − x̄; the remainder has homogeneous BCs → Φₙ = √2 sin(nπx̄)."),
        t("투영: dψₙ/dτ + (nπ)²ψₙ = √2nπ (경계항), ψₙ(0) = 0 → ψₙ = (√2/nπ)[1 − exp(−(nπ)²τ)].",
          "Project: dψₙ/dτ + (nπ)²ψₙ = √2nπ (from the boundary term), ψₙ(0) = 0 → ψₙ = (√2/nπ)[1 − exp(−(nπ)²τ)]."),
        t("조립: Θ = (1−x̄) − 2Σ exp(−(nπ)²τ)·sin(nπx̄)/(nπ). 긴 시간 후: 지수항이 모두 죽고 Θ → 1 − x̄ (선형 정상 분포).",
          "Assemble: Θ = (1−x̄) − 2Σ exp(−(nπ)²τ)·sin(nπx̄)/(nπ). Long time: every exponential dies and Θ → 1 − x̄, the linear steady profile."),
      ],
      moral: t("교훈: '정상해 + 감쇠 급수' 구조를 먼저 보면 절반은 끝난 것. 가장 느린 모드 exp(−π²τ)가 수렴 속도를 정합니다 (τ ≈ 0.3에서 95%).",
        "Moral: see the 'steady + decaying series' structure first and half the work is done. The slowest mode exp(−π²τ) sets the approach (95% by τ ≈ 0.3)."),
    },
    {
      title: t("2024 P2 (8점) — 지하 수도관과 반무한체", "2024 P2 (8 pts) — Underground aqueduct & the semi-infinite ground"),
      setup: t(
        "겨울 기온 253 K, 초기 지반 293 K. 30일 동안 물(273 K)이 얼지 않을 최소 매설 깊이는? (2.1) erf 해로 → (2.2) 침투깊이 근사로 비교 → (2.3) α가 시간에 따라 변하면?",
        "Winter air at 253 K, ground initially 293 K. Minimum burial depth so the water (273 K) does not freeze within 30 days? (2.1) exact erf solution → (2.2) compare with the penetration-depth shortcut → (2.3) what if α varies in time?",
      ),
      steps: [
        t("냉각 문제로 쓰기: (T−T_s)/(T₀−T_s) = erf(η). 273 K 조건 → (273−253)/(293−253) = 0.5 = erf(η) → η ≈ 0.48 (erf 표).",
          "Write it as a cooling problem: (T−T_s)/(T₀−T_s) = erf(η). The 273 K condition gives (273−253)/(293−253) = 0.5 = erf(η) → η ≈ 0.48."),
        t("깊이로 환산: x_min = 2η√(αt). t = 30일 = 2.59×10⁶ s를 초로 바꾸는 것을 잊지 말 것!",
          "Convert: x_min = 2η√(αt), with t = 30 days = 2.59×10⁶ s — do not forget the unit conversion!"),
        t("침투깊이 비교: x_d ≈ 2.8√(αt)는 '교란이 5% 도달'한 깊이 — 동결 기준(50% 변화)보다 훨씬 깊은 보수적 추정이 나옵니다. 두 기준의 차이를 설명할 수 있어야 합니다.",
          "Penetration-depth check: x_d ≈ 2.8√(αt) marks the 5%-change front, deeper (more conservative) than the 50%-change freezing criterion. Be ready to explain the difference."),
        t("α(t)인 경우: η = x/(2√(∫α dt))로 일반화 — √(αt)의 자리에 누적 확산량이 들어갑니다.",
          "Time-varying α: generalize to η = x/(2√(∫α dt)) — the accumulated diffusion replaces αt."),
      ],
      moral: t("교훈: erf 문제는 ① 무차원비 계산 ② erf 역산 ③ 단위 환산, 세 단계가 전부입니다. 가열/냉각 방향에 따라 erf와 erfc를 혼동하지 않는 것이 관건.",
        "Moral: every erf problem is three moves: form the ratio, invert erf, convert units. The trap is mixing up erf and erfc between heating and cooling."),
    },
    {
      title: t("2024 P3 (12점) — 경계층 적분법으로 Nu 만들기", "2024 P3 (12 pts) — Building Nu with the integral method"),
      setup: t(
        "열성 윤활유의 경계층 해석. (3.1) Pr의 의미 → (3.2) 3차 다항 속도 프로파일의 계수 결정(A, B, C) → (3.3) 벽 전단응력 → (3.4) 운동량 수지로 δ(x) ∝ x/√Re_x → (3.5) 같은 프로파일을 열경계층에 적용해 h_x와 Nu_x.",
        "Boundary-layer analysis of a thermal lubricant. (3.1) meaning of Pr → (3.2) fix the cubic velocity profile constants (A, B, C) from BCs → (3.3) wall shear → (3.4) momentum balance gives δ(x) ∝ x/√Re_x → (3.5) reuse the profile for the thermal layer: h_x and Nu_x.",
      ),
      steps: [
        t("프로파일 계수: no-slip(벽에서 0), 가장자리에서 v = v∞, 가장자리에서 기울기 0 — 세 조건이 A, B, C를 전부 결정합니다 (결과: 3/2, 0, −1/2 꼴).",
          "Profile constants: no-slip at the wall, v = v∞ at the edge, zero slope at the edge — three conditions pin A, B, C (the 3/2, 0, −1/2 cubic)."),
        t("벽 전단: τ_w = μ(∂v/∂y)|₀ = (3/2)μv∞/δ — 프로파일을 미분만 하면 됩니다.",
          "Wall shear: τ_w = μ(∂v/∂y)|₀ = (3/2)μv∞/δ — just differentiate the profile."),
        t("운동량 적분 수지에 τ_w를 넣으면 δdδ ∝ (ν/v∞)dx → δ ∝ √(νx/v∞), 즉 δ/x = C/√Re_x.",
          "Insert τ_w into the momentum-integral balance: δdδ ∝ (ν/v∞)dx → δ ∝ √(νx/v∞), i.e., δ/x = C/√Re_x."),
        t("열로 복제: 같은 3차 프로파일을 온도에 쓰면 h_x = k·(3/2)/δt, 그리고 δt = δ·Pr^(−⅓)을 쓰면 Nu_x = 0.36·Pr^⅓√Re_x — 정확해(0.332)와 8% 차이.",
          "Clone for heat: the same cubic in temperature gives h_x = (3/2)k/δt; with δt = δ·Pr^(−⅓), Nu_x = 0.36·Pr^⅓√Re_x — 8% from the exact 0.332."),
      ],
      moral: t("교훈: 적분법은 '프로파일 가정 → BC로 계수 → 수지식 → 두께 성장'의 4단 루틴입니다. Blasius를 못 외워도 이 루틴이면 Nu의 스케일링 전체가 나옵니다.",
        "Moral: the integral method is a four-step routine: assume profile → fix constants by BCs → balance → thickness growth. No memorized Blasius needed to recover the full Nu scaling."),
    },
  ];
  const [open, setOpen] = useState(problems.map(() => false));

  return (
    <div>
      <Note>
        {t("2024년 실제 중간고사 3문제의 뼈대입니다. 반드시 '풀이 열기' 전에 설정만 보고 스스로 복원해 보세요 — 시험장에서 하게 될 일과 똑같은 연습입니다.",
          "The skeletons of the three actual 2024 midterm problems. Reconstruct each from the setup before opening the steps — it is exactly what you will do in the exam room.")}
      </Note>
      {problems.map((p, i) => (
        <Panel key={i} title={p.title}>
          <p style={{ fontSize: 14, lineHeight: 1.75 }}>{p.setup}</p>
          <button onClick={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))} style={btnStyle(open[i])}>
            {open[i] ? t("풀이 접기", "Hide steps") : t("풀이 열기", "Show steps")}
          </button>
          {open[i] && (
            <div style={{ marginTop: 10 }}>
              <ol style={{ fontSize: 14, lineHeight: 1.85, paddingLeft: 20, margin: "6px 0" }}>
                {p.steps.map((s, j) => <li key={j} style={{ marginBottom: 6 }}>{s}</li>)}
              </ol>
              <div style={{ background: C.copperPale, borderRadius: 8, padding: "10px 14px", fontSize: 13.5, lineHeight: 1.7 }}>
                {p.moral}
              </div>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}

/* ---------------------------------- Tab 6: Pitfalls ---------------------------------- */
function TabPitfalls({ t }) {
  const items = [
    {
      bad: t("Nu와 Bi를 같은 것으로 취급", "Treating Nu and Bi as the same number"),
      fix: t("분모의 k를 확인: Nu는 k_fluid(대류 성능의 결과), Bi는 k_solid(lumped 판정 기준).", "Check the k in the denominator: Nu uses k_fluid (the outcome of convection), Bi uses k_solid (the lumped-model test)."),
    },
    {
      bad: t("Bi 확인 없이 집중용량법 사용", "Using the lumped model without checking Bi"),
      fix: t("풀이 첫 줄은 항상 Bi = hL_c/k < 0.1 확인. L_c = V/A_s (구는 D/6)도 자주 틀립니다.", "The first line of the solution is always Bi = hL_c/k < 0.1. L_c = V/A_s (D/6 for a sphere) is a second trap."),
    },
    {
      bad: t("Fo가 작은데 1항 근사(Heisler) 사용", "One-term (Heisler) at small Fo"),
      fix: t("Fo ≳ 0.2에서만. 그 전엔 반무한체(erf)가 올바른 모델입니다 — 두 영역의 경계를 기억할 것.", "Only for Fo ≳ 0.2. Before that the semi-infinite (erf) model is the right one — know where the regimes meet."),
    },
    {
      bad: t("erf와 erfc 혼동 (가열 vs 냉각)", "Mixing up erf and erfc (heating vs cooling)"),
      fix: t("정의로 돌아가기: (T−T₀)/(T_s−T₀) = erfc(η)는 '표면 기준', (T_s−T)/(T_s−T₀) = erf(η)는 그 보수. 경계값(η=0, η→∞) 두 개를 대입해 보면 즉시 검증됩니다.", "Go back to the definition: (T−T₀)/(T_s−T₀) = erfc(η) and its complement. Plugging η = 0 and η → ∞ verifies your choice in five seconds."),
    },
    {
      bad: t("원통 저항에 평판 공식 L/kA 사용", "Using the slab formula L/kA for a cylinder"),
      fix: t("원통은 ln(r₂/r₁)/(2πLk). 면적이 반경에 따라 변하기 때문 — 같은 이유로 임계 반경이 존재합니다.", "Cylinders take ln(r₂/r₁)/(2πLk) because the area grows with radius — the same fact that creates the critical radius."),
    },
    {
      bad: t("단위 환산 누락 (일→초, mm→m, 지름→반지름)", "Dropped unit conversions (days→s, mm→m, D→R)"),
      fix: t("√(αt)류 계산은 단위 실수가 √로 절반만 드러나 더 위험합니다. 모든 수치 대입 전 SI로 통일.", "In √(αt)-type formulas a unit slip shows up only half-size (under the root). Convert everything to SI before plugging in."),
    },
    {
      bad: t("LMTD에서 ΔT_in, ΔT_out을 입·출구 '온도'로 착각", "Reading ΔT_in/ΔT_out in the LMTD as inlet/outlet temperatures"),
      fix: t("둘은 각 끝에서의 '벽-유체 온도차'입니다. 계산 후 Q = ṁc_pΔT와 교차 검산하면 실수가 걸러집니다.", "They are the wall-fluid differences at each end. Cross-check with Q = ṁc_pΔT and the mistake cannot survive."),
    },
    {
      bad: t("급수 해에서 짝수 항까지 더함", "Keeping even-n terms in the series solutions"),
      fix: t("균일 IC·대칭 문제의 계수 [1−(−1)ⁿ]은 짝수 n에서 0. 1항 근사의 '다음 항'은 n = 2가 아니라 n = 3입니다.", "The coefficient [1−(−1)ⁿ] kills even n. The next term after n = 1 is n = 3, not n = 2."),
    },
  ];
  return (
    <div>
      {items.map((it, i) => (
        <Panel key={i}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.warn, marginBottom: 6 }}>✗ {it.bad}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: C.ink }}>→ {it.fix}</div>
        </Panel>
      ))}
    </div>
  );
}

/* ---------------------------------- Tab 7: Checklist ---------------------------------- */
function TabChecklist({ t }) {
  const items = [
    t("무차원수 8개(Bi·Fo·Re·Pr·Nu·Pe·Gr·St)를 정의·의미·판정값까지 말할 수 있다", "I can state all eight groups (Bi·Fo·Re·Pr·Nu·Pe·Gr·St) with definitions, meanings and threshold values"),
    t("열저항 3종(대류·평판·원통)을 쓰고 직렬 회로로 Q와 중간 온도를 구할 수 있다", "I can write the three resistances (convection, slab, cylinder) and march Q and intermediate temperatures through a series circuit"),
    t("임계 단열 반경을 유도할 수 있다 (dR/dr = 0)", "I can derive the critical insulation radius (dR/dr = 0)"),
    t("발열 문제에서 표면 에너지수지로 T_s를 먼저 구하는 순서를 안다", "For generation problems I know to get T_s from the surface balance first"),
    t("집중용량법 풀이를 Bi 확인부터 시작한다", "My lumped-model solutions start with the Bi check"),
    t("반무한체 erf 문제의 3단계(비율→역산→단위)를 연습했다", "I have drilled the three erf moves (ratio → invert → units)"),
    t("FFT 레시피 4단계(기저 선택→투영→모드 ODE→조립)를 백지에 복원할 수 있다", "I can reproduce the four FFT steps (basis → project → per-mode ODE → assemble) on blank paper"),
    t("정상해를 빼서 비균질 BC를 동차로 만드는 기술을 쓸 수 있다", "I can subtract the steady solution to homogenize the BCs"),
    t("평판 층류 Nu(0.332/0.664)와 관내 3.66/4.364의 사용 조건을 구분한다", "I know when 0.332/0.664 (plate) vs 3.66/4.364 (pipe) apply"),
    t("적분법 루틴(프로파일→계수→수지→두께)을 속도·온도 양쪽에 적용할 수 있다", "I can run the integral-method routine for both velocity and temperature"),
    t("LMTD 계산 후 에너지수지로 검산하는 습관이 있다", "I habitually cross-check LMTD results with the energy balance"),
    t("계산기·시계 준비, 답안은 영어로 쓴다는 것 확인", "Calculator and watch ready; answers go in English"),
  ];
  const [done, setDone] = useState(items.map(() => false));
  const n = done.filter(Boolean).length;

  return (
    <div>
      <Panel title={t("시험 전 최종 점검", "Final pre-exam check")}>
        <div style={{
          fontFamily: mono, fontSize: 14, fontWeight: 700, padding: "8px 14px", borderRadius: 8,
          background: n === items.length ? C.goodPale : C.coolPale, display: "inline-block", marginBottom: 10,
        }}>
          {n} / {items.length}
        </div>
        {items.map((it, i) => (
          <label key={i} style={{
            display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 8,
            background: done[i] ? C.goodPale : "transparent", cursor: "pointer", fontSize: 14, lineHeight: 1.6,
            marginBottom: 2,
          }}>
            <input type="checkbox" checked={done[i]}
              onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              style={{ accentColor: C.good, marginTop: 3 }} />
            <span style={{ textDecoration: done[i] ? "line-through" : "none", color: done[i] ? C.inkSoft : C.ink }}>{it}</span>
          </label>
        ))}
        {n === items.length && (
          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: C.goodPale, color: C.good, fontWeight: 700, fontSize: 14 }}>
            {t("준비 완료입니다. 시험장에서는 설정을 읽고, 지배식과 BC를 쓰고, 조건을 확인한 뒤에 공식을 고르세요. 행운을 빕니다!", "You are ready. In the room: read the setup, write the governing equation and BCs, check the conditions, then pick the formula. Good luck!")}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------------------------------- Root ---------------------------------- */
export default function Week7App({ language = "kr", onBack }) {
  const [lang, setLang] = useState(language);
  const [tab, setTab] = useState(0);
  const t = useCallback((kr, en) => (lang === "kr" ? kr : en), [lang]);

  const tabs = [
    { label: t("개요", "Overview"), comp: <TabOverview t={t} /> },
    { label: t("개념 지도", "Concept map"), comp: <TabConceptMap t={t} /> },
    { label: t("공식 시트", "Formulas"), comp: <TabFormulas t={t} /> },
    { label: t("개념 퀴즈", "Quiz"), comp: <TabQuiz t={t} /> },
    { label: t("기출 워크스루", "2024 walkthrough"), comp: <TabWalkthrough t={t} /> },
    { label: t("실수 모음", "Pitfalls"), comp: <TabPitfalls t={t} /> },
    { label: t("체크리스트", "Checklist"), comp: <TabChecklist t={t} /> },
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
                Heat & Mass Transfer · Week 7
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 24, fontWeight: 700 }}>
                {t("중간고사 리뷰", "Midterm Review")}
              </h1>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {t("1–6주차 총정리 — 개념 지도 · 공식 시트 · 16문항 퀴즈 · 2024 기출 워크스루 · 실수 모음 · 체크리스트",
                   "Weeks 1–6 in one place — concept map · formula sheet · 16-question quiz · 2024 walkthrough · pitfalls · checklist")}
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
