import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getSupabasePublicEnv } from "./env";

export interface CookieStoreLike {
  getAll(): { name: string; value: string }[];
  setAll(
    cookies: {
      name: string;
      value: string;
      options: CookieOptions;
    }[],
  ): void;
}

/**
 * Server client (SSR): forwards cookies so the user session applies and RLS uses auth.uid().
 * Pass Next.js `cookies()` result or middleware cookie adapters.
 */
export function createSupabaseServerClient(cookieStore: CookieStoreLike) {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookieStore.setAll(cookiesToSet);
      },
    },
  });
}
