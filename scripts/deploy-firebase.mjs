#!/usr/bin/env node
/** Reproducible full-stack deployment. Requires authenticated gcloud + Firebase CLI. */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("..", import.meta.url));
const project = "gen-lang-client-0444960702";
const site = "lotline-trace";
const region = "us-central1";
const service = "lotline-api";
const runtimeIdentity = `lotline-runtime@${project}.iam.gserviceaccount.com`;
const origin = `https://${site}.web.app`;
function firebase(args) {
  const explicit = process.env.FIREBASE_CLI_PATH;
  if (explicit)
    return explicit.endsWith(".js")
      ? run(process.execPath, [explicit, ...args])
      : run(explicit, args);
  const global = spawnSync("firebase", ["--version"], {
    cwd,
    encoding: "utf8",
  });
  if (!global.error && global.status === 0) return run("firebase", args);
  const local = fileURLToPath(
    new URL(
      "../../../work/firebase-cli/node_modules/firebase-tools/lib/bin/firebase.js",
      import.meta.url,
    ),
  );
  if (existsSync(local)) return run(process.execPath, [local, ...args]);
  return run("npx", ["--yes", "firebase-tools@15.34.0", ...args]);
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${command} exited with status ${result.status}. Deployment stopped.`,
    );
  return result.stdout?.toString().trim();
}
// Firebase's web configuration contains public project identifiers, never an Admin private key.
const config = JSON.parse(
  readFileSync(
    new URL("../public/firebase-config.json", import.meta.url),
    "utf8",
  ),
);
if (config.projectId !== project || !config.apiKey || !config.authDomain)
  throw new Error(
    "Provide the matching public Firebase web config in public/firebase-config.json before deploying.",
  );
const firebaseConfig = JSON.parse(
  readFileSync(new URL("../firebase.json", import.meta.url), "utf8"),
);
if (
  firebaseConfig.hosting.site !== site ||
  firebaseConfig.firestore.some((database) => database.database !== "lotline")
)
  throw new Error(
    "Deployment configuration must target the Lotline site and named database only.",
  );
run("gcloud", [
  "auth",
  "list",
  "--filter=status:ACTIVE",
  "--format=value(account)",
]);
firebase(["--version"]);
run("npm", ["run", "typecheck"]);
run("npm", ["test"]);
run("npm", ["run", "build"]);
run("gcloud", [
  "run",
  "deploy",
  service,
  "--source",
  ".",
  "--project",
  project,
  "--region",
  region,
  "--service-account",
  runtimeIdentity,
  "--allow-unauthenticated",
  "--ingress",
  "all",
  "--min-instances",
  "0",
  "--max-instances",
  "1",
  "--concurrency",
  "40",
  "--memory",
  "512Mi",
  "--cpu",
  "1",
  "--timeout",
  "60s",
  "--set-env-vars",
  `^|^NODE_ENV=production|GOOGLE_CLOUD_PROJECT=${project}|FIRESTORE_DATABASE_ID=lotline|ALLOWED_ORIGINS=${origin},https://${site}.firebaseapp.com`,
  "--quiet",
]);
// The explicit database target never changes any other application's default rules.
firebase([
  "deploy",
  "--project",
  project,
  "--only",
  "hosting,firestore:rules",
  "--non-interactive",
]);
const response = await fetch(`${origin}/api/health`, {
  signal: AbortSignal.timeout(60_000),
});
if (!response.ok || (await response.json()).status !== "ok")
  throw new Error(
    "Post-deploy health check failed. Inspect Cloud Run logs before announcing the deployment.",
  );
const privateResponse = await fetch(`${origin}/api/workspaces`, {
  signal: AbortSignal.timeout(60_000),
});
if (privateResponse.status !== 401)
  throw new Error(
    "Post-deploy authentication check failed. Private workspaces must require sign-in.",
  );
console.log(`Deployment verified: ${origin}`);
