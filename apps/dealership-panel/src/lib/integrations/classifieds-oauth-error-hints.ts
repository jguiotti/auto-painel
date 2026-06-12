import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

import { classifiedsProviderLabel } from "@/lib/integrations/integration-user-messages";

export interface ClassifiedsOAuthErrorDetails {
  title: string;
  hint: string;
  supportCode: string;
}

function resolveOlxRedirectUriHint(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return "https://<projeto>.supabase.co/functions/v1/classifieds-oauth-callback";
  }
  return `${supabaseUrl}/functions/v1/classifieds-oauth-callback`;
}

export function resolveClassifiedsOAuthErrorDetails(
  provider: ClassifiedsProvider,
  rawError: string | null | undefined,
): ClassifiedsOAuthErrorDetails | null {
  if (!rawError?.trim()) {
    return null;
  }

  const code = rawError.trim();
  const normalized = code.toLowerCase();
  const label = classifiedsProviderLabel(provider);

  if (normalized === "missing_code") {
    return {
      supportCode: "missing_code",
      title: "Login da OLX não foi concluído",
      hint: `A OLX devolveu o fluxo sem código de autorização. Mantenha a janela aberta até ela fechar sozinha, conclua o login na OLX e confira se a URL de redirecionamento cadastrada na OLX é exatamente: ${resolveOlxRedirectUriHint()} (sem parâmetros extras).`,
    };
  }

  if (
    normalized === "session_expired" ||
    normalized === "session_invalid" ||
    normalized.includes("sessão oauth")
  ) {
    return {
      supportCode: normalized,
      title: "Sessão de login expirou",
      hint: "Clique em Conectar novamente e complete o login na janela em até 15 minutos.",
    };
  }

  if (normalized === "cancelled" || normalized.includes("access_denied")) {
    return {
      supportCode: "cancelled",
      title: "Login cancelado",
      hint: "Autorize o acesso na OLX quando a janela de login abrir.",
    };
  }

  if (normalized === "token_exchange_failed" || normalized.includes("token endpoint")) {
    return {
      supportCode: "token_exchange_failed",
      title: `Não foi possível validar o login na ${label}`,
      hint:
        "Credenciais ou redirect URI podem estar divergentes entre OLX, Supabase e AutoPainel. Peça ao suporte para revisar platform_classifieds_oauth_providers e secrets da Edge.",
    };
  }

  if (normalized === "configuration") {
    return {
      supportCode: "configuration",
      title: "Integração ainda não liberada",
      hint: "A plataforma ainda não publicou as credenciais OAuth deste portal para sua loja.",
    };
  }

  if (normalized.includes("conexão não concluída")) {
    return {
      supportCode: "popup_closed",
      title: "Conexão interrompida",
      hint: "Não feche a janela de login manualmente. Aguarde o redirecionamento automático.",
    };
  }

  return {
    supportCode: code.slice(0, 64),
    title: `Falha ao conectar com a ${label}`,
    hint: "Tente novamente. Se persistir, informe ao suporte o código abaixo.",
  };
}
