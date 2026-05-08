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

const dev = process.env.NODE_ENV !== "production";
loadEnvConfig(resolveMonorepoEnvDir(), dev);
