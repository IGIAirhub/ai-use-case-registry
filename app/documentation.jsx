// Documentation screen — tiered fields with sticky side nav
/* global React, RegistryData, FieldControl, ContactField, fieldIsFilled, TierPill, useI18n */

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function DocumentationScreen({ tier, intake, screeningAnswers = {}, answers, setAnswers, onPreview, onBack, onDownloadDraft }) {
  const { t } = useI18n();
  const TD = RegistryData.tier;
  // Sections marked ownTierOnly (the elaborations) appear only at the use case's own tier.
  const tierGroups = RegistryData.getSectionsForTier(tier);

  // Build a screening-context sentence for an elaboration section.
  const sectionContext = (section) => {
    if (!section.contextFrom) return null;
    const group = RegistryData.screening.find((g) => g.id === section.contextFrom);
    const ans = screeningAnswers[section.contextFrom] || {};
    const phrases = group ? group.questions.filter((q) => ans[q.id] === "yes").map((q) => q.phrase) : [];
    if (!phrases.length) return null;
    const AND = t("and");
    if (phrases.length === 1) return phrases[0];
    if (phrases.length === 2) return `${phrases[0]} ${AND} ${phrases[1]}`;
    return `${phrases.slice(0, -1).join(", ")}, ${AND} ${phrases[phrases.length - 1]}`;
  };

  const flatSections = useMemo(() => {
    const out = [];
    tierGroups.forEach((g) => {
      g.sections.forEach((s) => { out.push({ ...s, tier: g.tier }); });
    });
    return out;
  }, [tierGroups]);

  // Pre-fill from intake on mount if blank
  useEffect(() => {
    setAnswers((prev) => {
      const next = { ...prev };
      flatSections.forEach((s) => {
        s.fields.forEach((f) => {
          if (f.derivedFromIntake && !next[f.id] && intake[f.derivedFromIntake]) {
            next[f.id] = intake[f.derivedFromIntake];
          }
        });
      });
      return next;
    });
    // eslint-disable-next-line
  }, []);

  const [activeSectionId, setActiveSectionId] = useState(flatSections[0]?.id);
  const sectionRefs = useRef({});
  const contentRef = useRef(null);

  const sectionStats = useMemo(() => {
    const stats = {};
    flatSections.forEach((s) => {
      const total = s.fields.length;
      const filled = s.fields.filter((f) => fieldIsFilled(f, answers)).length;
      stats[s.id] = { total, filled };
    });
    return stats;
  }, [flatSections, answers]);

  const totalFields = flatSections.reduce((a, s) => a + s.fields.length, 0);
  const filledFields = flatSections.reduce(
    (a, s) => a + s.fields.filter((f) => fieldIsFilled(f, answers)).length,
    0
  );
  const pct = totalFields ? Math.round(filledFields / totalFields * 100) : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.
        filter((e) => e.isIntersecting).
        sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSectionId(visible[0].target.dataset.sectionId);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [flatSections]);

  const jumpTo = (sid) => {
    const el = sectionRefs.current[sid];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSectionId(sid);
  };

  const updateAnswer = (id, v) => setAnswers((prev) => ({ ...prev, [id]: v }));

  // Identity fields surfaced in the document header (entered once at the top, not repeated inline).
  const allFields = flatSections.flatMap((s) => s.fields);
  const nameField = allFields.find((f) => f.derivedFromIntake === "useCaseName");
  const areaField = allFields.find((f) => f.derivedFromIntake === "operationalArea");

  return (
    <div className="fade-in">
      <div className="doc-toolbar-outer">
        <div className="doc-toolbar">
          <div className="meta">
            <TierPill tier={tier} />
          </div>
          <div className="progress-mini">
            <span>{t("fieldsCountOf", filledFields, totalFields)}</span>
            <div className="bar"><div className="fill" style={{ width: `${pct}%` }} /></div>
            <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>{pct}%</span>
          </div>
          <div className="actions">
            <button className="btn secondary" onClick={onDownloadDraft}>{t("downloadDraft")}</button>
            <button className="btn primary" onClick={onPreview}>
              {t("previewSubmission")} <span className="arr">→</span>
            </button>
          </div>
        </div>
      </div>

      <div className="doc-layout">
        <aside className="doc-nav">
          {tierGroups.map((g) =>
          <div className="nav-tier" key={g.tier}>
              <div className="nav-tier-head">
                <span>{TD(g.tier).name}</span>
                <span className="tag">{TD(g.tier).label}</span>
              </div>
              {g.sections.map((s) => {
              const stats = sectionStats[s.id];
              let checkClass = "";
              if (stats.filled === stats.total && stats.total > 0) checkClass = "full";else
              if (stats.filled > 0) checkClass = "partial";
              return (
                <div
                  key={s.id}
                  className={`nav-item ${activeSectionId === s.id ? "active" : ""}`}
                  onClick={() => jumpTo(s.id)}>
                    <span className={`check ${checkClass}`}>{checkClass === "full" ? "✓" : ""}</span>
                    <span>{s.title}</span>
                    <span className="count">{stats.filled}/{stats.total}</span>
                  </div>);
            })}
            </div>
          )}
          <div style={{ padding: "16px", borderTop: "1px solid var(--line)", marginTop: 12 }}>
            <button className="btn ghost" onClick={onBack} style={{ padding: "8px 0", fontSize: 13 }}>
              <span className="arr">←</span> {t("backToScreening")}
            </button>
          </div>
        </aside>

        <main className="doc-content" ref={contentRef}>
          <header className="doc-headline">
            <div className="doc-headline-eyebrow">{t("docEyebrow")}</div>
            <input
              className="doc-title-input serif"
              value={answers[nameField?.id] || ""}
              onChange={(e) => updateAnswer(nameField.id, e.target.value)}
              placeholder={t("docTitlePlaceholder")}
              aria-label={t("intake_nameLabel")}
            />
            <div className="doc-headline-row">
              <label className="doc-headline-field">
                <span>{t("docAreaLabel")}</span>
                <input
                  className="doc-area-input"
                  value={answers[areaField?.id] || ""}
                  onChange={(e) => updateAnswer(areaField.id, e.target.value)}
                  placeholder={t("docAreaPlaceholder")}
                  aria-label={t("docAreaLabel")}
                />
              </label>
            </div>
          </header>
          <div className="doc-guidance">
            <span className="doc-guidance-icon">!</span>
            <p>{RegistryData.startPage.completionGuidance}</p>
          </div>
          {tierGroups.map((g, gi) =>
          <div key={g.tier}>
              <div className={`tier-header t${g.tier} ${gi === 0 ? "first" : ""}`}>
                <span className="tier-header-no">{TD(g.tier).name}</span>
                <span className="tier-header-name serif">{TD(g.tier).headline}</span>
              </div>
              {g.sections.map((s, si) => {
                const ctx = sectionContext(s);
                const visibleFields = s.fields.filter((f) => !f.derivedFromIntake);
                const st = sectionStats[s.id] || { filled: 0, total: 0 };
                const complete = st.total > 0 && st.filled === st.total;
                const partial = st.filled > 0 && !complete;
                return (
            <section
              key={s.id}
              className="doc-section"
              data-section-id={s.id}
              data-config={`content/registry.en.js · tiers → ${s.id}`}
              ref={(el) => {sectionRefs.current[s.id] = el;}}>
                  <div className="doc-section-head">
                    <span className={`sec-check ${complete ? "full" : partial ? "partial" : ""}`}>{complete ? "✓" : ""}</span>
                    <span className="sec-num">{t("sectionWord")} {g.tier}.{si + 1}</span>
                    <h3 className="sec-title serif">{s.title}</h3>
                  </div>
                  {visibleFields.map((f, fi) =>
              <div className={`field-row`} key={f.id}>
                      <div>
                        <div className="field-name serif">{f.name}</div>
                        <p className="field-prompt">
                          {ctx && fi === 0 ?
                      <span className="field-context">{t("contextA")}<strong>{ctx}</strong>{t("contextB")}</span> :
                      f.prompt}
                        </p>
                        {f.kind === "contact" ?
                    <ContactField field={f} answers={answers} onUpdate={updateAnswer} /> :

                    <FieldControl
                      field={f}
                      value={answers[f.id] || ""}
                      onChange={(v) => updateAnswer(f.id, v)} />
                  }
                      </div>
                    </div>
              )}
                </section>);
              })}
            </div>
          )}

          <div className="nav-row">
            <button className="btn ghost" onClick={onBack}>
              <span className="arr">←</span> {t("backToScreening")}
            </button>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn secondary" onClick={onDownloadDraft}>
                {t("downloadDraft")}
              </button>
              <button className="btn primary" onClick={onPreview}>
                {t("previewSubmission")} <span className="arr">→</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>);

}

window.DocumentationScreen = DocumentationScreen;
