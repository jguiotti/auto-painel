import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import {
  decryptSecretValue,
  encryptSecretValue,
} from "../_shared/classifieds-crypto.ts";
import { normalizeClassifiedsOAuthRedirectUri, buildClassifiedsOAuthCallbackUrl } from "../_shared/classifieds-oauth-redirect.ts";
import { parseProviderFromClassifiedsOAuthState } from "../_shared/classifieds-oauth-state.ts";
import {
  buildClassifiedsOAuthDevStubTokenPayload,
  CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_ID,
  CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_SECRET,
  isClassifiedsOAuthDevStubEnabled,
  parseClassifiedsOAuthDevStubCode,
} from "../_shared/classifieds-oauth-dev-stub.ts";

type ProviderKey = "olx" | "webmotors" | "icarros";

interface OAuthSessionRow {
  id: string;
  dealership_id: string;
  provider: ProviderKey;
  state: string;
  code_verifier: string | null;
  redirect_origin: string;
  expires_at: string;
}

interface ProviderRuntimeConfig {
  provider: ProviderKey;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenResponsePayload {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

function resolveProvider(raw: string | null): ProviderKey | null {
  if (raw === "olx" || raw === "webmotors" || raw === "icarros") {
    return raw;
  }
  return null;
}

function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

interface OauthAppRow {
  oauth_client_id: string;
  oauth_client_secret_encrypted: string;
  token_url_override: string | null;
}

function resolveDefaultCallbackUrl(supabaseUrl: string, provider: ProviderKey): string {
  return normalizeClassifiedsOAuthRedirectUri(
    provider,
    buildClassifiedsOAuthCallbackUrl(supabaseUrl, provider),
  );
}

function getProviderConfigFromEnv(provider: ProviderKey): ProviderRuntimeConfig {
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const defaultRedirectUri = resolveDefaultCallbackUrl(supabaseUrl, provider);

  if (isClassifiedsOAuthDevStubEnabled()) {
    return {
      provider,
      tokenUrl: `${supabaseUrl}/functions/v1/classifieds-oauth-callback`,
      clientId: CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_ID,
      clientSecret: CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_SECRET,
      redirectUri: defaultRedirectUri,
    };
  }

  if (provider === "olx") {
    return {
      provider,
      tokenUrl: requireEnvVar("OLX_OAUTH_TOKEN_URL"),
      clientId: requireEnvVar("OLX_OAUTH_CLIENT_ID"),
      clientSecret: requireEnvVar("OLX_OAUTH_CLIENT_SECRET"),
      redirectUri: normalizeClassifiedsOAuthRedirectUri(
        provider,
        Deno.env.get("OLX_OAUTH_REDIRECT_URI")?.trim() || defaultRedirectUri,
      ),
    };
  }

  if (provider === "webmotors") {
    return {
      provider,
      tokenUrl: requireEnvVar("WEBMOTORS_OAUTH_TOKEN_URL"),
      clientId: requireEnvVar("WEBMOTORS_OAUTH_CLIENT_ID"),
      clientSecret: requireEnvVar("WEBMOTORS_OAUTH_CLIENT_SECRET"),
      redirectUri:
        Deno.env.get("WEBMOTORS_OAUTH_REDIRECT_URI")?.trim() || defaultRedirectUri,
    };
  }

  return {
    provider,
    tokenUrl: requireEnvVar("ICARROS_OAUTH_TOKEN_URL"),
    clientId: requireEnvVar("ICARROS_OAUTH_CLIENT_ID"),
    clientSecret: requireEnvVar("ICARROS_OAUTH_CLIENT_SECRET"),
    redirectUri:
      Deno.env.get("ICARROS_OAUTH_REDIRECT_URI")?.trim() || defaultRedirectUri,
  };
}

function tryGetProviderConfigFromEnv(provider: ProviderKey): ProviderRuntimeConfig | null {
  try {
    return getProviderConfigFromEnv(provider);
  } catch {
    return null;
  }
}

async function tryResolvePlatformProviderConfig(
  admin: SupabaseClient,
  provider: ProviderKey,
): Promise<ProviderRuntimeConfig | null> {
  const { data, error } = await admin
    .from("platform_classifieds_oauth_providers")
    .select(
      "is_enabled, token_url, oauth_client_id, oauth_client_secret_encrypted, redirect_uri",
    )
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data?.is_enabled || !data.token_url?.trim() || !data.oauth_client_id?.trim()) {
    return null;
  }

  if (!data.oauth_client_secret_encrypted?.trim()) {
    return null;
  }

  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
  let clientSecretPlain: string;
  try {
    clientSecretPlain = await decryptSecretValue(
      data.oauth_client_secret_encrypted,
      cryptoSecret,
    );
  } catch {
    return null;
  }

  const envFallback = tryGetProviderConfigFromEnv(provider);
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const defaultRedirectUri = resolveDefaultCallbackUrl(supabaseUrl, provider);

  const rawRedirectUri =
    data.redirect_uri?.trim() || envFallback?.redirectUri || defaultRedirectUri;

  return {
    provider,
    tokenUrl: data.token_url.trim(),
    clientId: data.oauth_client_id.trim(),
    clientSecret: clientSecretPlain.trim(),
    redirectUri: normalizeClassifiedsOAuthRedirectUri(provider, rawRedirectUri),
  };
}

async function resolveProviderRuntimeConfig(
  admin: SupabaseClient,
  provider: ProviderKey,
  dealershipId: string,
): Promise<ProviderRuntimeConfig> {
  const platformConfig = await tryResolvePlatformProviderConfig(admin, provider);
  const envConfig = tryGetProviderConfigFromEnv(provider);
  const baseConfig = platformConfig ?? envConfig;

  if (!baseConfig) {
    throw new Error("Canal de classificados indisponível para conexão.");
  }

  const { data: appRow, error } = await admin
    .from("dealership_classifieds_oauth_apps")
    .select(
      "oauth_client_id, oauth_client_secret_encrypted, token_url_override",
    )
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !appRow?.oauth_client_id?.trim()) {
    return baseConfig;
  }

