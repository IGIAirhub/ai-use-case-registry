// Records: building, exporting and importing them.
//
// The registry keeps nothing itself. A finished use case leaves as files (a JSON record
// for systems, a CSV row for spreadsheets) and, if registry.config.js sets submit.url,
// is also sent there. docs/record-format.md describes the JSON format.
/* global window, document, crypto, Blob, URL, fetch, AbortController, setTimeout, clearTimeout */

(function () {
  const SCHEMA = "ai-use-case-registry/record";
  const SCHEMA_VERSION = 1;
  const SEND_TIMEOUT_MS = 20000;

  // Records always use the base (English) structure, so ids and option values line up
  // whatever language a person filled the registry in.
  const base = () => window.getReg("en");

  function newRecordId() {
    const prefix = window.RegistryConfig.recordIdPrefix || "UC";
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => alphabet[b % alphabet.length]).join("");
    return `${prefix}-${ymd}-${suffix}`;
  }

  const allFields = (reg) => reg.tiers.flatMap((t) => t.sections.flatMap((s) => s.fields));

  function fieldValue(field, answers) {
    if (field.kind === "contact") {
      const out = {};
      field.subfields.forEach((sf) => { out[sf.key] = (answers[`${field.id}.${sf.key}`] || "").trim(); });
      return out;
    }
    return (answers[field.id] || "").trim();
  }

  // The name and area start at intake and can be edited during documentation. The documented
  // values win, so the review page and the record always agree.
  function currentIntake(intake, answers) {
    const documented = (key) => {
      const f = allFields(base()).find((field) => field.derivedFromIntake === key);
      return ((f && answers[f.id]) || intake[key] || "").trim();
    };
    return { useCaseName: documented("useCaseName"), operationalArea: documented("operationalArea") };
  }

  // Finishing screening confirms the intake values, so they replace the documented ones.
  function applyIntake(answers, intake) {
    const next = { ...answers };
    allFields(base()).forEach((f) => {
      if (f.derivedFromIntake && intake[f.derivedFromIntake]) next[f.id] = intake[f.derivedFromIntake];
    });
    return next;
  }

  // state = { meta: {id, createdAt, submittedAt}, lang, screening: {tier, intake, answers}, answers }
  // screening.answers is {groupId: {questionId: "yes" | "no"}}; answers holds field values.
  function buildRecord(state, { status = "draft" } = {}) {
    const reg = base();
    const { tier, intake, answers: groupAnswers } = state.screening;
    const screeningAnswers = {};
    Object.values(groupAnswers || {}).forEach((g) => Object.assign(screeningAnswers, g));

    const fields = {};
    reg.getSectionsForTier(tier).forEach((g) => g.sections.forEach((s) => {
      s.fields.forEach((f) => { fields[f.id] = fieldValue(f, state.answers); });
    }));

    const current = currentIntake(intake, state.answers);

    // A submitted record keeps one timestamp, so every download of it matches.
    const now = (status === "submitted" && state.meta.submittedAt) || new Date().toISOString();
    const t = reg.tier(tier);
    return {
      schema: SCHEMA,
      schemaVersion: SCHEMA_VERSION,
      id: state.meta.id,
      status,
      createdAt: state.meta.createdAt,
      updatedAt: now,
      submittedAt: status === "submitted" ? state.meta.submittedAt || now : null,
      organization: window.RegistryConfig.organization || "",
      language: state.lang,
      contentVersion: reg.startPage.version || "",
      useCase: { name: current.useCaseName, operationalArea: current.operationalArea },
      screening: { tier, tierLabel: t ? t.label : "", answers: screeningAnswers },
      fields,
    };
  }

  // ---- CSV ----
  // One column per screening question and per field across every tier, so rows from any
  // tier line up in one spreadsheet. Each header starts with its id (e.g. "A1.2", or
  // "A1.7.name" for part of a contact) followed by the base-language name, so tools can
  // match columns by the first word.
  function csvColumns() {
    const reg = base();
    const cols = [
      ["record_id", (r) => r.id],
      ["status", (r) => r.status],
      ["submitted_at", (r) => r.submittedAt || ""],
      ["updated_at", (r) => r.updatedAt],
      ["organization", (r) => r.organization],
      ["use_case_name", (r) => r.useCase.name],
      ["operational_area", (r) => r.useCase.operationalArea],
      ["tier", (r) => r.screening.tier],
      ["tier_label", (r) => r.screening.tierLabel],
    ];
    reg.screening.forEach((g) => g.questions.forEach((q) => {
      cols.push([`${q.id} ${q.title}`, (r) => r.screening.answers[q.id] || ""]);
    }));
    allFields(reg).forEach((f) => {
      if (f.kind === "contact") {
        f.subfields.forEach((sf) => {
          cols.push([`${f.id}.${sf.key} ${f.name}: ${sf.label}`, (r) => (r.fields[f.id] || {})[sf.key] || ""]);
        });
      } else {
        cols.push([`${f.id} ${f.name}`, (r) => r.fields[f.id] || ""]);
      }
    });
    return cols;
  }

  function csvCell(value) {
    let s = String(value == null ? "" : value);
    // Stop spreadsheet apps from running a cell as a formula.
    if (/^[=+@\t\r]/.test(s) || /^-\S/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  // A header row, plus the record's row when one is given. The leading BOM makes Excel
  // read accented characters correctly.
  function recordToCsv(record) {
    const cols = csvColumns();
    const lines = [cols.map((c) => csvCell(c[0])).join(",")];
    if (record) lines.push(cols.map((c) => csvCell(c[1](record))).join(","));
    return "﻿" + lines.join("\r\n") + "\r\n";
  }

  // ---- Downloads ----
  function download(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function slug(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .slice(0, 40) || "use-case";
  }

  const fileBase = (record) => `${record.id}-${slug(record.useCase.name)}`;

  function downloadJson(record, suffix = "") {
    download(`${fileBase(record)}${suffix}.json`, JSON.stringify(record, null, 2) + "\n", "application/json");
  }

  function downloadCsv(record) {
    download(`${fileBase(record)}.csv`, recordToCsv(record), "text/csv;charset=utf-8");
  }

  function downloadTemplate() {
    download("registry-inventory.csv", recordToCsv(null), "text/csv;charset=utf-8");
  }

  // ---- Import ----
  // Turn a record back into app state. Throws if it isn't a record this registry can open.
  function recordToState(record) {
    if (!record || record.schema !== SCHEMA || !(record.schemaVersion <= SCHEMA_VERSION)) {
      throw new Error("Not a registry record");
    }
    const reg = base();
    const tier = Number(record.screening && record.screening.tier);
    if (!reg.tier(tier)) throw new Error(`Unknown tier: ${tier}`);

    // The screens treat the name and area as text, so anything else can't be opened.
    const useCase = record.useCase || {};
    [useCase.name, useCase.operationalArea].forEach((value) => {
      if (value != null && typeof value !== "string") throw new Error("Not a registry record");
    });

    const flat = (record.screening && record.screening.answers) || {};
    const groupAnswers = {};
    reg.screening.forEach((g) => {
      groupAnswers[g.id] = {};
      g.questions.forEach((q) => {
        if (flat[q.id] === "yes" || flat[q.id] === "no") groupAnswers[g.id][q.id] = flat[q.id];
      });
    });

    const stored = record.fields || {};
    const answers = {};
    allFields(reg).forEach((f) => {
      const v = stored[f.id];
      if (f.kind === "contact" && v && typeof v === "object") {
        f.subfields.forEach((sf) => {
          if (typeof v[sf.key] === "string") answers[`${f.id}.${sf.key}`] = v[sf.key];
        });
      } else if (typeof v === "string") {
        answers[f.id] = v;
      }
    });

    // What doesn't carry over when the record was made with different questions or fields.
    // Screening asks groups in order and stops at the first "yes", so only the groups up to
    // that point need answers.
    let screenedTier = reg.baseTier;
    let unanswered = 0;
    for (const g of reg.screening) {
      const missing = g.questions.filter((q) => !groupAnswers[g.id][q.id]).length;
      unanswered += missing;
      if (missing) break;
      if (g.questions.some((q) => groupAnswers[g.id][q.id] === "yes")) {
        screenedTier = g.tier;
        break;
      }
    }
    const currentVersion = reg.startPage.version || "";
    const notes = {
      recordVersion: record.contentVersion || "",
      currentVersion,
      versionChanged: Boolean(record.contentVersion) && record.contentVersion !== currentVersion,
      droppedFields: Object.keys(stored).filter((id) => !allFields(reg).some((f) => f.id === id)),
      needsScreening: unanswered > 0 || screenedTier !== tier,
    };

    return {
      notes,
      meta: {
        id: typeof record.id === "string" && record.id ? record.id : newRecordId(),
        createdAt: record.createdAt || new Date().toISOString(),
      },
      lang: record.language,
      screening: {
        tier,
        intake: { useCaseName: useCase.name || "", operationalArea: useCase.operationalArea || "" },
        answers: groupAnswers,
      },
      answers,
    };
  }

  function readRecordFile(file) {
    return file.text().then((text) => recordToState(JSON.parse(text)));
  }

  // ---- Optional hand-off to the organization's own system ----
  // Resolves to false when no submit.url is configured. If the record doesn't get through,
  // rejects with an Error whose `kind` is "unreachable" (no answer at all) or "refused"
  // (the endpoint answered but didn't accept it), and whose message gives the reason.
  async function sendRecord(record) {
    const { url, contentType } = window.RegistryConfig.submit || {};
    if (!url) return false;
    const fail = (kind, message) => Object.assign(new Error(message), { kind });
    // Give up on an endpoint that doesn't answer, rather than showing "Sending…" forever.
    // The deadline covers reading the reply too: an endpoint can send headers and then stall.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": contentType || "application/json" },
        body: JSON.stringify(record),
        signal: controller.signal,
      });
      if (!res.ok) throw fail("refused", `HTTP ${res.status}`);
      const type = res.headers.get("Content-Type") || "";
      const text = await res.text();
      if (type.includes("json")) {
        // An endpoint can refuse a record with a JSON reply of {"ok": false, "error": "..."}.
        let reply = null;
        try { reply = JSON.parse(text); } catch (e) { /* not JSON after all: accepted */ }
        if (reply && reply.ok === false) throw fail("refused", reply.error || "Refused");
      } else if (type.includes("html")) {
        // A web page instead of a confirmation is almost always an error page. Apps Script,
        // for one, sends its error page with status 200.
        throw fail("refused", "The endpoint replied with a web page instead of a confirmation");
      }
      return true;
    } catch (err) {
      if (err.kind) throw err;
      throw fail("unreachable", controller.signal.aborted ? `No reply within ${SEND_TIMEOUT_MS / 1000} seconds` : err.message || "Network error");
    } finally {
      clearTimeout(timer);
    }
  }

  window.Records = {
    newRecordId,
    currentIntake,
    applyIntake,
    buildRecord,
    recordToCsv,
    downloadJson,
    downloadCsv,
    downloadTemplate,
    readRecordFile,
    sendRecord,
  };
})();
