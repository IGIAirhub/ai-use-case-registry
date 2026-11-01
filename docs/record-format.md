# Record format

Every record the registry produces (a downloaded `.json`, a draft, or a submission sent to `submit.url`) uses this format. It's the contract for anything you connect the registry to.

## Example

```json
{
  "schema": "ai-use-case-registry/record",
  "schemaVersion": 1,
  "id": "UC-20261030-K7Q2",
  "status": "submitted",
  "createdAt": "2026-10-30T15:02:11.204Z",
  "updatedAt": "2026-10-30T15:40:57.918Z",
  "submittedAt": "2026-10-30T15:40:57.918Z",
  "organization": "Your Organization",
  "language": "en",
  "contentVersion": "Version 1.0",
  "useCase": { "name": "Customer Support Copilot", "operationalArea": "Customer support" },
  "screening": {
    "tier": 2,
    "tierLabel": "Extended",
    "answers": { "A1": "no", "A2": "no", "A3": "no", "A4": "no", "A5": "no", "B1": "yes", "B2": "no", "B3": "no" }
  },
  "fields": {
    "A1.1": "Customer Support Copilot",
    "A1.2": "Drafts replies to player emails for agents to review.",
    "A1.5": "Active deployment",
    "A1.7": { "name": "Jordan Lee", "role": "Head of CX", "department": "Customer support", "email": "cx@example.com" },
    "B1.1": "…"
  }
}
```

## Fields

| Key | Meaning |
|---|---|
| `schema`, `schemaVersion` | Always `"ai-use-case-registry/record"` and `1` for this version. The registry refuses to open anything else |
| `id` | Record ID: `recordIdPrefix`, date, random suffix. It stays the same across drafts and the final submission, so use it to match versions |
| `status` | `"draft"` (from Download draft) or `"submitted"` |
| `createdAt`, `updatedAt`, `submittedAt` | ISO 8601 timestamps in UTC. `submittedAt` is `null` for drafts. For a submitted record, `updatedAt` equals `submittedAt`, so every download of one submission matches |
| `organization` | From `registry.config.js` |
| `language` | Language the person used, e.g. `"es"` |
| `contentVersion` | `startPage.version` from the content file, so you know which questions applied |
| `useCase` | Name and operational area as finally documented |
| `screening.tier` / `tierLabel` | Assigned tier, with its English label |
| `screening.answers` | `"yes"` / `"no"` by question id, for the groups the person answered. Screening stops at the first group with a "yes", so later groups may be missing |
| `fields` | Every field the assigned tier requires, by field id. Unanswered fields are `""`. Contact fields are objects keyed by subfield |

Keys and ids are always in English. Answers are stored exactly as typed, in whatever language the person used, except dropdown values, which are always the English option.

## CSV

The CSV export has one header row and one row per record. It has the same columns whatever the tier, so rows from different use cases append into one spreadsheet. The columns, in order:

1. `record_id, status, submitted_at, updated_at, organization, use_case_name, operational_area, tier, tier_label`
2. One per screening question, e.g. `A1 Player Access`
3. One per field across all tiers, e.g. `A1.2 Use Case Summary`. Contact fields get one column per part: `A1.7.name Organization Contact: Name`

The first word of every header is its id. Integrations match columns on that, so you can rename the rest of a header in your spreadsheet. Text that starts with `=`, `+`, `@` or `-` gets a leading `'` so spreadsheet apps don't run it as a formula. The file is UTF-8 with a byte-order mark, so Excel shows accented characters correctly.

If you add or remove fields, the columns change. Generate a fresh blank spreadsheet from the registry: after submitting, choose "Blank inventory spreadsheet". If your master sheet already has rows, see [Changing questions or fields after you have records](customizing.md#changing-questions-or-fields-after-you-have-records).
