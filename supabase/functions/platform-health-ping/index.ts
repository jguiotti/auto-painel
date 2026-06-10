/**
 * AutoPainel — scheduled keep-alive for hosted Supabase (REST + DB + optional audit log).
 * Invoke: GET or POST {SUPABASE_URL}/functions/v1/platform-health-ping
 * Optional header: x-health-ping-key: <PLATFORM_HEALTH_PING_SECRET>
 */
import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-health-ping-key",
};

interface PlatformHealthPingPayload {
  ok: boolean;
  pinged_at: string;
  database: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedSecret = Deno.env.get("PLATFORM_HEALTH_PING_SECRET") ?? "";
  if (expectedSecret.length > 0) {
    const provided = req.headers.get("x-health-ping-key") ?? "";
    if (provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured (missing Supabase env)" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const started = Date.now();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("platform_health_ping");
  const latencyMs = Date.now() - started;
  const ok = !error && data !== null;

  const payload = (data ?? {}) as PlatformHealthPingPayload;

  await supabase.rpc("record_platform_health_ping", {
    p_source: "edge:platform-health-ping",
    p_ok: ok,
    p_latency_ms: latencyMs,
    p_details: {
      pinged_at: payload.pinged_at ?? null,
      error: error?.message ?? null,
    },
  });

  if (!ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        latency_ms: latencyMs,
        error: error?.message ?? "ping_failed",
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      latency_ms: latencyMs,
      ping: payload,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
