// Builds the production version of the registry into dist/:
//   dist/                         compiled app: no in-browser Babel, works under a strict CSP
//   dist/ai-use-case-registry.html  everything inlined into one file that opens by double-click
//
// Usage: node scripts/build.mjs   (Node 18+, no npm install needed: it uses vendor/babel.min.js)

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const require = createRequire(import.meta.url);
const Babel = require(path.join(root, "vendor/babel.min.js"));

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const write = (rel, text) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};
const copy = (rel) => {
  const from = path.join(root, rel);
  const to = path.join(dist, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

fs.rmSync(dist, { recursive: true, force: true });

// ---- References to other files ----
// A path inside this folder, as opposed to a URL ("https://…", "data:…", "//…", "#…").
const isLocal = (ref) => Boolean(ref && ref.trim()) && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref.trim());
const decode = (ref) => { try { return decodeURI(ref); } catch { return ref; } };
const clean = (ref) => decode(ref.trim().split(/[?#]/)[0]).replace(/^\.?\//, "");
// Resolve a reference made from a file: "/x" is from the project folder, anything else
// from the referring file's folder.
const resolve = (fromRel, ref) =>
  ref.trim().startsWith("/") ? clean(ref) : path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), clean(ref)));
const outside = (rel) => rel === ".." || rel.startsWith("../") || path.isAbsolute(rel);
// A file (not a folder) at rel.
const isFile = (dir, rel) => {
  if (outside(rel)) return false;
  try { return fs.statSync(path.join(dir, rel)).isFile(); } catch { return false; }
};
const inRoot = (rel) => isFile(root, rel);
const inDist = (rel) => isFile(dist, rel);
// Referenced files that couldn't be copied, listed at the end so a broken logo or font
// doesn't go unnoticed.
const missing = new Set();
// A missing script leaves a blank page, so unlike those it fails the build.
const missingScripts = new Set();
const copyReferenced = (rel) => {
  if (!inRoot(rel)) return missing.add(outside(rel) ? `${rel} (outside the project folder)` : rel);
  if (!inDist(rel)) copy(rel);
};

// Tag attributes, whatever their order, quoting or neighbours.
const attrsOf = (text) => {
  const out = {};
  for (const m of text.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
};
const relsOf = (a) => (a.rel || "").toLowerCase().split(/\s+/);
// Links that load a file into the page, as opposed to canonical, alternate and other
// links to pages.
const loadsFile = (a) => relsOf(a).some((r) => /^(stylesheet|icon|apple-touch-icon|mask-icon|manifest|preload|modulepreload)$/.test(r));
const isBabelScript = (a) => /^text\/(babel|jsx)$/i.test((a.type || "").trim());
const isBabelCompiler = (rel) => /(^|\/)babel(\.min)?\.js$/i.test(rel);
const scriptTag = /<script\b([^>]*)>\s*<\/script>/gi; // external scripts (no inline code)
const linkTag = /<link\b([^>]*)>/gi;

// In stylesheets: url(...) and @import "...".
const cssRef = /url\(\s*(["']?)(.*?)\1\s*\)|@import\s+(["'])(.*?)\3/g;
const cssComment = /\/\*[\s\S]*?\*\//g;
const cssRefs = (css) => [...css.replace(cssComment, "").matchAll(cssRef)].map((m) => (m[2] ?? m[4]).trim()).filter(isLocal);
// Image paths written as strings in a script, e.g. the logo in registry.config.js. The
// browser resolves them from the page, not from the script.
const imagePath = /(["'])((?:\.?\/)?[^"'\n\r:]*?\.(?:svg|png|jpe?g|webp|gif|ico|avif))((?:[?#][^"'\n\r]*)?)\1/gi;
// Comments are left out when looking for those paths, so an old, commented-out logo isn't
// reported as missing. Rough, but enough for a config file: "//" after a colon or quote is
// part of a URL, not a comment.
const jsComments = (js) => js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

// 1. Files served as they are. Babel is left out: nothing is compiled in the browser.
["registry.config.js", "content", "app/config.js", "app/i18n.js", "app/records.js"].forEach(copy);
["react.production.min.js", "react-dom.production.min.js", "LICENSE-react.txt"].forEach((f) => copy(`vendor/${f}`));
["styles.css", "images", "LICENSE"].forEach((rel) => fs.existsSync(path.join(root, rel)) && copy(rel));
// The NOTICE without its Babel entry, since the build doesn't ship Babel.
if (inRoot("NOTICE")) {
  write("NOTICE", read("NOTICE").replace(/^[ \t]*Babel standalone[^\n]*\n(?:[ \t]+[^\n]*LICENSE-babel\.txt\)[^\n]*\n)?/m, ""));
}

// Plus anything else the page loads from this folder: scripts, stylesheets and icons in
// index.html, files those stylesheets point at (fonts, background images, @imports), and
// image paths in registry.config.js (a logo kept outside images/, say).
let html = read("index.html");
const stylesheets = [];
for (const m of html.matchAll(/<(link|script)\b([^>]*)>/gi)) {
  const a = attrsOf(m[2]);
  const ref = m[1].toLowerCase() === "link" ? a.href : a.src;
  if (!isLocal(ref) || (m[1].toLowerCase() === "link" && !loadsFile(a))) continue;
  const rel = resolve("index.html", ref);
  if (m[1].toLowerCase() === "script" && (isBabelScript(a) || isBabelCompiler(rel))) continue; // compiled or left out below
  if (m[1].toLowerCase() === "script" && !inRoot(rel)) {
    missingScripts.add(rel);
    continue;
  }
  copyReferenced(rel);
  if (relsOf(a).includes("stylesheet")) stylesheets.push(rel);
}
const followCss = (rel, seen = new Set()) => {
  if (seen.has(rel) || !inRoot(rel)) return;
  seen.add(rel);
  cssRefs(read(rel)).forEach((ref) => {
    const target = resolve(rel, ref);
    copyReferenced(target);
    if (/\.css$/i.test(target)) followCss(target, seen);
  });
};
stylesheets.forEach((rel) => followCss(rel));
[...jsComments(read("registry.config.js")).matchAll(imagePath)].forEach((m) => copyReferenced(resolve("index.html", m[2])));

// 2. Compile each Babel script. Each is wrapped in its own scope, as the browser compiler
//    does; files share components through window, never through top-level names.
const compiledName = (ref) => ref.replace(/\.jsx(?=[?#]|$)/i, ".js"); // keeps a ?v=2 on the end
const jsxFiles = [...html.matchAll(scriptTag)]
  .map((m) => attrsOf(m[1]))
  .filter((a) => isBabelScript(a) && isLocal(a.src))
  .map((a) => resolve("index.html", a.src));
jsxFiles.forEach((rel) => {
  if (!inRoot(rel)) return missingScripts.add(rel);
  const { code } = Babel.transform(read(rel), { presets: ["react"], filename: rel, comments: false });
  write(compiledName(rel), `(function () {\n${code}\n})();\n`);
});

// 3. index.html without Babel, pointing at the compiled files.
html = html.replace(/([ \t]*)<script\b([^>]*)>\s*<\/script>([ \t]*\r?\n)?/gi, (m, indent, attrText) => {
  const a = attrsOf(attrText);
  if (!isLocal(a.src)) return m;
  if (isBabelCompiler(resolve("index.html", a.src))) return "";
  if (!isBabelScript(a)) return m;
  return m
    .replace(/\s+type\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")
    .replace(a.src, compiledName(a.src.trim()));
});
write("index.html", html);

// 4. Single file: inline the stylesheets, every script and the files they reference.
//    Links to other sites (a web font service, say) stay links, so they still need a network.
const mime = {
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".ico": "image/x-icon", ".avif": "image/avif",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf", ".css": "text/css",
};
const dataUri = (rel, buffer = fs.readFileSync(path.join(dist, rel))) =>
  `data:${mime[path.extname(rel).toLowerCase()] || "application/octet-stream"};base64,${buffer.toString("base64")}`;
const distRead = (rel) => fs.readFileSync(path.join(dist, rel), "utf8");
const inlineImages = (code) =>
  code.replace(imagePath, (m, q, ref) => {
    const rel = resolve("index.html", ref);
    return inDist(rel) ? q + dataUri(rel) + q : m;
  });
// url(...) and @import references inside a stylesheet become data URIs, imported
// stylesheets with their own references inlined too.
const inlineCss = (cssRel, seen = new Set([cssRel])) =>
  distRead(cssRel).replace(cssRef, (m, q1, urlRef, q2, importRef) => {
    const ref = (urlRef ?? importRef).trim();
    const rel = isLocal(ref) ? resolve(cssRel, ref) : null;
    if (!rel || !inDist(rel)) return m;
    const uri = /\.css$/i.test(rel) && !seen.has(rel)
      ? dataUri(rel, Buffer.from(inlineCss(rel, new Set([...seen, rel]))))
      : dataUri(rel);
    return importRef !== undefined ? `@import url("${uri}")` : `url("${uri}")`;
  });
const safeScript = (code) => code.replace(/<\/script/gi, "<\\/script");

// The single file can travel on its own, so it carries the NOTICE (Apache 2.0 section 4d)
// and React's licence text, which the MIT License asks every copy to include.
const comment = (text) => text.replace(/--/g, "–");
const notice = [
  inDist("NOTICE") ? distRead("NOTICE") : "",
  inDist("vendor/LICENSE-react.txt") ? `React and React DOM:\n\n${distRead("vendor/LICENSE-react.txt")}` : "",
].filter(Boolean).map(comment).join("\n");
const noticeComment = notice ? `<!--\n${notice.trim()}\n\nSource and licenses: https://github.com/kasvegas/ai-use-case-registry\n-->\n` : "";

let single = html
  .replace(/^(﻿?\s*<!DOCTYPE[^>]*>[ \t]*\r?\n?)?/i, (m) => m + noticeComment)
  .replace(linkTag, (tag, attrText) => {
    const a = attrsOf(attrText);
    // A manifest stays a link: its own icon paths couldn't be found from a data URI.
    if (!isLocal(a.href) || !loadsFile(a) || relsOf(a).includes("manifest")) return tag;
    const rel = resolve("index.html", a.href);
    if (!inDist(rel)) return tag;
    if (relsOf(a).includes("stylesheet")) return `<style${a.media ? ` media="${a.media}"` : ""}>\n${inlineCss(rel)}\n</style>`;
    return tag.replace(a.href, dataUri(rel)); // icons and the like
  })
  .replace(scriptTag, (m, attrText) => {
    const a = attrsOf(attrText);
    if (!isLocal(a.src)) return m;
    const rel = resolve("index.html", a.src);
    if (!inDist(rel)) return m;
    const type = a.type && !/^(text|application)\/javascript$/i.test(a.type) ? ` type="${a.type}"` : "";
    return `<script${type}>\n${safeScript(inlineImages(distRead(rel)))}\n</script>`;
  });
write("ai-use-case-registry.html", single);

const kb = (rel) => `${Math.round(fs.statSync(path.join(dist, rel)).size / 1024)} KB`;
console.log(`Compiled ${jsxFiles.length} JSX files into dist/`);
console.log(`dist/index.html + assets, dist/ai-use-case-registry.html (${kb("ai-use-case-registry.html")})`);
if (missing.size) {
  console.warn(`\nWarning: these files are referenced but couldn't be copied, so they'll be missing from dist/:\n  ${[...missing].join("\n  ")}`);
}
if (missingScripts.size) {
  console.error(`\nError: index.html loads these scripts, but they don't exist, so the page wouldn't work:\n  ${[...missingScripts].join("\n  ")}`);
  process.exitCode = 1;
}
