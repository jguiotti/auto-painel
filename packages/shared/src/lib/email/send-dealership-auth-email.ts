import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveDealershipPanelAuthRedirectOrigin } from "../auth/resolve-auth-redirect-origins";
import { generateAuthEmailActionLink } from "../auth/generate-auth-action-link";
import { loadDealershipEmailBrand } from "./dealership-email-brand";
import { sendDealershipTransactionalEmail } from "./send-dealership-transactional-email";

export interface SendDealershipWelcomeEmailParams {
  email: string;
  recipientName: string;
  role: "owner" | "manager" | "seller";
  dealershipId: string;
  dealershipSlug: string;
  /** When true, sends recovery link instead of invite (user already had Auth account). */
  isExistingAuthUser?: boolean;
}

/**
 * LOJ-01 — convite / boas-vindas com marca da loja (Resend).
 */
export async function sendDealershipWelcomeEmail(
  supabase: SupabaseClient,
  params: SendDealershipWelcomeEmailParams,
): Promise<{ ok: true } | { ok: false; message: string; skipped?: boolean }> {
  const origin = resolveDealershipPanelAuthRedirectOrigin(params.dealershipSlug);
  if (!origin) {
    return { ok: false, message: "Host do painel da loja não configurado." };
  }

  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/definir-senha")}`;
  const linkType = params.isExistingAuthUser ? "recovery" : "invite";
  const linkResult = await generateAuthEmailActionLink(supabase, {
    email: params.email,
    redirectTo,
    linkType,
    motivo: params.isExistingAuthUser ? "recuperacao" : "primeiro-acesso",
  });

  if (!linkResult.ok) {
    return { ok: false, message: linkResult.message };
  }

  const brand = await loadDealershipEmailBrand(supabase, params.dealershipId);
  if (!brand) {
    return { ok: false, message: "Não foi possível carregar a identidade da loja." };
  }

  const sendResult = await sendDealershipTransactionalEmail({
    kind: "LOJ-01",
    to: params.email,
    recipientName: params.recipientName,
    role: params.role,
    brand,
    actionLink: linkResult.actionLink,
  });

  if (sendResult.ok) {
    return { ok: true };
  }

  return {
    ok: false,
    skipped: sendResult.skipped,
    message: sendResult.error ?? "Não foi possível enviar o e-mail de boas-vindas.",
  };
}

/**
 * LOJ-02 — recuperação de senha com marca da loja (Resend).
 */
export async function sendDealershipPasswordRecoveryEmail(
  supabase: SupabaseClient,
  params: {
    email: string;
    dealershipId: string;
    redirectOrigin: string;
  },
): Promise<{ ok: true } | { ok: false; message: string; skipped?: boolean }> {
  const redirectTo = `${params.redirectOrigin.replace(/\/$/, "")}/auth/confirm?next=${encodeURIComponent("/definir-senha")}`;
  const linkResult = await generateAuthEmailActionLink(supabase, {
    email: params.email,
    redirectTo,
    linkType: "recovery",
    motivo: "recuperacao",
  });

  if (!linkResult.ok) {
    return { ok: false, message: linkResult.message };
  }

  const brand = await loadDealershipEmailBrand(supabase, params.dealershipId);
  if (!brand) {
    return { ok: false, message: "Não foi possível carregar a identidade da loja." };
  }

  const sendResult = await sendDealershipTransactionalEmail({
    kind: "LOJ-02",
    to: params.email,
    brand,
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
