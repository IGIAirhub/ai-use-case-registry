// Shared test helpers: load the real app scripts and the Apps Script without a browser.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const readRepoFile = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

// Objects from a vm context have that context's prototypes, which deepStrictEqual rejects.
export const plain = (value) => JSON.parse(JSON.stringify(value));

// Run the plain scripts index.html loads, in the same order. Babel and React DOM are only
// needed for rendering, which tests/browser.test.mjs covers.
export function loadApp({ fetch } = {}) {
  const context = vm.createContext({
    console,
    crypto: globalThis.crypto,
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
    Blob,
    fetch,
    document: { title: "", documentElement: { style: { setProperty() {} } } },
  });
  context.window = context;
  context.self = context;
  const scripts = [...readRepoFile("index.html").matchAll(/<script\s+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => !/babel|react-dom/.test(src));
  scripts.forEach((src) => vm.runInContext(readRepoFile(src), context, { filename: src }));
  return context;
}

// The app state for a use case that reached `tier`, with the screening answers the real
// flow would keep: groups in order, stopping at the first "yes".
export function makeState(app, tier, { intake, answers = {} } = {}) {
  const reg = app.getReg("en");
  const screening = {};
  for (const group of reg.screening) {
    const yes = group.tier === tier;
    screening[group.id] = Object.fromEntries(group.questions.map((q) => [q.id, yes ? "yes" : "no"]));
    if (yes) break;
  }
  return {
    meta: { id: "UC-20260101-TEST", createdAt: "2026-01-01T00:00:00.000Z" },
    lang: "en",
    screening: { tier, intake: intake || { useCaseName: "Chatbot", operationalArea: "Support" }, answers: screening },
    answers,
  };
}

// Split one CSV line into cells, undoing the quoting.
export function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted && c === '"' && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += c;
    }
  }
  cells.push(cell);
  return cells;
}

// ---- Apps Script ----
// A stand-in for a Google Sheet. Like the real one, a new tab has 26 columns and a range
// past the last column throws. Mocked from Google's documented behavior, not run against it.
function makeSheet(rows = [], maxColumns = 26) {
  const sheet = {
    rows,
    maxColumns,
    getLastRow: () => sheet.rows.length,
    getLastColumn: () => sheet.rows.reduce((most, row) => Math.max(most, row.length), 0),
    getMaxColumns: () => sheet.maxColumns,
    insertColumnsAfter: (after, count) => { sheet.maxColumns += count; },
    appendRow: (row) => {
      sheet.rows.push(row);
      sheet.maxColumns = Math.max(sheet.maxColumns, row.length);
    },
    getRange: (row, column, rowCount, columnCount) => {
      if (column + columnCount - 1 > sheet.maxColumns) {
        throw new Error("The coordinates of the range are outside the dimensions of the sheet.");
      }
      return {
        getValues: () => Array.from({ length: rowCount }, (_, i) =>
          Array.from({ length: columnCount }, (_, j) => (sheet.rows[row - 1 + i] || [])[column - 1 + j] ?? "")),
        setValues: (values) => values.forEach((cells, i) => {
          sheet.rows[row - 1 + i] = sheet.rows[row - 1 + i] || [];
          cells.forEach((cell, j) => { sheet.rows[row - 1 + i][column - 1 + j] = cell; });
        }),
      };
    },
  };
  return sheet;
}

// Load the script against a mock spreadsheet. Pass header cells to start from an imported
// template, whose tab is exactly as wide as its header.
export function loadSheetsScript({ header } = {}) {
  const tabs = header ? { Inventory: makeSheet([header], header.length) } : {};
  const context = vm.createContext({
    console,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name) => tabs[name] || null,
        insertSheet: (name) => (tabs[name] = makeSheet()),
      }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (text) => ({ setMimeType: () => text }) },
  });
  vm.runInContext(readRepoFile("integrations/google-sheets-apps-script.gs"), context);
  return {
    tab: () => tabs.Inventory,
    constant: (name) => vm.runInContext(name, context),
    post: (body, token = vm.runInContext("TOKEN", context)) => JSON.parse(context.doPost({
      parameter: { token },
      postData: { contents: typeof body === "string" ? body : JSON.stringify(body) },
    })),
  };
}
