import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the dealership_id for the current auth user via `profiles` (RLS: same row only).
 * Use after `getUser()` to double-check tenant context in server actions.
 */
export async function fetchProfileDealershipId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.dealership_id as string;
}

/**
 * Ensures the given dealership id matches the authenticated profile tenant.
 * Prefer relying on RLS for queries; use this when passing dealership_id from cookies/URL.
 */
export async function assertDealershipMatchesProfile(
  supabase: SupabaseClient,
  userId: string,
  dealershipId: string,
): Promise<boolean> {
  const profileDealershipId = await fetchProfileDealershipId(supabase, userId);
  return profileDealershipId === dealershipId;
}
