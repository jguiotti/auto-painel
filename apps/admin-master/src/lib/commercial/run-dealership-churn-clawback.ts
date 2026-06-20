import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Runs commission clawback RPC when a dealership is marked churned.
 * Must use an authenticated super_admin session (not service role).
 */
export async function runDealershipChurnClawback(
  supabase: SupabaseClient,
  dealershipId: string,
): Promise<{ rows: number; error?: string }> {
  const { data, error } = await supabase.rpc(
    "clawback_dealership_sales_commissions",
    { p_dealership_id: dealershipId },
  );

  if (error) {
    console.error("runDealershipChurnClawback", error.message);
    return { rows: 0, error: error.message };
  }

  const rows = typeof data === "number" ? data : 0;
  return { rows };
}
