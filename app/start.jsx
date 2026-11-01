// Start page: the first page of the registry
/* global React, RegistryData, RegistryConfig, Records, useI18n */

// Renders text with inline anchor links for any matching {phrase, url} entries.
function renderWithLinks(text, links) {
  if (!links || !links.length) return text;
  const escaped = links.map((l) => l.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) => {
    const link = links.find((l) => l.phrase === part);
    if (link) {
      return (
        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="def-inline-link">
          {part}
        </a>);
    }
    return part;
  });
}

function StartScreen({ onStart, onOpenRecord }) {
  const { t } = useI18n();
  const D = RegistryData.startPage;
  const tiers = RegistryData.tiers;
  const H = D.howItWorks;
  const fileInput = React.useRef(null);
  const [openError, setOpenError] = React.useState(false);

  const openFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setOpenError(false);
    onOpenRecord(file).catch(() => setOpenError(true));
  };
  // An organization's own sections (how it uses the registry, who to ask). The default
  // start page has none.
  const sections = D.sections || [];

  return (
    <div className="fade-in">
      <section className="container narrow">
        <div className="start-hero">
          {RegistryConfig.organization ? <div className="start-eyebrow" data-config="registry.config.js · organization">{RegistryConfig.organization}</div> : null}
          <h1 className="start-h1 serif" data-config="content/registry.en.js · startPage" data-config-align="end">
            {D.title.split("\n").map((line, i, arr) => (
              <React.Fragment key={i}>{line}{i < arr.length - 1 ? <br /> : null}</React.Fragment>
            ))}
          </h1>
          <p className="start-lede">
            {[D.blurb, D.blurbTail].filter(Boolean).join(" ")}
          </p>
          <div className="start-actions" data-config="registry.config.js · theme">
            <button className="btn primary cta-begin" onClick={onStart}>
              {t("beginScreening")} <span className="arr">→</span>
            </button>
            <button className="btn secondary" onClick={() => fileInput.current.click()}>
              {t("openSaved")}
            </button>
            <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={openFile} />
          </div>
          {openError ? <p className="import-error" role="alert">{t("importError")}</p> : null}
        </div>
      </section>

      {/* How it works — plain-language flow */}
      <section className="container">
        <div className="howit" data-config="content/registry.en.js · startPage.howItWorks, tiers">
          <div className="howit-head">
            <span className="howit-eyebrow">{H.eyebrow}</span>
          </div>
          <ol className="howit-steps">
            {H.steps.map((step, i, arr) => (
              <React.Fragment key={i}>
                <li className="howit-step">
                  <span className="howit-num">{i + 1}</span>
                  <div className="howit-body">
                    <h4>{step.title}</h4>
                    <p>{step.body}</p>
                  </div>
                </li>
                {i < arr.length - 1 ? <li className="howit-arrow" aria-hidden="true">→</li> : null}
              </React.Fragment>
            ))}
          </ol>
          <div className="howit-scale">
            <div className="howit-scale-label">{H.scaleLabel}</div>
            <div className="howit-tiers">
              {tiers.map((td) => {
                const n = td.level;
                return (
                  <div className={`howit-tier t${n}`} key={n}>
                    <div className="howit-tier-top">
                      <span className="howit-tier-no">{td.name}</span>
                      <span className="howit-tier-name">{td.label}</span>
                    </div>
                    <p>{td.short}</p>
                  </div>);
              })}
            </div>
            <div className="howit-axis">
              <span>{H.axisLow}</span>
              <span className="howit-axis-line" aria-hidden="true"></span>
              <span>{H.axisHigh}</span>
            </div>
          </div>
        </div>
      </section>

      {sections.map((sec, si) =>
      <React.Fragment key={si}>
          <div className="container narrow"><div className="start-rule" /></div>
          <section className="container">
            <div className="start-sections">
              <div className="start-section-label">{sec.label}</div>
              <div className="start-section-body">
                <h3>{sec.heading}</h3>
                {(sec.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
                {sec.list ?
              <ul className="instruction-list">
                    {sec.list.map((line, i) => <li key={i}>{line}</li>)}
                  </ul> :
              null}
              </div>
            </div>
          </section>
        </React.Fragment>
      )}

      <div className="container narrow"><div className="start-rule" /></div>

      {/* Key terms: collapsed, so the start page stays short */}
      <section className="container">
        <div className="start-sections">
          <div className="start-section-label">{D.defsLabel}</div>
          <div className="start-section-body">
            <h3 data-config="content/registry.en.js · startPage.definitions">{D.defsHeading}</h3>
            {D.defsIntro ? <p>{D.defsIntro}</p> : null}
            <details className="tier-toggle defs-toggle">
              <summary>{D.defsToggleLabel}</summary>
              <dl className="def-list">
                {D.definitions.map((d) =>
                <div className="def" key={d.term}>
                    <dt>{d.term}</dt>
                    <dd>
                      {d.body.split(/\n\n+/).map((para, i) =>
                    <p className="def-para" key={i}>{renderWithLinks(para, d.inlineLinks)}</p>
                    )}
                      {d.showTiers ?
                    <details className="tier-toggle">
                          <summary>{D.tierToggleLabel}</summary>
                          <div className="tier-detail-body stacked">
                            {tiers.map((td) => {
                          const n = td.level;
                          return (
                            <div className={`tier-detail-card t${n}`} key={n}>
                                  <div className="tier-detail-head">
                                    <span className="tier-detail-no">{td.name}</span>
                                    <span className="tier-detail-name">{td.label}</span>
                                  </div>
                                  <p className="tier-detail-desc">{td.definition}</p>
                                  {td.categories ?
                              <dl className="tier-cats">
                                      {td.categories.map((c) =>
                                <div className="tier-cat" key={c.label}>
                                          <dt>{c.label}</dt>
                                          <dd>{c.body}</dd>
                                        </div>
                                )}
                                    </dl> :
                              null}
                                  <div className="tier-detail-ex">
                                    <span className="tier-detail-ex-label">{D.examplesLabel}</span>
                                    <ul>
                                      {td.examples.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                  </div>
                                </div>);
                        })}
                          </div>
                        </details> :
                    null}
                    </dd>
                  </div>
                )}
              </dl>
            </details>
          </div>
        </div>
      </section>

      <footer className="container" data-config="registry.config.js · footer" style={{ padding: "72px 32px 24px", color: "var(--muted)", fontSize: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <span>{[RegistryConfig.footer, D.version].filter(Boolean).join(" · ")}</span>
        {D.footerNote ? <span style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{D.footerNote}</span> : null}
        {/* For whoever keeps the inventory: a header row that matches the current fields. */}
        <button className="link-btn footer-template" onClick={() => Records.downloadTemplate()}>{t("dl_template")}</button>
      </footer>
    </div>);

}

window.StartScreen = StartScreen;
