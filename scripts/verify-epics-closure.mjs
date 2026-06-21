#!/usr/bin/env node
/**
 * Epic closure verification — smoke HTTP + optional production E2E hint.
 * Usage: npm run verify:epics-closure
 *        npm run verify:epics-closure -- --e2e   (runs production go-live Playwright)
 */
import { spawnSync } from "node:child_process";

const runE2e = process.argv.includes("--e2e");

function run(label, command, args, env = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Smoke produção (Épico 3)", "npm", ["run", "smoke:production-go-live"]);

if (runE2e) {
  run("E2E produção demo login", "npm", ["run", "test:e2e", "--", "e2e/specs/production-go-live.spec.ts"], {
    E2E_PRODUCTION: "true",
  });
} else {
  console.log(
    "\nℹ Para incluir E2E Playwright: npm run verify:epics-closure -- --e2e",
  );
  console.log(
    "  (ou: E2E_PRODUCTION=true npm run test:e2e -- e2e/specs/production-go-live.spec.ts)",
  );
}

console.log("\n✓ Verificação de fechamento concluída. Ver packages/shared/docs/EPICS_CLOSURE_JUN2026.md");