  const row = appRow as OauthAppRow;
  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
  let clientSecretPlain: string;
  try {
    clientSecretPlain = await decryptSecretValue(
      row.oauth_client_secret_encrypted,
      cryptoSecret,
    );
  } catch {
    throw new Error(
      "Não foi possível validar as credenciais da loja. Fale com nosso suporte.",
    );
  }

  return {
    provider,
    tokenUrl: row.token_url_override?.trim() || baseConfig.tokenUrl,
    clientId: row.oauth_client_id.trim(),
    clientSecret: clientSecretPlain.trim(),
    redirectUri: baseConfig.redirectUri,
  };
}

function jsonForPopup(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replaceAll("</", "<\\/");
}

function popupHtml(params: {
  targetOrigin: string;
  provider: ProviderKey | null;
  success: boolean;
  error?: string;
}): string {
  const payload = {
    source: "autopainel_classifieds_oauth",
    provider: params.provider,
    success: params.success,
    error: params.error ?? null,
  };

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Conexão concluída</title>
  </head>
  <body>
    <script>
      (function () {
        const payload = ${jsonForPopup(payload)};
        const targetOrigin = ${JSON.stringify(params.targetOrigin)};
        try {
          if (window.opener && typeof window.opener.postMessage === "function") {
            window.opener.postMessage(payload, targetOrigin);
          }
        } catch (_) {}
        setTimeout(function () {
          window.close();
        }, 150);
      })();
    </script>
    <p>Login processado. Esta janela pode ser fechada.</p>
  </body>
</html>`;
}

const POPUP_HTML_HEADERS: Record<string, string> = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
};

function oauthCallbackBootstrapHtml(): Response {
  return new Response(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Processando login…</title>
  </head>
  <body>
    <script>
      (function () {
        if (window.location.hash && window.location.hash.length > 1) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          if (params.has("code") || params.has("state") || params.has("error")) {
            window.location.replace(
              window.location.pathname + "?" + params.toString(),
            );
            return;
          }
        }
        window.location.replace(window.location.pathname + window.location.search);
      })();
    </script>
    <p>Processando login…</p>
  </body>
</html>`,
    {
      headers: POPUP_HTML_HEADERS,
      status: 200,
    },
  );
}

