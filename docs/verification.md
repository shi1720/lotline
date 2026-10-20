# Lotline verification record

Updated October 21, 2026. This record distinguishes executed checks, historical checks and remaining limits. It is not an independent certification or a guarantee of operational suitability.

## Current deployment

- Public application: [lotline-trace.web.app](https://lotline-trace.web.app)
- Source: [shi1720/lotline](https://github.com/shi1720/lotline)
- Serving path: Firebase Hosting, Firebase Authentication email/password, Express on Cloud Run us-central1, named Firestore database `lotline` in Montreal.
- Final backend runtime: Node 24; verified Cloud Run revision ends in `00002`. The final frontend polish was deployed separately through Firebase Hosting.
- Mapping: deterministic rules. No live LLM key or provider inference is needed or claimed.

These observations apply to the Firebase application. The earlier Sites deployment is recorded separately below.

## Automated checks

The final combined `npm test` run passed **55 tests**. TypeScript, application-scoped lint and the production build passed. The production dependency audit reported **zero findings** after pinning `@grpc/grpc-js` to 1.14.6. This production audit is not a claim of a clean full development dependency graph or an independent security audit.

The suite includes thirty trace/import tests, the earlier handler/Worker regression tests and the new Firebase Express API tests. Coverage includes sample arithmetic, malformed/multiline CSV, raw evidence preservation, missing/ambiguous lineage, supplier collisions, incompatible units, chronology, missing identities, negative balances, ownership boundaries, revision conflicts, limits and snapshot preservation. Firebase API tests include chunk reconstruction above 1 MiB with Unicode. Mock/injected API tests are distinct from the genuine-account live checks below.

Independent review reproduced accepted impossible dates and blank business identities. Those cases now produce critical findings or schema rejection. Explicit links remain available for investigation, while conflicting and negative balances disable the relevant quantity-assurance flags. See [review-round2.md](review-round2.md).

Reproduce from a clean clone:

```sh
npm ci
npm run typecheck
npm test
npm run build
```

`npm run deploy:firebase` runs checks/builds, deploys the API and Firebase Hosting/database rules, then verifies health and unauthorized workspace rejection. Authenticated Google Cloud and Firebase tooling with project permissions is required.

## Genuine-account live HTTP checks

The recorded live run passed **20 checks** against `https://lotline-trace.web.app`, using real Firebase accounts and tokens. The evidence file is `lotline-live-test-results.json` in the delivered outputs. Its UTC timestamp is October 20, 2026 at 18:37:32, equivalent to October 21 at 00:07:32 India Standard Time.

| Area | Observed result |
|---|---|
| Health and guest boundary | Hosted API health succeeded; private APIs rejected a guest |
| Mutation boundary | Cross-origin writes were blocked |
| Persistence | A workspace was created and preserved original evidence |
| Genuine second account | Could not read or update the first account's workspace |
| Related private resources | Second-account requests could not access drills, events or an individual drill |
| Revisions | Valid update succeeded; stale revision was rejected |
| Rehearsal integrity | Server computed the saved rehearsal; the snapshot stayed unchanged after later edits |
| Mapping | Returned the truthful rule-based fallback |
| Impossible calendar dates | The deployed API rejected a nonexistent calendar date |
| Activity | Server activity recorded revision changes |
| Delete | Test workspace deletion succeeded; the deleted workspace was inaccessible |

These are bounded functional and authorization checks, not a penetration test. They establish more than injected UID tests, but do not cover every Firebase account, network failure, permission change or alternate deployment configuration.

## Hosted browser workflow

The final browser walkthrough exercised the Firebase application with real interactions:

| Workflow | Observed result |
|---|---|
| Guest sample | Expected two batches, three customers, 650 confirmed shipped cases, 250-case calculated balance and separate forty-case unresolved shipment |
| Authentication | Email/password sign-in and sign-out completed. A fresh account was also created through the final hosted signup form and saved a private workspace successfully. |
| Private picker and loading | Saved private workspace was selected and loaded |
| Source import | Receiving CSV imported using Replace; original evidence remained inspectable |
| Save | Revised workspace saved |
| Rehearsal history | Rehearsal created, shown in history and snapshot downloaded |
| CSV and JSON | Actual downloads obtained from the hosted app |
| Print report | Browser print flow produced an actual PDF |
| Desktop | Final trace, journey, review and import views captured |
| Mobile | Actual hosted 320 by 740, 390 by 844 and 768 by 1024 viewports checked without page overflow; the 390 by 844 layout was captured. Opening navigation excludes the main content from the accessibility tree, focuses Close navigation, traps focus and returns focus on Escape |

Delivered browser artifacts include `lotline-firebase-trace.csv`, `lotline-firebase-evidence.json`, `lotline-firebase-snapshot.json`, `lotline-firebase-report.pdf`, and the desktop/journey/review/import/mobile PNGs. The evidence JSON contains the expected lot, source data and findings. The stored snapshot retains the reviewer note that the forty cases remain unresolved. Browser PDF is an actual print export, not a server-generated PDF feature.

Malformed CSV upload cleared mapping and displayed an unclosed-field error without changing records. Invalid negative-quantity edits were blocked. The observed production browser console contained no errors or warnings. Password-reset email delivery, exhaustive keyboard navigation and additional device coverage remain separate from this completed walkthrough. Do not infer them from sign-in or a single mobile viewport. Follow [testing-instructions.md](testing-instructions.md) for repeatable guest and signed-in steps.

## Firestore access configuration

The deployed `firestore.rules` denies every direct client document read and write. The frontend does not use the Firestore client SDK for workspace persistence. The Cloud Run API accesses the named database with its dedicated server IAM identity after verifying the Firebase token and deriving user-scoped paths.

Three supplemental checks were executed separately from the twenty-case live suite and fifty-five automated tests:

1. A direct Firestore REST request for the authenticated user's own workspace, carrying a genuine Firebase JWT, returned HTTP 403 `PERMISSION_DENIED` against the deployed named database. This confirms that client access is denied even when the user is signed in.
2. Public application, privacy, Firebase web configuration and sample receiving CSV routes returned HTTP 200. These are intentionally public resources, distinct from private workspace endpoints.
3. The hosted Content Security Policy contained `frame-ancestors`, providing a configured embedding boundary.

These checks are not additional unit tests and are not counted in the automated total. Provider IAM, deployment permissions and recovery policies remain operational controls to review.

## Historical checks

The prior Sites release `8697e0c` had 41 passing tests and a successful [GitHub Actions run](https://github.com/shi1720/lotline/actions/runs/39472231554). Its browser checks exercised ChatGPT-owned identity, D1 persistence, snapshots, import and a 390 by 844 layout. Those historical checks do not establish Firebase behavior; the current evidence is listed above.

## Remaining limits

No live model call, customer interview, paid pilot, revenue, measured savings or practitioner acceptance is claimed. The model supports one transformation layer rather than a complete inventory ledger. Chronology compares dates and earliest available lot receipt, not cumulative daily allocation. Semantic duplicates are conservatively excluded and flagged; genuinely identical separate transactions need disambiguating source evidence.

Backup recovery, provider log/backup retention, account deletion policy, operational monitoring, disaster recovery and support readiness have not been established by these tests. Database storage is in Montreal while API requests are processed in us-central1; exclusively Canadian processing is not promised. Real operational use needs practitioner acceptance and suitable privacy/recovery/support procedures.

## Published demonstration and submission preparation

The narrated product demonstration is public at https://www.youtube.com/watch?v=fXdZMhOwFtw. YouTube confirmed publication, copyright and Community Guidelines checks reported no issues, and a separate unauthenticated oEmbed API request returned HTTP 200 with the expected title and embeddable iframe. Browser playback progressed without a media error, full-HD 1920 by 1080 playback was selected and observed, and the uploaded English subtitle track was selectable. The 95.6-second source video contains burned captions as well as the separate SRT track.

Devpost project overview, story, technical stack, live/repository links, cover, four captioned screenshots and public video URL were saved in the existing draft. Creator credit is Shivam Gupta. The entry remains a draft until its creator accepts the final rules agreement and presses Submit project. Preparing fields is distinct from final prize-entry submission.

## Release freshness and deployment credentials

Final HTTP checks verified `no-cache` for the homepage, privacy route with and without a trailing slash, index HTML and public Firebase configuration. Content-hashed assets retain a one-year immutable cache policy, and the API retains `no-store,private`. This avoids serving an old HTML entry point after deployment. The deployment script's hosting-only path was executed successfully with the active gcloud identity, a fresh short-lived credential held in child-process memory and an explicit quota project. No service-account private key or shared global login configuration was changed.
