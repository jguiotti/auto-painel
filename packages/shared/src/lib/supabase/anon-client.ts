import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "./env";

/**
 * Stateless anon client (no cookies): for public vitrine RPCs and public inserts (e.g. leads)
 * where there is no logged-in user. RLS applies as role `anon`.
 */
export function createSupabaseAnonClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
