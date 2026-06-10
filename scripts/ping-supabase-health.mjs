/**
 * Keep-alive ping for Supabase hosted projects (avoids free-tier pause after inactivity).
 *
 * Modes (SUPABASE_PING_MODE):
 *   rpc  — POST /rest/v1/rpc/platform_health_ping (default; only needs anon key)
 *   edge — GET  /functions/v1/platform-health-ping (needs PLATFORM_HEALTH_PING_SECRET if set on project)
 *
 * Env (root .env.local or CI secrets):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   PLATFORM_HEALTH_PING_SECRET (optional, for edge mode)
 *   SUPABASE_PING_MODE (optional: rpc | edge)
 */
import { loadRootEnvLocal } from "./lib/load-root-env.mjs";

loadRootEnvLocal();

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const pingSecret = process.env.PLATFORM_HEALTH_PING_SECRET ?? "";
const mode = (process.env.SUPABASE_PING_MODE ?? "rpc").toLowerCase();

if (!supabaseUrl || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local or CI secrets).",
  );
  process.exit(1);
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
