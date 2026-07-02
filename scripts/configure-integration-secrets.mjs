#!/usr/bin/env node
/**
 * Configures Supabase Edge secrets for integrations UX (carousel render + Meta platform).
 * Prints Vercel dealership-panel variables to set manually.
 *
 * Usage:
 *   npm run integration:secrets:configure
 *   npm run integration:secrets:configure -- --manual
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

const manualMode = process.argv.includes("--manual");

loadRootEnvLocal();

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!projectRef) {
  console.error("Missing SUPABASE_PROJECT_REF in .env.local");
  process.exit(1);
}
if (!accessToken) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    return null;
  }
  return result.stdout;
}

function resolveSecret(name, { generateIfMissing = false } = {}) {
  const fromEnv = process.env[name]?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const envLocalPath = path.join(repoRoot, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8");
    const match = content.match(new RegExp(`^${name}=(.+)$`, "m"));
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  if (generateIfMissing) {
    return randomBytes(24).toString("hex");
  }

  return "";
}

function isLocalhostUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  } catch {
    return false;
  }
}

const carouselRenderSecret = resolveSecret("SOCIAL_CAROUSEL_RENDER_SECRET", {
  generateIfMissing: true,
});
const panelPublicUrl =
  process.env.DEALERSHIP_PANEL_PUBLIC_URL?.trim() ||
  process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_URL?.trim() ||
  "";
const configuredRenderUrl = process.env.SOCIAL_CAROUSEL_RENDER_URL?.trim() || "";
const carouselRenderUrl =
  configuredRenderUrl && !isLocalhostUrl(configuredRenderUrl)
    ? configuredRenderUrl
    : panelPublicUrl
      ? `${panelPublicUrl.replace(/\/$/, "")}/api/internal/social-carousel-render`
      : "";

const supabasePublicUrl =
  process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const metaRedirectUri =
  process.env.META_OAUTH_REDIRECT_URI?.trim() ||
  (supabasePublicUrl
    ? `${supabasePublicUrl.replace(/\/$/, "")}/functions/v1/meta-oauth-callback`
    : "");

const edgePairs = [
  ["SOCIAL_CAROUSEL_RENDER_SECRET", carouselRenderSecret],
  ["META_PLATFORM_APP_ONLY", process.env.META_PLATFORM_APP_ONLY?.trim() || "true"],
];

if (metaRedirectUri) {
  edgePairs.push(["META_OAUTH_REDIRECT_URI", metaRedirectUri]);
}

if (carouselRenderUrl) {
  edgePairs.unshift(["SOCIAL_CAROUSEL_RENDER_URL", carouselRenderUrl]);
}

const optionalEdge = [
  "META_APP_CLIENT_ID",
  "META_APP_CLIENT_SECRET",
  "META_TOKENS_CRYPTO_SECRET",
  "META_OAUTH_REDIRECT_URI",
  "META_OAUTH_DEV_STUB",
  "INTEGRATIONS_MOCK_MODE",
  "SOCIAL_PUBLISH_DRY_RUN",
  "CLASSIFIEDS_SYNC_DRY_RUN",
  "INTEGRATION_WORKERS_CRON_SECRET",
];

for (const key of optionalEdge) {
  const value = process.env[key]?.trim();
  if (value) {
    edgePairs.push([key, value]);
  }
}

const workerSecret = resolveSecret("INTEGRATION_WORKERS_CRON_SECRET");
if (workerSecret) {
  edgePairs.push(["CLASSIFIEDS_SYNC_WORKER_SECRET", workerSecret]);
  edgePairs.push(["SOCIAL_PUBLISH_WORKER_SECRET", workerSecret]);
}

const vercelVars = [
  ["SOCIAL_CAROUSEL_RENDER_SECRET", carouselRenderSecret],
  ["META_PLATFORM_APP_ONLY", process.env.META_PLATFORM_APP_ONLY?.trim() || "true"],
  ["META_TOKENS_CRYPTO_SECRET", process.env.META_TOKENS_CRYPTO_SECRET?.trim()],
  ["META_APP_CLIENT_ID", process.env.META_APP_CLIENT_ID?.trim()],
  ["META_APP_CLIENT_SECRET", process.env.META_APP_CLIENT_SECRET?.trim()],
].filter((entry) => Boolean(entry[1]));

if (manualMode) {
  console.log("\n=== Supabase Edge secrets (Dashboard ou CLI) ===\n");
  console.log(`supabase secrets set --project-ref ${projectRef} \\`);
  for (const [name, value] of edgePairs) {
    console.log(`  ${name}=${value} \\`);
  }
  console.log("\n=== Vercel → dealership-panel (Production + Preview) ===\n");
  for (const [name, value] of vercelVars) {
    console.log(`  ${name}=${value}`);
  }
  if (!carouselRenderUrl) {
    console.log(
      "\n⚠️  Defina DEALERSHIP_PANEL_PUBLIC_URL ou SOCIAL_CAROUSEL_RENDER_URL no .env.local",
    );
  }
  console.log("\nVer: packages/shared/docs/INTEGRATIONS_DEPLOY.md\n");
  process.exit(0);
}

const args = [
  "secrets",
  "set",
  "--project-ref",
  projectRef,
  ...edgePairs.map(([name, value]) => `${name}=${value}`),
];

const edgeSet = run("supabase", args);
if (!edgeSet) {
  console.error("Failed to set Supabase Edge secrets. Use --manual mode.");
  process.exit(1);
}

console.log("Supabase Edge secrets updated:");
for (const [name] of edgePairs) {
  console.log(`  - ${name}`);
}

console.log("\nConfigure no Vercel (dealership-panel):");
for (const [name] of vercelVars) {
  console.log(`  - ${name}`);
}

if (configuredRenderUrl && isLocalhostUrl(configuredRenderUrl)) {
  console.warn(
    "\n⚠️  SOCIAL_CAROUSEL_RENDER_URL no .env.local aponta para localhost — ignorado na Edge.",
  );
  if (panelPublicUrl) {
    console.warn(`    Usando URL de produção derivada: ${carouselRenderUrl}`);
  }
}

console.log("\nDone. See packages/shared/docs/INTEGRATIONS_DEPLOY.md");
