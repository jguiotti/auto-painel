#!/usr/bin/env node
/**
 * Deploy Supabase schema (migrations) + Edge Functions from git to the linked remote project.
 *
 * Env (root .env.local or CI secrets):
 *   SUPABASE_PROJECT_REF
 *   SUPABASE_DB_PASSWORD
 *   SUPABASE_ACCESS_TOKEN (required for Edge Functions deploy)
 *   SUPABASE_DB_PUSH_INCLUDE_ALL=true (optional; repair/out-of-order migrations)
 *   SUPABASE_DEPLOY_SKIP_FUNCTIONS=true (optional; migrations only)
 *
 * Usage:
 *   npm run supabase:deploy
 *   npm run supabase:deploy -- --dry-run
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";
import { redactCliArgs } from "./lib/redact-cli-args.mjs";

const dryRun = process.argv.includes("--dry-run");
const skipFunctions = process.env.SUPABASE_DEPLOY_SKIP_FUNCTIONS === "true";

loadRootEnvLocal();

const manifestPath = path.join(repoRoot, "supabase", "deploy.manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const projectRef =
  process.env.SUPABASE_PROJECT_REF ?? manifest.default_project_ref ?? "";
const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? "";

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF.");
  process.exit(1);
}
if (!dbPassword) {
  console.error("Missing SUPABASE_DB_PASSWORD.");
  process.exit(1);
}

function run(command, args, { allowFail = false } = {}) {
  console.log(`\n→ ${command} ${redactCliArgs(args).join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    stdio: "inherit",
  });
  const code = result.status ?? 1;
  if (code !== 0 && !allowFail) {
    console.error(`\nComando falhou (exit ${code}): ${command}`);
    process.exit(code);
  }
  return { code };
}

console.log(`AutoPainel Supabase deploy → project ${projectRef}`);
if (dryRun) {
  console.log("Modo: dry-run (nenhuma alteração será aplicada)");
}

run("supabase", [
  "link",
  "--project-ref",
  projectRef,
  "--password",
  dbPassword,
  "--yes",
]);

run("supabase", ["migration", "list", "--linked"]);

const includeAll =
  process.env.SUPABASE_DB_PUSH_INCLUDE_ALL === "true" ||
  process.env.SUPABASE_DB_PUSH_INCLUDE_ALL === "1";

const pushArgs = ["db", "push", "--linked", "--yes"];
if (dryRun) {
  pushArgs.push("--dry-run");
}
if (includeAll) {
  pushArgs.push("--include-all");
  console.log("Flag --include-all ativa (SUPABASE_DB_PUSH_INCLUDE_ALL)");
}

run("supabase", pushArgs);

if (skipFunctions) {
  console.log("\nEdge Functions ignoradas (SUPABASE_DEPLOY_SKIP_FUNCTIONS=true).");
  process.exit(0);
}

if (dryRun) {
  console.log("\nDry-run: Edge Functions não serão publicadas.");
  process.exit(0);
}

if (!accessToken) {
  console.warn(
    "\nAviso: SUPABASE_ACCESS_TOKEN ausente — pulando deploy de Edge Functions.",
  );
  console.warn("Defina o token para publicar funções (supabase login --token).");
  process.exit(0);
}

run("supabase", ["login", "--token", accessToken]);

for (const fn of manifest.edge_functions ?? []) {
  const args = [
    "functions",
    "deploy",
    fn.name,
    "--project-ref",
    projectRef,
  ];
  if (fn.verify_jwt === false) {
    args.push("--no-verify-jwt");
  }
  run("supabase", args);
}

console.log("\nDeploy Supabase concluído.");
console.log("Opcional: npm run supabase:ping");
