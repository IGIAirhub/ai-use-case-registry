// Runs the real app in headless Chrome. Skipped when Chrome or Node's WebSocket (Node 22+)
// isn't available.

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { after, before, beforeEach, afterEach, describe, it } from "node:test";
import { findChrome, startChrome } from "./chrome.mjs";
import { root } from "./helpers.mjs";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".jsx": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const executable = typeof WebSocket === "undefined" ? null : findChrome();

describe("the registry in a browser", { skip: executable ? false : "Chrome or WebSocket not available" }, () => {
  let server;
  let chrome;
  let page;
  let address;

  before(async () => {
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/$/, "/index.html");
      const file = path.join(root, rel);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    address = `http://127.0.0.1:${server.address().port}/`;
    chrome = await startChrome(executable);
  });

  after(async () => {
    await chrome?.close();
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  });

  beforeEach(async () => {
    page = await chrome.newPage();
    await page.goto(address);
    await page.waitFor(`Boolean(document.querySelector(".cta-begin"))`);
    // Capture downloads instead of saving them.
    await page.evaluate(`(() => {
      const createObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { window.lastDownload = blob; return createObjectURL(blob); };
      HTMLAnchorElement.prototype.click = () => {};
    })()`);
  });

  afterEach(() => page.close());

  // ---- Moving through the app ----
  const fillIntake = async (name, area) => {
    await page.fill(".intake-grid input", name, 0);
    await page.fill(".intake-grid input", area, 1);
  };
  // From intake to documentation, answering "no" to every question: the lowest tier.
  const finishScreening = async () => {
    await page.click(".nav-row .btn.primary");
    while (await page.has(".yn-toggle")) {
      await page.evaluate(`document.querySelectorAll(".yn-toggle").forEach((t) => t.querySelector(".yn-seg").click())`);
      await page.click(".actionbar-buttons .btn.primary");
    }
    await page.click(".result-actions .btn.primary");
    await page.waitFor(`Boolean(document.querySelector(".doc-title-input"))`);
  };
  const toDocumentation = async (name = "Chatbot", area = "Support") => {
    await page.click(".cta-begin");
    await fillIntake(name, area);
    await finishScreening();
  };
  const backToIntake = async () => {
    await page.click(".doc-content .nav-row .btn.ghost");
    await page.waitFor(`Boolean(document.querySelector(".intake-grid"))`);
  };
  const toReview = async () => {
    await page.click(".doc-content .nav-row .btn.primary");
    await page.waitFor(`Boolean(document.querySelector(".preview-head h1"))`);
  };
  const submitAndDownload = async () => {
    await page.click(".preview-wrap .btn.primary");
    await page.waitFor(`Boolean(document.querySelector(".submit-panel"))`);
    await page.click(".submit-panel .btn.primary");
    return JSON.parse(await page.evaluate("window.lastDownload.text()"));
  };

  const expectEverywhere = async (name, area, oldValues = []) => {
    assert.equal(await page.text(".preview-head h1"), name);
    const review = await page.text(".preview-wrap");
    assert.ok(review.includes(area), `review page should show "${area}"`);
    oldValues.forEach((old) => assert.ok(!review.includes(old), `review page still shows "${old}"`));
    const record = await submitAndDownload();
    assert.equal(record.useCase.name, name);
    assert.equal(record.useCase.operationalArea, area);
    return record;
  };

  // ---- Tests ----
  it("starts without errors", async () => {
    assert.ok(await page.has(".cta-begin"));
    assert.deepEqual(page.exceptions, []);
  });

  it("carries the intake name and area through to the record", async () => {
    await toDocumentation("Chatbot", "Support");
    assert.equal(await page.value(".doc-title-input"), "Chatbot");
    assert.equal(await page.value(".doc-area-input"), "Support");
    await toReview();
    await expectEverywhere("Chatbot", "Support");
  });

  it("shows a rename made during documentation on the review page", async () => {
    await toDocumentation("Chatbot", "Support");
    await page.fill(".doc-title-input", "Player Support Bot");
    await page.fill(".doc-area-input", "Customer Service");
    await toReview();
    await expectEverywhere("Player Support Bot", "Customer Service", ["Chatbot", "Support\n"]);
  });

  it("carries a rename made at intake into documentation and the record", async () => {
    await toDocumentation("Old Name", "Old Area");
    await backToIntake();
    await fillIntake("New Name", "New Area");
    await finishScreening();
    assert.equal(await page.value(".doc-title-input"), "New Name");
    assert.equal(await page.value(".doc-area-input"), "New Area");
    await toReview();
    await expectEverywhere("New Name", "New Area", ["Old Name", "Old Area"]);
  });

  it("shows a documentation rename when going back to intake", async () => {
    await toDocumentation("Chatbot", "Support");
    await page.fill(".doc-title-input", "Player Support Bot");
    await backToIntake();
    assert.equal(await page.value(".intake-grid input"), "Player Support Bot");
  });

  it("keeps a documentation rename after passing back through screening unchanged", async () => {
    await toDocumentation("Chatbot", "Support");
    await page.fill(".doc-title-input", "Player Support Bot");
    await backToIntake();
    await finishScreening();
    assert.equal(await page.value(".doc-title-input"), "Player Support Bot");
    await toReview();
    await expectEverywhere("Player Support Bot", "Support", ["Chatbot"]);
  });

  it("keeps other documentation answers after going back to intake", async () => {
    await toDocumentation();
    await page.fill(".doc-content textarea", "A written summary");
    await backToIntake();
    await fillIntake("New Name", "New Area");
    await finishScreening();
    assert.equal(await page.value(".doc-content textarea"), "A written summary");
  });

  it("discards an intake change that was never finished", async () => {
    await toDocumentation("Chatbot", "Support");
    await backToIntake();
    await fillIntake("Abandoned", "Abandoned");
    await page.click(".nav-row .btn.ghost"); // back to the start page
    await page.click(".cta-begin");
    await page.waitFor(`Boolean(document.querySelector(".intake-grid"))`);
    assert.equal(await page.value(".intake-grid input"), "Chatbot");
  });
});
