#!/usr/bin/env node
/**
 * Validates Meta integration env before deploy/homologation.
 *
 * Usage:
 *   node scripts/smoke-meta-config.mjs
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const required = [
  "META_APP_CLIENT_ID",
  "META_APP_CLIENT_SECRET",
  "META_TOKENS_CRYPTO_SECRET",
];

const warnings = [];

function read(name) {
  return process.env[name]?.trim() ?? "";
}

let failed = false;

for (const key of required) {
  if (!read(key)) {
    console.error(`❌ Missing ${key}`);
    failed = true;
  }
}

const platformOnly = read("META_PLATFORM_APP_ONLY");
if (platformOnly !== "true" && platformOnly !== "1") {
  warnings.push("META_PLATFORM_APP_ONLY should be true in production (Connect simplificado).");
}

const supabaseUrl = read("SUPABASE_URL") || read("NEXT_PUBLIC_SUPABASE_URL");
const redirectUri =
  read("META_OAUTH_REDIRECT_URI") ||
  (supabaseUrl ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/meta-oauth-callback` : "");

if (!redirectUri) {
  console.error("❌ Missing META_OAUTH_REDIRECT_URI (or SUPABASE_URL to derive it)");
  failed = true;
} else {
  console.log(`✓ Redirect URI: ${redirectUri}`);
}

const renderUrl = read("SOCIAL_CAROUSEL_RENDER_URL");
const renderSecret = read("SOCIAL_CAROUSEL_RENDER_SECRET");
if (!renderUrl) {
  warnings.push("SOCIAL_CAROUSEL_RENDER_URL unset — worker usará foto bruta do veículo.");
}
if (renderUrl && !renderSecret) {
  warnings.push("SOCIAL_CAROUSEL_RENDER_URL definida mas SOCIAL_CAROUSEL_RENDER_SECRET ausente.");
}

const dryRun = read("SOCIAL_PUBLISH_DRY_RUN");
if (!dryRun || dryRun === "true" || dryRun === "1") {
  console.log("ℹ️  SOCIAL_PUBLISH_DRY_RUN=true — publicações Meta simuladas (seguro para homolog).");
} else {
  console.log("⚠️  SOCIAL_PUBLISH_DRY_RUN=false — publicações reais na Graph API.");
}

for (const warning of warnings) {
  console.warn(`⚠️  ${warning}`);
}

if (failed) {
  console.error("\nConfigure .env.local e rode npm run integration:secrets:configure");
  process.exit(1);
}

console.log("\nMeta config OK for OAuth start + worker (verifique App Review no Facebook Developers).");
