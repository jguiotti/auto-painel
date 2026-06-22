import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAuthEmailRedirectTo } from "../auth/auth-email-callback";
import { resolveAdminAuthRedirectOrigin } from "../auth/resolve-auth-redirect-origins";
import { generateAuthEmailActionLink } from "../auth/generate-auth-action-link";
import { sendAutopainelTransactionalEmail } from "./send-autopainel-transactional-email";

/**
 * ADM-02 — recuperação de senha com marca AutoPainel (Resend).
 */
export async function sendAutopainelPasswordRecoveryEmail(
  supabase: SupabaseClient,
  params: { email: string },
): Promise<{ ok: true } | { ok: false; message: string; skipped?: boolean }> {
  const origin = resolveAdminAuthRedirectOrigin();
  const redirectTo = buildAuthEmailRedirectTo(origin);
  const linkResult = await generateAuthEmailActionLink(supabase, {
    email: params.email,
    redirectTo,
    linkType: "recovery",
    motivo: "recuperacao",
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
