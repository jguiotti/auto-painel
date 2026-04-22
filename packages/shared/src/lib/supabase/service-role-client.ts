import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleEnv } from "./env";

/**
 * Bypasses RLS. Use only on trusted servers (admin-master, secure workflows).
 * Never import from Client Components or client bundles.
 */
export function createSupabaseServiceRoleClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseServiceRoleEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
