// Screening flow — intake -> screening groups (in content order) -> result.
// The first group with any "yes" assigns its tier and ends screening; if every group is
// all "no", the use case gets the lowest tier.
/* global React, RegistryData, TierPill, useI18n */

const { useState, useEffect, useMemo, useCallback, useRef } = React;

function ScreeningScreen({ initial, onDraftChange, onComplete, onBackToHome }) {
  const { t } = useI18n();
  const groups = RegistryData.screening;
  const resultStage = groups.length + 1;

  // Stage 0 is intake, 1..n are the screening groups, n + 1 is the result.
  const [stage, setStage] = useState(initial?.stage ?? 0);
  const [intake, setIntake] = useState(initial?.intake || { useCaseName: "", operationalArea: "" });
  const [answers, setAnswers] = useState(initial?.answers || {}); // {groupId: {questionId: "yes" | "no"}}

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [stage]);

  // Keep a copy above this screen, so leaving it and coming back loses nothing.
  useEffect(() => {
    onDraftChange({ stage, intake, answers });
  }, [stage, intake, answers]);

  const groupHasYes = (g) => Object.values(answers[g.id] || {}).some((v) => v === "yes");

  // Index of the group that set the tier, or -1 if none has a "yes" yet.
  const decidingIndex = useMemo(() => groups.findIndex(groupHasYes), [answers, groups]);
  const computedTier = decidingIndex >= 0 ? groups[decidingIndex].tier : RegistryData.baseTier;

  // Groups this person actually passes through, for the progress bar.
  const pathGroups = decidingIndex >= 0 ? groups.slice(0, decidingIndex + 1) : groups;
  const pathStages = ["intake", ...pathGroups.map((g) => g.id), "result"];
  const stageKey = stage === 0 ? "intake" : stage === resultStage ? "result" : groups[stage - 1].id;
  const progress = Math.max(0, pathStages.indexOf(stageKey)) / (pathStages.length - 1);

  const setAnswer = (groupId, qid, val) =>
    setAnswers((prev) => ({ ...prev, [groupId]: { ...(prev[groupId] || {}), [qid]: val } }));

  const submitGroup = (index) => {
    if (groupHasYes(groups[index]) || index === groups.length - 1) setStage(resultStage);
    else setStage(index + 2);
  };

  // Only keep answers from the groups on this person's path.
  const pathAnswers = () => {
    const out = {};
    pathGroups.forEach((g) => { out[g.id] = answers[g.id] || {}; });
    return out;
  };

  let content;
  if (stage === 0) {
    content = <IntakeStage intake={intake} setIntake={setIntake} onNext={() => setStage(1)} onBack={onBackToHome} />;
  } else if (stage < resultStage) {
    const index = stage - 1;
    const g = groups[index];
    content =
    <QuestionGroupStage
      key={g.id}
      eyebrow={t("groupEyebrow", index + 1, groups.length)}
      heading={g.heading}
      intro={g.intro}
      questions={g.questions}
      answers={answers[g.id] || {}}
      onSet={(qid, val) => setAnswer(g.id, qid, val)}
      onContinue={() => submitGroup(index)}
      onBack={() => setStage(index)}
      backLabel={index === 0 ? t("backToIntake") : t("backToPrevSection")}
      materiality={g.materialityNote ? RegistryData.materiality : null} />;

  } else {
    content =
    <ResultStage
      tier={computedTier}
      intake={intake}
      onContinue={() => onComplete({ tier: computedTier, intake, answers: pathAnswers() })}
      onRestart={() => {
        setAnswers({});
        setStage(1);
      }} />;

  }

  let progLabel = t("prog_intake");
  if (stageKey === "result") progLabel = t("prog_result");
  else if (stage > 0) progLabel = t("prog_section", stage, groups.length);

  return (
    <div className="screening-wrap fade-in" key={stage}>
      <div className="screening-progress">
        <span className="stage">{t("screeningStage")}</span>
        <span style={{ color: "var(--line-strong)" }}>—</span>
        <span>{progLabel}</span>
        <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="screening-track">
        <div className="fill" style={{ width: `${progress * 100}%` }} />
      </div>
      {content}
    </div>);

}

// --------- Intake stage ---------
function IntakeStage({ intake, setIntake, onNext, onBack }) {
  const { t } = useI18n();
  const canContinue = intake.useCaseName.trim().length > 0 && intake.operationalArea.trim().length > 0;
  return (
    <div className="fade-in">
      <div className="screening-eyebrow">{t("intake_eyebrow")}</div>
      <h1 className="screening-h">{t("intake_heading")}</h1>
      <p className="screening-sub">{t("intake_sub")}</p>

      <div className="intake-grid">
        <div className="field-block">
          <label className="field-label">{t("intake_nameLabel")}</label>
          <div className="field-prompt">{t("intake_namePrompt")}</div>
          <input
            className="text-input"
            placeholder={t("intake_namePlaceholder")}
            value={intake.useCaseName}
            onChange={(e) => setIntake({ ...intake, useCaseName: e.target.value })}
            autoFocus />
        </div>

        <div className="field-block">
          <label className="field-label">{t("intake_areaLabel")}</label>
          <div className="field-prompt">{t("intake_areaPrompt")}</div>
          <input
            className="text-input"
            placeholder={t("intake_areaPlaceholder")}
            value={intake.operationalArea}
            onChange={(e) => setIntake({ ...intake, operationalArea: e.target.value })} />
        </div>
      </div>

      <div className="nav-row">
        <button className="btn ghost" onClick={onBack}>
          <span className="arr">←</span> {t("backToStart")}
        </button>
        <button className="btn primary" onClick={onNext} disabled={!canContinue}>
          {t("continueToScreening")} <span className="arr">→</span>
        </button>
      </div>
    </div>);

}

