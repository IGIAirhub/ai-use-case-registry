/**
 * AI Use Case Registry → Google Sheets
 *
 * Appends every submitted registry record as a row in this spreadsheet.
 * Setup steps are in docs/integrations.md. In short:
 *   1. In your Google Sheet: Extensions → Apps Script, paste this file, save.
 *   2. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 *   3. Copy the web app URL into registry.config.js → submit.url, adding
 *      ?token=<the TOKEN below> to the end.
 *
 * If the tab already has a header row (for example from
 * templates/registry-inventory.csv), values go into the matching columns by id.
 * Otherwise the script writes a header row of ids itself. New fields you add to the
 * registry later get new columns at the end.
 *
 * After editing this file (for example to change TOKEN), deploy again:
 * Deploy → Manage deployments → Edit → Version: New version. Until then the old code runs.
 */

// Name of the tab to write to. It's created if it doesn't exist. If you imported the
// template CSV, rename that tab to this name (or change this to match), or the script
// writes to a new, separate tab.
const SHEET_NAME = "Inventory";

// A shared value that must appear as ?token=... on the submit URL. It only stops casual
// misuse: anyone who can open your registry can read it in registry.config.js.
const TOKEN = "change-me";

// Question and field ids become column headers, so anyone who can read TOKEN could otherwise
// send an id that runs as a spreadsheet formula, or add columns without limit.
const VALID_ID = /^[A-Za-z0-9][\w.-]{0,63}$/;
const MAX_COLUMNS = 500;

function doPost(e) {
  // Any error must still come back as {ok: false}. Otherwise Apps Script answers with an
  // HTML error page, and the person submitting isn't told their record didn't arrive.
  try {
    return reply(handle(e));
  } catch (err) {
    return reply({ ok: false, error: String((err && err.message) || err) });
  }
}

function handle(e) {
  if (TOKEN && e.parameter.token !== TOKEN) return { ok: false, error: "Wrong or missing token" };

  if (!e.postData || !e.postData.contents) return { ok: false, error: "No record in the request" };
  let record;
  try {
    record = JSON.parse(e.postData.contents);
  } catch (err) {
    return { ok: false, error: "Body is not JSON" };
  }
  if (record.schema !== "ai-use-case-registry/record") return { ok: false, error: "Not a registry record" };

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: "The sheet is busy. Try again in a moment." };
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    const values = flatten(record);
    const badId = Object.keys(values).find((id) => !VALID_ID.test(id));
    if (badId !== undefined) return { ok: false, error: "Invalid question or field id: " + badId };

    // Match columns by the first word of each header ("A1.2 Use Case Summary" -> "A1.2").
    let header = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map((h) => String(h).replace(/^\uFEFF/, ""))
      : [];
    const ids = header.map((h) => h.split(" ")[0]);
    Object.keys(values).forEach((id) => {
      if (!ids.includes(id)) {
        ids.push(id);
        header.push(id);
      }
    });
    if (header.length > MAX_COLUMNS) return { ok: false, error: "This record would need too many columns" };

    // A new tab has only 26 columns, and writing past the last one throws.
    const extraColumns = header.length - sheet.getMaxColumns();
    if (extraColumns > 0) sheet.insertColumnsAfter(sheet.getMaxColumns(), extraColumns);
    sheet.getRange(1, 1, 1, header.length).setValues([header]);

    // "Try again" after a slow reply can resend a submission that already arrived, so skip
    // a row with the same record_id and submitted_at. An updated record, submitted again
    // later, has a new submitted_at and gets its own row.
    const idCol = ids.indexOf("record_id");
    const atCol = ids.indexOf("submitted_at");
    if (idCol >= 0 && atCol >= 0 && sheet.getLastRow() > 1) {
      const text = (v) => (v instanceof Date ? v.toISOString() : String(v));
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, ids.length).getValues();
      if (rows.some((row) => text(row[idCol]) === String(values.record_id) && text(row[atCol]) === String(values.submitted_at))) {
        return { ok: true, id: record.id, duplicate: true };
      }
    }
    sheet.appendRow(ids.map((id) => safe(values[id])));
  } finally {
    lock.releaseLock();
  }
  return { ok: true, id: record.id };
}

// One value per column id, mirroring the registry's CSV export.
function flatten(r) {
  const out = {
    record_id: r.id,
    status: r.status,
    submitted_at: r.submittedAt || "",
    updated_at: r.updatedAt,
    organization: r.organization,
    use_case_name: (r.useCase || {}).name,
    operational_area: (r.useCase || {}).operationalArea,
    tier: (r.screening || {}).tier,
    tier_label: (r.screening || {}).tierLabel,
  };
  const answers = (r.screening || {}).answers || {};
  Object.keys(answers).forEach((id) => { out[id] = answers[id]; });
  const fields = r.fields || {};
  Object.keys(fields).forEach((id) => {
    const v = fields[id];
    if (v && typeof v === "object") {
      Object.keys(v).forEach((key) => { out[id + "." + key] = v[key]; });
    } else {
      out[id] = v;
    }
  });
  return out;
}

// Keep text from being run as a spreadsheet formula.
function safe(v) {
  const s = v == null ? "" : String(v);
  return /^[=+@-]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
