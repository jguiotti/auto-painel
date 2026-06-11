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
  return `Seu plano inclui a ${classifiedsProviderLabel(provider)}, mas a conexão OAuth ainda não foi liberada pela plataforma. Nossa equipe configura as credenciais oficiais do portal — tente novamente em breve ou fale com o suporte.`;
}

export function classifiedsProviderConnectHint(
  provider: ClassifiedsProvider,
  oauthReady: boolean,
): string {
  if (oauthReady) {
    return "Clique em Conectar e faça login na janela que abrir. A conexão é concluída automaticamente.";
  }
  return "Seu plano inclui este integrador. A conexão será habilitada assim que a plataforma publicar as credenciais OAuth do portal.";
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
  if (normalized.includes("access_denied") || normalized.includes("cancel")) {
    return "Login cancelado. Você pode tentar conectar novamente quando quiser.";
  }
  if (normalized.includes("invalid") && normalized.includes("state")) {
    return "O login expirou. Clique em Conectar novamente.";
  }
  if (normalized.includes("token endpoint")) {
    return "Não foi possível validar o login com o portal. Tente novamente em alguns minutos.";
  }
  if (normalized.includes("missing") || normalized.includes("ambiente")) {
    return "Este canal ainda não está disponível para sua loja. Fale com nosso suporte.";
  }
  return undefined;
}
