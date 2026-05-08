import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { normalizeRow } from "@/lib/data/dealerships";
import type { DealershipAdminRow } from "@/types/dealership-admin";

export async function fetchDealershipById(
  id: string,
): Promise<DealershipAdminRow | null> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("dealerships")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeRow(data as Record<string, unknown>);
}
