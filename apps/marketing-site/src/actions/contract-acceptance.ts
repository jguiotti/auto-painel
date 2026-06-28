"use server";

import { headers } from "next/headers";

import { mapPublicContractAcceptancePreview } from "@autopainel/shared/lib/growth-operations/map-contract-acceptance-preview";
import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import type { PublicContractAcceptancePreview } from "@autopainel/shared/types";

export async function fetchContractAcceptancePreviewAction(
  token: string,
): Promise<{ preview?: PublicContractAcceptancePreview; error?: string }> {
  const trimmed = token.trim();
  if (trimmed.length < 16) {
    return { error: "Link inválido." };
  }

  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return { error: "Serviço indisponível no momento." };
  }

  const { data, error } = await supabase.rpc("get_platform_contract_acceptance_preview", {
    p_token: trimmed,
  });

  if (error) {
    if (error.message.includes("token_not_found") || error.message.includes("token_invalid")) {
      return { error: "Este link não é válido." };
    }
    return { error: "Não foi possível carregar o contrato." };
  }

  const preview = mapPublicContractAcceptancePreview(data);
  if (!preview) {
    return { error: "Não foi possível interpretar o contrato." };
  }

  return { preview };
}

export async function submitContractAcceptanceAction(input: {
  token: string;
  acceptContract: boolean;
  acceptPlatformTerms: boolean;
  acceptPrivacyPolicy: boolean;
}): Promise<{ success?: boolean; error?: string }> {
  if (!input.acceptContract || !input.acceptPlatformTerms || !input.acceptPrivacyPolicy) {
    return { error: "Marque os três aceites obrigatórios para confirmar." };
  }

  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return { error: "Serviço indisponível no momento." };
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = headerStore.get("user-agent");

  const { error } = await supabase.rpc("submit_platform_contract_acceptance", {
    p_token: input.token.trim(),
    p_accept_contract: true,
    p_accept_platform_terms: true,
    p_accept_privacy_policy: true,
    p_client_ip: clientIp,
    p_user_agent: userAgent,
  });

  if (error) {
    if (error.message.includes("token_expired")) {
      return {
        error:
          "Este link não é mais válido. Entre em contato pelo WhatsApp +55 13 99743-5851.",
      };
    }
    if (error.message.includes("token_already_used")) {
      return { error: "Este link já foi utilizado." };
    }
    if (error.message.includes("acceptances_required")) {
      return { error: "Marque os três aceites obrigatórios para confirmar." };
    }
    return { error: "Não foi possível registrar seus aceites. Tente novamente." };
  }

  return { success: true };
}
