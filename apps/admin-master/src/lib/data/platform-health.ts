import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface PlatformHealthSummary {
  lastPingAt: string | null;
  lastSuccess: boolean | null;
  lastLatencyMs: number | null;
}

export async function fetchPlatformHealthSummary(): Promise<PlatformHealthSummary> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { lastPingAt: null, lastSuccess: null, lastLatencyMs: null };
  }

  const { data, error } = await supabase
    .from("platform_health_ping_log")
    .select("created_at, ok, latency_ms")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { lastPingAt: null, lastSuccess: null, lastLatencyMs: null };
  }

  return {
    lastPingAt: data.created_at as string,
    lastSuccess: data.ok as boolean,
    lastLatencyMs: typeof data.latency_ms === "number" ? data.latency_ms : null,
  };
}
