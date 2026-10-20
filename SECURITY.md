# Security and data handling

Lotline is an evaluation build for record preparation and recall rehearsal. It is not a food-safety decision system, a compliance certification, or an independently audited production service. Use synthetic or appropriately de-identified records until operational data handling has been reviewed.

## Implemented controls

- Sites injects authenticated identity in the hosted environment. Workspace queries use the stable user ID and workspace ID together; ownership is checked for workspace, event and drill resources. Unauthorized ownership lookups return 404.
- Private responses are marked `no-store, private`. Mutations require same-origin requests; JSON bodies are type-validated and stream-limited to 1 MiB.
- Dataset schemas bound record count, text lengths, dates and finite positive quantities. A workspace holds at most 5,000 total records. Account and drill quotas are enforced inside database statements.
- Workspace updates compare revisions to detect stale writes. Database triggers generate system activity events. User notes cannot impersonate those system events.
- Drill results are calculated server-side from the saved record set and retained with the snapshot. The API exposes no snapshot-update endpoint.
- Optional AI mappings accept only canonical fields and existing source headers. The model cannot mutate record values. The request has a 15-second timeout and durable per-user limits of 6/minute and 100/day. These limits are abuse controls, not a complete cost or availability guarantee.
- CSV exports quote fields and prefix formula-like values. Imported content renders through React text handling. Manual batch corrections require a nonempty note, preserve the original batch assignment and record an ISO timestamp; they are displayed separately from original import values.

## Data flow and secrets

Public sample operations run in the browser. Saving sends workspace records to the application's D1 database. Before full-page sign-in, the application preserves a temporary draft in sessionStorage. On return it validates and restores that draft, then removes the temporary copy. A downloaded JSON backup remains advisable; refresh, browser restrictions or a closed tab can still affect unsaved work. Restoring a backup opens a new workspace and clears the previous active/history association.

**Suggest mapping** sends column headers and up to three sample rows to the server after explicit action. With `ANTHROPIC_API_KEY` configured, those fields are sent to Anthropic. Without it, the server returns rule-based suggestions. The internal user ID is not sent to Anthropic. Do not include consumer health information or sensitive free-text data in imports.

Keep provider keys in server-side hosting secrets. Never use public browser environment variables for them. The selected deployment intentionally uses the rules fallback; no live Anthropic key or provider call is claimed. Portable mock sign-in is development-only and must never be treated as a production identity provider.

## Verification and remaining limits

The passing suite has 22 engine/import tests, 13 API tests and 2 Worker integration tests, plus passing TypeScript/build checks. Production browser verification exercised sign-in, D1 saves/reopen and drill JSON export. Production HTTP probes returned 401 for anonymous workspace requests even with forged oai identity headers. Tenant separation is tested with injected identities; two genuine-account browser isolation has not been performed. No penetration test or independent audit is claimed. See docs/verification.md.

Hosting region, regulatory data-location suitability, encryption/key-management commitments, retention schedules, backup deletion, disaster recovery, operational monitoring and contractual privacy terms have not been independently established. UI deletion removes workspace data and related drill/activity rows through database relationships; it does not establish deletion from hosting backups. This version has no team membership, granular staff roles or external account-provisioning integration.

## Reporting a vulnerability

Do not post secrets, actual customer records, or exploit details in a public issue. When the repository is public, use GitHub's private vulnerability-reporting feature if enabled. Otherwise, open a minimal issue requesting a private contact channel without describing sensitive details. No private reporting inbox or response-time SLA is currently established.

## Before customer production use

Review the launch checklist, run two-account hosted isolation tests, validate the full authentication boundary, confirm data handling with the intended operator, exercise backup/recovery and deletion, and obtain domain-practitioner review of supported scenarios. An empty trace or clean automated check does not establish safety or completeness.
