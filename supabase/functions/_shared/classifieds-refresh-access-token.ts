import type { SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import { decryptSecretValue, encryptSecretValue } from "./classifieds-crypto.ts";
import type { ClassifiedsProviderKey } from "./classifieds-providers/types.ts";
import { exchangeWebMotorsPasswordGrantToken } from "./exchange-webmotors-password-grant.ts";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function envPrefixForProvider(provider: ClassifiedsProviderKey): string {
  if (provider === "olx") {
    return "OLX";
  }
  if (provider === "webmotors") {
    return "WEBMOTORS";
  }
  return "ICARROS";
}

function resolveTokenUrlFromEnv(provider: ClassifiedsProviderKey): string | null {
  const prefix = envPrefixForProvider(provider);
  return Deno.env.get(`${prefix}_OAUTH_TOKEN_URL`)?.trim() || null;
}

async function resolveOAuthClientConfig(
  admin: SupabaseClient,
  dealershipId: string,
  provider: ClassifiedsProviderKey,
): Promise<{ tokenUrl: string; clientId: string; clientSecret: string }> {
  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");

  const { data: platformRow } = await admin
    .from("platform_classifieds_oauth_providers")
    .select("is_enabled, token_url, oauth_client_id, oauth_client_secret_encrypted")
    .eq("provider", provider)
    .maybeSingle();

  if (
    platformRow?.is_enabled &&
    platformRow.token_url?.trim() &&
    platformRow.oauth_client_id?.trim() &&
    platformRow.oauth_client_secret_encrypted?.trim()
  ) {
    return {
      tokenUrl: platformRow.token_url.trim(),
      clientId: platformRow.oauth_client_id.trim(),
      clientSecret: await decryptSecretValue(
        platformRow.oauth_client_secret_encrypted,
        cryptoSecret,
      ),
    };
  }

  const prefix = envPrefixForProvider(provider);
  const tokenUrl = resolveTokenUrlFromEnv(provider);
  const clientId = Deno.env.get(`${prefix}_OAUTH_CLIENT_ID`)?.trim();
  const clientSecret = Deno.env.get(`${prefix}_OAUTH_CLIENT_SECRET`)?.trim();

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(`OAuth do portal ${provider} não está configurado na plataforma.`);
  }

  const { data: appRow } = await admin
    .from("dealership_classifieds_oauth_apps")
    .select("oauth_client_id, oauth_client_secret_encrypted, token_url_override")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (appRow?.oauth_client_id?.trim() && appRow.oauth_client_secret_encrypted?.trim()) {
    return {
      tokenUrl: appRow.token_url_override?.trim() || tokenUrl,
      clientId: appRow.oauth_client_id.trim(),
      clientSecret: await decryptSecretValue(
        appRow.oauth_client_secret_encrypted,
        cryptoSecret,
      ),
    };
  }

  return { tokenUrl, clientId, clientSecret };
}

async function markConnectionReauthRequired(
  admin: SupabaseClient,
  dealershipId: string,
  provider: ClassifiedsProviderKey,
  reason: string,
): Promise<void> {
  await admin
    .from("dealership_classifieds_connections")
    .update({
      status: "reauth_required",
      last_error: reason.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("dealership_id", dealershipId)
    .eq("provider", provider);
}

function usesIntegratorPasswordGrant(provider: ClassifiedsProviderKey): boolean {
  return provider === "webmotors" || provider === "icarros";
}

async function exchangeIntegratorPasswordGrant(params: {
  admin: SupabaseClient;
  dealershipId: string;
  provider: ClassifiedsProviderKey;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}): Promise<OAuthTokenResponse> {
  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");

  const { data: integratorRow, error: integratorError } = await params.admin
    .from("dealership_classifieds_integrator_accounts")
    .select("integrator_username, integrator_password_encrypted")
    .eq("dealership_id", params.dealershipId)
    .eq("provider", params.provider)
    .maybeSingle();

  if (integratorError || !integratorRow?.integrator_username?.trim()) {
    throw new Error("Credenciais do integrador CRM ausentes — reconecte o portal.");
  }
  if (!integratorRow.integrator_password_encrypted?.trim()) {
    throw new Error("Senha do integrador CRM ausente — reconecte o portal.");
  }

  const username = integratorRow.integrator_username.trim();
  const password = await decryptSecretValue(
    integratorRow.integrator_password_encrypted,
    cryptoSecret,
  );

  if (params.provider === "webmotors") {
    const tokenPayload = await exchangeWebMotorsPasswordGrantToken({
      tokenUrl: params.tokenUrl,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
      username,
      password,
    });
    return {
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token,
      expires_in: tokenPayload.expires_in,
      scope: tokenPayload.scope,
    };
  }

  throw new Error(`Renovação automática ainda não implementada para ${params.provider}.`);
}

async function exchangeRefreshToken(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const response = await fetch(params.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const rawBody = await response.text();
  let payload: Partial<OAuthTokenResponse> & { error?: string; error_description?: string } = {};
  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody) as typeof payload;
    } catch {
      payload = {};
    }
  }

  if (!response.ok || !payload.access_token) {
    const remoteMessage =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : rawBody.slice(0, 300);
    throw new Error(
      remoteMessage || `Falha ao renovar token OAuth (${response.status}).`,
    );
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    scope: payload.scope,
  };
}

