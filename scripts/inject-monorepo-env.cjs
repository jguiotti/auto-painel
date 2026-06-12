/**
 * Injects env vars from the monorepo root into `process.env` before Next reads config.
 * Resolves the directory that contains both `apps/` and `.env.local`; otherwise uses cwd.
 */
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

function resolveMonorepoEnvDir() {
  let dir = path.resolve(process.cwd());
  for (let i = 0; i < 14; i++) {
    const appsDir = path.join(dir, "apps");
    const envLocal = path.join(dir, ".env.local");
    if (fs.existsSync(appsDir) && fs.existsSync(envLocal)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return path.resolve(process.cwd());
}

/**
 * Force-apply root `.env.local` so monorepo file wins over stale shell exports
 * (e.g. remote `NEXT_PUBLIC_SUPABASE_ANON_KEY` + local URL → PostgREST PGRST301).
 */
function applyRootEnvLocalOverrides(envDir) {
  const envLocalPath = path.join(envDir, ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    return;
  }

  const content = fs.readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const dev = process.env.NODE_ENV !== "production";
const envDir = resolveMonorepoEnvDir();
loadEnvConfig(envDir, dev);
applyRootEnvLocalOverrides(envDir);
