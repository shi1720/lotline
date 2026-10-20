# Verification record

This record separates automated tests, production browser checks and remaining gaps. It records observations from the build session rather than claiming independent certification, a security audit or commercial readiness.

## Public artifacts

- [Live Lotline application](https://lotline-recall.sg127977958.chatgpt.site)
- [Public GitHub repository](https://github.com/shi1720/lotline)

Both artifacts were verified public and accessible. The first verified production deployment corresponds to source commit **0a95369**. Additional fixes were subsequently prepared; do not assume an unredeployed source change is already live. Rerun the smoke checks after each publication and record the resulting deployment revision.

## Automated checks

| Check | Result | Scope and limit |
|---|---|---|
| Engine/import suite | 24 passed | Deterministic lineage, arithmetic, missing/ambiguous records, CSV parsing, input validation and correction provenance |
| API suite | 15 passed | Actual handlers against SQLite with injected platform identity/D1 adapters; ownership isolation, mutations, revisions, snapshots, quotas and mocked provider behavior |
| Worker integration suite | 2 passed | Worker-runtime integration cases; complements rather than replaces hosted browser checks |
| TypeScript | Passed | Static type checking with `npx tsc --noEmit` |
| Production build | Passed | `npm run build`; a successful build alone is not a deployed-service check |

**Total: 41 passing tests.** API model responses are mocked. No live Anthropic provider call or production model key is claimed. The deployment intentionally uses the rule-based mapping fallback selected for this build.

Reproduce from the project root:

```sh
node --experimental-strip-types --test tests/trace.test.ts
node --test tests/api.test.mjs
node --test tests/api-worker.test.mjs
npx tsc --noEmit
npm run build
```

These counts describe the verified suite at documentation update time. If tests change, update the counts after running them rather than treating this table as permanently current.

## Production browser observations

| Workflow | Observed result |
|---|---|
| Anonymous public sample | Loaded with synthetic sample and expected trace |
| Hosted authentication | Existing ChatGPT sign-in consent completed; returned to the application |
| Private workspace persistence | Workspace saved to D1; after reload the saved-workspace picker reopened it |
| Rehearsal snapshot | Saved with a multiline reviewer note |
| Snapshot JSON export | Downloaded and inspected; contains the saved dataset and calculated result |
| CSV import | Receiving sample imported successfully in Replace mode |
| Console during exercised import | No warning/error observed |
| Mobile layout | 390 × 844 screenshot inspected; responsive layout/mobile navigation verified |
| Manual correction flow | Original assignment, nonempty correction note and ISO timestamp preserved; confirmation disabled until note entered |

These are exercised paths, not proof of every browser, device, dataset or failure mode. Browser print-to-PDF remains a browser feature; a server-generated PDF service is not claimed. The checked snapshot download is JSON, not evidence of a recorded demo video.

## Production HTTP observations

- The public root returned **HTTP 200**.
- Response headers included no-store/cache controls and security headers.
- Anonymous `/api/workspaces` requests carrying forged `oai` identity headers returned **HTTP 401**. The test did not obtain private records by adding those headers.

This is evidence about the exercised hosted boundary. It is not a penetration test or a claim that all alternate-origin hosting configurations would be safe.

## Source-level fixes and their scope

A manual batch correction retains `originalBatch`, requires a nonempty `correctionNote`, and records ISO `correctedAt`; evidence/export surfaces distinguish those values from original imports. The earlier concern that a changed assignment could appear to have existed in the original CSV has been addressed in the current source and exercised correction flow. Full CSV sourceData preserves mapped and unmapped columns separately, including original whitespace and multiline cells (CRLF/CR normalized to LF). The evidence modal distinguishes Original CSV row from normalized/current values and corrections. Schemas reject dangerous object keys and control characters while bounding source columns and cell sizes.

Sign-in draft handling uses temporary sessionStorage: a restored draft is schema-validated and its temporary copy is removed. Restoring a JSON backup opens a new workspace and clears the previous active workspace/history association. These are ephemeral safeguards, not a substitute for durable save or a recovery guarantee. Include these final fixes in the next deployed revision and smoke check.

The 25 MiB aggregate per-user payload quota is enforced through atomic SQL byte-count predicates across workspace and snapshot payloads. Tests include multibyte input, quota rejection for create/update/drill, equal-size and shrinking updates at quota, tenant separation and deletion freeing bytes. The public `/privacy` page documents retention/deletion, temporary draft handling, fonts and unguaranteed hosting-region details. Final source changes require the final deployment/revision check noted above.

Dependency audit status is recorded in SECURITY.md: production-only audit reports zero findings; the full dependency graph still has eight high entries from an unresolved braces 3.0.3 advisory chain, with zero critical. No clean full-graph audit is claimed, and RSC runtime dependencies are considered despite their package classification.

## Explicitly not established

- Two **genuine account** browser isolation has not been tested. Injected Alice/Bob API ownership tests pass; those are distinct evidence.
- No live Anthropic API call has been made or required for this deployment.
- No practitioner acceptance, actual customer operational use, paid pilot, revenue, measured time savings or willingness to pay is established.
- Data residency suitability, backup restoration, hosting retention/deletion commitments, operational monitoring and incident-response readiness have not been independently established.
- CI is planned separately; this record does not claim an executed remote CI run.
- Eligibility, late-registration acceptance, Canadian residence and Toronto attendance remain unconfirmed.
- Video recording/upload and Devpost submission remain unfinished.

Use docs/launch-checklist.md to track those remaining gates. A functioning demonstration and a public deployment are real accomplishments; neither establishes suitability for a real food-safety incident without the remaining review.
