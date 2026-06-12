import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

const PROVIDER_LABEL: Record<ClassifiedsProvider, string> = {
  olx: "OLX",
  webmotors: "WebMotors",
  icarros: "iCarros",
};

export function classifiedsProviderLabel(provider: ClassifiedsProvider): string {
  return PROVIDER_LABEL[provider];
}

export function classifiedsConnectDialogTitle(provider: ClassifiedsProvider): string {
  return `Entrar na ${classifiedsProviderLabel(provider)}`;
}

export function classifiedsConnectDialogDescription(
  provider: ClassifiedsProvider,
): string {
  return `Vamos abrir uma janela segura para você fazer login na ${classifiedsProviderLabel(provider)}. Assim que você concluir o login, a conexão com sua loja é feita automaticamente — não é preciso copiar códigos nem configurar nada técnico.`;
}

export function classifiedsProviderUnavailableMessage(
  provider: ClassifiedsProvider,
): string {
  return classifiedsProviderOAuthPendingMessage(provider);
}

/** Shown when the plan includes the portal but platform OAuth credentials are not live yet. */
export function classifiedsProviderOAuthPendingMessage(
  provider: ClassifiedsProvider,
): string {
  if (provider === "webmotors") {
    return "Seu plano inclui a WebMotors. Estamos finalizando a conexão com o login do integrador do CRM Cockpit — diferente da OLX, que já abre login em janela segura. Enquanto isso, use a OLX ou fale com nosso suporte.";
  }
  if (provider === "icarros") {
    return "Seu plano inclui o iCarros. A conexão em janela segura (como na OLX) será liberada assim que a AutoPainel concluir a homologação com a central iCarros. Tente novamente em breve ou fale com o suporte.";
  }
  return "Seu plano inclui a OLX, mas a conexão ainda não foi liberada pela plataforma. Nossa equipe configura as credenciais oficiais do portal — tente novamente em breve ou fale com o suporte.";
}

export function classifiedsProviderConnectHint(
  provider: ClassifiedsProvider,
  oauthReady: boolean,
): string {
  if (oauthReady) {
    return "Clique em Conectar e faça login na janela que abrir. A conexão é concluída automaticamente.";
  }
  if (provider === "webmotors") {
    return "Incluído no seu plano. A WebMotors usa login do integrador CRM — nossa equipe está habilitando esse fluxo.";
  }
  if (provider === "icarros") {
    return "Incluído no seu plano. A conexão iCarros será igual à OLX (janela de login) após homologação com o portal.";
  }
  return "Incluído no seu plano. A conexão será habilitada assim que a plataforma publicar as credenciais OAuth da OLX.";
}

export function classifiedsConnectSuccessMessage(provider: ClassifiedsProvider): string {
  return `Sua loja foi conectada à ${classifiedsProviderLabel(provider)} com sucesso.`;
}

export function classifiedsConnectFailureMessage(provider: ClassifiedsProvider): string {
  return `Não foi possível concluir a conexão com a ${classifiedsProviderLabel(provider)}. Tente novamente ou fale com nosso suporte se o problema continuar.`;
}

export function classifiedsPopupBlockedMessage(): string {
  return "Seu navegador bloqueou a janela de login. Permita pop-ups para este site e tente conectar novamente.";
}

export function classifiedsDisconnectSuccessMessage(provider: ClassifiedsProvider): string {
  return `Conexão com a ${classifiedsProviderLabel(provider)} removida.`;
}

export function mapClassifiedsOAuthCallbackError(raw: string | undefined): string | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const normalized = raw.toLowerCase();
  if (
    normalized === "session_expired" ||
    normalized === "session_invalid" ||
    (normalized.includes("invalid") && normalized.includes("state")) ||
    normalized.includes("sessão oauth")
  ) {
    return "O login expirou. Clique em Conectar novamente.";
  }
  if (
    normalized === "cancelled" ||
    normalized.includes("access_denied") ||
    normalized.includes("cancel")
  ) {
    return "Login cancelado. Você pode tentar conectar novamente quando quiser.";
  }
  if (normalized === "missing_code" || normalized === "invalid_callback") {
    return "Não foi possível concluir o login. Clique em Conectar novamente.";
  }
  if (normalized === "token_exchange_failed" || normalized.includes("token endpoint")) {
    return "Não foi possível validar o login com o portal. Tente novamente em alguns minutos.";
  }
  if (
    normalized === "configuration" ||
    normalized.includes("missing") ||
    normalized.includes("ambiente") ||
    normalized.includes("suporte")
  ) {
    return "Este canal ainda não está disponível para sua loja. Fale com nosso suporte.";
  }
  if (normalized.includes("conexão não concluída")) {
    return "Conexão não concluída. Feche a janela de login e clique em Conectar novamente.";
  }
  if (
    normalized.includes("supabase.co") ||
    normalized.includes("client_id") ||
    normalized.includes("client_secret") ||
    normalized.includes("token endpoint error")
  ) {
    return "Não foi possível validar o login com o portal. Tente novamente em alguns minutos.";
  }
  return undefined;
}
