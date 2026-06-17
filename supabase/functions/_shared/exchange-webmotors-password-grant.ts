export interface WebMotorsPasswordGrantTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export async function exchangeWebMotorsPasswordGrantToken(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}): Promise<WebMotorsPasswordGrantTokenResponse> {
  const basicAuth = btoa(`${params.clientId}:${params.clientSecret}`);

  const response = await fetch(params.tokenUrl, {
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
          : rawBody.slice(0, 300);
    throw new Error(remoteMessage || `WebMotors token failed (${response.status}).`);
  }

  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  if (!accessToken) {
    throw new Error("WebMotors token response missing access_token.");
  }

  return {
    access_token: accessToken,
    expires_in:
      typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in)
        ? payload.expires_in
        : undefined,
    refresh_token:
      typeof payload.refresh_token === "string" ? payload.refresh_token.trim() : undefined,
    scope: typeof payload.scope === "string" ? payload.scope.trim() : undefined,
  };
}
