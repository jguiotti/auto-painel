import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { DealershipAdminRow } from "@/types/dealership-admin";

export async function fetchDealerships(): Promise<DealershipAdminRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }
  const { data, error } = await supabase
    .from("dealerships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchDealerships", error.message);
    return [];
  }

  return (data ?? []) as DealershipAdminRow[];
}
