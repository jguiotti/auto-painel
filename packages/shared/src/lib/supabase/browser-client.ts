import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

/**
 * Browser client: uses the anon key and respects RLS for the logged-in user.
 * Use in Client Components (e.g. dealership-panel dashboard, auth forms).
 */
export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
