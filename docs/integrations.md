# Connecting the registry to your systems

The registry has no database. When someone submits a use case it offers:

- **Record (.json)**: the full record, for systems ([format](record-format.md))
- **Spreadsheet row (.csv)**: one row, with the same columns for every tier
- **Print**: a printable summary (choose "Save as PDF" in the print dialog)

It can also send the record to an address you choose with `submit.url`. Pick whichever of these setups fits. Setups 2–4 are optional: unless you set `submit.url`, the registry sends nothing anywhere.

## 1. Shared spreadsheet, no setup

Good for getting started, or for a single team.

1. Open [`templates/registry-inventory.csv`](../templates/registry-inventory.csv) in Excel or Google Sheets. Save it as your master inventory on SharePoint/OneDrive or Google Drive, shared with the people who need it.
2. After each submission, download **Spreadsheet row (.csv)**, open it, and copy the second row into the next empty row of the master sheet.
3. Save the **Record (.json)** and the printed PDF in a shared folder, named by record ID.
4. To update a use case later, choose **Open a saved record** on the registry's first page and pick its JSON file. Then edit, resubmit, and add the new row below the old one rather than replacing it. The record ID stays the same, so sorting by `record_id` and `submitted_at` shows every version. Keep the new JSON and PDF alongside the old ones too: they download under the same name, so add the date or keep a folder per use case.

If you've changed the registry's fields, use "Blank inventory spreadsheet" at the foot of the registry's start page (or on the submit screen) instead of the template in this repo.

## 2. Send each submission to Google Sheets

Each submission is appended to a Google Sheet. This uses [`integrations/google-sheets-apps-script.gs`](../integrations/google-sheets-apps-script.gs).

1. Create a Google Sheet. To start with the header row in place, import the template CSV (or the "Blank inventory spreadsheet" download, if you've changed the fields) (**File → Import → Upload**) and rename the tab it creates to **Inventory**. The script writes to the tab named in `SHEET_NAME`, and creates a separate one if that tab doesn't exist.
2. **Extensions → Apps Script.** Replace the code with the contents of `google-sheets-apps-script.gs`.
3. Change `TOKEN` to a value of your own, then save.
4. **Deploy → New deployment → Web app**. Set **Execute as:** Me and **Who has access:** Anyone, then choose **Deploy** and authorize it.
5. Copy the web app URL. In `registry.config.js`, set:
   ```js
   submit: {
     url: "https://script.google.com/macros/s/…/exec?token=YOUR-TOKEN",
     contentType: "text/plain;charset=utf-8",
   },
   ```
   Keep `text/plain`, since that's what lets the browser call Apps Script directly.
6. Submit a test use case. A row should appear in the "Inventory" tab, and the registry should say "Also sent to your organization's registry". If it says the record wasn't accepted, it shows the reason (for example "Wrong or missing token"), and the browser's developer console logs it too.

**After changing the script** (a new `TOKEN`, say), deploy it again: **Deploy → Manage deployments**, edit the deployment, set **Version** to **New version**, and **Deploy**. Saving alone doesn't change what the web app runs. The URL stays the same.

**Know the trade-off:** "Who has access: Anyone" is required because the registry runs in the browser without a Google sign-in. Anyone who has the URL can send rows to your sheet, and the URL (token included) is visible to anyone who can open your registry. Host the registry where only staff can reach it (see [deploying.md](deploying.md)), and treat the sheet as an intake log that someone reviews.

## 3. Send each submission to Excel (Microsoft 365)

Each submission becomes a row in an Excel table on SharePoint or OneDrive. This needs Power Automate's **When an HTTP request is received** trigger, which requires a Power Automate Premium license.

1. In Excel on SharePoint/OneDrive, open the template CSV, select the header row and the row below, and **Insert → Table** (with "My table has headers"). Save it as `.xlsx`.
2. In Power Automate, create an **Instant cloud flow** with the trigger **When an HTTP request is received**. For the request body JSON schema, choose **Use sample payload** and paste a record you downloaded from the registry.
3. Add **Excel Online (Business) → Add a row into a table**. Point it at your file and table, then map each column to the matching record value with an expression: for example `triggerBody()?['id']` → `record_id`, `triggerBody()?['fields']?['A1.2']` → `A1.2 Use Case Summary`, and `triggerBody()?['screening']?['answers']?['A1']` → `A1 Player Access`. Field ids contain dots, so use the `?['…']` form; dot notation won't find them.
4. Add a **Response** action with status 200 and body `{"ok": true}`.
5. Save, copy the HTTP POST URL, and set it in `registry.config.js`:
   ```js
   submit: { url: "https://prod-…logic.azure.com/…", contentType: "application/json" },
   ```
6. Submit a test use case and check that the row appears.

The flow URL contains its own access key, and it's visible in your registry's config. As with Google Sheets, host the registry where only staff can reach it. If the browser reports the request was blocked (a CORS error in the developer console), your tenant isn't accepting browser calls to the flow. In that case use setup 1, or route the call through your own API (setup 4).

## 4. Your own system

Point `submit.url` at any endpoint that:

- accepts a `POST` with the record as the body (`application/json` or `text/plain`)
- allows browser requests from the registry's address (CORS), on error replies as well as successful ones. Without CORS headers the browser hides the reply, and the registry can only say it couldn't reach the endpoint
- returns a 2xx status. To refuse a record, reply with JSON `{"ok": false, "error": "…"}`: the registry tells the person it wasn't accepted and shows your `error` text. A non-2xx status or an HTML reply (usually an error page) also counts as not accepted. If nothing answers at all, the person is told the registry couldn't be reached. Either way they can try again or download the record

The registry sends the same record a person can download, so you can test your endpoint with a downloaded file. Authentication is best handled by your hosting: for example, serve the registry and your endpoint from the same origin (the same `https://host:port`) behind your company sign-in, so the browser's session cookie protects both. The registry only sends cookies to its own origin, so an endpoint on another host needs its own check, such as a token. Don't put secrets in `registry.config.js`.

## Updating and re-registering use cases

Every record keeps its ID. To update a use case, open its saved JSON in the registry, change what's needed and resubmit. If the questions or fields have changed since the record was made, the registry says what won't carry over before opening it. The new record has the same `id`, a new `updatedAt`, and re-run screening answers if you went back to screening. In a spreadsheet, add it as a new row rather than replacing the old one (see [Keeping a history](#keeping-a-history)). With an automated setup, the new submission arrives as a new row with the same ID on its own. The Google Sheets script skips a row it already has (same ID and `submitted_at`), which happens when someone presses **Try again** after a slow reply.

## Keeping a history

The registry keeps no history of its own. Each submission is a complete copy of the record at that moment, so the history of a use case is every copy you keep:

- `id` stays the same across versions, `createdAt` is when the use case was first started, `submittedAt` (and `updatedAt`) is when this version was submitted, and `contentVersion` says which version of the questions it was filled in against.
- The Google Sheets script, and a Power Automate flow that adds a row, keep every version automatically, one row each. With the shared spreadsheet, add a row for each submission instead of replacing the old one.
- To see what changed, compare two versions: two rows of the sheet, or two JSON files.

What it doesn't do: it doesn't record who submitted a version (there are no sign-ins, and the contact fields name the use case's owner, not the person submitting), it has no side-by-side comparison, and a downloaded file is plain text that can be edited without a trace. If you need sign-off, approvals or a tamper-evident log, send records to a system that provides them ([setup 4](#4-your-own-system)) and keep the trail there.
