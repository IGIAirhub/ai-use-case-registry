// Main app shell: routes between Start, Screening, Documentation and Review
/* global React, ReactDOM, SiteHeader, StartScreen, ScreeningScreen, DocumentationScreen, PreviewScreen, LangContext, makeT, setActiveLang, getReg, RegistryConfig, Records */

const { useState, useEffect, useMemo, useRef } = React;

// Parse a deep-link hash like "#screening", "#documentation&es".
// Documentation and review deep links open with made-up screening answers (the highest
// tier, so every section shows). They only work in the public demo, so a real deployment
// can't be led into submitting a record nobody screened.
function parseHash() {
  const raw = (window.location.hash || "").replace(/^#/, "").toLowerCase();
  if (!raw) return null;
  const parts = raw.split(/[&/]/).filter(Boolean);
  const lang = RegistryConfig.languages.find((code) => parts.includes(code)) || null;
  let stage = null;
  if (parts.includes("screening")) stage = "screening";
  else if (parts.includes("documentation") || parts.includes("docs")) stage = "documentation";
  else if (parts.includes("review")) stage = "review";
  else if (parts.includes("start") || parts.includes("home")) stage = "start";
  if ((stage === "documentation" || stage === "review") && !(RegistryConfig.demo && RegistryConfig.demo.href)) stage = null;
  if (!stage && !lang) return null;
  return { stage, lang };
}

// A ready-made screening result so documentation/review deep links have a tier + context:
// the first two questions of the first (highest-tier) group answered "yes".
function demoScreeningState() {
  const group = getReg("en").screening[0];
  const answers = {};
  group.questions.forEach((q, i) => { answers[q.id] = i < 2 ? "yes" : "no"; });
  return {
    tier: group.tier,
    intake: { useCaseName: "", operationalArea: "" },
    answers: { [group.id]: answers },
  };
}

const newMeta = () => ({ id: Records.newRecordId(), createdAt: new Date().toISOString() });

function App() {
  const initialHash = parseHash();
  const needsDemo = initialHash && (initialHash.stage === "documentation" || initialHash.stage === "review");
  // stage: "start" | "screening" | "documentation" | "review" | "submitted"
  const [stage, setStage] = useState(initialHash?.stage || "start");
  const [lang, setLang] = useState(initialHash?.lang || RegistryConfig.languages[0]);
  const [screeningState, setScreeningState] = useState(needsDemo ? demoScreeningState() : null); // {tier, intake, answers}
  const [answers, setAnswers] = useState({}); // documentation field answers
  const [meta, setMeta] = useState(needsDemo ? newMeta() : null); // {id, createdAt, submittedAt}
  const [sendStatus, setSendStatus] = useState(null); // null | "sending" | "ok" | "refused" | "unreachable"
  const [sendError, setSendError] = useState(""); // why the last send failed
  const sendSeq = useRef(0); // only the latest send may update sendStatus
  const [showConfig, setShowConfig] = useState(false); // demo only: outline what adopters can change

  // Point the global RegistryData at the active language BEFORE children render.
  setActiveLang(lang);
  const t = makeT(lang);
  const ctx = useMemo(() => ({ lang, setLang, t }), [lang]);

  useEffect(() => {
    document.body.classList.toggle("show-config", showConfig);
  }, [showConfig]);

  // Scroll to top when stage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);

  // Respond to deep-link hash changes after load (e.g. clicking a #screening link).
  useEffect(() => {
    const onHash = () => {
      const h = parseHash();
      if (!h) return;
      if (h.lang) setLang(h.lang);
      if (h.stage) {
        if ((h.stage === "documentation" || h.stage === "review") && !screeningState) {
          setScreeningState(demoScreeningState());
          setMeta(newMeta());
        }
        setStage(h.stage);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [screeningState]);

  const reset = () => {
    setScreeningState(null);
    setAnswers({});
    setMeta(null);
    sendSeq.current++;
    setSendStatus(null);
    setSendError("");
    setStage("start");
  };

  const goHome = () => {
    if (stage === "submitted") return reset();
    if (Object.keys(answers).length > 0 || screeningState) {
      if (!confirm(t("dialogReturnHome"))) return;
    }
    setStage("start");
  };

  // Once submitted, a record keeps the language it was submitted in, even if the
  // person switches language on the submitted page.
  const buildRecord = (options) =>
    Records.buildRecord({ meta, lang: (meta && meta.lang) || lang, screening: screeningState, answers }, options);

  const openRecord = (file) =>
    Records.readRecordFile(file).then((state) => {
      // Say what won't carry over before opening a record made with other questions or fields.
      const n = state.notes;
      const warnings = [];
      if (n.versionChanged) warnings.push(t("openOtherVersion", n.recordVersion, n.currentVersion));
      if (n.droppedFields.length) warnings.push(t("openDroppedFields", n.droppedFields.length, n.droppedFields.join(", ")));
      if (n.needsScreening) warnings.push(t("openRescreen"));
      if (warnings.length && !confirm(`${warnings.join("\n\n")}\n\n${t("openContinue")}`)) return;
      setScreeningState(state.screening);
      setAnswers(state.answers);
      setMeta(state.meta);
      sendSeq.current++;
      setSendStatus(null);
      setSendError("");
      if (RegistryConfig.languages.includes(state.lang)) setLang(state.lang);
      setStage(n.needsScreening ? "screening" : "documentation");
    });

  const send = (record) => {
    const seq = ++sendSeq.current;
    setSendStatus("sending");
    setSendError("");
    Records.sendRecord(record).then(
      () => { if (seq === sendSeq.current) setSendStatus("ok"); },
      (err) => {
        if (seq !== sendSeq.current) return; // a newer send or record has taken over
        // Logged for whoever sets up submit.url: a wrong token reads differently from a network problem.
        console.warn("Sending the record to submit.url failed:", err);
        setSendError(err.message || "");
        setSendStatus(err.kind === "refused" ? "refused" : "unreachable");
      }
    );
  };

  const submit = () => {
    const submittedMeta = { ...meta, submittedAt: new Date().toISOString(), lang };
    setMeta(submittedMeta);
    setStage("submitted");
    if (!RegistryConfig.submit.url) return;
    send(Records.buildRecord(
      { meta: submittedMeta, lang, screening: screeningState, answers },
      { status: "submitted" }
    ));
  };

  return (
    <LangContext.Provider value={ctx}>
      {RegistryConfig.demo && RegistryConfig.demo.href ?
      <div className="demo-bar" role="note">
          <span>{t("demoBar")}</span>
          <button className="demo-bar-toggle" aria-pressed={showConfig} onClick={() => setShowConfig((v) => !v)}>
            {showConfig ? t("demoConfigHide") : t("demoConfigShow")}
          </button>
          <a href={RegistryConfig.demo.href}>{t("demoBarLink")} <span aria-hidden="true">→</span></a>
        </div> :
      null}
      <SiteHeader stage={stage} onHome={goHome} />
      {stage === "start" ?
      <StartScreen onStart={() => setStage("screening")} onOpenRecord={openRecord} /> :
      null}

      {stage === "screening" ?
      <ScreeningScreen
        initial={screeningState ? { intake: Records.currentIntake(screeningState.intake, answers), answers: screeningState.answers, stage: 0 } : null}
        onComplete={(result) => {
          setAnswers((prev) => Records.applyIntake(prev, result.intake));
          setScreeningState(result);
          if (!meta) setMeta(newMeta());
          setStage("documentation");
        }}
        onBackToHome={() => setStage("start")} /> :

      null}

      {stage === "documentation" && screeningState ?
      <DocumentationScreen
        tier={screeningState.tier}
        intake={screeningState.intake}
        screeningAnswers={screeningState.answers}
        answers={answers}
        setAnswers={setAnswers}
        onPreview={() => setStage("review")}
        onBack={() => setStage("screening")}
        onDownloadDraft={() => Records.downloadJson(buildRecord({ status: "draft" }), "-draft")} /> :

      null}

      {(stage === "review" || stage === "submitted") && screeningState ?
      <PreviewScreen
        tier={screeningState.tier}
        intake={screeningState.intake}
        answers={answers}
        recordId={meta?.id}
        submitted={stage === "submitted"}
        sendStatus={sendStatus}
        sendError={sendError}
        onRetrySend={() => send(buildRecord({ status: "submitted" }))}
        buildRecord={buildRecord}
        onBackToEdit={() => setStage("documentation")}
        onSubmit={submit}
        onStartAnother={reset} /> :

      null}
    </LangContext.Provider>);

}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
