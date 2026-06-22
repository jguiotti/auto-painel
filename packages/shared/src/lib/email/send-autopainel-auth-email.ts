import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveAdminAuthRedirectOrigin } from "../auth/resolve-auth-redirect-origins";
import { generateAuthRecoveryActionLink } from "./generate-auth-action-link";
import { sendAutopainelTransactionalEmail } from "./send-autopainel-transactional-email";

/**
 * ADM-02 — recuperação de senha com marca AutoPainel (Resend).
 */
export async function sendAutopainelPasswordRecoveryEmail(
  supabase: SupabaseClient,
  params: { email: string },
): Promise<{ ok: true } | { ok: false; message: string; skipped?: boolean }> {
  const origin = resolveAdminAuthRedirectOrigin();
  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/definir-senha")}`;
  const linkResult = await generateAuthRecoveryActionLink(supabase, {
    email: params.email,
    redirectTo,
  });

  if (!linkResult.ok) {
    return { ok: false, message: linkResult.message };
  }

  const sendResult = await sendAutopainelTransactionalEmail({
    kind: "ADM-02",
    to: params.email,
    actionLink: linkResult.actionLink,
  });

  if (sendResult.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    skipped: sendResult.skipped,
    message: sendResult.error ?? "Não foi possível enviar o e-mail.",
  };
}
