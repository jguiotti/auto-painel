/**
 * Keep-alive ping for Supabase hosted projects (avoids free-tier pause after inactivity).
 *
 * Modes (SUPABASE_PING_MODE):
 *   rpc  — POST /rest/v1/rpc/platform_health_ping (default; only needs anon key)
 *   edge — GET  /functions/v1/platform-health-ping (needs PLATFORM_HEALTH_PING_SECRET if set on project)
 *
 * Env (root .env.local or CI secrets):
 *   NEXT_PUBLIC_SUPABASE_URL  (dev local)
 *   SUPABASE_URL              (remoto — CI / npm run supabase:ping:remote)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_ANON_KEY         (remoto — alias usado no CI)
 *   PLATFORM_HEALTH_PING_SECRET (optional, for edge mode)
 *   SUPABASE_PING_MODE (optional: rpc | edge)
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const useRemote =
  process.argv.includes("--remote") ||
  process.env.SUPABASE_PING_TARGET === "remote";

if (useRemote && !process.env.SUPABASE_URL && process.env.SUPABASE_PROJECT_REF) {
  process.env.SUPABASE_URL = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
}

const supabaseUrl = (
  process.env.SUPABASE_URL ??
  process.env.SUPABASE_PING_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).replace(/\/$/, "");
let anonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

if (useRemote && !process.env.SUPABASE_ANON_KEY) {
  console.error(
    "Ping remoto exige SUPABASE_ANON_KEY na raiz .env.local (Dashboard → Project Settings → API → anon public).",
  );
  console.error(
    "A chave NEXT_PUBLIC_SUPABASE_ANON_KEY local (Docker) não funciona no projeto hospedado.",
  );
  process.exit(1);
}

if (useRemote) {
  anonKey = process.env.SUPABASE_ANON_KEY ?? "";
}
const pingSecret = process.env.PLATFORM_HEALTH_PING_SECRET ?? "";
const mode = (process.env.SUPABASE_PING_MODE ?? "rpc").toLowerCase();

if (!supabaseUrl || !anonKey) {
  console.error(
    "Missing Supabase URL/anon key. Use NEXT_PUBLIC_* (local) or SUPABASE_URL + SUPABASE_ANON_KEY (remoto).",
  );
  process.exit(1);
}

if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
  console.warn(
    "Aviso: ping aponta para Supabase local. Para o projeto hospedado: npm run supabase:ping:remote",
  );
}

async function pingRpc() {
  const started = Date.now();
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/platform_health_ping`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    signal: AbortSignal.timeout(30_000),
  });
  const latencyMs = Date.now() - started;
  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }
  return { response, latencyMs, parsed };
}

async function pingEdge() {
  const started = Date.now();
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  if (pingSecret.length > 0) {
    headers["x-health-ping-key"] = pingSecret;
  }
  const response = await fetch(`${supabaseUrl}/functions/v1/platform-health-ping`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(45_000),
  });
  const latencyMs = Date.now() - started;
  const body = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }
  return { response, latencyMs, parsed };
}

console.log(`Supabase keep-alive (${mode}) → ${supabaseUrl}`);

try {
  const { response, latencyMs, parsed } =
    mode === "edge" ? await pingEdge() : await pingRpc();

  if (!response.ok) {
    console.error(`Falhou: HTTP ${response.status} em ${latencyMs}ms`, parsed);
    if (response.status === 401 && useRemote) {
      console.error(
        "401: confira SUPABASE_ANON_KEY (remota) em .env.local — não use a anon key do Docker local.",
      );
    }
    process.exit(1);
  }

  console.log(`OK: HTTP ${response.status} em ${latencyMs}ms`, parsed);
  process.exit(0);
} catch (error) {
  console.error(
    "Erro no ping:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
