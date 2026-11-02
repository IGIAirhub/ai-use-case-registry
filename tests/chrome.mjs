// A small driver for headless Chrome over its DevTools protocol, so the browser tests
// need no npm install. Set CHROME_PATH to use a particular browser.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
const COMMANDS = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];

export function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const installed = CANDIDATES.find((file) => fs.existsSync(file));
  if (installed) return installed;
  return COMMANDS.find((command) => spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0);
}

export async function startChrome(executable) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "registry-chrome-"));
  const args = ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`];
  // CI runners don't allow Chrome's sandbox. The tests only load this project's own files.
  if (process.env.CI) args.push("--no-sandbox");
  const browser = spawn(executable, [...args, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });

  const address = await new Promise((resolve, reject) => {
    let output = "";
    browser.stderr.on("data", (chunk) => {
      output += chunk;
      const found = output.match(/DevTools listening on (ws:\S+)/);
      if (found) resolve(found[1]);
    });
    browser.on("error", reject);
    browser.on("exit", (code) => reject(new Error(`Chrome exited with code ${code}: ${output}`)));
  });

  const socket = new WebSocket(address);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const waiting = new Map();
  const exceptions = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails);
    if (!waiting.has(message.id)) return;
    const { resolve, reject, method } = waiting.get(message.id);
    waiting.delete(message.id);
    if (message.error) reject(new Error(`${method}: ${message.error.message}`));
    else resolve(message.result);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    waiting.set(id, { resolve, reject, method });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });

  return {
    async newPage() {
      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      await send("Runtime.enable", {}, sessionId);
      return makePage(send, sessionId, targetId, exceptions);
    },
    async close() {
      browser.removeAllListeners("exit");
      socket.close();
      browser.kill();
      await new Promise((resolve) => setTimeout(resolve, 100));
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}

function makePage(send, sessionId, targetId, exceptions) {
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (exceptionDetails) throw new Error(`${expression}: ${exceptionDetails.exception?.description || exceptionDetails.text}`);
    return result.value;
  };
  const waitFor = async (expression, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error(`Timed out waiting for: ${expression}`);
  };
  const selector = (css) => JSON.stringify(css);
  // Let React finish rendering what the last event changed.
  const settle = () => evaluate("new Promise((resolve) => setTimeout(resolve, 0))");

  return {
    evaluate,
    waitFor,
    exceptions,
    goto: async (url) => {
      await send("Page.navigate", { url }, sessionId);
    },
    has: (css) => evaluate(`Boolean(document.querySelector(${selector(css)}))`),
    text: (css) => evaluate(`document.querySelector(${selector(css)}).innerText`),
    value: (css) => evaluate(`document.querySelector(${selector(css)}).value`),
    async click(css) {
      await waitFor(`(() => { const el = document.querySelector(${selector(css)}); return el && !el.disabled; })()`);
      await evaluate(`document.querySelector(${selector(css)}).click()`);
      await settle();
    },
    // Set a value through the native setter so React sees the change.
    async fill(css, value, index = 0) {
      await waitFor(`document.querySelectorAll(${selector(css)}).length > ${index}`);
      await evaluate(`(() => {
        const el = document.querySelectorAll(${selector(css)})[${index}];
        const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event("input", { bubbles: true }));
      })()`);
      await settle();
    },
    close: () => send("Target.closeTarget", { targetId }),
  };
}
