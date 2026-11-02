# Customizing the registry

You'll edit three kinds of file:

- `registry.config.js`: your organization's identity, look and integrations
- `content/registry.en.js`: everything the registry says and asks (the structural source)
- `content/registry.<lang>.js`: translations

Reload the page after saving. You don't need to change anything in `app/`.

## Branding (`registry.config.js`)

| Setting | What it does |
|---|---|
| `organization` | Shown above the start page title and stored in every record |
| `appTitle` | Browser tab title |
| `logo` | `{ src, alt, href }` for the header. `src` is a path in your copy of the repo (`images/` is the usual place). Remove `logo` to show `organization` as text |
| `footer` | Footer line on the start page |
| `theme` | Colors. Each key sets the CSS variable of the same name in `styles.css` (`brand` → `--brand`). Quote keys with hyphens: `"brand-tint": "#…"` |
| `fonts` | `sans`, `display` (headings) and `mono` font-family lists. To use a web font, see [Fonts](#fonts) |
| `languages` | Languages offered in the switcher. The first is the default |
| `recordIdPrefix` | Start of every record ID, e.g. `UC-20261030-K7Q2` |
| `submit` | Optional address to send each submitted record to (see [integrations.md](integrations.md)) |

The light highlight tints follow `theme.brand` automatically.

**Browser-tab icon:** replace `images/favicon.svg` (it's a placeholder), or point the `<link rel="icon">` in `index.html` at your own file.

### Fonts

The best option is to self-host: put the font files in your copy (for example `fonts/`) and add an `@font-face` rule at the top of `styles.css`. The build copies them, the single file has them inlined, and the strict Content Security Policy in [deploying.md](deploying.md) still works.

Linking a font service in `index.html` (a Google Fonts `<link>`, say) also works. But then the single file needs a network connection for it, and your Content Security Policy has to allow that service.

## Start page (`startPage` in each content file)

| Key | What it does |
|---|---|
| `title` | The start page heading. Use `\n` to break it over two lines. Change it in each language file |
| `version` | Shown in the start page footer and stored in every record as `contentVersion`. Change it whenever you change questions or fields (see [below](#changing-questions-or-fields-after-you-have-records)) |
| `blurb`, `blurbTail` | The paragraph under the heading |
| `howItWorks` | The "How it works" steps and the tier strip under them |
| `definitions`, `defsLabel`, `defsHeading`, `defsIntro` | The "Key terms" list |
| `sections` | Your own sections, shown above the key terms (none by default) |
| `footerNote` | A short note in the footer |

To tell staff something about your own process, such as how your organization uses the registry or who to ask, add `sections`. Each has a `label` (the small heading on the left), a `heading`, and `paragraphs`, a `list`, or both:

```js
startPage: {
  // …
  sections: [
    { label: "Our process", heading: "How we use the registry", paragraphs: ["Register every AI use case before it goes live.", "Compliance reviews new records each month."] },
    { label: "Help", heading: "Who to ask", list: ["Questions about a use case: the AI governance team", "Technical problems: IT service desk"] },
  ],
},
```

In other language files, give `sections` in the same order with the text translated.

## Screening

Screening groups live in `screening` in `content/registry.en.js`. They are asked in order:

```js
screening: [
  { id: "t3", tier: 3, heading: "…", intro: "…", materialityNote: true, questions: [ … ] },
  { id: "t2", tier: 2, heading: "…", intro: "…", questions: [ … ] },
],
```

**The rule:** the first group with any "yes" assigns its `tier`, and screening stops there. If every group is answered "no", the use case gets the lowest tier in `tiers`. Order your groups from highest tier to lowest.

Each question has:

- `id`: stable key used in records and translations, e.g. `"A1"`
- `title`: short name shown above the question
- `prompt`: the question
- `phrase`: completes "You indicated this use case …" at the top of an elaboration section

`materialityNote: true` adds an explanation icon next to the word in `materiality.word` ("materially") in that group's questions. The explanation text is in `materiality.note`. That text is your materiality threshold, so adjust it to your risk appetite.

You can reword, add or remove questions, and add or remove whole groups. To remove one, delete its block, and delete its entry in each language file too.

When you add a question, check that the tier's `short`, `definition` and `categories` text in `tiers` still describe what the group covers.

## Tiers, sections and fields

`tiers` lists each documentation tier with its definition, examples and `sections`. Tiers are additive: a Tier 3 use case completes the sections of tiers 1, 2 and 3.

```js
{
  level: 2, name: "Tier 2", label: "Extended", abbr: "T2",
  headline: "…", docLabel: "Extended", short: "…", definition: "…", examples: [ … ],
  sections: [
    { id: "t2-s2", title: "Transparency", fields: [
      { id: "B2.1", name: "AI Disclosure to Users", prompt: "…", kind: "textarea" },
    ] },
  ],
}
```

Field `kind`:

- `"text"`: short answer
- `"textarea"`: long answer, with a word count
- `"select"`: dropdown, needs `options: [ … ]`
- `"contact"`: a block of inputs, needs `subfields: [{ key, label, type }]`

Section options:

- `contextFrom: "<group id>"`: opens the section with the "yes" answers from that screening group
- `ownTierOnly: true`: the section is for use cases of exactly this tier, and isn't carried up to higher tiers. Tiers normally stack, so a Tier 3 use case also completes the Tier 1 and 2 sections. But each tier opens with an "Elaboration" asking why the use case landed in that tier, and a Tier 3 use case should only explain why it's Tier 3. So the Tier 2 Elaboration has `ownTierOnly: true`: Tier 2 use cases see it, Tier 3 use cases don't

Field options:

- `derivedFromIntake: "useCaseName"` or `"operationalArea"`: prefilled from the intake step and shown in the document header
- `summary: "deployment"`: shown as "Deployment status" in the review summary

To remove a field or a whole section, delete its block (and its entry in each language file).

The tier colors in `styles.css` cover tiers 1–3 (`--t1` to `--t3`). If you add a fourth tier, add `--t4` and matching `.t4` rules.

## Ids are stable keys

Translations and exported records refer to ids (group `id`, question `id`, tier `level`, section `id`, field `id`). Change any text freely, but give new questions or fields new ids rather than reusing old ones. Otherwise older records and spreadsheets will put answers under the wrong heading.

Keep question and field ids to letters, numbers, `.`, `_` and `-`, starting with a letter or number, and no longer than 64 characters including any contact subfield. The Google Sheets script refuses records with any other id.

## Languages

Translations only change text, never structure. `registry.es.js` overlays Spanish onto the English structure, matched by id, and anything it leaves out falls back to English.

**When you reword English, update each language file too.** A translation is matched by id, not by meaning, so a reworded English question keeps its old Spanish wording until you change it. If you can't translate it yet, delete the entry: that language then shows the new English text.

To add a language (French, for example):

1. Copy `content/registry.es.js` to `content/registry.fr.js`.
2. Change `window.REGISTRY_LOCALES.es` to `window.REGISTRY_LOCALES.fr`, plus `label` and `flag`.
3. Translate the values. Keep the keys and ids as they are.
4. Add `<script src="content/registry.fr.js"></script>` to `index.html` after the other content files.
5. Add `"fr"` to `languages` in `registry.config.js`.

Dropdown values are stored in English whatever the language, so records line up. Only the labels people see are translated (`options` in the language file).

## Changing questions or fields after you have records

1. **Change `startPage.version`** in `content/registry.en.js` (and the matching line in each language file). Every record stores it as `contentVersion`. When someone opens a record made under another version, the registry says so. It also lists answers to fields that no longer exist (they're left out from then on) and sends the person back through screening if the questions changed.
2. **Update your master spreadsheet.** Choose "Blank inventory spreadsheet" at the foot of the start page to get the new header row. Replace `templates/registry-inventory.csv` with it too, so your copy of the repo stays accurate. In a sheet that already has rows, insert each new column at the same position as in the new header, and keep the columns of removed fields so older rows still make sense. Pasted CSV rows only line up if the columns match.
3. **Google Sheets script:** it matches columns by id and adds unknown ids as new columns at the end. That's safe for its own rows, but it puts new columns in a different position from the CSV export. In an automated sheet, insert the new columns yourself (matching the new header) before the first submission under the new version, or don't paste CSV rows into it.

## What needs code

Content and config cover almost everything. A few changes need a small edit in `app/`:

- **A different scoring rule** (for example "two yeses means Tier 3", or weighting): `app/screening.jsx`
- **New field input types** (date, checkbox, file upload): `FieldControl` in `app/components.jsx`, plus `fieldIsFilled` and the CSV export in `app/records.js`
- **Changing the overall flow** (start page → screening → documentation → review): `app/app.jsx`
