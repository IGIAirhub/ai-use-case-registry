import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadApp, makeState, parseCsvLine, plain, readRepoFile } from "./helpers.mjs";

const app = loadApp();
const { Records } = app;
const reg = app.getReg("en");
const fields = reg.tiers.flatMap((t) => t.sections.flatMap((s) => s.fields));
const derivedId = (key) => fields.find((f) => f.derivedFromIntake === key).id;
const nameId = derivedId("useCaseName");
const areaId = derivedId("operationalArea");
const intake = { useCaseName: "Chatbot", operationalArea: "Support" };

describe("currentIntake", () => {
  it("uses the documented values when there are any", () => {
    const current = Records.currentIntake(intake, { [nameId]: "Support Bot", [areaId]: "Service" });
    assert.deepEqual(plain(current), { useCaseName: "Support Bot", operationalArea: "Service" });
  });

  it("falls back to intake for blank documented values", () => {
    const current = Records.currentIntake(intake, { [nameId]: "" });
    assert.deepEqual(plain(current), intake);
  });

  it("trims whitespace", () => {
    assert.equal(Records.currentIntake(intake, { [nameId]: "  Support Bot " }).useCaseName, "Support Bot");
  });
});

describe("applyIntake", () => {
  it("replaces the documented name and area and keeps other answers", () => {
    const next = Records.applyIntake({ [nameId]: "Old", [areaId]: "Old area", "A1.2": "Kept" }, intake);
    assert.equal(next[nameId], "Chatbot");
    assert.equal(next[areaId], "Support");
    assert.equal(next["A1.2"], "Kept");
  });

  it("doesn't change the answers it was given", () => {
    const answers = { [nameId]: "Old" };
    Records.applyIntake(answers, intake);
    assert.equal(answers[nameId], "Old");
  });

  it("doesn't blank a documented value when intake is empty", () => {
    const next = Records.applyIntake({ [nameId]: "Kept" }, { useCaseName: "", operationalArea: "" });
    assert.equal(next[nameId], "Kept");
  });
});

describe("buildRecord", () => {
  it("names the use case with the same values the review page shows", () => {
    const answers = { [nameId]: "Support Bot", [areaId]: "Service" };
    const record = Records.buildRecord(makeState(app, 1, { answers }));
    const current = Records.currentIntake(intake, answers);
    assert.equal(record.useCase.name, current.useCaseName);
    assert.equal(record.useCase.operationalArea, current.operationalArea);
  });

  it("includes every field its tier requires and none from higher tiers", () => {
    const expected = (tier) => reg.getSectionsForTier(tier).flatMap((g) => g.sections.flatMap((s) => s.fields.map((f) => f.id)));
    reg.tiers.forEach((t) => {
      const record = Records.buildRecord(makeState(app, t.level));
      assert.deepEqual(plain(Object.keys(record.fields).sort()), plain(expected(t.level).sort()));
    });
  });

  it("stores contact fields as objects keyed by subfield", () => {
    const contact = fields.find((f) => f.kind === "contact");
    const subfield = contact.subfields[0].key;
    const record = Records.buildRecord(makeState(app, 1, { answers: { [`${contact.id}.${subfield}`]: " Ada " } }));
    assert.equal(record.fields[contact.id][subfield], "Ada");
  });

  it("flattens screening answers by question id", () => {
    const record = Records.buildRecord(makeState(app, 1));
    const questions = reg.screening.flatMap((g) => g.questions.map((q) => q.id));
    assert.deepEqual(plain(Object.keys(record.screening.answers).sort()), plain(questions.sort()));
  });

  it("gives a draft no submission time", () => {
    assert.equal(Records.buildRecord(makeState(app, 1), { status: "draft" }).submittedAt, null);
  });

  it("gives every download of a submitted record the same timestamps", () => {
    const state = makeState(app, 1);
    state.meta.submittedAt = "2026-02-02T00:00:00.000Z";
    const record = Records.buildRecord(state, { status: "submitted" });
    assert.equal(record.submittedAt, "2026-02-02T00:00:00.000Z");
    assert.equal(record.updatedAt, "2026-02-02T00:00:00.000Z");
  });
});

describe("recordToCsv", () => {
  const row = (answers) => {
    const lines = Records.recordToCsv(Records.buildRecord(makeState(app, 1, { answers }))).split("\r\n");
    return { header: parseCsvLine(lines[0].replace(/^﻿/, "")), cells: parseCsvLine(lines[1]) };
  };
  const cellFor = (answers, id) => {
    const { header, cells } = row(answers);
    return cells[header.findIndex((h) => h.split(" ")[0] === id)];
  };

  it("matches the inventory template in the repo", () => {
    assert.equal(Records.recordToCsv(null).replace(/^﻿/, ""), readRepoFile("templates/registry-inventory.csv").replace(/^﻿/, ""));
  });

  it("starts with a BOM so Excel reads accented characters", () => {
    assert.equal(Records.recordToCsv(null)[0], "﻿");
  });

  it("gives a row the same number of cells as the header", () => {
    const { header, cells } = row({ "A1.2": 'Has "quotes", and commas' });
    assert.equal(cells.length, header.length);
  });

  it("round-trips quotes and commas", () => {
    assert.equal(cellFor({ "A1.2": 'Has "quotes", and commas' }, "A1.2"), 'Has "quotes", and commas');
  });

  for (const formula of ["=1+1", "+1+1", "@SUM(A1)", "-1+1"]) {
    it(`stops ${formula} from running as a formula`, () => {
      assert.equal(cellFor({ "A1.2": formula }, "A1.2"), `'${formula}`);
    });
  }

  it("leaves a bulleted line alone", () => {
    assert.equal(cellFor({ "A1.2": "- first point" }, "A1.2"), "- first point");
  });
});

