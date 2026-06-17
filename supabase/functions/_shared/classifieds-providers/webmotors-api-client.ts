function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

export function resolveWebMotorsClientId(): string {
  return requireEnvVar("WEBMOTORS_OAUTH_CLIENT_ID");
}

export function resolveWebMotorsCatalogBaseUrl(): string {
  return (
    Deno.env.get("WEBMOTORS_CATALOG_API_URL")?.trim() ||
    "https://hlg-webmotors.sensedia.com/catalogo/v1"
  ).replace(/\/$/, "");
}

export function resolveWebMotorsEstoqueBaseUrl(): string {
  return (
    Deno.env.get("WEBMOTORS_LISTINGS_API_URL")?.trim() ||
    "https://hlg-webmotors.sensedia.com/estoque/v1"
  ).replace(/\/$/, "");
}

export function buildWebMotorsRequestHeaders(accessToken: string): HeadersInit {
  const clientId = resolveWebMotorsClientId();
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AutoPainel/1.0",
    client_id: clientId,
    access_token: accessToken,
  };
}

export async function webMotorsApiRequest(params: {
  accessToken: string;
  method: string;
  url: string;
  body?: Record<string, unknown>;
}): Promise<{ status: number; body: Record<string, unknown>; raw: string }> {
  const response = await fetch(params.url, {
    method: params.method,
    headers: buildWebMotorsRequestHeaders(params.accessToken),
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const raw = await response.text();
  let body: Record<string, unknown> = {};
  if (raw.trim()) {
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      body = { raw };
    }
  }

  if (!response.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : raw.slice(0, 500);
    throw new Error(`WebMotors API ${params.method} failed (${response.status}): ${message}`);
  }

  return { status: response.status, body, raw };
}
