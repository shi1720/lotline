# Lotline

**Find the lot. Follow the records. See what is missing.**

[Open Lotline](https://lotline-trace.web.app) · [Watch the demo](https://youtu.be/fXdZMhOwFtw) · [Testing instructions](docs/testing-instructions.md)

Lotline helps an operations or quality lead at a small packaged-food producer rehearse an ingredient trace using records they already keep. Import receiving, production and shipment CSVs, inspect the recorded path from a supplier lot to batches and customers, and keep missing evidence visible alongside the result.

Created by **Shivam Gupta**, who directed the product, commercial requirements and quality decisions, with substantial Codex assistance in implementation, research, testing and documentation. The initial interface began from a Vinext starter; the current deployment uses Firebase Hosting, Firebase Authentication, Cloud Run and Firestore.

![The live Lotline trace workspace](docs/assets/trace-workspace.png)

## Try the complete workflow

1. Open [lotline-trace.web.app](https://lotline-trace.web.app). The fictional Cedar & Crumb sample works without an account.
2. Select **SES-104**. Its 100 kg receipt connects to two batches, 90 kg of recorded use, 900 cases produced and 650 cases shipped to three customers. The calculated finished-stock balance is 250 cases.
3. Open a lineage card. Inspect the source filename, physical CSV row number and original imported cells, separate from normalized values and reviewed corrections.
4. Review the separate **40-case shipment with no batch assignment**. It remains unresolved and is excluded from confirmed totals. Only original documentation can justify an assignment.
5. Export the trace as CSV, complete evidence JSON or a print-ready report saved as PDF through the browser.
6. Optionally create an email/password account. Save a private workspace, reopen it and record a rehearsal snapshot with reviewer notes.

All sample records and businesses are synthetic. Calculated stock is output less recorded shipments, not a physical inventory count. Lotline prepares evidence; a qualified person makes incident and food-safety decisions.

## Development and checks

Use Node.js 24 LTS, matching Cloud Run and CI. Install dependencies and run the checks:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

For local interactive work, run `npm run dev:api` in one terminal and `npm run dev` in another. The frontend runs at `http://localhost:5174` and proxies API requests to port 8080. Set the intended Google Cloud project and use Application Default Credentials for the API.

To reproduce deployment to the configured project, run `npm run deploy:firebase`. The script validates the checked-in public Firebase configuration, runs checks and builds, deploys the Cloud Run API, then deploys Firebase Hosting and rules for the named database. It requires an authenticated Google Cloud identity, Firebase tooling and appropriate project permissions. Firebase deployment uses a fresh short-lived credential in process memory and an explicit quota project. Use `npm run deploy:firebase -- --hosting-only` for frontend or header updates that do not change the API or database rules.

The frontend uses Vite with `vite.firebase.config.ts`; the Express API entry point is `server/index.ts`. Local API execution requires a Firebase project configuration and Application Default Credentials with access to its named `lotline` Firestore database. Do not commit service-account keys or production credentials. The public Firebase web configuration identifies the project and is not an administrator credential.

The public sample and local CSV trace computation do not require a model key. The deployed mapping endpoint uses deterministic rules. No live LLM inference is required or claimed. Legacy Sites/Worker adapters remain in the repository as prior implementation context; they are not the Firebase production serving path.

Final verification includes 55 passing automated tests, 20 genuine-account live HTTP checks and hosted desktop/mobile import, persistence, rehearsal and export checks. The production dependency audit reported zero findings. See [verification](docs/verification.md) for exact scope and limits. Do not mistake a passing old Worker test for verification of the new Firebase backend. Follow [architecture](docs/architecture.md) and the checked-in deployment configuration for the active deployment path.

## Architecture

- React 19, TypeScript, Vite and Tailwind for the responsive interface.
- Firebase Hosting serves the frontend at **lotline-trace.web.app** and routes `/api/**` to an Express API on Cloud Run in **us-central1**.
- Firebase Authentication handles email/password sign-up, sign-in, password reset and sessions. The API verifies Firebase ID tokens server-side.
- The named Firestore database **lotline** is in **northamerica-northeast1, Montreal**. API processing runs in us-central1; the database region is not a promise that all processing stays in Canada.
- Deterministic trace and CSV logic lives in `lib/trace.ts` and `lib/import.ts`.
- User-scoped saved workspaces use transactional revision checks, server-generated activity and server-computed rehearsal snapshots.

The current API caps a dataset at 700,000 serialized bytes and 5,000 total records. It caps accounts at 20 workspaces and 25 MiB of application-counted saved payloads, and workspaces at 100 rehearsal snapshots. Request and source-file limits may apply sooner. See the [operator guide](docs/operator-guide.md) for details.

## Supported scope

The supported relationship is one transformation: **ingredient lot → finished batch → shipment**. Exact identifiers establish links. Missing identities, supplier-lot collisions, incompatible units, conflicting quantities and impossible linked dates produce findings. The engine does not infer missing batch assignments or invent evidence.

Rework, intermediates, returns, waste, transfers and unrecorded stock adjustments are not a full inventory ledger. Supplier lot IDs must be unique within a workspace. Chronology checks dates and earliest available receipt evidence, not cumulative inventory allocation or times within a day.

Before real operational use, validate the workflow with a food-safety practitioner and establish suitable privacy, recovery, retention and operational support. No customer traction, revenue, measured time savings or compliance certification is claimed. [Commercial thesis](docs/business.md) describes explicit hypotheses rather than validated demand.

## Documentation

- [Operator guide](docs/operator-guide.md)
- [Guest and signed-in testing instructions](docs/testing-instructions.md)
- [Architecture and trust boundaries](docs/architecture.md)
- [Verification record](docs/verification.md)
- [Independent adversarial review](docs/review-round2.md)
- [Project story](docs/devpost-story-v2.md)
- [Demo storyboard and narration](docs/demo-storyboard-v2.md)
- [Security policy](SECURITY.md)
- [Privacy notice](https://lotline-trace.web.app/privacy)

## License and attribution

Lotline-authored code is MIT licensed, copyright 2026 Shivam Gupta. Retain third-party notices, including `build/sites-vite-plugin.LICENSE` and `vendor/shadcn-tailwind-4.13.0.LICENSE.md`. Dependencies retain their own licenses. The MIT license does not replace those notices.
