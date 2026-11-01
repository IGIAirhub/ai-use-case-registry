// Shared UI components for the registry
/* global React, useI18n, getReg, RegistryConfig */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// --------- Site Header ---------
function SiteHeader({ stage, onHome }) {
  const { lang, setLang, t } = useI18n();
  const pageLabels = {
    start: t("pageLabel_start"),
    screening: t("pageLabel_screening"),
    documentation: t("pageLabel_documentation"),
    review: t("pageLabel_review"),
    submitted: t("pageLabel_submitted"),
  };
  const stages = [
    { key: "screening", label: t("prog_screening") },
    { key: "documentation", label: t("prog_documentation") },
    { key: "review", label: t("prog_review") },
  ];
  const currentIdx = stage === "submitted" ? stages.length : stages.findIndex((s) => s.key === stage);
  const genericRail = stage === "start";

  const languages = RegistryConfig.languages;
  const langToggle = languages.length > 1 ? (
    <div className="lang-toggle" role="group" aria-label={t("langAria")} data-config="registry.config.js · languages" data-config-align="end">
      <span className="lang-globe" aria-hidden="true">🌐</span>
      {languages.map((code) => {
        const L = getReg(code);
        return (
          <button
            key={code}
            className={`lang-opt ${lang === code ? "active" : ""}`}
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
          >
            {L.flag ? <span className="lang-flag" aria-hidden="true">{L.flag}</span> : null}
            {L.label}
          </button>
        );
      })}
    </div>
  ) : null;

  const logo = RegistryConfig.logo;
  const logoImg = logo && logo.src ? <img src={logo.src} alt={logo.alt || RegistryConfig.organization} /> : null;

  return (
    <header className="site-header">
      <div className="row">
        <div className="header-left">
          {logoImg && logo.href ? (
            <a className="site-logo" href={logo.href} data-config="registry.config.js · logo">{logoImg}</a>
          ) : logoImg ? (
            <span className="site-logo" data-config="registry.config.js · logo">{logoImg}</span>
          ) : RegistryConfig.organization ? (
            <span className="site-logo site-logo-text" data-config="registry.config.js · organization">{RegistryConfig.organization}</span>
          ) : null}
          {logoImg || RegistryConfig.organization ? <span className="header-divider" aria-hidden="true" /> : null}
          <button className="page-label" onClick={onHome} title={t("returnTitle")}>
            <span className="page-label-dot" />
            {pageLabels[stage] || pageLabels.start}
          </button>
        </div>
        {!genericRail ? (
          <div className="stage-progress">
            {stages.map((s, i, arr) => {
              const idx = i + 1;
              let state = "todo";
              if (i === currentIdx) state = "active";
              else if (i < currentIdx) state = "done";
              return (
                <React.Fragment key={s.key}>
                  <div className="pip" data-state={state}>
                    <span className="num">
                      {state === "done" ? null : <span>{idx}</span>}
                    </span>
                    <span>{s.label}</span>
                  </div>
                  {i < arr.length - 1 ? <div className="sep" /> : null}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="stage-progress">
            {stages.map((s, i, arr) => (
              <React.Fragment key={s.key}>
                <div className="pip" data-state="todo"><span className="num"><span>{i + 1}</span></span><span>{s.label}</span></div>
                {i < arr.length - 1 ? <div className="sep" /> : null}
              </React.Fragment>
            ))}
          </div>
        )}
        {langToggle}
      </div>
    </header>
  );
}

// --------- Field controls ---------
function TextField({ value, onChange, placeholder, autoFocus }) {
  return (
    <input
      className="text-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}

// `options` are the stored values; `labels` (if translated) are what people see.
function SelectField({ value, onChange, options, labels, placeholder }) {
  return (
    <select
      className="select-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o, i) => (
        <option key={o} value={o}>{(labels && labels[i]) || o}</option>
      ))}
    </select>
  );
}

// The label to show for a stored select value.
function optionLabel(field, value) {
  const i = (field.options || []).indexOf(value);
  return i >= 0 && field.optionLabels && field.optionLabels[i] ? field.optionLabels[i] : value;
}

function TextareaField({ value, onChange, placeholder, minRows = 4 }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const v = value || "";
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(minRows * 24 + 24, el.scrollHeight) + "px";
  }, [v, minRows]);
  const wordCount = v.trim() === "" ? 0 : v.trim().split(/\s+/).length;
  return (
    <div>
      <textarea
        ref={ref}
        className="textarea-input"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
      />
      <div className="input-meta">
        <span>{wordCount} {wordCount === 1 ? t("word") : t("words")} · {v.length} {t("chars")}</span>
      </div>
    </div>
  );
}

function FieldControl({ field, value, onChange }) {
  const { t } = useI18n();
  if (field.kind === "text") {
    return <TextField value={value} onChange={onChange} placeholder={t("ph_enter")} />;
  }
  if (field.kind === "select") {
    return <SelectField value={value} onChange={onChange} options={field.options} labels={field.optionLabels} placeholder={t("ph_select")} />;
  }
  return <TextareaField value={value} onChange={onChange} placeholder={t("ph_describe")} />;
}

// Structured contact field — Name / Role / Department / Email stored under `${id}.${key}`.
function ContactField({ field, answers, onUpdate }) {
  const { t } = useI18n();
  return (
    <div className="contact-grid">
      {field.subfields.map((sf) => (
        <label className="contact-sub" key={sf.key}>
          <span className="contact-sub-label">{sf.label}</span>
          <input
            className="text-input"
            type={sf.type === "email" ? "email" : "text"}
            value={answers[`${field.id}.${sf.key}`] || ""}
            onChange={(e) => onUpdate(`${field.id}.${sf.key}`, e.target.value)}
            placeholder={sf.type === "email" ? t("ph_email") : ""}
          />
        </label>
      ))}
    </div>
  );
}

// Whether a field has any content (handles composite contact fields).
function fieldIsFilled(field, answers) {
  if (field.kind === "contact") {
    return (field.subfields || []).some(
      (sf) => (answers[`${field.id}.${sf.key}`] || "").trim().length > 0
    );
  }
  return (answers[field.id] || "").trim().length > 0;
}

// Human-readable one-line summary of a contact field for the preview.
function contactSummary(field, answers) {
  const parts = (field.subfields || []).map((sf) => (answers[`${field.id}.${sf.key}`] || "").trim());
  const [name, role, department, email] = parts;
  const left = [name, role, department].filter(Boolean).join(" · ");
  if (left && email) return `${left} — ${email}`;
  return left || email || "";
}

// --------- Tier pill (reads active-language RegistryData) ---------
function TierPill({ tier, size = "md" }) {
  const td = RegistryData.tier(tier);
  return (
    <span className={`tier-pill t${tier}`}>
      <span className="pip" />
      <span>{td.abbr} · {td.label}</span>
    </span>
  );
}

// --------- Banner ---------
function Banner({ eyebrow, title, sub }) {
  return (
    <div className="banner">
      {eyebrow ? <div className="banner-eyebrow">{eyebrow}</div> : null}
      <h2>{title}</h2>
      {sub ? <div className="banner-sub">{sub}</div> : null}
    </div>
  );
}

// --------- Toast ---------
function useToast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);
  const fire = useCallback((m) => {
    setMsg(m);
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2000);
  }, []);
  const node = (
    <div className={`toast ${show ? "show" : ""}`} aria-live="polite">
      {msg}
    </div>
  );
  return [fire, node];
}

Object.assign(window, {
  SiteHeader,
  TextField,
  SelectField,
  TextareaField,
  FieldControl,
  ContactField,
  optionLabel,
  fieldIsFilled,
  contactSummary,
  TierPill,
  Banner,
  useToast,
});
