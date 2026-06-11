#!/usr/bin/env node
/**
 * Configures GitHub Actions secrets for integration-workers-cron.yml.
 *
 * Usage:
 *   node scripts/configure-github-worker-secrets.mjs
 *   GH_TOKEN=... node scripts/configure-github-worker-secrets.mjs
 *   node scripts/configure-github-worker-secrets.mjs --manual
 *
 * When `api.github.com` is unreachable from Terminal (gh login timeout), use --manual
 * and paste secrets in GitHub → Settings → Secrets and variables → Actions.
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

const manualMode = process.argv.includes("--manual");

loadRootEnvLocal();

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF in .env.local");
  process.exit(1);
}
if (!accessToken) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL?.trim() || `https://${projectRef}.supabase.co`;

function run(command, args, { input } = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    return null;
  }
  return result.stdout;
}

function resolveWorkerCronSecret() {
  const fromEnv = process.env.INTEGRATION_WORKERS_CRON_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const envLocalPath = path.join(repoRoot, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8");
    const match = content.match(/^INTEGRATION_WORKERS_CRON_SECRET=(.+)$/m);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return randomBytes(24).toString("hex");
}

const workerCronSecret = resolveWorkerCronSecret();

const edgeSet = run("supabase", [
  "secrets",
  "set",
  "--project-ref",
  projectRef,
  `CLASSIFIEDS_SYNC_WORKER_SECRET=${workerCronSecret}`,
  `SOCIAL_PUBLISH_WORKER_SECRET=${workerCronSecret}`,
]);
if (!edgeSet) {
  console.error("Failed to set worker secrets on Supabase Edge.");
  process.exit(1);
}
console.log("Supabase Edge secrets updated: CLASSIFIEDS_SYNC_WORKER_SECRET, SOCIAL_PUBLISH_WORKER_SECRET");

const secrets = [
  ["SUPABASE_URL", supabaseUrl],
  ["INTEGRATION_WORKERS_CRON_SECRET", workerCronSecret],
];

if (manualMode) {
  console.log("\nModo manual — cole no GitHub (Settings → Secrets → Actions):\n");
  console.log(
    "https://github.com/jguiotti/auto-painel/settings/secrets/actions\n",
  );
  for (const [name, value] of secrets) {
    console.log(`  ${name}`);
    console.log(`  ${value}\n`);
  }
  console.log(
    "Opcional: grave INTEGRATION_WORKERS_CRON_SECRET no .env.local da raiz para reutilizar.",
  );
  console.log("Depois: Actions → Integration workers cron → Run workflow.");
  process.exit(0);
}

const ghCheck = run("gh", ["auth", "status"]);
if (!ghCheck) {
  console.error(
    "GitHub CLI não autenticado. Use: node scripts/configure-github-worker-secrets.mjs --manual",
  );
  process.exit(1);
}

for (const [name, value] of secrets) {
  const setResult = spawnSync("gh", ["secret", "set", name, "--body", value], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (setResult.status !== 0) {
    console.error(`Failed to set GitHub secret ${name}`);
    process.exit(setResult.status ?? 1);
  }
  console.log(`GitHub secret set: ${name}`);
}

console.log("Done. Workflow integration-workers-cron.yml can invoke workers.");
