import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

/**
 * Service role client bypasses RLS. Use only in trusted server code.
 * Never import from Client Components.
 */
export function createSupabaseAdminClient() {
  return createSupabaseServiceRoleClient();
}
