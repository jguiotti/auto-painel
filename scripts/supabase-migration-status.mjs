#!/usr/bin/env node
/**
 * Compares migration files in git vs remote history (requires link + credentials).
 *
 * Usage:
 *   npm run supabase:migrations:status
 *   npm run supabase:migrations:status -- --dry-run
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

const dryRun = process.argv.includes("--dry-run");

loadRootEnvLocal();

const migrationsDir = path.join(repoRoot, "supabase", "migrations");
const localFiles = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

console.log(`Migrações no repositório: ${localFiles.length}`);
console.log(`Última local: ${localFiles.at(-1) ?? "(nenhuma)"}`);

function runSupabase(args) {
  const result = spawnSync("supabase", args, {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  return { code: result.status ?? 1, output };
}

const projectRef = process.env.SUPABASE_PROJECT_REF ?? "";
const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? "";

if (!projectRef || !dbPassword) {
  console.log(
    "\nRemoto: não verificado (defina SUPABASE_PROJECT_REF e SUPABASE_DB_PASSWORD em .env.local ou CI).",
  );
  process.exit(0);
}

const link = runSupabase([
  "link",
  "--project-ref",
  projectRef,
  "--password",
  dbPassword,
  "--yes",
]);

if (link.code !== 0) {
  console.error("\nFalha ao ligar projeto remoto:\n", link.output);
  process.exit(link.code);
}

const list = runSupabase(["migration", "list", "--linked"]);
console.log("\n--- migration list (local │ remoto) ---\n");
console.log(list.output || "(sem saída)");

if (list.code !== 0) {
  process.exit(list.code);
}

if (dryRun) {
  const includeAll =
    process.env.SUPABASE_DB_PUSH_INCLUDE_ALL === "true" ||
    process.env.SUPABASE_DB_PUSH_INCLUDE_ALL === "1";
  const pushArgs = ["db", "push", "--linked", "--dry-run", "--yes"];
  if (includeAll) {
    pushArgs.push("--include-all");
  }
  const preview = runSupabase(pushArgs);
  console.log("\n--- db push --dry-run ---\n");
  console.log(preview.output || "(sem saída)");
  process.exit(preview.code);
}
