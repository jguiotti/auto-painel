export interface WebMotorsPasswordGrantTokenResponse {
  accessToken: string;
  expiresIn: number | null;
  refreshToken: string | null;
  scope: string | null;
}

export class WebMotorsPasswordGrantError extends Error {
  readonly statusCode: number | null;
  readonly supportCode: string;

  constructor(message: string, options?: { statusCode?: number | null; supportCode?: string }) {
    super(message);
    this.name = "WebMotorsPasswordGrantError";
    this.statusCode = options?.statusCode ?? null;
    this.supportCode = options?.supportCode ?? "webmotors_auth_failed";
  }
}

export async function exchangeWebMotorsPasswordGrantToken(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}): Promise<WebMotorsPasswordGrantTokenResponse> {
  const basicAuth = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(params.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        username: params.username,
        password: params.password,
        integracaosite: "true",
        grant_type: "password",
      }),
    });
  } catch {
    throw new WebMotorsPasswordGrantError(
      "Não foi possível contactar a WebMotors. Tente novamente em instantes.",
      { supportCode: "webmotors_network_error" },
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
          : null;

    throw new WebMotorsPasswordGrantError(
      remoteMessage ??
        "Usuário ou senha do integrador CRM inválidos. Verifique no Cockpit WebMotors.",
      {
        statusCode: response.status,
        supportCode:
          response.status === 401 || response.status === 403
            ? "webmotors_invalid_credentials"
            : "webmotors_token_exchange_failed",
      },
    );
  }

  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  if (!accessToken) {
    throw new WebMotorsPasswordGrantError(
      "A WebMotors não devolveu token de acesso. Tente novamente ou fale com o suporte.",
      { supportCode: "webmotors_missing_access_token" },
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
