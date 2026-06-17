#!/usr/bin/env node
/**
 * Push production env vars to Vercel projects (AutoPainel monorepo).
 * Reads integration secrets from repo-root `.env.local`; fetches Supabase keys via CLI.
 *
 * Usage:
 *   node scripts/configure-vercel-env.mjs
 *   node scripts/configure-vercel-env.mjs --dry-run
 */
import { spawnSync } from "node:child_process";

import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

const dryRun = process.argv.includes("--dry-run");
const scope = "odona-project";
const environments = ["production", "preview"];

loadRootEnvLocal();

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || "wcgevmvystdhqpzwuyig";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!accessToken && !dryRun) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

function fetchSupabaseKeys() {
  if (dryRun) {
    return {
      anon: "<anon>",
      serviceRole: "<service_role>",
    };
  }

  const result = spawnSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef],
    {
      encoding: "utf8",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
    },
  );

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }

  const anon =
    result.stdout.match(/^\s*anon\s*\|\s*(\S+)/m)?.[1] ?? "";
  const serviceRole =
    result.stdout.match(/^\s*service_role\s*\|\s*(\S+)/m)?.[1] ?? "";

  if (!anon || !serviceRole) {
    console.error("Could not parse Supabase API keys from CLI output");
    process.exit(1);
  }

  return { anon, serviceRole };
}

function addEnv(appDir, name, value) {
  if (!value) {
    console.log(`  skip ${name} (empty)`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] ${name}`);
    return;
  }

  for (const envName of environments) {
    const result = spawnSync(
      "vercel",
      ["env", "add", name, envName, "--scope", scope, "--force", "--sensitive"],
      {
        cwd: appDir,
        input: value,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    if (result.status !== 0) {
      console.error(`  FAIL ${name} (${envName}): ${result.stderr || result.stdout}`);
      process.exit(1);
    }
  }

  console.log(`  ok ${name}`);
}

function applyProject(label, appRelativeDir, vars) {
  const appDir = `${repoRoot}/${appRelativeDir}`;
  console.log(`\n=== ${label} ===`);

  for (const [name, value] of Object.entries(vars)) {
    addEnv(appDir, name, value);
  }
}

const supabaseUrl = `https://${projectRef}.supabase.co`;
const { anon, serviceRole } = fetchSupabaseKeys();

const commonPublic = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  NEXT_PUBLIC_AUTOPAINEL_SITE_URL: "https://autopainel.com.br",
  NEXT_PUBLIC_GTM_ID: "GTM-MV99ZXW9",
};

const carouselSecret =
  process.env.SOCIAL_CAROUSEL_RENDER_SECRET?.trim() ||
  "cabf489d22c9cf9a2e5f9a5d9f3e01dedc91f6885842acf0";
const cronSecret =
  process.env.INTEGRATION_WORKERS_CRON_SECRET?.trim() ||
  "df15714f63408de1747a6fd9cfe83638700ba32f8dd24cfc";
const classifiedsCrypto =
  process.env.CLASSIFIEDS_TOKENS_CRYPTO_SECRET?.trim() ||
  "dev-classifieds-crypto-secret-change-in-prod-32chars";

applyProject("auto-painel-site (marketing)", "apps/marketing-site", {
  ...commonPublic,
});

applyProject("auto-painel-customer-site", "apps/customer-site", {
  ...commonPublic,
  NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN: "autopainel.com.br",
});

applyProject("auto-painel-admin-master", "apps/admin-master", {
  ...commonPublic,
  SUPABASE_SERVICE_ROLE_KEY: serviceRole,
  NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN: "autopainel.com.br",
  NEXT_PUBLIC_ADMIN_AUTH_REDIRECT_ORIGIN: "https://admin.autopainel.com.br",
  NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE:
    "https://{slug}.loja.autopainel.com.br",
  NEXT_PUBLIC_CUSTOMER_SITE_URL_TEMPLATE: "https://{slug}.autopainel.com.br",
  ADMIN_PROVISION_FUNCTION_SECRET:
    process.env.ADMIN_PROVISION_FUNCTION_SECRET?.trim() || "",
});

applyProject("auto-painel-dealership-panel", "apps/dealership-panel", {
  ...commonPublic,
  SUPABASE_SERVICE_ROLE_KEY: serviceRole,
  NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN: "loja.autopainel.com.br",
  NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE:
    "https://{slug}.loja.autopainel.com.br",
  NEXT_PUBLIC_CUSTOMER_SITE_URL_TEMPLATE: "https://{slug}.autopainel.com.br",
  CLASSIFIEDS_OAUTH_DEV_STUB: "false",
  CLASSIFIEDS_SYNC_DRY_RUN: process.env.CLASSIFIEDS_SYNC_DRY_RUN?.trim() || "true",
  CLASSIFIEDS_TOKENS_CRYPTO_SECRET: classifiedsCrypto,
  OLX_OAUTH_AUTHORIZATION_URL:
    process.env.OLX_OAUTH_AUTHORIZATION_URL?.trim() ||
    "https://auth.olx.com.br/oauth",
  OLX_OAUTH_TOKEN_URL:
    process.env.OLX_OAUTH_TOKEN_URL?.trim() ||
    "https://auth.olx.com.br/oauth/token",
  OLX_OAUTH_CLIENT_ID: process.env.OLX_OAUTH_CLIENT_ID?.trim() || "",
  OLX_OAUTH_CLIENT_SECRET: process.env.OLX_OAUTH_CLIENT_SECRET?.trim() || "",
  OLX_OAUTH_SCOPE: process.env.OLX_OAUTH_SCOPE?.trim() || "autoupload",
  OLX_OAUTH_REDIRECT_URI:
    process.env.OLX_OAUTH_REDIRECT_URI?.trim() ||
    `${supabaseUrl}/functions/v1/classifieds-oauth-callback`,
  OLX_LISTINGS_API_URL:
    process.env.OLX_LISTINGS_API_URL?.trim() ||
    "https://apps.olx.com.br/autoupload/import",
  WEBMOTORS_OAUTH_TOKEN_URL:
    process.env.WEBMOTORS_OAUTH_TOKEN_URL?.trim() ||
    "https://hlg-webmotors.sensedia.com/oauth/v1/access-token",
  WEBMOTORS_OAUTH_CLIENT_ID: process.env.WEBMOTORS_OAUTH_CLIENT_ID?.trim() || "",
  WEBMOTORS_OAUTH_CLIENT_SECRET:
    process.env.WEBMOTORS_OAUTH_CLIENT_SECRET?.trim() || "",
  WEBMOTORS_LISTINGS_API_URL:
    process.env.WEBMOTORS_LISTINGS_API_URL?.trim() ||
    "https://hlg-webmotors.sensedia.com/site/v1/estoque",
  INTEGRATION_WORKERS_CRON_SECRET: cronSecret,
  SOCIAL_CAROUSEL_RENDER_SECRET: carouselSecret,
  SOCIAL_CAROUSEL_RENDER_URL:
    "https://guiotti.loja.autopainel.com.br/api/internal/social-carousel-render",
  META_PLATFORM_APP_ONLY: "true",
});

console.log("\nDone. Redeploy each project (vercel --prod) for changes to take effect.");
console.log("See packages/shared/docs/VERCEL_DEPLOY.md\n");
