/**
 * Project URL (same for anon and service role clients).
 */
export function getSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local at the monorepo root (or in this app folder); Next loads root env via next.config loadEnvConfig.",
    );
  }

  return supabaseUrl;
}

/**
 * Reads Supabase URL and anon key from the environment (Next.js public vars).
 */
export function getSupabasePublicEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local at the monorepo root (see .env.example).",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Service role key must never be exposed to the browser.
 */
export function getSupabaseServiceRoleEnv(): {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
} {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local at the monorepo root (server-only; never expose to the browser).",
    );
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}
