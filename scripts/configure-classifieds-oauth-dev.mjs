/**
 * Applies classifieds OAuth dev-stub secrets to local Supabase Edge from root .env.local.
 * Usage: npm run classifieds:oauth:dev:configure
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function parseEnvFile(content) {
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 1) {
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
    map.set(key, value);
  }
  return map;
}

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local at monorepo root.");
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
const required = [
  "CLASSIFIEDS_TOKENS_CRYPTO_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of required) {
  if (!env.get(key)?.trim()) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const stubEnabled = env.get("CLASSIFIEDS_OAUTH_DEV_STUB")?.trim().toLowerCase();
if (stubEnabled !== "true" && stubEnabled !== "1") {
  console.warn(
    "CLASSIFIEDS_OAUTH_DEV_STUB is not true — set it in .env.local for local OAuth simulation.",
  );
}

const edgeEnv = path.join(root, "supabase", ".env.local");
const lines = [
  `CLASSIFIEDS_TOKENS_CRYPTO_SECRET=${env.get("CLASSIFIEDS_TOKENS_CRYPTO_SECRET")}`,
  `SUPABASE_URL=${env.get("SUPABASE_URL") ?? env.get("NEXT_PUBLIC_SUPABASE_URL")}`,
  `SUPABASE_SERVICE_ROLE_KEY=${env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
  `CLASSIFIEDS_OAUTH_DEV_STUB=${env.get("CLASSIFIEDS_OAUTH_DEV_STUB") ?? "true"}`,
  `CLASSIFIEDS_SYNC_DRY_RUN=${env.get("CLASSIFIEDS_SYNC_DRY_RUN") ?? "true"}`,
];

fs.writeFileSync(edgeEnv, `${lines.join("\n")}\n`, "utf8");
console.log("Wrote", edgeEnv);

const result = spawnSync(
  "supabase",
  ["secrets", "set", "--env-file", edgeEnv],
  { cwd: root, stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Local Edge secrets updated. Restart supabase functions if needed.");