async function persistRefreshedTokens(
  admin: SupabaseClient,
  params: {
    connectionId: string;
    dealershipId: string;
    provider: ClassifiedsProviderKey;
    tokenPayload: OAuthTokenResponse;
    previousRefreshTokenEncrypted: string | null;
    cryptoSecret: string;
  },
): Promise<string> {
  const accessTokenEncrypted = await encryptSecretValue(
    params.tokenPayload.access_token,
    params.cryptoSecret,
  );

  const refreshTokenPlain =
    params.tokenPayload.refresh_token?.trim() ||
    (params.previousRefreshTokenEncrypted
      ? await decryptSecretValue(
          params.previousRefreshTokenEncrypted,
          params.cryptoSecret,
        )
      : null);

  const refreshTokenEncrypted = refreshTokenPlain
    ? await encryptSecretValue(refreshTokenPlain, params.cryptoSecret)
    : null;

  const tokenExpiresAt =
    typeof params.tokenPayload.expires_in === "number" &&
    Number.isFinite(params.tokenPayload.expires_in)
      ? new Date(Date.now() + params.tokenPayload.expires_in * 1000).toISOString()
      : null;

  await admin
    .from("dealership_classifieds_credentials")
    .update({
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      scope: params.tokenPayload.scope ?? null,
      expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("connection_id", params.connectionId);

  await admin
    .from("dealership_classifieds_connections")
    .update({
      status: "connected",
      token_expires_at: tokenExpiresAt,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.connectionId);

  return params.tokenPayload.access_token;
}

export async function ensureFreshClassifiedsAccessToken(
  admin: SupabaseClient,
  dealershipId: string,
  provider: ClassifiedsProviderKey,
): Promise<string> {
  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");

  const { data: connection, error: connectionError } = await admin
    .from("dealership_classifieds_connections")
    .select("id, status, token_expires_at")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (connectionError || !connection) {
    throw new Error("Conexão com o portal não encontrada.");
  }
  if (connection.status === "reauth_required") {
    throw new Error("Reconecte o portal em Integrações antes de sincronizar.");
  }
  if (connection.status !== "connected") {
    throw new Error("Reconecte o portal em Integrações antes de sincronizar.");
  }

  const { data: credential, error: credentialError } = await admin
    .from("dealership_classifieds_credentials")
    .select("access_token_encrypted, refresh_token_encrypted, expires_at")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (credentialError || !credential?.access_token_encrypted) {
    throw new Error("Credenciais OAuth ausentes para este portal.");
  }

  const expiresAtMs = credential.expires_at
    ? new Date(credential.expires_at).getTime()
    : connection.token_expires_at
      ? new Date(connection.token_expires_at).getTime()
      : null;

  const shouldRefresh =
    expiresAtMs !== null && expiresAtMs - Date.now() <= TOKEN_REFRESH_BUFFER_MS;

  if (!shouldRefresh) {
    return decryptSecretValue(credential.access_token_encrypted, cryptoSecret);
  }

  const oauthConfig = await resolveOAuthClientConfig(admin, dealershipId, provider);

  try {
    const tokenPayload = usesIntegratorPasswordGrant(provider)
      ? await exchangeIntegratorPasswordGrant({
          admin,
          dealershipId,
          provider,
          tokenUrl: oauthConfig.tokenUrl,
          clientId: oauthConfig.clientId,
          clientSecret: oauthConfig.clientSecret,
        })
      : await (async () => {
          if (!credential.refresh_token_encrypted) {
            throw new Error("Token expirado — reconecte o portal.");
          }
          const refreshToken = await decryptSecretValue(
            credential.refresh_token_encrypted,
            cryptoSecret,
          );
          return exchangeRefreshToken({
            tokenUrl: oauthConfig.tokenUrl,
            clientId: oauthConfig.clientId,
            clientSecret: oauthConfig.clientSecret,
            refreshToken,
          });
        })();

    return await persistRefreshedTokens(admin, {
      connectionId: connection.id,
      dealershipId,
      provider,
      tokenPayload,
      previousRefreshTokenEncrypted: credential.refresh_token_encrypted,
      cryptoSecret,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao renovar token OAuth.";
    await markConnectionReauthRequired(admin, dealershipId, provider, message);
    throw new Error("Token expirado. Reconecte o portal em Integrações.");
  }
}

export async function markClassifiedsConnectionReauthRequired(
  admin: SupabaseClient,
  dealershipId: string,
  provider: ClassifiedsProviderKey,
  reason: string,
): Promise<void> {
  await markConnectionReauthRequired(admin, dealershipId, provider, reason);
}
