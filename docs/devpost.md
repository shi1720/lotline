# Lotline

**Find the lot. Follow the records. See what is missing.**

## Inspiration

A small food maker can have every invoice and production spreadsheet on file and still struggle to answer a simple question: “Where did this ingredient lot go?” The records exist across receiving, production and customer shipments. The difficult part is connecting them, and knowing when the connection cannot be proved.

Lotline is built for the operations or quality lead at a small packaged-food manufacturer who needs to rehearse that question before a real incident. CFIA's guidance makes this a concrete workflow: applicable businesses keep traceability records, and relevant operators conduct and document recall simulations. [CFIA traceability guidance](https://inspection.canada.ca/en/food-safety-industry/toolkit-food-businesses/traceability), [CFIA inspection procedure](https://inspection.canada.ca/en/inspection-and-enforcement/guidance-food-activities/preventive-control-inspection/traceability-inspection)

## What it does

Lotline connects receiving, production and shipment CSVs into a lot-level trace. Its three main views are Trace workspace, Source records and Drill history. An operator selects an ingredient lot, inspects the connected batches and distribution records, opens the supporting source rows, and reviews missing or ambiguous information. CSV and JSON exports preserve the results; a print-ready report can be saved as PDF through the browser.

The demo follows **Cedar & Crumb**, a fictional granola maker investigating sesame lot **SES-104**. Two batches use 90 kg of the 100 kg received and produce 900 cases. Records connect 650 shipped cases to three customers and leave a calculated 250-case balance. A separate 40-case shipment has no batch assignment and remains in review scope. The complete fixture contains two receipts, three production records and five shipments. All companies, customers and quantities are synthetic: this is a rehearsal, not a real recall.

Imported CSVs retain all source columns, including unmapped values; the evidence dialog distinguishes the Original CSV row from normalized/current values and reviewed corrections. The central design choice is to keep uncertainty visible. A missing lot code becomes a review item. A plausible association is not silently promoted into a confirmed connection. Source evidence sits beside the result so a human can assess it.

## How it is built

The application uses a React/TypeScript interface on a Vinext starter and Sites deployment infrastructure. Signed-in workspaces use Sites-provided ChatGPT authentication and user-owned persistent storage. The lineage and reconciliation logic is deterministic: it does not depend on an LLM inventing the relationships.

An optional server-side Anthropic integration suggests column mappings when a valid API key is configured. The explicit Suggest mapping action sends headers and up to three sample rows; users review every proposed field. Strict header allowlists, timeouts and durable per-user quotas constrain the feature. Missing configuration or a failed call returns an honestly labeled rules fallback. The initial test run used mocked provider responses; no live Anthropic call is claimed.

The project targets **Best Overall**. We are not claiming Expo, Clerk, Eon or SurrealDB category integrations.

## What we tested

Twenty-four engine/import tests, fifteen API tests and two Worker integration tests pass: forty-one in total. TypeScript checking and the production build also pass. They cover the sample arithmetic, missing/unknown associations, malformed CSV, incompatible units, schema validation, ownership isolation, origin checks, request limits, stale-write conflicts, immutable snapshots, quotas and mocked AI output validation. API tests exercise the actual handlers against SQLite with injected platform identity and D1 bindings. Separate production browser checks verified ChatGPT sign-in, D1 workspace save/reopen, a drill snapshot with multiline notes, snapshot JSON download, receiving-CSV import and a 390 × 844 mobile layout. Production probes confirmed the root response and rejected anonymous requests carrying forged identity headers. Two genuine-account browser isolation has not been tested; production data residency and live model access are not claimed.

## Why this approach

Existing platforms such as Katana and FoodDocs already support traceability. Lotline explores a narrower adoption path: begin with the files a small maker already has, make the trace inspectable, and show the gaps that prevent a complete answer. We have not established that these competitors lack equivalent import or review capabilities. [Katana documentation](https://support.katanamrp.com/en/articles/14737323-how-to-use-the-traceability-explorer), [FoodDocs](https://www.fooddocs.com/pricing)

## Responsible operation

Saved workspace and snapshot payloads share a tested 25 MiB per-user storage quota, enforced atomically with row/request/account limits. A public privacy notice describes retention, deletion and remaining hosting limitations.

Lotline helps prepare and inspect records. It does not determine whether food is safe, whether a recall is necessary, or whether an operator meets legal requirements. A qualified person must make operational decisions. Demonstration exports should remain visibly labeled as synthetic/drill material.

Before real customer use, data location, retention/deletion, backups, tenant isolation, access permissions and unsupported record scenarios need explicit validation. Do not upload confidential production data merely to try the public demo.

## Commercial direction

The proposed first buyer is a small manufacturer using spreadsheets rather than a full ERP. A CAD $99/site/month pricing experiment would test whether recurring record checks and drill history are valuable enough to support a subscription. A guided one-off drill is an alternative to test. These are hypotheses: we are not claiming customers, revenue, interviews or measured time savings.

The next step is an observed pilot with a food-safety practitioner and de-identified records, measuring setup time, unresolved linkage rates, export usefulness and repeat usage.

## Creator and disclosure

**Shivam Gupta — project creator.** Shivam set the product ambition, commercial requirements and quality bar. Research, code, synthetic fixtures, tests and submission drafts were developed with substantial AI assistance using Codex. Manual review and recording contributions should be added here only after they occur.

The application began from a Vinext starter. The Lotline product interface, traceability workflow, domain logic, synthetic sample records and documentation were developed during this build. The underlying framework and deployment/authentication infrastructure pre-existed the project. No prior customer product or proprietary customer dataset is claimed.

## Publication status

[Live application](https://lotline-recall.sg127977958.chatgpt.site) · [Public source repository](https://github.com/shi1720/lotline)

The app and repository are public and externally accessible. The deployment uses the rule-based mapping fallback by choice; no live model key is required. Video recording and Devpost submission remain pending. Official residency/registration eligibility and Toronto attendance must still be confirmed before entry.