// --------- Question group stage (all questions in a section at once) ---------
function QuestionGroupStage({ eyebrow, heading, intro, questions, answers, onSet, onContinue, onBack, backLabel, materiality }) {
  const { t } = useI18n();
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === questions.length;

  const [infoOpenKey, setInfoOpenKey] = useState(null);

  useEffect(() => {
    if (!infoOpenKey) return;
    const onKey = (e) => { if (e.key === "Escape") setInfoOpenKey(null); };
    const onClick = (e) => {
      if (!e.target.closest || !e.target.closest(".info-wrap")) setInfoOpenKey(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [infoOpenKey]);

  // Attach an info affordance to every question prompt that uses the "materially" word.
  const renderPrompt = (prompt, qid) => {
    const materiallyWord = materiality && materiality.word;
    if (!materiallyWord || !prompt.includes(materiallyWord)) return prompt;
    const open = infoOpenKey === qid;
    const idx = prompt.indexOf(materiallyWord);
    const before = prompt.slice(0, idx);
    const after = prompt.slice(idx + materiallyWord.length);
    return (
      <>
        {before}
        <span className="info-wrap">
          {materiallyWord}
          <button
            type="button"
            className="info-dot"
            aria-label={materiality.aria}
            aria-expanded={open}
            onClick={() => setInfoOpenKey(open ? null : qid)}
          >
            i
          </button>
          {open ?
          <span className="info-pop" role="tooltip">
              <span className="info-pop-title">{materiality.title}</span>
              {materiality.note}
            </span> :
          null}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="fade-in">
      <div className="screening-eyebrow">{eyebrow}</div>
      <h1 className="screening-h">{heading}</h1>
      <p className="screening-sub">{intro}</p>

      <div className="q-list" data-config="content/registry.en.js · screening">
        {questions.map((q, i) => {
          const val = answers[q.id];
          return (
            <div className={`q-row ${val ? "answered" : ""} ${val === "yes" ? "is-yes" : ""}`} key={q.id}>
              <div className="q-row-head">
                <span className="q-index">{String(i + 1).padStart(2, "0")}</span>
                <div className="q-meta">
                  <span className="q-title">{q.title}</span>
                </div>
              </div>
              <p className="q-prompt">{renderPrompt(q.prompt, q.id)}</p>
              <div className="yn-toggle" role="radiogroup" aria-label={q.title}>
                <button
                  className={`yn-seg ${val === "no" ? "sel no" : ""}`}
                  onClick={() => onSet(q.id, "no")}
                  aria-pressed={val === "no"}>
                  {t("no")}
                </button>
                <button
                  className={`yn-seg ${val === "yes" ? "sel yes" : ""}`}
                  onClick={() => onSet(q.id, "yes")}
                  aria-pressed={val === "yes"}>
                  {t("yes")}
                </button>
              </div>
            </div>);

        })}
      </div>

      <div className="screening-actionbar">
        <div className="actionbar-status">
          <span className="status-count">{t("answeredOf", answeredCount, questions.length)}</span>
          <span className={`actionbar-hint ${allAnswered ? "ready" : ""}`}>
            {allAnswered ? t("allAnswered") : t("answerAll")}
          </span>
        </div>
        <div className="actionbar-buttons">
          <button className="btn ghost" onClick={onBack}>
            <span className="arr">←</span> {backLabel}
          </button>
          <button className="btn primary" onClick={onContinue} disabled={!allAnswered}>
            {t("continue")} <span className="arr">→</span>
          </button>
        </div>
      </div>
    </div>);

}

// --------- Result stage ---------
function ResultStage({ tier, intake, onContinue, onRestart }) {
  const { t } = useI18n();
  const T = RegistryData.tier(tier);

  return (
    <div className="fade-in">
      <div className="screening-eyebrow">{t("result_eyebrow")}</div>
      <h1 className="screening-h">
        {t("result_headA")}<span style={{ color: "var(--accent)" }}>{T.name}</span>{t("result_headB", T.docLabel)}
      </h1>
      <p className="screening-sub">
        {t("result_subA")}<strong style={{ color: "var(--ink)" }}>{intake.useCaseName || t("thisUseCase")}</strong>
        {intake.operationalArea ? <>{t("result_subIn")}<strong style={{ color: "var(--ink)" }}>{intake.operationalArea}</strong></> : null}.
      </p>

      <div className="result-card">
        <div className="top">
          <TierPill tier={tier} />
        </div>
        <div className="result-tiers">
          <div className="ladder-label">{t("yourDocumentation")}</div>
          <div className="tier-ladder">
            {RegistryData.tiers.map((td) => {
              const n = td.level;
              const required = n <= tier;
              return (
                <div className={`rung ${n === tier ? "active" : ""} ${required ? "req" : "not-req"}`} key={n}>
                  <div className="rung-head">
                    <span className="rung-no">{td.name}</span>
                    <span className={`rung-flag ${required ? "yes" : "no"}`}>
                      <span className="rung-flag-mark" aria-hidden="true">{required ? "✓" : "✕"}</span>
                      {required ? t("required") : t("notRequired")}
                    </span>
                  </div>
                  <div className="rung-name serif">{td.label}</div>
                  <div className="rung-blurb">{td.short}</div>
                </div>);

            })}
          </div>
        </div>
      </div>

      <div className="nav-row result-actions">
        <button className="btn ghost" onClick={onRestart}>
          <span className="arr">↺</span> {t("reAnswer")}
        </button>
        <button className="btn primary" onClick={onContinue}>
          {t("continueToDoc")} <span className="arr">→</span>
        </button>
      </div>
    </div>);

}

window.ScreeningScreen = ScreeningScreen;
