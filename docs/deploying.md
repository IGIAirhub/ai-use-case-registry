# Deploying and security

The registry is a set of static files: HTML, CSS, JavaScript and images. Anything that can serve files can host it, including an internal web server, SharePoint, IIS, nginx or a cloud storage bucket. There is no server code, database, login or tracking.

## Which version to deploy

| Version | Where | Use it when |
|---|---|---|
| **Source** (this repo) | `index.html` at the repo root | You're customizing it. Edit a file, reload, see the change. The browser compiles the `.jsx` files with Babel on every load |
| **Compiled build** | the `dist/` artifact from the **Build** workflow, or a release `.zip` | Production. Faster, no Babel, works under a strict Content Security Policy |
| **Single file** | `ai-use-case-registry.html`, inside the `dist` artifact or attached to each release | Trying it out or sharing it. Opens by double-click, no server needed |

The compiled build is produced by `scripts/build.mjs`, which needs Node.js 18 or later (`node scripts/build.mjs`). The repo's GitHub Actions workflow runs it on every push to `main`, so you don't need Node yourself: open **Actions → Build**, pick the latest run, and download **dist** under Artifacts. It holds the compiled build and the single file, with your branding. GitHub deletes artifacts after 90 days; for a lasting copy, publish a release (see [Your own copy on GitHub](#your-own-copy-on-github)).

Configuration and content changes work the same in every version, since the build copies `registry.config.js` and `content/` as they are. Edit them in `dist/` after building if you like. The single file has them inlined, so rebuild it after changing them.

The build also copies the other files your copy loads from its own folder: scripts, stylesheets, icons and a web manifest linked in `index.html`, files your stylesheet files point at (fonts, background images, `@import`s), and image paths in `registry.config.js`. Keep those inside the repo folder. If something referenced can't be found, the build lists it as a warning at the end of its log. It doesn't look inside a `<style>` block in `index.html` or inside a web manifest, so put fonts and background images in a stylesheet file, and copy a manifest's icons into `dist/` yourself.

## Security

**What the registry does with data.** It does nothing with it on its own. Answers live in the browser tab until someone downloads them or, if you set `submit.url`, the registry sends them to that address. Closing the tab discards them. Nothing is sent anywhere else, and every library is served from your own copy in `vendor/` (no CDN).

**Malicious files.** The interface never inserts raw HTML, since React escapes all text. So opening a tampered record file can't run scripts. The CSV export prefixes text that looks like a spreadsheet formula with `'`.

**Content Security Policy.** The compiled build runs under:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' <your submit.url origin>
```

It has been tested end to end under exactly that policy, with no violations. The source version also needs `'unsafe-eval'`, because Babel compiles code in the browser. Many organizations block that, which is why production should use the compiled build. The single file needs `'unsafe-inline'` for scripts and styles, since everything is inline. Use it for trying the registry out, not behind a strict policy.

**What adopters need to decide:**

- **Who can reach it.** Nothing leaks from the registry itself, but records describe sensitive governance detail. Host it behind your company sign-in, VPN or intranet rather than on the open internet.
- **The submit address.** Everything in `registry.config.js` is readable by anyone who can load the registry, including any token in `submit.url`. The endpoint must not trust a submission just because it arrived. Protect it with your hosting's authentication, and treat what it receives as input to review. A Google Apps Script set to "Anyone" is a public write URL (see [integrations.md](integrations.md)).
- **Where records are kept.** Downloaded JSON, CSV and PDF files land on people's computers. Decide where they should be stored (a shared folder with the right permissions). Each file is the full record, so if you share records outside your organization, decide what to remove first.
- **Updates.** React and Babel are pinned in `vendor/`. Check for security releases now and then, and replace the files with the same versions' production builds from npm.

## Your own copy on GitHub

**Keep it private.** A fork of a public repository is public too, so your `registry.config.js` (including any token in `submit.url`), your content and your materiality threshold would be published. Make a private copy instead: on GitHub choose **+ → Import repository** and set it to Private, or create an empty private repository and push a clone of this one to it. Never commit a token to a public repository.

1. **Make your private copy**, then open its **Actions** tab and enable workflows if GitHub asks.
2. **Every push to `main` builds** the registry. Download it from the run's **dist** artifact, as above. Pull requests build too.
3. **Releases:** when you publish a release in your copy, the workflow attaches `ai-use-case-registry.html` and a zip of the compiled build to it.
4. **GitHub Pages stays off.** It only publishes from a public repository (see below).
5. **`DEMO_LINK`** is only for AiR Hub's own public demo, where it adds a banner. Leave it unset.

## GitHub Pages (public demos only)

This is how AiR Hub publishes its public demo. Most organizations won't need it: Pages sites are public on the internet, and a real registry belongs behind your company sign-in (see [Security](#security)). Use it only for a copy anyone may see, such as a demo with no `submit.url`. The workflow deploys to Pages only when the repository is public **and** you opt in:

1. **Settings → Pages:** set **Source** to **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables:** add `DEPLOY_PAGES` with the value `true`.

The next push to `main` publishes the compiled build (or choose **Actions → Build → Run workflow** on `main`). A private repository never deploys to Pages.
