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
  let demo = false; // serve the config the public demo uses

  before(async () => {
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/$/, "/index.html");
      const file = path.join(root, rel);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      if (demo && rel === "/registry.config.js") {
        res.end(`${fs.readFileSync(file, "utf8")}\nwindow.REGISTRY_CONFIG.demo = { href: "https://example.test" };\n`);
        return;
      }
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

  const open = async (url, readySelector) => {
    page = await chrome.newPage();
    await page.goto(url);
    await page.waitFor(`Boolean(document.querySelector(${JSON.stringify(readySelector)}))`);
    // Capture downloads instead of saving them, and answer dialogs instead of waiting on them.
    await page.evaluate(`(() => {
      const createObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => { window.lastDownload = blob; return createObjectURL(blob); };
      HTMLAnchorElement.prototype.click = () => {};
      window.print = () => {};
      window.confirmAnswer = true;
      window.confirms = [];
      window.confirm = (message) => { window.confirms.push(message); return window.confirmAnswer; };
      window.observersMade = 0;
      const Observer = window.IntersectionObserver;
      window.IntersectionObserver = class extends Observer {
        constructor(...args) {
          super(...args);
          window.observersMade++;
        }
      };
    })()`);
  };

  beforeEach(() => open(address, ".cta-begin"));

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

  const submit = async () => {
    await page.click(".preview-wrap .btn.primary");
    await page.waitFor(`Boolean(document.querySelector(".submit-panel"))`);
  };
  const clickHeader = () => page.click(".page-label");
  const resume = () => page.click(".cta-begin");
  const answerConfirmWith = (answer) => page.evaluate(`window.confirmAnswer = ${answer}`);
  const confirmCount = () => page.evaluate("window.confirms.length");
  const warnsOnLeave = () => page.evaluate(`(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })()`);
  const downloadDraft = async () => {
    await page.click(".doc-content .nav-row .btn.secondary");
    return page.evaluate("window.lastDownload.text()");
  };
  const openSavedRecord = (text) => page.evaluate(`(() => {
    const input = document.querySelector('input[type="file"]');
    const files = new DataTransfer();
    files.items.add(new File([${JSON.stringify(text)}], "record.json", { type: "application/json" }));
    input.files = files.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);

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

  it("shows an error instead of a blank page for a malformed saved record", async () => {
    await toDocumentation();
    const record = JSON.parse(await downloadDraft());
    await clickHeader();
    await openSavedRecord(JSON.stringify({ ...record, useCase: { name: 123, operationalArea: "Support" } }));
    await page.waitFor(`Boolean(document.querySelector(".import-error"))`);
    assert.equal(await page.has(".cta-begin"), true);
    assert.deepEqual(page.exceptions, []);
  });

  describe("the documentation side nav", () => {
    it("doesn't rebuild its scroll tracking while typing", async () => {
      await toDocumentation();
      const before = await page.evaluate("window.observersMade");
      await page.fill(".doc-content textarea", "A");
      await page.fill(".doc-content textarea", "AB");
      await page.fill(".doc-title-input", "Renamed");
      assert.ok(before > 0);
      assert.equal(await page.evaluate("window.observersMade"), before);
    });

    it("follows a language change", async () => {
      await toDocumentation();
      const english = await page.text(".doc-nav .nav-item");
      await page.click(".lang-opt:not(.active)");
      assert.notEqual(await page.text(".doc-nav .nav-item"), english);
    });
  });

  describe("leaving and coming back", () => {
    it("keeps a first screening left from the header, at the same step", async () => {
      await page.click(".cta-begin");
      await fillIntake("Chatbot", "Support");
      await page.click(".nav-row .btn.primary");
      await page.evaluate(`document.querySelector(".yn-toggle .yn-seg").click()`);
      await clickHeader();
      assert.equal(await confirmCount(), 1);
      await resume();
      assert.equal(await page.evaluate(`document.querySelectorAll(".yn-seg.sel").length`), 1);
      await page.click(".actionbar-buttons .btn.ghost");
      assert.equal(await page.value(".intake-grid input"), "Chatbot");
    });

    it("keeps edits made while going back through screening", async () => {
      await toDocumentation("Chatbot", "Support");
      await backToIntake();
      await fillIntake("Edited", "Edited Area");
      await clickHeader();
      await resume();
      assert.equal(await page.value(".intake-grid input"), "Edited");
    });

    it("keeps an unfinished intake change after the Back to home button", async () => {
      await toDocumentation("Chatbot", "Support");
      await backToIntake();
      await fillIntake("Unfinished", "Unfinished Area");
      await page.click(".nav-row .btn.ghost");
      await resume();
      assert.equal(await page.value(".intake-grid input"), "Unfinished");
    });

    it("doesn't ask before leaving a screening with nothing entered", async () => {
      await page.click(".cta-begin");
      await page.waitFor(`Boolean(document.querySelector(".intake-grid"))`);
      await clickHeader();
      assert.equal(await confirmCount(), 0);
      assert.equal(await page.has(".start-new"), false);
    });

    it("stays on the page when returning home is cancelled", async () => {
      await toDocumentation();
      await answerConfirmWith(false);
      await clickHeader();
      assert.equal(await page.has(".doc-title-input"), true);
    });

    it("resumes documentation and review where they were left", async () => {
      await toDocumentation();
      await page.fill(".doc-content textarea", "A written summary");
      await clickHeader();
      await resume();
      assert.equal(await page.value(".doc-content textarea"), "A written summary");
      await toReview();
      await clickHeader();
      await resume();
      assert.equal(await page.has(".preview-head h1"), true);
    });

    it("doesn't lose the resume point when the header is clicked on the start page", async () => {
      await toDocumentation();
      await clickHeader();
      await clickHeader();
      await resume();
      assert.equal(await page.has(".doc-title-input"), true);
    });
  });

  describe("starting a new use case", () => {
    it("starts clean, with a new record id", async () => {
      await toDocumentation("First", "First Area");
      await page.fill(".doc-content textarea", "First summary");
      const first = JSON.parse(await downloadDraft());
      await clickHeader();
      await page.click(".start-new");
      assert.equal(await page.value(".intake-grid input"), "");
      await fillIntake("Second", "Second Area");
      await finishScreening();
      assert.equal(await page.value(".doc-content textarea"), "");
      await toReview();
      const record = await expectEverywhere("Second", "Second Area", ["First"]);
      assert.notEqual(record.id, first.id);
      assert.ok(!JSON.stringify(record).includes("First"));
    });

    it("keeps the work when Start new is cancelled", async () => {
      await toDocumentation("First", "First Area");
      await clickHeader();
      await answerConfirmWith(false);
      await page.click(".start-new");
      await resume();
      assert.equal(await page.value(".doc-title-input"), "First");
    });

    it("offers only Begin when there's no work in progress", async () => {
      assert.equal(await page.has(".start-new"), false);
      await page.click(".cta-begin");
      assert.equal(await confirmCount(), 0);
    });
  });

  describe("opening a saved record over work in progress", () => {
    it("asks first, and keeps the work if cancelled", async () => {
      await toDocumentation("In Progress", "Area");
      const saved = (await downloadDraft()).replace("In Progress", "From File");
      await clickHeader();
      const asked = await confirmCount();
      await answerConfirmWith(false);
      await openSavedRecord(saved);
      await page.waitFor(`window.confirms.length > ${asked}`);
      await resume();
      assert.equal(await page.value(".doc-title-input"), "In Progress");
    });

    it("opens the record when the discard is accepted", async () => {
      await toDocumentation("In Progress", "Area");
      const saved = await downloadDraft();
      await clickHeader();
      await openSavedRecord(saved.replace(/In Progress/g, "From File"));
      await page.waitFor(`Boolean(document.querySelector(".doc-title-input"))`);
      assert.equal(await page.value(".doc-title-input"), "From File");
    });
  });

  describe("leaving a submitted record", () => {
    const submitted = async () => {
      await toDocumentation();
      await toReview();
      await submit();
    };
    const clickStartAnother = () => page.evaluate(`[...document.querySelectorAll(".preview-wrap .btn.primary")].pop().click()`);

    it("asks before the header erases an undownloaded record", async () => {
      await submitted();
      await answerConfirmWith(false);
      await clickHeader();
      assert.equal(await confirmCount(), 1);
      assert.equal(await page.has(".submit-panel"), true);
      await answerConfirmWith(true);
      await clickHeader();
      assert.equal(await page.has(".cta-begin"), true);
      assert.equal(await page.has(".start-new"), false);
    });

    it("asks before Start another erases an undownloaded record", async () => {
      await submitted();
      await answerConfirmWith(false);
      await clickStartAnother();
      assert.equal(await confirmCount(), 1);
      assert.equal(await page.has(".submit-panel"), true);
    });

    for (const [format, selector] of [["JSON", ".dl-row .btn.primary"], ["CSV", ".dl-row .btn.secondary"]]) {
      it(`doesn't ask once the ${format} is downloaded`, async () => {
        await submitted();
        await page.click(selector);
        await clickHeader();
        assert.equal(await confirmCount(), 0);
        assert.equal(await page.has(".cta-begin"), true);
      });
    }

    it("still asks after printing, which can be cancelled", async () => {
      await submitted();
      await page.click(".dl-row .btn.ghost");
      await answerConfirmWith(false);
      await clickHeader();
      assert.equal(await confirmCount(), 1);
    });
  });

  describe("warning before closing the page", () => {
    it("doesn't warn with nothing entered", async () => {
      assert.equal(await warnsOnLeave(), false);
      await page.click(".cta-begin");
      await page.waitFor(`Boolean(document.querySelector(".intake-grid"))`);
      assert.equal(await warnsOnLeave(), false);
    });

    it("warns from the first typed character, through to submission", async () => {
      await page.click(".cta-begin");
      await page.fill(".intake-grid input", "C", 0);
      assert.equal(await warnsOnLeave(), true);
      await page.fill(".intake-grid input", "Chatbot", 0);
      await page.fill(".intake-grid input", "Support", 1);
      await finishScreening();
      assert.equal(await warnsOnLeave(), true);
      await clickHeader();
      assert.equal(await warnsOnLeave(), true);
      await resume();
      await toReview();
      assert.equal(await warnsOnLeave(), true);
      await submit();
      assert.equal(await warnsOnLeave(), true);
    });

    it("stops warning once a submitted record is downloaded", async () => {
      await toDocumentation();
      await toReview();
      await submitAndDownload();
      assert.equal(await warnsOnLeave(), false);
    });

    it("stops warning after starting over", async () => {
      await toDocumentation();
      await clickHeader();
      await page.click(".start-new");
      await page.waitFor(`Boolean(document.querySelector(".intake-grid"))`);
      assert.equal(await warnsOnLeave(), false);
    });

    it("doesn't treat the demo's made-up screening answers as work", async () => {
      await page.close();
      demo = true;
      try {
        await open(`${address}#documentation`, ".doc-title-input");
        assert.equal(await warnsOnLeave(), false);
        await clickHeader();
        assert.equal(await confirmCount(), 0);
        assert.equal(await page.has(".start-new"), false);
      } finally {
        demo = false;
      }
    });
  });
});
