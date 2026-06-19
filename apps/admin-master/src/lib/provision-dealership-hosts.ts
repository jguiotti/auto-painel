import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

/**
 * Registers Vercel hostnames (and optional Cloudflare DNS) for a new dealership slug.
 * Runs detached so create-dealership UX is not blocked by external APIs.
 */
export function provisionDealershipHostsInBackground(slug: string): void {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return;
  }

  const scriptPath = path.join(repoRoot, "scripts/dealership-hosts-provision.mjs");
  const child = spawn(
    process.execPath,
    [scriptPath, normalizedSlug, "--cloudflare"],
    {
      cwd: repoRoot,
      env: process.env,
      detached: true,
      stdio: "ignore",
    },
  );
  child.unref();
}
