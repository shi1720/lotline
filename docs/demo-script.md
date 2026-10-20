# Lotline demo recording

Use the compact cut unless the final organizer instructions confirm that four minutes are accepted. Devpost currently says up to four minutes; the organizer's Luma listing says two. Record real interactions and actual exports. The scripted business and incident are fictional.

Full-cut target: **3:35–3:50**, including deliberate screen pauses. Narration has 470 words; rehearse at 140–145 words/minute, then trim dead time. Route: **Trace workspace → evidence modal → Review queue → Source records/import → Export trace → Drill history**. Pre-sign in and save the sample workspace only if hosted persistence is verified. Otherwise omit the saved-history sentence and show that surface as an available implementation, without pretending a save succeeded.

## Full cut: read verbatim

### 0:00–0:28 — The problem

Shot: Trace workspace; synthetic banner and Cedar & Crumb name visible.

“Your sesame supplier calls. Lot S E S, one zero four, needs investigation. You're a small granola maker. You have the receiving spreadsheet, the production log, and the customer shipments. But can you connect them, and can you tell where the evidence stops?

I'm Shivam Gupta, and this is Lotline. Find the lot. Follow the records. See what is missing.”

### 0:28–1:12 — Follow the recorded scope

Shot: SES-104 selector, four metrics, supplier/batch/customer lineage cards. Point to CR-201 and CR-202.

“This demonstration uses Cedar and Crumb, a fictional food maker, and entirely synthetic records. Nothing here is a real recall.

Our sesame lot has a one-hundred-kilogram receipt. Sixty kilograms went into batch C R, two zero one; thirty went into C R, two zero two. Those batches produced nine hundred cases of Sesame Crunch. The records connect six hundred and fifty shipped cases to three customers, leaving a calculated balance of two hundred and fifty cases.

These are calculations from supplied records, not a physical stock count.”

### 1:12–1:42 — Inspect a source

Shot: click receiving or production lineage card; source-modal filename/row visible. Then close.

“Open a card and inspect the source row. Here are the imported values, the filename, and the row reference behind this connection.

The trace follows exact recorded lot and batch identifiers. A language model does not invent these links. Deterministic rules make the result repeatable, while source evidence lets another person review how we got here.”

### 1:42–2:20 — The missing link

Shot: open review findings; inspect unresolved shipment, `shipments.csv`, row 5. Show assignment selector but do not guess or confirm a change.

“Now look at this shipment: forty cases to Cedar Market, with no batch assignment. Those forty cases remain separate from the confirmed shipment total. They could widen the scope, so Lotline keeps them visible for review.

An operator can assign a batch only after checking original documentation. If we cannot verify it, we leave it unresolved. A clean-looking diagram is less valuable than an honest account of what we do not know.”

### 2:20–2:52 — Bring existing files

Shot: Source records, sample downloads; open import dialog with a rehearsed sample CSV and mapping preview. Do not commit an accidental duplicate append.

“Source records shows the receiving, production, and shipment tables. To bring existing files, choose a record type, upload a C S V, and review the column mapping before importing.

Optional A I can suggest those mappings when configured. The explicit action discloses that headers and up to three sample rows may go to Anthropic. Without a configured provider, the application honestly returns rules. The lineage stays deterministic.”

### 2:52–3:20 — Keep the evidence

Shot: close import; Export trace; show CSV/JSON options and browser PDF preview. If verified signed-in save works, show Drill history with an actual snapshot.

“Export trace includes confirmed links and unresolved records. Download the C S V, the complete evidence J S O N, or use the print-ready report to save a P D F.

A signed-in operator can save a workspace and record a rehearsal snapshot, preserving the data and open questions at that moment. Later edits do not rewrite that snapshot.”

### 3:20–3:48 — Boundaries and business

Shot: return to main trace, then closing card with verified live/repository addresses only.

“Lotline prepares evidence. A qualified person decides whether food is safe and what action is necessary. This version supports one ingredient-to-finished-batch transformation.

Our first buyer is a small manufacturer using spreadsheets. A lightweight subscription for recurring checks and drills is a commercial hypothesis, still to be validated with customers.

We're building toward a practical promise: make the records usable, the evidence inspectable, and the missing links impossible to miss.”

## Compact cut: approximately 1:50–2:00

### 0:00–0:20

Shot: main trace and synthetic sample banner.

“Your sesame supplier flags lot S E S, one zero four. You're a small granola maker. Which batches used it, where did they ship, and what can your records prove? I'm Shivam Gupta. This is Lotline.”

### 0:20–0:45

Shot: CR-201/CR-202, three customers, calculated balance.

“This is Cedar and Crumb, a fictional maker with synthetic data. Our lot connects to two batches producing nine hundred cases. Six hundred and fifty cases are recorded as shipped to three customers. Two hundred and fifty remain as a calculated balance. Exact identifiers and deterministic rules create the trace.”

### 0:45–1:13

Shot: source row, then unresolved 40-case row and assignment selector.

“Open a card to inspect its source filename and row. Now here is a separate forty-case shipment with no batch assignment. Lotline keeps it unresolved instead of guessing. Only original documentation can justify assigning it. This is evidence preparation: a qualified person decides incident scope and food safety.”

### 1:13–1:35

Shot: Source records, import mapping, export choices.

“Import receiving, production and shipment C S V files with reviewed column mappings. Optional A I can suggest mappings when configured; the trace itself stays deterministic. Export confirmed links and unresolved records as C S V, complete J S O N, or a print-ready P D F.”

### 1:35–1:57

Shot: actual saved history if verified, then closing overview.

“Signed-in workspaces support saved records and rehearsal snapshots. We're starting with small manufacturers who already use spreadsheets. Demand and pricing still need validation. Lotline: find the lot, follow the records, see what is missing.”

## Exact fixture reference

| Evidence | Record |
|---|---|
| SES-104 receipt | `receipts.csv:2` — 100 kg |
| CR-201 production | `production.csv:2` — 60 kg input, 600 cases output |
| CR-202 production | `production.csv:3` — 30 kg input, 300 cases output |
| Cedar Market | `shipments.csv:2` — 300 cases, CR-201 |
| Harbour Foods | `shipments.csv:3` — 150 cases, CR-201 |
| Maple Co-op | `shipments.csv:4` — 200 cases, CR-202 |
| Unresolved Cedar Market shipment | `shipments.csv:5` — 40 cases, no batch |
| Comparison lot | SES-105 → CR-203, unrelated confirmed shipment |

## Recording preparation

- Use a 1920 × 1080 browser recording and readable zoom. Enable do-not-disturb; hide private tabs and account data.
- Keep the sample unresolved. Reset it through the workspace switcher if any rehearsal changed the batch assignment.
- The sample is 2 receipts + 3 production rows + 5 shipments. Do not claim all 5 shipment rows are tied to SES-104.
- Do not imply that Anthropic was called unless a configured live call has been verified. The initial tests use mocked responses.
- If sign-in/persistence has not been verified, remove those narration sentences instead of staging a fake save.
- Keep all uncertainty and drill labels visible. No fabricated users, testimonials, performance benchmarks or compliance claims.
- Video must be publicly viewable without login. Verify duration and playback from an unauthenticated window.
