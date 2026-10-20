# Lotline

**Find the lot. Follow the records. See what is missing.**

Live application: https://lotline-trace.web.app

Public repository: https://github.com/shi1720/lotline

## Inspiration

A supplier flags an ingredient lot. A small food producer's quality lead needs to answer three questions: which batches used it, where they shipped, and what the records cannot establish.

Those answers may already exist in receiving logs, production sheets and customer shipment files. But having the files is different from having a trace another person can inspect. The most dangerous result is a confident-looking answer that quietly skips a missing batch code.

We built Lotline around that missing link. The initial user is an operations or quality lead at a small packaged-food producer who already keeps spreadsheets and wants to rehearse a trace without replacing their entire inventory system.

## What it does

Lotline turns receiving, production and shipment CSVs into an ingredient-to-batch-to-customer trace. Users review column mappings, inspect original source rows, investigate missing evidence, save private workspaces and record rehearsal snapshots. CSV, complete evidence JSON and printable reports make the result reviewable outside the app.

The fictional Cedar & Crumb example follows sesame lot SES-104. Its 100 kg receipt connects to two batches using 90 kg and producing 900 cases. Records connect 650 shipped cases to three customers, with a calculated 250-case stock balance. A separate forty-case shipment has no batch assignment. It stays unresolved instead of being assigned through guesswork.

All sample companies and records are synthetic. Calculated stock means recorded output less recorded shipments, not a physical count.

## How we built it

The current application uses React, TypeScript, Vite and Tailwind. Firebase Hosting serves the public application at lotline-trace.web.app. Firebase Authentication provides email/password accounts. A Cloud Run Express API verifies Firebase ID tokens and saves user-scoped records to the named Firestore database `lotline`.

The API runs in us-central1; the database is in Montreal. Firestore transactions enforce revision checks and storage limits. Rehearsal snapshots are computed from saved records server-side, preserving the dataset, selected lot, result and source revision at that moment.

The trace engine is deterministic. Exact recorded identifiers establish links; a model does not invent relationships. This deployment uses rule-based column suggestions and requires no live model key. Imported records retain original mapped and unmapped source cells separately from normalized fields and reviewed corrections.

## Challenges we ran into

A neat diagram was easier than an honest one. We had to handle supplier-local lot collisions, inconsistent units, duplicate records, missing shipment assignments and contradictory batch output without implying the evidence was complete.

Independent adversarial review also found that impossible dates and missing business identities could leave a trace looking ready. We reproduced those cases, added critical findings and regression tests, and made conflicting or negative balances disable quantity assurance while preserving the records for investigation.

Moving to a clean Firebase URL meant replacing the original hosting-owned identity and database assumptions. The active backend now validates Firebase tokens, scopes records by verified user identity and checks revisions before saving. Old deployment tests remain distinct from current Firebase verification.

## Accomplishments that we're proud of

The product makes missing evidence visible at the moment someone needs an answer. A forty-case shipment with no batch code stays an open question, even when hiding it would make the screen look cleaner.

The workflow goes beyond a chart: reviewed CSV import, original source evidence, private persistence, documented corrections, rehearsal history and portable exports fit together around one specific job. The final suite passes fifty-five tests, including thirty trace/import cases and newly reproduced failures. Twenty live checks with genuine Firebase accounts verify persistence, isolation, revision conflicts and snapshots. A hosted browser walkthrough confirms private workspace loading, CSV import, saved rehearsal history and actual CSV, JSON and PDF exports.

## What we learned

The useful question was not how much AI we could add. It was which claims the records support and how a reviewer can check them. Deterministic joins are appropriate for exact lot identifiers. Missing links should lead to investigation, not an invented answer.

We also learned to distinguish a working product from a validated business. A specific buyer and plausible pricing do not prove demand. No customer interviews, paid pilots, revenue or measured time savings are claimed.

## What's next for Lotline

The first commercial experiment is an observed pilot with a small food producer and a qualified food-safety practitioner, using permissioned, de-identified records. We would measure setup time, missing-link rates, usefulness of the exported evidence and whether teams return for later rehearsals.

A proposed CAD 99 per site per month subscription would test demand for recurring record checks and saved history. A one-off guided drill is another pricing hypothesis. Neither has been validated or sold. The adoption wedge is a focused workflow around existing files, inspectable evidence and visible uncertainty, rather than replacing a broader ERP.

Before use in real operations, we need practitioner acceptance and appropriate recovery, retention, privacy and support procedures. The current model supports one ingredient-to-finished-batch transformation. It does not reconstruct rework, returns, transfers or cross-contact. Lotline prepares evidence; responsible people determine incident scope and food safety.

## Team and disclosure of prior work

**Shivam Gupta is the project creator.** Shivam set the commercial requirements and quality bar and directed the project development. Substantial Codex assistance supported research, implementation, tests, design iteration and submission drafting. This disclosure does not claim manual work or customer research that did not occur.

The application began from an existing Vinext starter and existing framework components. The Lotline interface, traceability workflow, deterministic engine, synthetic records, tests and documentation were developed during this project. Firebase, Google Cloud and open-source frameworks are pre-existing infrastructure. The original Sites deployment was subsequently migrated to Firebase Hosting, Firebase Authentication, Cloud Run and Firestore.

We are targeting Best Overall and do not claim qualifying Expo, Clerk, Eon or SurrealDB integrations.

## Testing instructions

Open [the live app](https://lotline-trace.web.app). The synthetic sample needs no account or API key.

1. Select **SES-104**. Expect two batches, three customers, 650 confirmed shipped cases and a 250-case calculated balance.
2. Open a production card to inspect its original CSV row. Review the separate forty-case shipment with a missing batch assignment.
3. In **Source records**, download a sample CSV and inspect **Import CSV**. Cancel the preview or choose Replace for that record type to avoid appending the sample twice.
4. Create your own email/password account to save a private workspace, reopen it and record a rehearsal. Export CSV, evidence JSON or the print-ready report.

See the [complete testing guide](https://github.com/shi1720/lotline/blob/main/docs/testing-instructions.md) for persistence, snapshot and edge-case checks. All sample businesses and records are fictional.