describe("readRecordFile", () => {
  const open = (record) => Records.readRecordFile({ text: async () => JSON.stringify(record) });
  const saved = (tier = 1, answers = { "A1.2": "Summary" }) => plain(Records.buildRecord(makeState(app, tier, { answers })));

  it("restores what a saved record holds", async () => {
    const state = await open(saved());
    assert.equal(state.meta.id, "UC-20260101-TEST");
    assert.equal(state.answers["A1.2"], "Summary");
    assert.equal(state.screening.tier, 1);
    assert.equal(state.screening.intake.useCaseName, "Chatbot");
    assert.equal(state.notes.needsScreening, false);
  });

  it("refuses a file that isn't a registry record", async () => {
    await assert.rejects(open({ schema: "something-else" }), /Not a registry record/);
  });

  it("refuses a record from a newer format", async () => {
    await assert.rejects(open({ ...saved(), schemaVersion: 999 }), /Not a registry record/);
  });

  it("refuses an unknown tier", async () => {
    await assert.rejects(open({ ...saved(), screening: { tier: 99, answers: {} } }), /Unknown tier/);
  });

  for (const [key, value] of [["name", 123], ["operationalArea", true], ["name", { text: "x" }]]) {
    it(`refuses ${JSON.stringify(value)} as the use case's ${key}`, async () => {
      const record = saved();
      record.useCase[key] = value;
      await assert.rejects(open(record), /Not a registry record/);
    });
  }

  it("opens a record with no name, area or use case at all", async () => {
    const record = saved();
    delete record.useCase;
    assert.equal((await open(record)).screening.intake.useCaseName, "");
    assert.equal((await open({ ...saved(), useCase: { name: null } })).screening.intake.useCaseName, "");
  });

  it("asks for screening again when the answers don't support the tier", async () => {
    const record = saved(3);
    record.screening.answers = {};
    assert.equal((await open(record)).notes.needsScreening, true);
  });

  it("reports fields this registry no longer has", async () => {
    const record = saved();
    record.fields.Z9 = "Old field";
    assert.deepEqual(plain((await open(record)).notes.droppedFields), ["Z9"]);
  });

  it("ignores field values that aren't text", async () => {
    const record = saved();
    record.fields["A1.2"] = 123;
    assert.equal((await open(record)).answers["A1.2"], undefined);
  });

  it("restores contact subfields", async () => {
    const contact = fields.find((f) => f.kind === "contact");
    const subfield = contact.subfields[0].key;
    const state = await open(saved(1, { [`${contact.id}.${subfield}`]: "Ada" }));
    assert.equal(state.answers[`${contact.id}.${subfield}`], "Ada");
  });
});

describe("sendRecord", () => {
  const reply = ({ ok = true, status = 200, type = "application/json", body = "{}" }) =>
    async () => ({ ok, status, headers: { get: () => type }, text: async () => body });
  const send = (fetch, url = "https://example.test/submit") => {
    const sender = loadApp({ fetch });
    sender.RegistryConfig.submit.url = url;
    return sender.Records.sendRecord({ id: "UC-1" });
  };

  it("sends nothing when no address is configured", async () => {
    assert.equal(await send(() => assert.fail("fetch was called"), ""), false);
  });

  it("posts the record as JSON", async () => {
    let sent;
    const fetch = async (url, options) => {
      sent = { url, method: options.method, body: options.body };
      return reply({})();
    };
    assert.equal(await send(fetch), true);
    assert.deepEqual(sent, { url: "https://example.test/submit", method: "POST", body: '{"id":"UC-1"}' });
  });

  it("treats a JSON refusal as refused and keeps its reason", async () => {
    await assert.rejects(send(reply({ body: '{"ok":false,"error":"Wrong or missing token"}' })), {
      kind: "refused",
      message: "Wrong or missing token",
    });
  });

  it("treats an HTTP error as refused", async () => {
    await assert.rejects(send(reply({ ok: false, status: 500 })), { kind: "refused", message: "HTTP 500" });
  });

  it("treats an HTML error page sent with status 200 as refused", async () => {
    await assert.rejects(send(reply({ type: "text/html", body: "<html>" })), { kind: "refused" });
  });

  it("treats a network failure as unreachable", async () => {
    await assert.rejects(send(async () => { throw new Error("Network down"); }), {
      kind: "unreachable",
      message: "Network down",
    });
  });
});

describe("newRecordId", () => {
  it("uses the prefix, date and an unambiguous random suffix", () => {
    assert.match(Records.newRecordId(), /^[A-Za-z0-9]+-\d{8}-[2-9A-HJ-NP-Z]{4}$/);
  });
});
