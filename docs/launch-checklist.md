# Lotline launch and submission gates

Prepared 20 October 2026. Completed checks are grounded in the build verification record; see verification.md. An unchecked box remains open. Do not convert these into statements of completion without evidence.

## Eligibility: resolve before entering

- [ ] Confirm Shivam Gupta is 18+ and genuinely meets the official residency rule. The [specific Devpost rules](https://build-north.devpost.com/rules) say participants must live in Canada. An India timezone does not prove residence, but no Canadian residence is established here. The overview's generic international badge is insufficient to override the specific rule.
- [ ] If residency does not qualify, obtain an explicit organizer exception before entering. Do not invent a Canadian address, teammate, or eligibility confirmation. The product can still be launched independently.
- [ ] Confirm registration is accepted. The [organizer's Luma page](https://luma.com/build-north) lists registration closing and team confirmation on 16 October. This build begins after that date. No late-registration exception has been obtained.
- [ ] Confirm actual team roster, up to four people, and that no exclusion/conflict applies. Current named creator: Shivam Gupta. AI tools are disclosed, not listed as human teammates.
- [ ] Confirm at least one eligible team member can attend Toronto on 29 October if selected. Travel and accommodation are self-funded according to Luma; no booking or visa/entry permission is confirmed.

## Deadline and video conflict

Use **25 October 2026, 11:59 PM Eastern**, or **26 October, 9:29 AM India Standard Time**, as the latest published narrative deadline. Aim to finish by 25 October, 8:00 PM IST. The Devpost schedule uses the midnight boundary one minute later; do not rely on that extra minute. [Official schedule](https://build-north.devpost.com/details/dates)

- [ ] Verify the final submission form and organizer announcements for deadline changes.
- [ ] Resolve conflicting video guidance: [Devpost](https://build-north.devpost.com/) says optional/up to four minutes, while [Luma](https://luma.com/build-north) says required/up to two. Use the supplied two-minute cut unless clarified.
- [ ] Record narration and real screen interactions; upload an accessible video and check no-login playback. The human recording is not completed by the script.

## Keys and account access

- [ ] Verify deployed Firebase Authentication and user-owned persistence with two genuine accounts. No Clerk key is necessary for Firebase Authentication; no Clerk prize claim is made.
- [x] Choose rule-based mapping fallback for this deployment. No live model key is needed or claimed.
- [ ] Optional future integration: configure a server-side Anthropic API key if live AI column mapping becomes part of a later build. Create it in the Anthropic Console, enable billing or verified credits, set a small spending cap, and enter it through the hosting service's secret configuration. Never commit it or put it in a browser bundle. Do not claim a successful provider call until tested.
- [ ] Confirm production hosting entitlements, database quotas, storage region and backup options. Free access for this build does not prove a production SLA.
- [x] Verify public repository: https://github.com/shi1720/lotline.
- [ ] Complete a final published-source secret/confidential-data review after the last commit.
- [ ] Enter any private tokens only through a secure secret-entry flow. CAPTCHA, billing consent and account verification may require Shivam's interaction.

## Working application verification

- [ ] Verify final Firebase application and sample load: https://lotline-trace.web.app.
- [ ] Verify Firebase email/password sign-in, workspace save to Firestore, reload and saved-workspace reopening exercised.
- [ ] Complete logout and two genuine-account browser isolation. Injected-identity API ownership tests pass; forged identity headers on anonymous production requests returned 401.
- [x] Public sample is synthetic and uses sesame SES-104 consistently.
- [ ] Import errors are understandable; unknown columns and invalid rows do not silently disappear.
- [ ] Confirm lot-to-batch-to-shipment trace and supporting source-row references.
- [ ] Check missing and ambiguous lot handling; do not classify uncertain records as unaffected.
- [ ] Verify duplicate lots across suppliers, duplicate batches/products, cycles, units, numeric parsing, returns and rework are either correctly handled or explicitly unsupported.
- [ ] CSV/JSON exports match the current reviewed state; spreadsheet formula values are safely escaped.
- [ ] Print/PDF report is legible and includes drill labeling and uncertainty. Browser print-to-PDF is distinct from server-generated PDF.
- [ ] Optional AI endpoint has authentication, input limits, timeout/error fallback and no exposed secret. Verify it sends only the intended fields.
- [x] Inspect 390 × 844 responsive layout and mobile navigation.
- [ ] Complete broader keyboard-navigation and contrast review.
- [ ] Record the final trace/import and Firebase API test totals, passing type/build checks and known limits in verification.md.
- [x] Production receiving-CSV import in Replace mode and saved snapshot JSON download inspected, including dataset and result.
- [x] Correction flow preserves original assignment and requires a nonempty note before confirming; imported CSV sourceData retains mapped/unmapped cells separately.
- [x] Test aggregate 25 MiB per-user application payload quota, including multibyte records, tenant separation, shrinking/equal-size updates and deletion freeing bytes.
- [x] Add public privacy notice describing data handling and hosting limitations.
- [ ] Confirm final deployment contains these last source changes; review dependency caveat in SECURITY.md.
- [ ] Publish final source fixes and repeat production smoke checks; the first verified deployment corresponds to 0a95369.
- [ ] Add and run remote CI; local passing checks are not a CI run.

## Real customer readiness

- [ ] Have a qualified food-safety practitioner review the scope, data model and drill output.
- [ ] Establish privacy notice, retention/deletion, data residency, backups/recovery, operational monitoring and incident response appropriate to the customer's obligations.
- [ ] Verify all data access checks server-side; inspect dependencies and file-import limits.
- [ ] Get permission before importing actual customer records. Keep public demo data synthetic.
- [ ] Conduct discovery and a paid pilot; no traction, savings or compliance guarantee is established yet.

## Submission assembly

- [ ] Confirm Best Overall entry; add sponsor categories only after genuine qualifying integrations exist and are evidenced.
- [x] Add verified app and public repository links to README and Devpost draft.
- [ ] Add the recorded/uploaded video link after no-login playback verification.
- [ ] Review devpost.md against deployed behavior and actual test results. Remove conditional implementation notes before publication.
- [ ] Disclose the Vinext starter, platform infrastructure and substantial Codex assistance. Credit Shivam Gupta as project creator without inventing manual implementation or user research.
- [ ] Submit the actual Devpost project only once eligibility and form requirements are satisfied. Saving these documents is not submission.
- [ ] Reopen the submitted page and check links, formatting, team details and edit status before the deadline.
