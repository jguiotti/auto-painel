import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AuthEmailLinkType,
  buildAuthConfirmUrlFromGenerateLinkResponse,
} from "./auth-email-callback";

export interface GenerateAuthEmailActionLinkParams {
  email: string;
  redirectTo: string;
  linkType: AuthEmailLinkType;
  motivo?: "primeiro-acesso" | "recuperacao";
}

export async function generateAuthEmailActionLink(
  supabase: SupabaseClient,
  params: GenerateAuthEmailActionLinkParams,
): Promise<{ ok: true; actionLink: string } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  const redirectTo = params.redirectTo.trim();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: params.linkType,
    email,
    options: { redirectTo },
  });

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Não foi possível gerar o link de acesso.",
    };
  }

  const actionLink = buildAuthConfirmUrlFromGenerateLinkResponse({
    redirectTo,
    hashedToken: data?.properties?.hashed_token,
    verificationType: data?.properties?.verification_type ?? params.linkType,
    fallbackActionLink: data?.properties?.action_link,
    motivo: params.motivo,
  });

  if (!actionLink) {
    return {
      ok: false,
      message: "Não foi possível gerar o link de acesso.",
    };
  }

  return { ok: true, actionLink };
}

/** @deprecated Use generateAuthEmailActionLink */
export async function generateAuthRecoveryActionLink(
  supabase: SupabaseClient,
  params: { email: string; redirectTo: string },
): Promise<{ ok: true; actionLink: string } | { ok: false; message: string }> {
  return generateAuthEmailActionLink(supabase, {
    email: params.email,
    redirectTo: params.redirectTo,
    linkType: "recovery",
    motivo: "recuperacao",
  });
}
