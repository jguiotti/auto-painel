#!/usr/bin/env node
/**
 * Smoke test WebMotors Sensedia token endpoint (homolog or prod).
 * Usage: node scripts/smoke-webmotors-token.mjs [username] [password]
 * Without credentials: only checks app client_id/secret (expects 401/400, not network error).
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const tokenUrl = process.env.WEBMOTORS_OAUTH_TOKEN_URL?.trim();
const clientId = process.env.WEBMOTORS_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.WEBMOTORS_OAUTH_CLIENT_SECRET?.trim();
const username = process.argv[2]?.trim() || "smoke-test@example.com";
const password = process.argv[3] || "invalid-password";

if (!tokenUrl || !clientId || !clientSecret) {
  console.error("Missing WEBMOTORS_OAUTH_TOKEN_URL, CLIENT_ID or CLIENT_SECRET in .env.local");
  process.exit(1);
}

const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const res = await fetch(tokenUrl, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${basicAuth}`,
  },
  body: JSON.stringify({
    username,
    password,
    integracaosite: true,
    grant_type: "password",
  }),
});

const body = await res.text();
let parsed = {};
try {
  parsed = JSON.parse(body);
} catch {
  parsed = { raw: body.slice(0, 200) };
}

console.log("Token URL:", tokenUrl);
console.log("HTTP status:", res.status);
if (res.ok && parsed.access_token) {
  console.log("OK — access_token recebido (integrador CRM válido).");
  process.exit(0);
}

if (res.status === 401 || res.status === 400 || res.status === 403) {
  console.log(
    "OK — endpoint respondeu (credenciais de integrador inválidas ou de teste, esperado no smoke).",
  );
  console.log("Detalhe:", parsed.error_description || parsed.message || parsed.error || parsed);
  process.exit(0);
}

console.error("Falha — resposta inesperada:", parsed);
process.exit(1);
