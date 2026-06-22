import type { SupabaseClient } from "@supabase/supabase-js";

import { loadDealershipEmailBrand } from "./dealership-email-brand";
import { sendDealershipTransactionalEmail } from "./send-dealership-transactional-email";

export interface SendDealershipMemberDeactivatedEmailParams {
  email: string;
  recipientName: string;
  dealershipId: string;
}

/**
 * LOJ-04 — colaborador removido/desativado pelo titular (marca da loja).
 */
export async function sendDealershipMemberDeactivatedEmail(
  supabase: SupabaseClient,
  params: SendDealershipMemberDeactivatedEmailParams,
): Promise<{ ok: true } | { ok: false; message: string; skipped?: boolean }> {
  const brand = await loadDealershipEmailBrand(supabase, params.dealershipId);
  if (!brand) {
    return { ok: false, message: "Não foi possível carregar a identidade da loja." };
  }

  const sendResult = await sendDealershipTransactionalEmail({
    kind: "LOJ-04",
    to: params.email,
    recipientName: params.recipientName,
    brand,
  });

  if (sendResult.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    skipped: sendResult.skipped,
    message: sendResult.error ?? "Não foi possível enviar o e-mail de desativação.",
  };
}
