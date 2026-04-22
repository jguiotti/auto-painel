import { createSupabaseBrowserClient as createSharedBrowserClient } from "@autopainel/shared/lib/supabase";

export function createSupabaseBrowserClient() {
  return createSharedBrowserClient();
}
