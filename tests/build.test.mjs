import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { root } from "./helpers.mjs";

// Builds a copy of the project, because the build deletes and recreates dist/.
describe("scripts/build.mjs", () => {
  let copy;
  let result;
  const built = (rel) => path.join(copy, "dist", rel);
  const readBuilt = (rel) => fs.readFileSync(built(rel), "utf8");

  before(() => {
    copy = fs.mkdtempSync(path.join(os.tmpdir(), "registry-build-"));
    const skip = new Set([".git", "dist", "tests"]);
    fs.cpSync(root, copy, { recursive: true, filter: (from) => !skip.has(path.relative(root, from)) });
    result = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: copy, encoding: "utf8" });
  });

  after(() => fs.rmSync(copy, { recursive: true, force: true }));

  it("finishes with no errors or missing files", () => {
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /couldn't be copied/);
  });

  it("compiles the JSX and drops in-browser Babel", () => {
    const html = readBuilt("index.html");
    assert.doesNotMatch(html, /babel/i);
    assert.doesNotMatch(html, /\.jsx/);
    assert.ok(fs.existsSync(built("app/app.js")));
    assert.ok(!fs.existsSync(built("vendor/babel.min.js")));
  });

  it("refers only to files that exist", () => {
    const refs = [...readBuilt("index.html").matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length > 0);
    refs.forEach((ref) => assert.ok(fs.existsSync(built(ref)), `missing ${ref}`));
  });

  it("makes a single file with everything inlined and the credits kept", () => {
    const single = readBuilt("ai-use-case-registry.html");
    assert.doesNotMatch(single, /<script[^>]+src=/);
    assert.doesNotMatch(single, /<link[^>]+rel="stylesheet"/);
    assert.match(single, /AiR Hub/);
  });

  it("carries the fixes into the compiled app", () => {
    assert.match(readBuilt("app/preview.js"), /currentIntake/);
    assert.match(readBuilt("app/app.js"), /applyIntake/);
  });
});

describe("scripts/build.mjs with missing files", () => {
  // Build a copy after changing it, and report how the build ended.
  const buildAfter = (change) => {
    const copy = fs.mkdtempSync(path.join(os.tmpdir(), "registry-build-"));
    const skip = new Set([".git", "dist", "tests"]);
    fs.cpSync(root, copy, { recursive: true, filter: (from) => !skip.has(path.relative(root, from)) });
    const editIndex = (edit) => {
      const file = path.join(copy, "index.html");
      fs.writeFileSync(file, edit(fs.readFileSync(file, "utf8")));
    };
    try {
      change({ copy, editIndex });
      return spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: copy, encoding: "utf8" });
    } finally {
      fs.rmSync(copy, { recursive: true, force: true });
    }
  };

  it("fails when a JSX file index.html loads doesn't exist", () => {
    const result = buildAfter(({ copy }) => fs.rmSync(path.join(copy, "app/preview.jsx")));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /app\/preview\.jsx/);
  });

  it("fails when a plain script index.html loads doesn't exist", () => {
    const result = buildAfter(({ editIndex }) =>
      editIndex((html) => html.replace("</body>", '<script src="app/gone.js"></script></body>')));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /app\/gone\.js/);
  });

  it("only warns about a missing image", () => {
    const result = buildAfter(({ editIndex }) =>
      editIndex((html) => html.replace("images/favicon.svg", "images/gone.svg")));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /Warning:[^]*images\/gone\.svg/);
  });
});
