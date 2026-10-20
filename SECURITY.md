# Security and data handling

Updated October 21, 2026. Lotline prepares source records and supports recall rehearsals. Results describe the supplied evidence. They do not establish food safety, complete incident scope, regulatory compliance or independent certification. Practitioner acceptance and operational privacy, recovery and support procedures remain necessary before customer use.

## Active deployment and trust boundaries

The active application is [lotline-trace.web.app](https://lotline-trace.web.app). Firebase Hosting serves the compiled React frontend and routes `/api/**` to the Express API on Cloud Run. The verified backend runs Node 24. Firebase Authentication provides email/password accounts and sessions. The API verifies each private request's bearer token with Firebase Admin, including revocation checks. Browser-supplied owner IDs and historical Sites identity headers do not establish identity.

Private records live in the named Firestore database `lotline`, under `users/{verifiedUid}/workspaces/{workspaceId}`. Each workspace has its own events and drill subcollections. The server constructs paths from the verified user ID. Cross-account workspace, event and snapshot lookups return 404 without exposing another account's data. The runtime uses a dedicated Google Cloud service account.

The deployed Firestore rules deny direct client reads and writes. Persistence passes through the authenticated API using Admin SDK IAM permissions. Those rules are deployed only to the named Lotline database. They do not replace the default database rules of unrelated applications sharing the Firebase project.

Firestore storage is in Montreal. API requests are processed in us-central1. Exclusively Canadian processing is not promised. Provider retention, backup handling and legal suitability require separate review.

## Implemented controls

- Private API responses use `Cache-Control: no-store, private`. Mutations require an explicitly allowed Origin. JSON requests are limited to 1 MiB and validated against strict schemas. Ownership is checked for each private resource.
- Dataset validation bounds text, record count, real calendar dates and finite positive quantities. Missing lot and batch identifiers remain representable so unresolved lineage is visible. Required ingredient, product and supplier identities cannot be blank in saved records.
- Firestore transactions enforce revision checks, account quotas and related bookkeeping. A stale save returns 409 rather than overwriting a newer revision. Server-generated activity identifies verified saves and drill creation. User-authored notes have a separate kind and prefix and cannot impersonate those events.
- Drill results are recomputed on the server from the saved dataset. The saved dataset, result, selected lot, source revision and reviewer notes are retained together. Snapshot payloads are chunked below Firestore's document limit. The API exposes no snapshot-update endpoint. These are application snapshots, not independently notarized evidence or a tamper-proof external audit service.
- Each API process limits an authenticated user to 120 requests and 30 mutations per minute. Mapping requests count as mutations. Exceeding a limit returns 429 with `Retry-After`. Public health checks are exempt. The bounded in-memory counters are not a distributed global limiter and reset on process restart. Durable storage quotas are enforced separately in Firestore transactions.
- Firebase Hosting applies content security, frame, content-type, referrer and permissions headers. The API does not return internal errors, token contents or source records in error messages.
- React renders imported content as text. CSV exports quote cells and neutralize formula-like values. Corrections preserve original imported cells; shipment batch corrections additionally preserve the original assignment, reviewer note and timestamp.

## Limits and deletion

| Control | Limit |
|---|---:|
| JSON request | 1 MiB |
| Serialized workspace dataset | 700,000 bytes |
| Records per workspace | 5,000 |
| Workspaces per account | 20 |
| Saved drills per workspace | 100 |
| Snapshot payload | 1,800,000 bytes |
| Application-counted saved payload per account | 25 MiB |
| Server activity events per workspace | 5,000 |
| User notes per workspace | 500 |

Application byte accounting covers saved data and associated audit/note payloads. It is not a Firestore billing-byte measurement.

Deletion first creates a persistent deletion intent and makes the workspace inaccessible. The account quota is released once. The server then attempts recursive cleanup up to three times. A cleanup failure returns an explicit 503 instead of claiming all stored records were removed. Repeating DELETE resumes cleanup, including when a prior partial deletion removed the parent document, without releasing quota twice. Successful completion removes the workspace descendants and deletion intent. These checks do not establish deletion from provider backups or logs. Workspace deletion does not delete the Firebase Authentication account.

## Browser data and public configuration

The fictional sample and unsaved editing run in the browser. Saving sends records to the API and Firestore. Unsaved data can be lost on refresh or tab closure; export a JSON backup when needed. Downloaded backups and exports become the operator's responsibility. Avoid consumer health information and unnecessary personal data in imports.

`public/firebase-config.json` intentionally contains Firebase web configuration and a restricted public API key. This is not an Admin private key or a secret that grants database access. Firebase Authentication, verified bearer tokens, API authorization and Firestore rules provide the data boundary. Keep service-account private keys, provider secrets and privileged access tokens out of browser assets, repository files and logs. Cloud Run uses its assigned service identity rather than a committed credential file.

The active mapping endpoint returns deterministic rule-based header suggestions for the user to review. It does not call an LLM or send records to an inference provider. No live Anthropic or other model inference is claimed. Earlier Sites/D1 handlers and their optional Anthropic code remain archival source and regression context; they are not the current Firebase serving path.

## Verification evidence

The current automated suite passes **55 tests**: 30 trace/import tests and 25 API regression and integration tests. Eight API test groups exercise the active Firebase Express handlers, including token revocation, ownership, revision conflicts, quotas, Unicode snapshot reconstruction above 1 MiB, immutable evidence, deletion failure/recovery and request throttling. TypeScript, application-scoped lint and the production build also passed. Mocked handler tests do not substitute for live authorization checks.

The deployed Firebase release separately passed **20 live HTTP checks using genuine Firebase accounts and tokens**. Those checks include cross-account isolation for workspaces and related resources, stale revision rejection, persistence, snapshots and deletion. A supplemental direct Firestore REST request carrying a genuine user's JWT returned 403 `PERMISSION_DENIED` for that user's own workspace, confirming that signed-in clients cannot bypass the API through direct database access. Hosted browser checks exercised sign-in, source import, reviewer edits, saving/reopening, snapshots and exports. Responsive layouts were inspected at multiple widths. See [verification evidence](docs/verification.md) for exact coverage and artifacts.

These are bounded functional and authorization checks. They are not a penetration test or an independent security audit. Password-reset email delivery, exhaustive device coverage, practitioner acceptance, disaster recovery and provider backup deletion have not been established by these checks.

## Dependency advisory status

A fresh audit on October 21, 2026 reports **zero advisories in the production dependency graph**. The complete repository dependency audit reports **eight high-severity entries and zero critical entries**. Those entries propagate the [braces nested-pattern stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through glob matching, Next ESLint tooling and archived Vinext build plugins. They remain unresolved in the full development graph. The audit's suggested major dependency changes have not been applied blindly.

The active frontend uses the Firebase Vite configuration; the backend container installs a separate locked minimal runtime dependency set. It does not serve the archived Sites Worker or use Vinext to handle production requests. Uploaded records are not evaluated as glob patterns. This is a reachability assessment, not proof that every dependency or emitted artifact is safe. Build reviewed source in isolated jobs, keep development servers private, track upstream fixes and rerun both complete and production audits when lockfiles change. A clean production audit must not be described as a vulnerability-free service or a clean complete dependency audit.

## Reporting a vulnerability

Do not post secrets, actual customer records or exploit details in a public issue. Use GitHub private vulnerability reporting if enabled. Otherwise, open a minimal issue requesting a private contact channel without disclosing sensitive details. No private reporting inbox or response-time SLA is established.

## Before customer use

Validate representative workflows with a food-manufacturing practitioner. Establish suitable privacy terms, account lifecycle and retention policies, backup/recovery procedures, monitoring and support. Review the shared-project Firebase configuration and IAM scopes as deployment needs change. Repeat live authorization and deployment checks after changes to authentication, database rules, hosting routes, dependencies or service identities. A clean trace describes the supplied records and cannot establish that unrecorded exposure does not exist.
