#!/usr/bin/env node
/**
 * Pushes classifieds OAuth secrets to Supabase Edge (local or remote via linked project).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const keys = [
  "CLASSIFIEDS_TOKENS_CRYPTO_SECRET",
  "CLASSIFIEDS_OAUTH_DEV_STUB",
  "CLASSIFIEDS_SYNC_DRY_RUN",
  "OLX_OAUTH_CLIENT_ID",
  "OLX_OAUTH_CLIENT_SECRET",
  "OLX_OAUTH_AUTHORIZATION_URL",
  "OLX_OAUTH_TOKEN_URL",
  "OLX_OAUTH_SCOPE",
  "OLX_OAUTH_REDIRECT_URI",
  "WEBMOTORS_OAUTH_CLIENT_ID",
  "WEBMOTORS_OAUTH_CLIENT_SECRET",
  "WEBMOTORS_OAUTH_AUTHORIZATION_URL",
  "WEBMOTORS_OAUTH_TOKEN_URL",
  "WEBMOTORS_OAUTH_SCOPE",
  "WEBMOTORS_OAUTH_REDIRECT_URI",
  "WEBMOTORS_LISTINGS_API_URL",
  "ICARROS_OAUTH_CLIENT_ID",
  "ICARROS_OAUTH_CLIENT_SECRET",
  "ICARROS_OAUTH_AUTHORIZATION_URL",
  "ICARROS_OAUTH_TOKEN_URL",
  "ICARROS_OAUTH_SCOPE",
  "ICARROS_OAUTH_REDIRECT_URI",
  "ICARROS_LISTINGS_API_URL",
];

const lines = [];
for (const key of keys) {
  const value = process.env[key]?.trim();
  if (value) {
    lines.push(`${key}=${value}`);
  }
}

if (!lines.some((line) => line.startsWith("CLASSIFIEDS_TOKENS_CRYPTO_SECRET="))) {
  console.error("Missing CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
  process.exit(1);
}

const edgeEnv = path.join(repoRoot, "supabase", ".env.classifieds-oauth");
fs.writeFileSync(edgeEnv, `${lines.join("\n")}\n`, "utf8");
console.log("Wrote", edgeEnv);

const result = spawnSync("supabase", ["secrets", "set", "--env-file", edgeEnv], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Edge secrets updated for classifieds OAuth.");
