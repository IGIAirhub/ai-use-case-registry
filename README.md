# AI Use Case Registry

An adoptable AI use case registry for the gambling sector, from [AiR Hub](https://www.igiairhub.com/) at UNLV International Gaming Institute.

Each AI use case goes through a short screening that classifies its potential impact on players into one of three documentation tiers. The registry then asks only for the documentation that tier requires. Your organization runs it on its own infrastructure, and rebrands and adapts it as needed.

**Live demo:** https://kasvegas.github.io/ai-use-case-registry/

## How it works

1. **Screen.** A few yes/no questions about how the use case interacts with, or materially affects, individual players.
2. **Classify.** The answers place the use case in Tier 1, 2 or 3. The Tier 3 questions come first: any "yes" makes it Tier 3. Otherwise, any "yes" to the Tier 2 questions makes it Tier 2. If every answer is "no", it's Tier 1.
3. **Document.** Complete the fields for that tier. Tiers are additive: Tier 3 includes Tier 1 and 2.
4. **Hand it off.** The registry stores nothing itself. Each record leaves as a JSON file, a spreadsheet row (CSV) and a printable summary. If you configure it, the record is also sent to a system you choose.

| Tier | For use cases that… | What you document |
|---|---|---|
| 1 · Baseline | Don't target, analyze or address individual players | Use case overview, contact |
| 2 · Extended | Target, analyze or communicate with players, without materially affecting a consequential outcome | Tier 1, plus player interaction, transparency, internal governance |
| 3 · Comprehensive | Can materially affect access, money, protection, identity or other consequential decisions about players | Tiers 1 and 2, plus player impact, data privacy, risk mitigation, model architecture |

## Who it's for

Existing transparency and reporting frameworks offer foundational principles, but they aren't tailored to the nuances of the gambling industry. The registry draws on those broader tools and was refined through direct engagement with gambling sector stakeholders, so it fits this landscape.

- **Industry (operators, suppliers and others):** a structured internal framework to map, monitor and manage AI deployments, in line with corporate governance, risk management protocols and evolving compliance standards.
- **Regulators:** a standardized tool that could be recommended or mandated, giving the visibility needed to supervise industry practices, uphold legislation and protect consumers.

Adopt it at any scale: across an entire organization, within a single department or team, or on your own to document your own AI use.

## Quick start

```bash
git clone https://github.com/kasvegas/ai-use-case-registry
cd ai-use-case-registry
python3 -m http.server 8000      # or: npx serve .
```

Then open http://localhost:8000. The source version needs a web server, because the browser loads the `.jsx` files over HTTP. Opening `index.html` straight from disk won't work.

Prefer not to run anything? Each [release](https://github.com/kasvegas/ai-use-case-registry/releases) includes `ai-use-case-registry.html`, a single file that opens by double-click.

## Make it yours

| To change | Edit |
|---|---|
| Organization name, logo, colors, fonts, languages, submit address | [`registry.config.js`](registry.config.js) |
| Browser-tab icon | [`images/favicon.svg`](images/favicon.svg) (or the `<link rel="icon">` in [`index.html`](index.html)) |
| Screening questions, tiers, documentation fields, start page heading and text, wording | [`content/registry.en.js`](content/registry.en.js) |
| Spanish text (or add another language) | [`content/registry.es.js`](content/registry.es.js) |

You can add, remove or reword screening questions and groups, tiers, sections and fields without touching the app code. See [docs/customizing.md](docs/customizing.md), including what to do when you [change questions or fields after you have records](docs/customizing.md#changing-questions-or-fields-after-you-have-records).

## Getting records out

The registry is front end only, with no database, so you decide where records live:

- **Simplest:** keep one shared spreadsheet (Excel on SharePoint/OneDrive, or Google Sheets) started from [`templates/registry-inventory.csv`](templates/registry-inventory.csv), or, if you've changed the fields, from "Blank inventory spreadsheet" at the foot of the registry's start page. Paste in each submission's CSV row, and keep the JSON and PDF in a shared folder.
- **Sent on submit (optional):** set `submit.url` in the config to send each record to a Google Apps Script ([included](integrations/google-sheets-apps-script.gs)), a Power Automate flow or your own API. Leave it empty and nothing is sent.

Setup steps are in [docs/integrations.md](docs/integrations.md), and the record format is in [docs/record-format.md](docs/record-format.md).

The registry keeps no history and has no sign-ins. Updating a use case produces a new copy with the same ID, so keep every copy (the automated setups do) to have an audit trail. See [Keeping a history](docs/integrations.md#keeping-a-history).

## Deploying

Put the files on any static host: an internal web server, SharePoint, IIS, nginx or a cloud storage bucket. There's no server code to run. For production, use the compiled build from a release (or from the **Build** workflow), which doesn't compile code in the browser and works under a strict Content Security Policy. Read [docs/deploying.md](docs/deploying.md) for hosting and security notes. Copying it on GitHub? Keep your copy private (a fork of a public repo is public, config and all), and see [Your own copy on GitHub](docs/deploying.md#your-own-copy-on-github) for what the workflow does there.

## Project layout

```
index.html              loads everything below
registry.config.js      your settings
content/                content and wording, one file per language
app/                    the application (React, compiled in the browser in this source version)
styles.css              all styling; colors and fonts are variables at the top
images/                 placeholder logo and browser-tab icon
templates/              blank inventory spreadsheet
docs/                   customizing, integrations, deploying, record format
integrations/           Google Sheets Apps Script
scripts/build.mjs       produces the compiled build and the single-file version (run by CI)
vendor/                 React 18.3.1 and Babel 7.29.0, served locally (no CDN)
```

## License and stewardship

Use it, modify it and deploy it, commercially or not, with no obligation to publish your changes or your records. In return, keep the credit to AiR Hub when you share it.

- **Software:** [Apache License 2.0](LICENSE). If you share a copy or a modified version, include the [`NOTICE`](NOTICE) file, which credits AiR Hub, and mark the files you changed.
- **Framework content** (the screening questions, tier definitions, documentation fields and wording in [`content/`](content)): [CC BY 4.0](content/LICENSE). You can reuse and adapt it anywhere, including outside this software. When you share it, credit it as: *"AI Use Case Registry" framework by AiR Hub at UNLV International Gaming Institute, licensed under CC BY 4.0*, and say whether you changed it.
- **Citing it:** use GitHub's "Cite this repository" button, which reads [`CITATION.cff`](CITATION.cff).

Running the registry inside your organization without sharing it carries no attribution duties.

The registry is maintained as research by AiR Hub and evolves through co-design with operators, suppliers and regulators. Issues and pull requests are welcome. Substantive changes to the tiering model or field content are reviewed against the underlying research.

This is a documentation and transparency tool, not a regulatory requirement, certification scheme or approval process.

## AI Disclosure

Code in this project was generated with AI-assisted coding tools, under the direction of the maintainers, who reviewed and tested it. The framework content in `content/` was developed through research and stakeholder engagement.