type PopupErrorCode =
  | "invalid_callback"
  | "session_expired"
  | "session_invalid"
  | "cancelled"
  | "missing_code"
  | "token_exchange_failed"
  | "configuration"
  | "unknown";

function buildPanelPopupResultUrl(
  redirectOrigin: string,
  params: {
    provider: ProviderKey;
    success: boolean;
    error?: PopupErrorCode;
  },
): string {
  const url = new URL(
    `${redirectOrigin.replace(/\/$/, "")}/api/painel/integracoes/oauth/popup-result`,
  );
  url.searchParams.set("provider", params.provider);
  url.searchParams.set("success", params.success ? "1" : "0");
  if (!params.success && params.error) {
    url.searchParams.set("error", params.error);
  }
  return url.toString();
}

function redirectToPanelPopupResult(
  redirectOrigin: string,
  params: {
    provider: ProviderKey;
    success: boolean;
    error?: PopupErrorCode;
  },
): Response {
  return Response.redirect(buildPanelPopupResultUrl(redirectOrigin, params), 302);
}

function htmlPopupResponse(
  params: {
    targetOrigin: string;
    provider: ProviderKey | null;
    success: boolean;
    error?: string;
  },
  status = 200,
): Response {
  return new Response(popupHtml(params), {
    headers: POPUP_HTML_HEADERS,
    status,
  });
}

async function tryResolvePendingSessionByState(
  admin: SupabaseClient,
  state: string,
): Promise<OAuthSessionRow | null> {
  const normalizedState = normalizeOAuthStateParam(state);
  const { data, error } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id, dealership_id, provider, state, code_verifier, redirect_origin, expires_at, status")
    .eq("state", normalizedState)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OAuthSessionRow;
}

async function tryResolveSessionByStateAnyStatus(
  admin: SupabaseClient,
  state: string,
): Promise<OAuthSessionRow | null> {
  const normalizedState = normalizeOAuthStateParam(state);
  const { data, error } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id, dealership_id, provider, state, code_verifier, redirect_origin, expires_at, status")
    .eq("state", normalizedState)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OAuthSessionRow;
}

