# Lotline operator guide

Open [Lotline](https://lotline-trace.web.app). The fictional Cedar & Crumb sample is available without signing in. Use synthetic or de-identified test files while assessing the workflow.

## Read the sample trace

Select **SES-104** in Trace workspace. A 100 kg ingredient receipt connects to CR-201 and CR-202, which use 90 kg and produce 900 cases. Confirmed shipment records total 650 cases to three customers. The calculated finished-stock balance is 250 cases. A separate forty-case shipment has no batch code and remains unresolved, excluded from confirmed totals.

Open a supplier, production or customer card to inspect its source evidence. Original CSV cells appear separately from normalized/current fields and reviewed corrections. The filename and physical start-row number identify the imported location. Mapped and unmapped source cells are retained, including whitespace and multiline content, with line endings normalized to LF.

## Import structured records

1. Choose **Use your own records** or create a new workspace. Export unsaved work before discarding changes.
2. Open Source records and choose Receiving, Production or Shipments.
3. Upload a UTF-8 CSV under the displayed file-size limit. Export Excel or Google Sheets files to CSV first; direct XLSX import is not supported.
4. Review the preview and map every expected field to a source column. Download a sample for the canonical structure. Rule-based suggestions propose columns, not record values.
5. Choose Append or Replace for that record type. Reimporting the same file in Append mode triggers duplicate protection. Use Replace deliberately when replacing that whole record type.
6. Confirm the import. Errors leave the dataset unchanged and identify the offending row/field.
7. Repeat for the other record types. Return to the trace and select the lot.

Use valid ISO calendar dates, finite positive numbers and consistent units. Ingredient/supplier/product identities must be present. Missing lot/batch cells remain representable for investigation, rather than being invented. Give suppliers' lot codes unique workspace identifiers if their local codes collide. A sample with no confirmed matches does not establish that nothing was exposed.

The current deployment uses rule-based mapping. No live LLM call, provider key or external model transmission is needed. Every mapping remains the user's responsibility to review.

## Review findings and corrections

Review missing lineage, collisions, incompatible units, duplicate rows, negative balances and impossible linked dates. These findings can disable readiness or quantity assurance. Production before every available receipt and shipments before their recorded production require investigation. Same-day dates do not identify order within the day, and the app does not implement cumulative inventory allocation.

A batch assignment may be added only after original documentation establishes the correct batch. Enter a nonempty correction note explaining the supporting evidence. Confirmation stays disabled until a note exists. The app preserves originalBatch, correctionNote and correctedAt. Save the workspace to retain the revision. If the evidence is unavailable, leave the assignment unresolved.

## Save and return

Choose sign-in to create or access a Firebase email/password account. Save the workspace with a recognizable name. The workspace picker lets you reopen, rename or delete your saved workspaces. The public sample remains available to guests. Account sessions are managed by Firebase Authentication.

Saves use revisions. If another session has changed the saved workspace, the API returns a conflict instead of silently overwriting it. Export your unsaved JSON, reopen the saved revision and reconcile deliberately. Restoring a JSON backup opens a new workspace rather than borrowing a prior workspace's history.

Private records are scoped server-side to the verified Firebase user. Sign out when finished on a shared device. Unsaved work can be exported; do not rely on browser memory as durable storage.

## Record a rehearsal

Save the workspace first. Open Drill history, create a rehearsal and add reviewer notes explaining what was checked and what remains unresolved. The server computes a snapshot from the saved dataset and records its lot and source revision.

Open a stored rehearsal and download its complete snapshot JSON. Later workspace changes do not rewrite that earlier snapshot. A rehearsal history is evidence of the exercise, not a certificate of incident readiness.

## Export evidence

| Export | Contents |
|---|---|
| Trace and distribution CSV | Confirmed record links, source coordinates, corrections and unresolved shipment rows |
| Complete evidence JSON | Dataset, calculated trace, findings and export metadata |
| Print-ready report | Browser print view; choose Save as PDF |

Inspect print layout before sharing. Keep synthetic/drill labels and unresolved scope visible. Exports do not send customer messages, notify authorities or initiate a recall.

## Storage and deletion

The API limits each dataset to 700,000 serialized bytes and 5,000 total records. An account supports 20 workspaces and 25 MiB of application-counted saved data, snapshots, notes and activity. Each workspace supports 100 snapshots, 500 reviewer notes and 5,000 activity events. A snapshot payload can be up to 1,800,000 bytes. File/request limits may apply sooner.

Delete test workspaces to remove their accessible records and history. Workspace deletion does not delete the Firebase Authentication account. Hosting backups and logs have separate retention policies. Read the [privacy notice](https://lotline-trace.web.app/privacy) before supplying sensitive information.

The named Firestore database is in Montreal; Cloud Run processes API requests in us-central1. Do not interpret the database location as a guarantee of exclusively Canadian processing.

## Supported boundaries

The current model supports one ingredient-to-finished-batch transformation. It does not reconstruct rework, intermediate products, returns, transfers, disposal or cross-contact. Calculated stock is output less recorded shipments, not a physical count. The trace covers supplied records and cannot establish that omitted records do not exist.

Lotline prepares evidence. A responsible qualified person determines food safety, incident scope and operational action. Practitioner acceptance, suitable data handling and recovery/support procedures remain prerequisites for real operational use.
