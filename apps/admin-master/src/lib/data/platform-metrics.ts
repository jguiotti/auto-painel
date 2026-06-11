import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface PlatformMetrics {
  dealershipCount: number;
  activeDealerships: number;
  trialSubscriptions: number;
  saasProspectCount: number;
  pendingSetupDealerships: number;
  pastDueSubscriptions: number;
  platformLeadsLast7Days: number;
  platformLeadsPrevious7Days: number;
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
      pendingSetupDealerships: 0,
      pastDueSubscriptions: 0,
      platformLeadsLast7Days: 0,
      platformLeadsPrevious7Days: 0,
    };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalDealerships },
    { count: activeDealerships },
    { count: trialPlans },
    { count: prospects },
    { count: pendingSetup },
    { count: pastDue },
    { count: leadsLast7Days },
    { count: leadsPrevious7Days },
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
    supabase
      .from("dealerships")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_setup"),
    supabase
      .from("dealerships")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "past_due"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fourteenDaysAgo)
      .lt("created_at", sevenDaysAgo),
  ]);

  return {
    dealershipCount: totalDealerships ?? 0,
    activeDealerships: activeDealerships ?? 0,
    trialSubscriptions: trialPlans ?? 0,
    saasProspectCount: prospects ?? 0,
    pendingSetupDealerships: pendingSetup ?? 0,
    pastDueSubscriptions: pastDue ?? 0,
    platformLeadsLast7Days: leadsLast7Days ?? 0,
    platformLeadsPrevious7Days: leadsPrevious7Days ?? 0,
  };
}
