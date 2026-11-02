import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadApp, loadSheetsScript, plain } from "./helpers.mjs";

const app = loadApp();
const en = app.getReg("en");
const languages = Object.keys(app.REGISTRY_LOCALES);
const fieldsOf = (reg) => reg.tiers.flatMap((t) => t.sections.flatMap((s) => s.fields));
const questionsOf = (reg) => reg.screening.flatMap((g) => g.questions);

describe("registry content", () => {
  it("has no duplicate question or field ids", () => {
    const ids = [...questionsOf(en), ...fieldsOf(en)].map((item) => item.id);
    assert.deepEqual(plain(ids.filter((id, i) => ids.indexOf(id) !== i)), []);
  });

  it("uses only ids the Google Sheets script accepts", () => {
    const validId = loadSheetsScript().constant("VALID_ID");
    const ids = [
      ...questionsOf(en).map((q) => q.id),
      ...fieldsOf(en).flatMap((f) => (f.kind === "contact" ? f.subfields.map((sf) => `${f.id}.${sf.key}`) : [f.id])),
    ];
    assert.deepEqual(plain(ids.filter((id) => !validId.test(id))), []);
  });

  it("has a field for the name and area collected at intake", () => {
    const derived = fieldsOf(en).map((f) => f.derivedFromIntake).filter(Boolean).sort();
    assert.deepEqual(plain(derived), ["operationalArea", "useCaseName"]);
  });

  it("gives every screening group a tier that exists", () => {
    en.screening.forEach((g) => assert.ok(en.tier(g.tier), `no tier ${g.tier} for group ${g.id}`));
  });
});

describe("translations", () => {
  for (const lang of languages.filter((code) => code !== "en")) {
    const reg = app.getReg(lang);

    it(`${lang} has the same questions and fields as English`, () => {
      assert.deepEqual(plain(questionsOf(reg).map((q) => q.id)), plain(questionsOf(en).map((q) => q.id)));
      assert.deepEqual(plain(fieldsOf(reg).map((f) => f.id)), plain(fieldsOf(en).map((f) => f.id)));
    });

    it(`${lang} translates all the interface wording`, () => {
      const own = app.REGISTRY_LOCALES[lang].ui;
      assert.deepEqual(plain(Object.keys(en.ui).filter((key) => own[key] == null)), []);
    });
  }
});
