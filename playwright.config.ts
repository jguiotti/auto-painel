import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * Loads `.env.local` when present so defaults align with `npm run sync:env`.
 * Does not override variables already set in the shell.
 */
function loadRootDotEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // CI may omit the file — tests can rely on injected env instead.
  }
}

loadRootDotEnvLocal();

const panelPort =
  process.env.E2E_DEALERSHIP_PANEL_PORT ??
  process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_DEV_PORT ??
  "3002";
const storefrontPort =
  process.env.E2E_CUSTOMER_SITE_PORT ??
  process.env.NEXT_PUBLIC_CUSTOMER_SITE_DEV_PORT ??
  "3003";

process.env.E2E_DEALERSHIP_PANEL_PORT ??= panelPort;
process.env.E2E_CUSTOMER_SITE_PORT ??= storefrontPort;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
