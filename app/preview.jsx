// Preview / Review screen — read-only summary of everything entered. After submitting,
// the same view shows the record's downloads.
/* global React, RegistryData, TierPill, fieldIsFilled, contactSummary, optionLabel, useI18n, Records */

function PreviewScreen({ tier, intake, answers, recordId, submitted, sendStatus, sendError, onRetrySend, buildRecord, onBackToEdit, onSubmit, onStartAnother }) {
  const { t, lang } = useI18n();
  const tierGroups = RegistryData.getSectionsForTier(tier);
  const T = RegistryData.tier(tier);

  const today = new Date().toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" });

  const totalFields = tierGroups.reduce((a, g) => a + g.sections.reduce((b, s) => b + s.fields.length, 0), 0);
  const filledFields = tierGroups.reduce(
    (a, g) => a + g.sections.reduce(
      (b, s) => b + s.fields.filter((f) => fieldIsFilled(f, answers)).length,
      0
    ),
    0
  );
  const pct = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;
  const allComplete = filledFields === totalFields;
  const emptyCount = totalFields - filledFields;

  const valueFor = (f) => {
    if (f.kind === "contact") return contactSummary(f, answers);
    const v = (answers[f.id] || "").trim();
    return f.kind === "select" ? optionLabel(f, v) : v;
  };

  const fields = tierGroups.flatMap((g) => g.sections).flatMap((s) => s.fields);
  const deploymentField = fields.find((f) => f.summary === "deployment");
  const deployment = deploymentField ? valueFor(deploymentField) : "";
  const contactField = fields.find((f) => f.kind === "contact");
  const contact = contactField ? contactSummary(contactField, answers) : "";
  const dash = t("dash");
  const summaryFacts = [
    { label: t("fact_docLevel"), value: <span><strong>{T.name}</strong> — {T.label}</span> },
    { label: t("fact_area"), value: intake.operationalArea || dash },
    { label: t("fact_deployment"), value: deployment || dash },
    { label: t("fact_contact"), value: contact || dash },
  ];

  const status = submitted ? "submitted" : "draft";

  return (
    <div className="preview-wrap fade-in">
      <div className="preview-head">
        <div className="eyebrow">{submitted ? t("submittedEyebrow", recordId) : t("previewEyebrow")}</div>
        <h1>{intake.useCaseName || t("previewTitlePlaceholder")}</h1>
        {submitted ? null : (
          <p className="preview-lede-note">
            {t("previewNoteA")}<strong>{t("confirmSubmit")}</strong>.
          </p>
        )}

        {submitted ? (
          <div className="submit-panel">
            <div className="submit-panel-head">
              <span className="submit-check" aria-hidden="true">✓</span>
              <div>
                <h2>{t("submittedHeading")}</h2>
                <p>{t("submittedBody")}</p>
              </div>
            </div>
            <div className="dl-row">
              <button className="btn primary" onClick={() => Records.downloadJson(buildRecord({ status }))}>
                {t("dl_json")}
              </button>
              <button className="btn secondary" onClick={() => Records.downloadCsv(buildRecord({ status }))}>
                {t("dl_csv")}
              </button>
              <button className="btn ghost" onClick={() => window.print()}>{t("print")}</button>
            </div>
            {sendStatus ? (
              <p className={`send-status ${sendStatus}`} role="status">
                {sendStatus === "sending" ? t("sending") : sendStatus === "ok" ? t("sentOk") : (
                  <>
                    {t(sendStatus === "refused" ? "sentRefused" : "sentUnreachable")}
                    {sendError ? <span className="send-reason"> {t("sentReason", sendError)}</span> : null}
                    {" "}<button className="link-btn send-retry" onClick={onRetrySend}>{t("retrySend")}</button>
                  </>
                )}
              </p>
            ) : null}
            <button className="link-btn" onClick={() => Records.downloadTemplate()}>{t("dl_template")}</button>
          </div>
        ) : null}

        {/* At-a-glance summary card */}
        <div className="preview-summary">
          <div className="summary-facts">
            {summaryFacts.map((f) => (
              <div className="summary-fact" key={f.label}>
                <div className="sf-label">{f.label}</div>
                <div className="sf-value">{f.value}</div>
              </div>
            ))}
          </div>
          <div className="summary-progress">
            <div className="sp-top">
              <span className="sp-count">{filledFields}<span className="sp-total"> / {totalFields}</span></span>
              <span className="sp-unit">{t("fieldsComplete")}</span>
            </div>
            <div className="sp-bar"><div className="sp-fill" style={{ width: `${pct}%` }} /></div>
            <div className={`sp-status ${allComplete ? "ok" : "warn"}`}>
              {allComplete ? t("allFieldsComplete") : t(emptyCount === 1 ? "fieldsEmptyOne" : "fieldsEmptyMany", emptyCount)}
            </div>
          </div>
        </div>
      </div>

      {tierGroups.map((g) => (
        <div key={g.tier}>
          <div className="preview-tier-band">
            <TierPill tier={g.tier} />
            <span className="ptb-name">{RegistryData.tier(g.tier).headline}</span>
            <div className="ptb-rule" />
          </div>
          {g.sections.map((s, si) => {
            const sTotal = s.fields.length;
            const sFilled = s.fields.filter((f) => fieldIsFilled(f, answers)).length;
            const sComplete = sFilled === sTotal;
            return (
              <section className="preview-section" key={s.id}>
                <div className="preview-section-head">
                  <div>
                    <div className="section-tag">
                      {t("sectionXofY", si + 1, g.sections.length)}
                    </div>
                    <h2 className="serif">{s.title}</h2>
                  </div>
                  <span className={`section-status ${sComplete ? "ok" : "warn"}`}>
                    {sComplete ? t("complete") : t("nEmpty", sTotal - sFilled)}
                  </span>
                </div>
                {s.fields.map((f) => {
                  const v = valueFor(f);
                  return (
                    <div className="preview-field" key={f.id}>
                      <div className="fname">{f.name}</div>
                      <div className={`fvalue ${!v ? "empty" : ""}`}>
                        {v || t("notProvided")}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      ))}

      <div className="preview-foot anchored">
        <div className="stamp">
          {recordId} · {today}
        </div>
        <div className="preview-foot-actions">
          <button className="btn ghost" onClick={() => window.print()}>{t("print")}</button>
          {submitted ? (
            <button className="btn primary" onClick={onStartAnother}>{t("startAnother")}</button>
          ) : (
            <>
              <button className="btn secondary" onClick={onBackToEdit}>
                <span className="arr">←</span> {t("backToEdit")}
              </button>
              <button className="btn primary" onClick={onSubmit}>
                {t("confirmSubmit")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.PreviewScreen = PreviewScreen;
