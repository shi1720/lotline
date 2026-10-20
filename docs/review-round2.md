# Lotline independent product and correctness review

Review date: October 20, 2026. Scope: current `lib/trace.ts`, `lib/import.ts`, `lib/server-validation.ts`, unit tests, evidence export, sample data and operator/business documentation. This is a source-level adversarial review with executable trace reproductions. Firebase deployment, browser responsiveness and newly migrated identity/storage are separate acceptance checks and were not verified by this reviewer.

## Findings discovered and disposition

| Priority | Finding | Reproduction and observed result | Bounded fix |
|---|---|---|---|
| P1, fixed | Chronologically impossible links could appear ready | Start from the synthetic dataset and remove its blank-batch shipment. Set the first linked shipment's `shippedDate` to `2020-01-01`. The dataset schema accepts it; `analyze(..., 'SES-104')` returns `ready: true`, `quantitativeComplete: true` and no non-information findings. Setting the first production row's `producedDate` to `2020-01-01` produces the same result. | Preserve the explicit identifier link for investigation, but flag shipment dates before batch production as critical. Flag selected production with no corresponding receipt available by that date. With multiple deliveries, compare cumulative dated receipt and ingredient-use quantities when units are compatible rather than comparing against an arbitrary receipt row. Do not infer times within one date. Add regression tests for impossible chronology and valid split deliveries. |
| P1, fixed | Missing business identity passed backup/API validation and could appear complete | On the same base, blank the selected receipt supplier. Separately blank both selected production ingredient names. Separately blank first selected production product and both shipments from that batch. Every variant validates and returns `ready: true`, `quantitativeComplete: true`, no non-information findings. | Require nonempty supplier, ingredient, production product and shipment product in the server schema, matching CSV import. Alternatively retain incomplete rows with explicit critical identity findings and incomplete quantity flags. Missing lot/batch remains representable and visibly unresolved. Add API and backup-path tests, not only importer tests. |
| P2, fixed | `quantitativeComplete` remained true with impossible balances | Set the first confirmed shipment to 1,000 cases. The engine correctly emits `Shipments exceed batch output` and `ready: false`, but returns `quantitativeComplete: true`. | Define the flag precisely. If it means arithmetically reconcilable, make negative ingredient/finished balances false. If it means all numbers are present in compatible units, rename/document it and ensure UI never presents it as evidence of reconciliation. Keep the negative value visible. |
| P2 | Semantic duplicate policy can reject legitimate identical transactions | `clean()` excludes records with the same canonical business values, even if file/row/ID differ. Real shipments can share date, quantity, recipient, batch and product. The current behavior blocks readiness, so this is conservative rather than silent assurance, but totals are incomplete until corrected. | Explain this policy in import review and require original transaction references or disambiguating source records for a future release. Do not silently start summing duplicates. Existing warning and blocked readiness should remain. |

## Executed reproduction

Ran Node 22.16.0 with `--experimental-strip-types`. For each test below, clone `demoDataset`, remove the sample blank-batch shipment, apply the mutation and call `datasetSchema.safeParse` and `analyze`.

```text
mutation                             schema  ready  quantitativeComplete  non-info findings
shipment date = 2020-01-01            pass    true   true                  none
production date = 2020-01-01          pass    true   true                  none
selected receipt supplier = blank    pass    true   true                  none
selected production ingredients blank pass   true   true                  none
linked production/shipment products blank pass true true                  none
first shipment quantity = 1000        pass    false  true                  Shipments exceed batch output
```

## Implemented fixes and verification

The source now emits critical findings for linked shipment dates before production, selected production dates before every available lot receipt, missing receipt/production identity and missing linked shipment product. Explicit identifier links remain visible for investigation. Negative ingredient and finished-stock balances, chronological conflicts and product conflicts disable the relevant quantitative-completeness flags. The backend owner also strengthened shared schema identity validation.

