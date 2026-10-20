# Lotline launch and submission gates

Prepared 20 October 2026. An unchecked box means not independently confirmed by this document. Do not convert these into statements of completion without evidence.

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

- [ ] Verify deployed Sites authentication and user-owned persistence with two genuine accounts. No Clerk key is necessary for Sites-provided authentication; no Clerk prize claim is made.
- [ ] Optional: configure a server-side Anthropic API key if live AI column mapping is part of the final build. Create it in the Anthropic Console, enable billing or verified credits, set a small spending cap, and enter it through the hosting service's secret configuration. Never commit it or put it in a browser bundle. Do not claim a successful provider call until tested.
- [ ] Confirm production hosting entitlements, database quotas, storage region and backup options. Free access for this build does not prove a production SLA.
- [ ] Confirm GitHub publication rights, repo URL and public visibility. Inspect the published repository for secrets and confidential data.
- [ ] Enter any private tokens only through a secure secret-entry flow. CAPTCHA, billing consent and account verification may require Shivam's interaction.

## Working application verification

- [ ] Deployed home and sample workflow load in a fresh browser session.
- [ ] Login/logout, save, reload and owner isolation pass. Account B cannot retrieve Account A's private workspace by changing an identifier.
- [ ] Sample data is labeled synthetic and uses sesame SES-104 consistently.
- [ ] Import errors are understandable; unknown columns and invalid rows do not silently disappear.
- [ ] Confirm lot-to-batch-to-shipment trace and supporting source-row references.
- [ ] Check missing and ambiguous lot handling; do not classify uncertain records as unaffected.
- [ ] Verify duplicate lots across suppliers, duplicate batches/products, cycles, units, numeric parsing, returns and rework are either correctly handled or explicitly unsupported.
- [ ] CSV/JSON exports match the current reviewed state; spreadsheet formula values are safely escaped.
- [ ] Print/PDF report is legible and includes drill labeling and uncertainty. Browser print-to-PDF is distinct from server-generated PDF.
- [ ] Optional AI endpoint has authentication, input limits, timeout/error fallback and no exposed secret. Verify it sends only the intended fields.
- [ ] Verify responsive/mobile layout, keyboard navigation and contrast.
- [ ] Record commands, test results and known limitations in a reproducible verification report. Never call unrun tests passed.

## Real customer readiness

- [ ] Have a qualified food-safety practitioner review the scope, data model and drill output.
- [ ] Establish privacy notice, retention/deletion, data residency, backups/recovery, operational monitoring and incident response appropriate to the customer's obligations.
- [ ] Verify all data access checks server-side; inspect dependencies and file-import limits.
- [ ] Get permission before importing actual customer records. Keep public demo data synthetic.
- [ ] Conduct discovery and a paid pilot; no traction, savings or compliance guarantee is established yet.

## Submission assembly

- [ ] Confirm Best Overall entry; add sponsor categories only after genuine qualifying integrations exist and are evidenced.
- [ ] Replace draft placeholders with the verified live app, public GitHub and video links.
- [ ] Review devpost.md against deployed behavior and actual test results. Remove conditional implementation notes before publication.
- [ ] Disclose the Vinext starter, platform infrastructure and substantial Codex assistance. Credit Shivam Gupta as project creator without inventing manual implementation or user research.
- [ ] Submit the actual Devpost project only once eligibility and form requirements are satisfied. Saving these documents is not submission.
- [ ] Reopen the submitted page and check links, formatting, team details and edit status before the deadline.
