#!/usr/bin/env node
/**
 * Fails if secret env files are tracked by git (should only be .env.example).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const blockedPatterns = [
  /^\.env\.local$/,
  /^\.env$/,
  /^apps\/[^/]+\/\.env\.local$/,
  /^supabase\/\.env(\.local)?$/,
];

const result = spawnSync("git", ["ls-files"], {
  cwd: repoRoot,
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error("git ls-files falhou.");
  process.exit(result.status ?? 1);
}

const tracked = (result.stdout ?? "")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const violations = tracked.filter((file) =>
  blockedPatterns.some((pattern) => pattern.test(file)),
);

if (violations.length > 0) {
  console.error("Ficheiros de segredo versionados no git (remover do índice):\n");
  for (const file of violations) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\nCorreção: npm run git:untrack-env  (depois commitar a remoção do índice)",
  );
  process.exit(1);
}

const allowedEnv = tracked.filter((f) => f.includes(".env"));
const unexpected = allowedEnv.filter((f) => f !== ".env.example");
if (unexpected.length > 0) {
  console.warn("Aviso: ficheiros .env* versionados além de .env.example:");
  for (const file of unexpected) {
    console.warn(`  - ${file}`);
  }
}

console.log("OK: nenhum .env.local / .env com segredos está no git.");
