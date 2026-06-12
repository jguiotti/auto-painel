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
  if (provider === "webmotors") {
    return "Conectar WebMotors";
  }
  return `Entrar na ${classifiedsProviderLabel(provider)}`;
}

export function classifiedsConnectDialogDescription(
  provider: ClassifiedsProvider,
): string {
  if (provider === "webmotors") {
    return "Informe o usuário e a senha do Integrador de API criado no CRM Cockpit WebMotors (https://www.cockpit.com.br). Cada loja pode ter apenas um integrador. A AutoPainel usa essas credenciais de forma segura para publicar seu estoque.";
  }
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
    return "Seu plano inclui a WebMotors, mas a plataforma ainda não publicou as credenciais da aplicação AutoPainel no portal Sensedia. Tente novamente em breve ou fale com o suporte.";
  }
  if (provider === "icarros") {
    return "Seu plano inclui o iCarros. A conexão será liberada após homologação com a central iCarros (fluxo com usuário integrador, sem popup). Tente novamente em breve ou fale com o suporte.";
  }
  return "Seu plano inclui a OLX, mas a conexão ainda não foi liberada pela plataforma. Nossa equipe configura as credenciais oficiais do portal — tente novamente em breve ou fale com o suporte.";
}

export function classifiedsProviderConnectHint(
  provider: ClassifiedsProvider,
  oauthReady: boolean,
): string {
  if (oauthReady) {
    if (provider === "webmotors") {
      return "Clique em Conectar e informe o usuário e senha do integrador CRM WebMotors (Cockpit).";
    }
    return "Clique em Conectar e faça login na janela que abrir. A conexão é concluída automaticamente.";
  }
  if (provider === "webmotors") {
    return "Incluído no seu plano. Aguardando credenciais da aplicação AutoPainel na WebMotors (Sensedia).";
  }
  if (provider === "icarros") {
    return "Incluído no seu plano. A conexão iCarros usará credenciais do integrador após homologação com o portal.";
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
    return "O portal não devolveu o código de login. Conclua o login na janela e não a feche manualmente — ela deve fechar sozinha.";
  }
  if (normalized.startsWith("webmotors_")) {
    if (normalized === "webmotors_invalid_credentials") {
      return "Usuário ou senha do integrador CRM WebMotors inválidos. Confira no Cockpit e tente novamente.";
    }
    return "Não foi possível validar o integrador CRM WebMotors. Tente novamente ou fale com o suporte.";
  }

  if (normalized === "token_exchange_failed" || normalized.includes("token endpoint")) {
    return "Não foi possível validar o login com a OLX. Confira se o redirect URI cadastrado na OLX é idêntico ao da plataforma e tente novamente.";
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