function normalizeOAuthStateParam(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

async function tryResolveLatestPendingSessionForProvider(
  admin: SupabaseClient,
  provider: ProviderKey,
): Promise<OAuthSessionRow | null> {
  const { data, error } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id, dealership_id, provider, state, code_verifier, redirect_origin, expires_at")
    .eq("provider", provider)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as OAuthSessionRow;
}

function redirectOrHtmlPopup(
  redirectOrigin: string | null | undefined,
  params: {
    provider: ProviderKey | null;
    success: boolean;
    error?: PopupErrorCode | string;
  },
  status = 400,
): Response {
  if (redirectOrigin && params.provider) {
    const errorCode =
      typeof params.error === "string" &&
      [
        "invalid_callback",
        "session_expired",
        "session_invalid",
        "cancelled",
        "missing_code",
        "token_exchange_failed",
        "configuration",
        "unknown",
      ].includes(params.error)
        ? (params.error as PopupErrorCode)
        : params.success
          ? undefined
          : "unknown";

    return redirectToPanelPopupResult(redirectOrigin, {
      provider: params.provider,
      success: params.success,
      error: params.success ? undefined : errorCode,
    });
  }

  return htmlPopupResponse(
    {
      targetOrigin: redirectOrigin ?? "*",
      provider: params.provider,
      success: params.success,
      error: typeof params.error === "string" ? params.error : params.error ?? "unknown",
    },
    status,
  );
}

async function exchangeCodeForTokens(
  config: ProviderRuntimeConfig,
  code: string,
  codeVerifier: string | null,
  expectedState: string,
): Promise<TokenResponsePayload> {
  const stubPayload = parseClassifiedsOAuthDevStubCode(code);
  if (
    stubPayload &&
    isClassifiedsOAuthDevStubEnabled() &&
    stubPayload.state === expectedState &&
    stubPayload.provider === config.provider
  ) {
    return buildClassifiedsOAuthDevStubTokenPayload(stubPayload.provider);
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });
  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token endpoint error (${tokenRes.status}): ${text}`);
  }

  const payload = (await tokenRes.json()) as Partial<TokenResponsePayload>;
  if (!payload.access_token) {
    throw new Error("Token endpoint returned no access_token.");
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    scope: payload.scope,
  };
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const hasAuthParams =
    url.searchParams.has("code") ||
    url.searchParams.has("state") ||
    url.searchParams.has("error");

  if (!hasAuthParams && req.method === "GET") {
    return oauthCallbackBootstrapHtml();
  }

  let provider = resolveProvider(url.searchParams.get("provider"));
  let state = url.searchParams.get("state")?.trim() ?? null;
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");

  if (!provider && state) {
    provider = parseProviderFromClassifiedsOAuthState(state);
  }

  let tokenCryptoSecret: string;
  let supabaseUrl: string;
  let serviceRoleKey: string;
  try {
    tokenCryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
    supabaseUrl = requireEnvVar("SUPABASE_URL");
    serviceRoleKey = requireEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    return htmlPopupResponse(
      {
        targetOrigin: "*",
        provider,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a conexão.",
      },
      500,
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let oauthSession: OAuthSessionRow | null = null;
  if (state) {
    oauthSession = await tryResolvePendingSessionByState(admin, state);
    if (!provider && oauthSession) {
      provider = oauthSession.provider;
    }
  }

  if (!oauthSession && code && provider && !state) {
    oauthSession = await tryResolveLatestPendingSessionForProvider(admin, provider);
    if (oauthSession) {
      state = oauthSession.state;
    }
  }

  if (!oauthSession && code && !state && !provider) {
    for (const candidate of ["olx", "webmotors", "icarros"] as ProviderKey[]) {
      const session = await tryResolveLatestPendingSessionForProvider(admin, candidate);
      if (session) {
        oauthSession = session;
        provider = session.provider;
        state = session.state;
        break;
      }
    }
  }

  if (!provider || !state) {
    console.info("[classifieds-oauth-callback] invalid_callback", {
      provider,
      hasState: Boolean(state),
      hasCode: Boolean(code),
      queryKeys: [...url.searchParams.keys()],
    });

    return redirectOrHtmlPopup(oauthSession?.redirect_origin, {
      provider,
      success: false,
      error: "invalid_callback",
    });
  }

  if (!oauthSession || oauthSession.provider !== provider) {
    const sessionForRedirect =
      oauthSession ?? (state ? await tryResolveSessionByStateAnyStatus(admin, state) : null);

    if (sessionForRedirect?.dealership_id && provider) {
      await admin.from("dealership_classifieds_connections").upsert(
        {
          dealership_id: sessionForRedirect.dealership_id,
          provider,
          status: "error",
          last_error: "session_invalid",
        },
        { onConflict: "dealership_id,provider" },
      );
    }

    console.info("[classifieds-oauth-callback] session_invalid", {
      provider,
      hasCode: Boolean(code),
      statePrefix: state?.slice(0, 24) ?? null,
      hadPendingSession: Boolean(oauthSession),
      sessionStatus: sessionForRedirect?.status ?? null,
    });

    return redirectOrHtmlPopup(sessionForRedirect?.redirect_origin, {
      provider,
      success: false,
      error: sessionForRedirect?.status === "expired" ? "session_expired" : "session_invalid",
    });
  }

  const sessionExpired = new Date(oauthSession.expires_at).getTime() < Date.now();
  if (sessionExpired) {
    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "oauth_session_expired",
      })
      .eq("id", oauthSession.id);

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: oauthSession.dealership_id,
        provider,
        status: "disconnected",
        last_error: "session_expired",
      },
      { onConflict: "dealership_id,provider" },
    );

    return redirectToPanelPopupResult(oauthSession.redirect_origin, {
      provider,
      success: false,
      error: "session_expired",
    });
  }

  if (oauthError) {
    const errorText = oauthErrorDescription || oauthError;
    await admin.from("dealership_classifieds_oauth_sessions").update({
      status: "error",
      error_reason: errorText,
      consumed_at: new Date().toISOString(),
    }).eq("id", oauthSession.id);

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: oauthSession.dealership_id,
        provider,
        status: "error",
        last_error: "cancelled",
      },
      { onConflict: "dealership_id,provider" },
    );

    return redirectToPanelPopupResult(oauthSession.redirect_origin, {
      provider,
      success: false,
      error: "cancelled",
    });
  }

  if (!code) {
    console.info("[classifieds-oauth-callback] missing_code", {
      provider,
      hasState: Boolean(state),
      queryKeys: [...url.searchParams.keys()],
    });

    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "error",
        error_reason: "missing_code",
        consumed_at: new Date().toISOString(),
      })
      .eq("id", oauthSession.id);

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: oauthSession.dealership_id,
        provider,
        status: "error",
        last_error: "missing_code",
      },
      { onConflict: "dealership_id,provider" },
    );

    return redirectToPanelPopupResult(oauthSession.redirect_origin, {
      provider,
      success: false,
      error: "missing_code",
    });
  }

  try {
    let providerConfig: ProviderRuntimeConfig;
    try {
      providerConfig = await resolveProviderRuntimeConfig(
        admin,
        provider,
        oauthSession.dealership_id,
      );
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a configuração OAuth desta concessionária.",
      );
    }

    const tokenPayload = await exchangeCodeForTokens(
      providerConfig,
      code,
      oauthSession.code_verifier,
      oauthSession.state,
    );

    const accessTokenEncrypted = await encryptSecretValue(
      tokenPayload.access_token,
      tokenCryptoSecret,
    );
    const refreshTokenEncrypted = tokenPayload.refresh_token
      ? await encryptSecretValue(tokenPayload.refresh_token, tokenCryptoSecret)
      : null;

    const tokenExpiresAt = tokenPayload.expires_in
      ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
      : null;

    const { data: connectionRow, error: connectionError } = await admin
      .from("dealership_classifieds_connections")
      .upsert(
        {
          dealership_id: oauthSession.dealership_id,
          provider,
          status: "connected",
          token_expires_at: tokenExpiresAt,
          connected_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "dealership_id,provider" },
      )
      .select("id")
      .single();

    if (connectionError || !connectionRow) {
      throw new Error(connectionError?.message ?? "Could not upsert connection row.");
    }

    const { error: credentialsError } = await admin
      .from("dealership_classifieds_credentials")
      .upsert(
        {
          connection_id: connectionRow.id,
          dealership_id: oauthSession.dealership_id,
          provider,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          scope: tokenPayload.scope ?? null,
          expires_at: tokenExpiresAt,
        },
        { onConflict: "connection_id" },
      );

    if (credentialsError) {
      throw new Error(credentialsError.message);
    }

    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "consumed",
        consumed_at: new Date().toISOString(),
        error_reason: null,
      })
      .eq("id", oauthSession.id);

    return redirectToPanelPopupResult(oauthSession.redirect_origin, {
      provider,
      success: true,
    });
  } catch (error) {
    const errorCode: PopupErrorCode =
      error instanceof Error &&
      (error.message.toLowerCase().includes("indisponível") ||
        error.message.toLowerCase().includes("missing") ||
        error.message.toLowerCase().includes("misconfigured") ||
        error.message.toLowerCase().includes("suporte"))
        ? "configuration"
        : "token_exchange_failed";

    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "error",
        consumed_at: new Date().toISOString(),
        error_reason: errorCode,
      })
      .eq("id", oauthSession.id);

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: oauthSession.dealership_id,
        provider,
        status: "error",
        last_error: errorCode,
      },
      { onConflict: "dealership_id,provider" },
    );

    return redirectToPanelPopupResult(oauthSession.redirect_origin, {
      provider,
      success: false,
      error: errorCode,
    });
  }
});
