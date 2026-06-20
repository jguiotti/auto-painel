import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function fetchCurrentPlatformSalesRepId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("current_platform_sales_rep_id");

  if (error) {
    console.error("fetchCurrentPlatformSalesRepId", error.message);
    return null;
  }

  if (typeof data !== "string" || data.trim().length === 0) {
    return null;
  }

  return data;
}

export async function fetchIsPlatformSalesRep(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_platform_sales_rep");

  if (error) {
    console.error("fetchIsPlatformSalesRep", error.message);
    return false;
  }

  return Boolean(data);
}
