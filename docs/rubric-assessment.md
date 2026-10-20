# Lotline: candid rubric review

This is an internal critical review, not a score from Build North judges. Scores are provisional internal assessments after source review, 41 passing tests, successful type/build checks and recorded production browser verification. The hosted flow includes sign-in, D1 save/reopen, saved snapshot export, CSV import and mobile layout checks; see verification.md for limits. A polished narrative cannot substitute for deployment evidence.

| Criterion | Provisional / 5 | Evidence and concern | Highest-value next verification |
|---|---:|---|---|
| Innovation | 3.5 | The evidence/gap-first workflow is focused and comprehensible. Traceability graphs and recall reports already exist in Katana/FoodDocs. Differentiation remains a hypothesis. | Show import of existing records and an ambiguous lot that stays unresolved instead of a false complete result. |
| Real-world impact | 3 | A specific operator and recurring workflow are supported by primary guidance. No interviews, usage, payment or measured savings exist. | Observe a practitioner doing a drill and compare the exported evidence with what they actually need. |
| UI and design | 4 provisional | Desktop workflow, receiving import and 390 × 844 responsive layout were verified. No uninstructed target-user usability session has been observed. | Observe an operator selecting a lot, inspecting evidence and exporting without coaching. |
| Tech and deployment | 4 | 41 tests and type/build checks pass. Public deployment, hosted sign-in, D1 save/reopen and snapshot JSON export were exercised. Two genuine-account browser isolation and remote CI remain open. | Publish final fixes, rerun smoke checks and add a two-account browser test plus CI. |
| Security and ethics | 3.5 pending operational review | Local tests cover server authorization, mutation boundaries, strict validation, quotas and mocked model-output constraints. Synthetic fixtures and visible uncertainty help; hosting controls and data obligations remain gates. | Validate backup recovery, data location and two genuine-account isolation; retain the implemented distinction between original and manually reviewed assignments. |

## Adversarial judge questions and direct answers

**“Why isn't this just a spreadsheet join?”**

The core joins should indeed be simple and deterministic. The product value to test is the complete review workflow around them: importing existing layouts, retaining source references, refusing unsupported links, and producing a drill record. If buyers can do this comfortably in their current sheets, we have not earned a business.

**“Why use AI?”**

Unfamiliar column layouts are a reasonable bounded use for AI suggestions. Users can review them, and the trace does not depend on a model inventing relationships. If no provider key is configured, do not pretend an AI call occurred. The deployable product should still work through explicit mappings.

**“Is this safe for a real recall?”**

It is a record preparation and rehearsal tool. It does not decide food safety or incident scope. Until practitioner review and production gates pass, do not represent it as a replacement for established incident procedures.

**“Who pays?”**

The candidate buyer is the operations/quality lead at a small packaged-food maker using spreadsheets. Proposed pricing is an experiment. No one has been shown to pay yet.

**“Why not Katana or FoodDocs?”**

They already support traceability and may be the better choice for buyers needing broad inventory or food-safety operations. Lotline tests a narrower adoption path around existing records and visible gaps. We do not claim competitors lack these abilities without testing them.

**“What would stop you from launching tomorrow?”**

Practitioner validation, customer discovery, production data handling and tested deployment are real gates. For this specific competition, eligibility, registration and Toronto attendance also require confirmation. Strong execution includes acknowledging those gates rather than faking completion.

## Improvements that should change a judge's mind

1. Prove a complete real interaction, from a sample CSV through trace, source row, ambiguity and export.
2. Show a failed/incomplete case as carefully as the happy path.
3. Publish tested architecture and limitations in the repository.
4. Keep the final video short and legible. Let working evidence carry the story.
5. Add one genuine practitioner review if available, with permission and honest attribution. Do not manufacture it.
