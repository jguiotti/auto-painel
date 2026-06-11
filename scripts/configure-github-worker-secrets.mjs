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
import { spawnSync } from "node:child_process";

import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

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

const keysOutput = run("supabase", [
  "projects",
  "api-keys",
  "--project-ref",
  projectRef,
]);
if (!keysOutput) {
  console.error("Failed to read remote API keys via Supabase CLI.");
  process.exit(1);
}

let serviceRoleKey = "";
for (const line of keysOutput.split("\n")) {
  if (line.includes("|") && line.toLowerCase().includes("service_role")) {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length >= 2 && parts[0].toLowerCase() === "service_role") {
      serviceRoleKey = parts[1];
      break;
    }
  }
}

if (!serviceRoleKey) {
  console.error("Could not parse service_role key from supabase projects api-keys.");
  process.exit(1);
}

const secrets = [
  ["SUPABASE_URL", supabaseUrl],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
];

if (manualMode) {
  console.log("Modo manual — api.github.com inacessível pelo Terminal?\n");
  console.log(
    "Abra no browser: https://github.com/jguiotti/auto-painel/settings/secrets/actions\n",
  );
  console.log("Crie ou atualize estes repository secrets:\n");
  for (const [name, value] of secrets) {
    console.log(`  ${name}`);
    console.log(`  ${value}\n`);
  }
  console.log(
    "Depois: Actions → Integration workers cron → Run workflow (para testar).",
  );
  process.exit(0);
}

const ghCheck = run("gh", ["auth", "status"]);
if (!ghCheck) {
  console.error(
    "GitHub CLI não autenticado ou api.github.com inacessível pelo Terminal.",
  );
  console.error("Tente: gh auth login --with-token  (cole um PAT)");
  console.error("Ou:    node scripts/configure-github-worker-secrets.mjs --manual");
  process.exit(1);
}

for (const [name, value] of secrets) {
  const setResult = spawnSync("gh", ["secret", "set", name, "--body", value], {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (setResult.status !== 0) {
    console.error(`Failed to set GitHub secret ${name}`);
    console.error("Fallback: node scripts/configure-github-worker-secrets.mjs --manual");
    process.exit(setResult.status ?? 1);
  }
  console.log(`GitHub secret set: ${name}`);
}

console.log("Done. Workflow integration-workers-cron.yml can invoke workers.");
