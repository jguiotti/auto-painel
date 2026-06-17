import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "../supabase/env";

export interface SendPasswordSetupEmailParams {
  email: string;
  /** Origin without trailing slash, e.g. https://admin.autopainel.com.br */
  redirectOrigin: string;
  /** Path after auth confirm, default /definir-senha */
  nextPath?: string;
}

/**
 * Triggers Supabase Auth recovery email (uses configured SMTP + recovery template).
 * Requires redirect URL in Supabase Auth allow list.
 */
export async function sendPasswordSetupEmail(
  params: SendPasswordSetupEmailParams,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  const base = params.redirectOrigin.replace(/\/$/, "");
  const nextPath = params.nextPath ?? "/definir-senha";
  const next = encodeURIComponent(nextPath);

  let supabaseUrl: string;
  let supabaseAnonKey: string;
  try {
    ({ supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv());
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Supabase env missing",
    };
  }

  const pub = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await pub.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=${next}`,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
