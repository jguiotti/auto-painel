import type { SupabaseClient } from "@supabase/supabase-js";

export async function generateAuthRecoveryActionLink(
  supabase: SupabaseClient,
  params: { email: string; redirectTo: string },
): Promise<{ ok: true; actionLink: string } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  const redirectTo = params.redirectTo.trim();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  const actionLink = data?.properties?.action_link?.trim();
  if (error || !actionLink) {
    return {
      ok: false,
      message: error?.message ?? "Não foi possível gerar o link de acesso.",
    };
  }

  return { ok: true, actionLink };
}
