#!/usr/bin/env node
/**
 * Generates SQL (or applies via instructions) to enable platform OLX OAuth from .env.local.
 *
 * Usage:
 *   npm run classifieds:oauth:platform:configure
 *   npm run classifieds:oauth:platform:configure -- --manual   # print SQL only
 *   npm run classifieds:oauth:platform:configure -- --apply-local  # psql local docker
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { encryptClassifiedsSecretValue } from "./lib/classifieds-token-crypto.mjs";
import { loadRootEnvLocal, repoRoot } from "./lib/load-root-env.mjs";

const manualMode = process.argv.includes("--manual");
const applyLocal = process.argv.includes("--apply-local");

loadRootEnvLocal();

const cryptoSecret = process.env.CLASSIFIEDS_TOKENS_CRYPTO_SECRET?.trim();
if (!cryptoSecret) {
  console.error("Missing CLASSIFIEDS_TOKENS_CRYPTO_SECRET in .env.local");
  process.exit(1);
}

function requireProviderEnv(provider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_OAUTH_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_OAUTH_CLIENT_SECRET`]?.trim();
  const authorizationUrl = process.env[`${prefix}_OAUTH_AUTHORIZATION_URL`]?.trim();
  const tokenUrl = process.env[`${prefix}_OAUTH_TOKEN_URL`]?.trim();
  const scope = process.env[`${prefix}_OAUTH_SCOPE`]?.trim() || null;
  const redirectUri = process.env[`${prefix}_OAUTH_REDIRECT_URI`]?.trim() || null;

  if (provider === "webmotors") {
    if (!clientId || !clientSecret || !tokenUrl) {
      console.error(
        `Missing ${prefix}_OAUTH_CLIENT_ID, ${prefix}_OAUTH_CLIENT_SECRET or ${prefix}_OAUTH_TOKEN_URL`,
      );
      process.exit(1);
    }
    return {
      provider,
      clientId,
      clientSecret,
      authorizationUrl: authorizationUrl || tokenUrl,
      tokenUrl,
      scope,
      redirectUri: null,
    };
  }

  if (!clientId || !clientSecret || !authorizationUrl || !tokenUrl) {
    console.error(
      `Missing ${prefix}_OAUTH_CLIENT_ID, ${prefix}_OAUTH_CLIENT_SECRET, ${prefix}_OAUTH_AUTHORIZATION_URL or ${prefix}_OAUTH_TOKEN_URL`,
    );
    process.exit(1);
  }

  return {
    provider,
    clientId,
    clientSecret,
    authorizationUrl,
    tokenUrl,
    scope,
    redirectUri,
  };
}

const providers = [];
if (
  process.env.OLX_OAUTH_CLIENT_ID?.trim() &&
  process.env.OLX_OAUTH_CLIENT_SECRET?.trim()
) {
  providers.push(requireProviderEnv("olx"));
}

if (
  process.env.ICARROS_OAUTH_CLIENT_ID?.trim() &&
  process.env.ICARROS_OAUTH_CLIENT_SECRET?.trim()
) {
  providers.push(requireProviderEnv("icarros"));
}

if (
  process.env.WEBMOTORS_OAUTH_CLIENT_ID?.trim() &&
  process.env.WEBMOTORS_OAUTH_CLIENT_SECRET?.trim()
) {
  providers.push(requireProviderEnv("webmotors"));
}

if (providers.length === 0) {
  console.error(
    "No provider credentials found. Fill OLX_OAUTH_* and/or ICARROS_OAUTH_* in .env.local (see packages/shared/docs/CLASSIFIEDS_OAUTH_SETUP.md).",
  );
  process.exit(1);
}

const statements = [];

for (const config of providers) {
  const secretEncrypted = encryptClassifiedsSecretValue(
    config.clientSecret,
    cryptoSecret,
  );
  const scopeSql = config.scope ? `'${config.scope.replace(/'/g, "''")}'` : "null";
  const redirectSql = config.redirectUri
    ? `'${config.redirectUri.replace(/'/g, "''")}'`
    : "null";

  statements.push(`
-- ${config.provider.toUpperCase()} platform OAuth (generated ${new Date().toISOString()})
update public.platform_classifieds_oauth_providers
set
  is_enabled = true,
  authorization_url = '${config.authorizationUrl.replace(/'/g, "''")}',
  token_url = '${config.tokenUrl.replace(/'/g, "''")}',
  oauth_client_id = '${config.clientId.replace(/'/g, "''")}',
  oauth_client_secret_encrypted = '${secretEncrypted.replace(/'/g, "''")}',
  scope = ${scopeSql},
  redirect_uri = ${redirectSql},
  updated_at = now()
where provider = '${config.provider}';
`);
}

const sql = `-- AutoPainel — platform_classifieds_oauth_providers
-- Run in Supabase SQL Editor (remote) or: npm run classifieds:oauth:platform:configure -- --apply-local
${statements.join("\n")}
`;

const outPath = path.join(repoRoot, "supabase", ".generated-platform-classifieds-oauth.sql");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, sql, "utf8");

console.log("Wrote", outPath);

if (manualMode) {
  console.log("\n--- SQL ---\n");
  console.log(sql);
  process.exit(0);
}

if (applyLocal) {
  const result = spawnSync(
    "psql",
    [
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      outPath,
    ],
    { stdio: "inherit" },
  );
  process.exit(result.status ?? 1);
}

console.log(`
Next steps:
1. Review ${outPath}
2. Remote: paste SQL in Supabase Dashboard → SQL Editor (project wcgevmvystdhqpzwuyig)
   Or local: npm run classifieds:oauth:platform:configure -- --apply-local
3. Set Edge secrets: npm run classifieds:oauth:secrets:configure
4. Deploy Edge: supabase functions deploy classifieds-oauth-callback --project-ref wcgevmvystdhqpzwuyig
5. In .env.local set CLASSIFIEDS_OAUTH_DEV_STUB=false and npm run sync:env
6. Register redirect URI at each portal: same value as PROVIDER_OAUTH_REDIRECT_URI (including ?provider= when required)
`);
