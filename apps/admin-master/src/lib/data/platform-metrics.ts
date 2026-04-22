import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface PlatformMetrics {
  dealershipCount: number;
  activeDealerships: number;
  trialSubscriptions: number;
  saasProspectCount: number;
}

export async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return {
      dealershipCount: 0,
      activeDealerships: 0,
      trialSubscriptions: 0,
      saasProspectCount: 0,
    };
  }

  const [
    { count: totalDealerships },
    { count: activeDealerships },
    { count: trialPlans },
    { count: prospects },
  ] = await Promise.all([
    supabase.from("dealerships").select("*", { count: "exact", head: true }),
    supabase
      .from("dealerships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("dealerships")
      .select("*", { count: "exact", head: true })
      .eq("subscription_plan", "trial"),
    supabase.from("saas_prospects").select("*", { count: "exact", head: true }),
  ]);

  return {
    dealershipCount: totalDealerships ?? 0,
    activeDealerships: activeDealerships ?? 0,
    trialSubscriptions: trialPlans ?? 0,
    saasProspectCount: prospects ?? 0,
  };
}
