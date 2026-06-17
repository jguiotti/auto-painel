import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

import { classifiedsProviderLabel } from "@/lib/integrations/integration-user-messages";

export interface ClassifiedsOAuthErrorDetails {
  title: string;
  hint: string;
  supportCode: string;
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
    const redirectHint =
      provider === "icarros"
        ? "confira se a URL de redirecionamento cadastrada no iCarros inclui ?provider=icarros"
        : provider === "olx"
          ? "confira se a URL de redirecionamento cadastrada na OLX é a URL base do callback (sem ?provider=)"
          : "confira se a URL de redirecionamento cadastrada no portal está idêntica à da plataforma";
    return {
      supportCode: "missing_code",
      title: `Login ${label} não foi concluído`,
      hint: `O portal devolveu o fluxo sem código de autorização. Mantenha a janela aberta até ela fechar sozinha, conclua o login e ${redirectHint}.`,
    };
  }

  if (normalized === "invalid_callback") {
    return {
      supportCode: "invalid_callback",
      title: `Login ${label} não foi concluído`,
      hint:
        provider === "olx"
          ? "A OLX devolveu o callback sem parâmetros válidos. Confirme que a URL de redirecionamento cadastrada na OLX é a URL base (sem ?provider=) e tente conectar novamente sem fechar a janela."
          : "O portal devolveu o callback sem parâmetros válidos. Tente conectar novamente e aguarde a janela fechar sozinha.",
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
      hint: `Autorize o acesso na ${label} quando a janela de login abrir.`,
    };
  }

  if (normalized.startsWith("webmotors_")) {
    return {
      supportCode: normalized,
      title: "Não foi possível conectar à WebMotors",
      hint:
        normalized === "webmotors_invalid_credentials"
          ? "Usuário ou senha do integrador CRM inválidos. Crie ou redefina o integrador no Cockpit WebMotors (cockpit.com.br) e tente novamente."
          : "Verifique se o integrador CRM está ativo e se a aplicação AutoPainel está homologada na Sensedia.",
    };
  }

  if (normalized.startsWith("icarros_")) {
    return {
      supportCode: normalized,
      title: "Não foi possível conectar ao iCarros",
      hint:
        normalized === "icarros_invalid_credentials"
          ? "Usuário ou senha iCarros inválidos. Use o login da loja no portal iCarros e tente novamente."
          : "Verifique se a aplicação AutoPainel está homologada no iCarros e se as credenciais da plataforma estão publicadas.",
    };
  }

  if (normalized === "token_exchange_failed" || normalized.includes("token endpoint")) {
    return {
      supportCode: "token_exchange_failed",
      title: `Não foi possível validar o login na ${label}`,
      hint: `Credenciais ou redirect URI podem estar divergentes entre ${label}, Supabase e AutoPainel. Peça ao suporte para revisar platform_classifieds_oauth_providers e secrets da Edge.`,
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
