import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface DealershipUnitAdminRow {
  id: string;
  dealership_id: string;
  name: string;
  address: Record<string, unknown>;
  sort_order: number;
}

export async function fetchDealershipUnits(
  dealershipId: string,
): Promise<DealershipUnitAdminRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("dealership_units")
    .select("id, dealership_id, name, address, sort_order")
    .eq("dealership_id", dealershipId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    dealership_id: row.dealership_id as string,
    name: row.name as string,
    address:
      row.address && typeof row.address === "object" && !Array.isArray(row.address)
        ? (row.address as Record<string, unknown>)
        : {},
    sort_order: Number(row.sort_order ?? 0),
  }));
}
