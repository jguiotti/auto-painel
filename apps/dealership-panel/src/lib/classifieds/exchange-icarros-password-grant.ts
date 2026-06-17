export interface ICarrosPasswordGrantTokenResponse {
  accessToken: string;
  expiresIn: number | null;
  refreshToken: string | null;
  scope: string | null;
}

export class ICarrosPasswordGrantError extends Error {
  readonly statusCode: number | null;
  readonly supportCode: string;

  constructor(message: string, options?: { statusCode?: number | null; supportCode?: string }) {
    super(message);
    this.name = "ICarrosPasswordGrantError";
    this.statusCode = options?.statusCode ?? null;
    this.supportCode = options?.supportCode ?? "icarros_auth_failed";
  }
}

export async function exchangeICarrosPasswordGrantToken(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  scope?: string | null;
}): Promise<ICarrosPasswordGrantTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "password",
    username: params.username,
    password: params.password,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const scope = params.scope?.trim();
  if (scope) {
    body.set("scope", scope);
  }

  let response: Response;
  try {
    response = await fetch(params.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch {
    throw new ICarrosPasswordGrantError(
      "Não foi possível contactar o iCarros. Tente novamente em instantes.",
      { supportCode: "icarros_network_error" },
    );
  }

  const rawBody = await response.text();
  let payload: Record<string, unknown> = {};
  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const remoteMessage =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.message === "string"
          ? payload.message
          : typeof payload.error === "string"
            ? payload.error
            : null;

    throw new ICarrosPasswordGrantError(
      remoteMessage ??
        "Usuário ou senha iCarros inválidos. Verifique os dados da sua conta no portal.",
      {
        statusCode: response.status,
        supportCode:
          response.status === 401 || response.status === 403
            ? "icarros_invalid_credentials"
            : "icarros_token_exchange_failed",
      },
    );
  }

  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  if (!accessToken) {
    throw new ICarrosPasswordGrantError(
      "O iCarros não devolveu token de acesso. Tente novamente ou fale com o suporte.",
      { supportCode: "icarros_missing_access_token" },
    );
  }

  const expiresIn =
    typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in)
      ? payload.expires_in
      : null;
  const refreshToken =
    typeof payload.refresh_token === "string" ? payload.refresh_token.trim() : null;
  const scope = typeof payload.scope === "string" ? payload.scope.trim() : null;

  return {
    accessToken,
    expiresIn,
    refreshToken,
    scope,
  };
}