Added six regression tests covering impossible chronology, preserved customer scope, missing identity, negative balances and valid same-day/multiple receipt records. All 30 trace/import tests passed on Node 22.16.0. Chronology is deliberately bounded to date evidence and earliest available receipt; it is not a full inventory ledger or cumulative daily receipt allocation. Duplicate transaction ambiguity remains a conservative limitation.

## Positive evidence and limits

The existing trace tests cover case-sensitive identifiers, unit incompatibilities, supplier-local lot collisions, same-product missing ingredient evidence, missing batch assignments, duplicate/invalid quantities, multiline CSV provenance and preservation of unmapped raw source cells. The engine does not pretend a language model is identifying lineage. The app preserves source evidence and separates the unresolved forty-case sample shipment from the confirmed 650 cases. These are meaningful strengths.

The narrow supported workflow is one ingredient-to-finished-batch transformation layer. Rework, nested bills of material, transfers, returns, disposal and physical inventory reconciliation are not implemented. The operator guide states these limits; production-facing copy and exports should keep the calculated-stock and uploaded-record boundaries visible. Avoid any claim of full recall management or compliance certification.

## Release acceptance tests

1. Confirm public sample works without sign-in and keeps synthetic labels visible in reports.
2. Create a fresh Firebase email/password account. Reject wrong credentials without disclosing account existence; verify sign-out removes access to saved records. If email verification is required, demonstrate the actual verification path.
3. Save, reload and reopen a custom CSV workspace. Try an unauthorized second account against workspace and drill endpoints and require denial.
4. Modify the same saved workspace from two sessions. Confirm stale revisions cannot silently overwrite a newer save.
5. Import valid files, malformed CSV, invalid dates, blank required identities, duplicate files, mixed units, multiline raw evidence and oversized payloads. Invalid imports must leave records unchanged.
6. Inspect an original source row, leave an unresolved assignment unchanged, then test a documented correction on a separate copy. Save, reopen and verify original and current values remain distinguishable.
7. Save a rehearsal snapshot, change the workspace and verify the earlier snapshot remains unchanged. Verify deletes remove accessible workspace/history records.
8. Download trace CSV and complete JSON. Confirm unresolved records, source coordinates and correction provenance. Print to PDF and inspect page breaks and clipping.
9. Check 390-pixel mobile, tablet and desktop layouts; keyboard dialogs, focus restoration, escape close, horizontal table scrolling and loading/error states.
10. Run all automated checks against final main, then repeat live smoke checks on the final Firebase URL, not only localhost.

## Judging feedback

| Criterion | Grounded strength | What improves it most |
|---|---|---|
| Innovation | Makes absent evidence a first-class result, instead of presenting a confident answer from messy spreadsheets | Open the demo on the missing forty-case shipment. Explain the deliberate refusal to guess. Avoid pitching another generic AI agent. |
| Real-world impact | Specific buyer and recurring rehearsal job; migration starts with existing CSV records | Validate with real operators later. Do not turn proposed CAD 99 pricing or untested time savings into traction claims. |
| UI and design | Source evidence and investigation queue support a clear review task | Demonstrate actual file import, persistence and export. Keep the primary action prominent on small screens. |
| Tech and deployment | Deterministic domain logic, raw evidence preservation, snapshot/revision model | Fix the P1 cases, verify migrated tenant isolation, test clean deployment and retain reproducible scripts. |
| Security and ethics | Synthetic sample, explicit uncertainty, qualified-person decision boundary | Ensure privacy notice and operator guide describe Firebase/Cloud Run reality. Do not claim live AI, certifications, verified customers or guarantees. |

## Commercial interpretation

The strongest wedge is a rehearsal and evidence-preparation workspace for small packaged-food makers who already keep receiving, production and shipping spreadsheets. The differentiator is auditable uncertainty and low migration effort. The longer-term advantage would come from validated operational fit and reliable mapping/reconciliation workflows. Neither a moat nor customer demand has yet been proven. Keep billing and broad inventory-system promises outside this release.
