/* eslint-disable no-unused-vars */
// Languages for the registry.
// - getReg(lang): the registry content in that language. Other languages are built by
//   copying the English structure (content/registry.en.js) and overlaying translated
//   text matched by id, so every language has the same questions, tiers and fields.
// - t(key, ...args): interface wording, with {0}/{1} interpolation.
// - LangContext / useI18n(): read { lang, t, setLang } anywhere in the tree.
/* global React, window */

(function () {
  const LOCALES = window.REGISTRY_LOCALES || {};

  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

  // Merge translated text onto the English structure. Objects merge key by key, arrays of
  // objects merge item by item, and anything else (strings, lists of strings) is replaced.
  function merge(base, over) {
    if (over === undefined || over === null) return base;
    if (Array.isArray(base) && Array.isArray(over)) {
      if (base.every(isObj) && over.every(isObj)) return base.map((b, i) => merge(b, over[i]));
      return over;
    }
    if (isObj(base) && isObj(over)) {
      const out = { ...base };
      Object.keys(over).forEach((k) => { out[k] = merge(base[k], over[k]); });
      return out;
    }
    return over;
  }

  function translate(lang) {
    const en = JSON.parse(JSON.stringify(LOCALES.en));
    const L = lang === "en" ? null : LOCALES[lang];
    if (!L) return en;
    const pick = (table, id) => (table && table[id]) || {};

    return {
      label: L.label || lang.toUpperCase(),
      flag: L.flag || "",
      startPage: merge(en.startPage, L.startPage),
      materiality: merge(en.materiality, L.materiality),
      ui: { ...en.ui, ...(L.ui || {}) },
      screening: en.screening.map((g) => ({
        ...g,
        ...pick(L.screening, g.id),
        questions: g.questions.map((q) => ({ ...q, ...pick(L.questions, q.id) })),
      })),
      tiers: en.tiers.map((tier) => ({
        ...merge(tier, pick(L.tiers, tier.level)),
        sections: tier.sections.map((s) => ({
          ...s,
          title: (L.sections && L.sections[s.id]) || s.title,
          fields: s.fields.map((f) => {
            const field = { ...f, ...pick(L.fields, f.id) };
            // Option values stay in English so records line up across languages;
            // only the labels people see are translated.
            if (f.options && L.options && L.options[f.id]) field.optionLabels = L.options[f.id];
            if (f.subfields) {
              field.subfields = f.subfields.map((sf) => ({
                ...sf,
                label: (L.subfields && L.subfields[sf.key]) || sf.label,
              }));
            }
            return field;
          }),
        })),
      })),
    };
  }

  // Wrap translated content with the lookups the screens use.
  function build(lang) {
    const c = translate(lang);
    const tiers = [...c.tiers].sort((a, b) => a.level - b.level);
    const byLevel = {};
    tiers.forEach((t) => { byLevel[t.level] = t; });
    return {
      lang,
      label: c.label,
      flag: c.flag,
      startPage: c.startPage,
      materiality: c.materiality,
      ui: c.ui,
      screening: c.screening,
      tiers,
      tier: (level) => byLevel[level],
      // Assigned when every screening group is answered "no".
      baseTier: tiers[0].level,
      // Sections a use case of this tier documents, grouped by tier (tiers are additive).
      getSectionsForTier(level) {
        return tiers
          .filter((t) => t.level <= level)
          .map((t) => ({
            tier: t.level,
            sections: t.sections.filter((s) => !(s.ownTierOnly && t.level !== level)),
          }))
          .filter((g) => g.sections.length);
      },
    };
  }

  const cache = {};
  function getReg(lang) {
    const code = LOCALES[lang] ? lang : "en";
    if (!cache[code]) cache[code] = build(code);
    return cache[code];
  }

  // Point the global RegistryData at the active language (screens read it during render).
  function setActiveLang(lang) {
    window.RegistryData = getReg(lang);
  }

  function makeT(lang) {
    const dict = getReg(lang).ui;
    const fallback = getReg("en").ui;
    return function t(key, ...args) {
      let s = dict[key] != null ? dict[key] : (fallback[key] != null ? fallback[key] : key);
      args.forEach((a, i) => { s = s.replace("{" + i + "}", a); });
      return s;
    };
  }

  const LangContext = React.createContext({
    lang: "en",
    setLang: () => {},
    t: makeT("en"),
  });

  function useI18n() {
    return React.useContext(LangContext);
  }

  Object.assign(window, { getReg, setActiveLang, makeT, LangContext, useI18n });
})();
