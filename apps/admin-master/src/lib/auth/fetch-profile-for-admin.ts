import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { ProfileRoleRow } from "@/lib/auth/platform-operator-profile";

/**
 * Loads `profiles` by user id with the service role so RLS never blocks admin login
 * or layout checks. Only call with `user.id` from a verified Supabase Auth session.
 */
export async function fetchProfileRowForUserId(userId: string): Promise<{
  profile: ProfileRoleRow | null;
  error?: string;
}> {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role, dealership_id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as ProfileRoleRow | null };
  } catch (e) {
    return {
      profile: null,
      error:
        e instanceof Error
          ? e.message
          : "Não foi possível ler o perfil (verifique SUPABASE_SERVICE_ROLE_KEY).",
    };
  }
}
