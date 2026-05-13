import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import {
  decryptSecretValue,
  encryptSecretValue,
} from "../_shared/classifieds-crypto.ts";

type ProviderKey = "olx" | "webmotors";

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
  if (raw === "olx" || raw === "webmotors") {
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

function getProviderConfigFromEnv(provider: ProviderKey): ProviderRuntimeConfig {
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const defaultRedirectUri = `${supabaseUrl}/functions/v1/classifieds-oauth-callback?provider=${provider}`;

  if (provider === "olx") {
    return {
      provider,
      tokenUrl: requireEnvVar("OLX_OAUTH_TOKEN_URL"),
      clientId: requireEnvVar("OLX_OAUTH_CLIENT_ID"),
      clientSecret: requireEnvVar("OLX_OAUTH_CLIENT_SECRET"),
      redirectUri: Deno.env.get("OLX_OAUTH_REDIRECT_URI")?.trim() || defaultRedirectUri,
    };
  }

  return {
    provider,
    tokenUrl: requireEnvVar("WEBMOTORS_OAUTH_TOKEN_URL"),
    clientId: requireEnvVar("WEBMOTORS_OAUTH_CLIENT_ID"),
    clientSecret: requireEnvVar("WEBMOTORS_OAUTH_CLIENT_SECRET"),
    redirectUri:
      Deno.env.get("WEBMOTORS_OAUTH_REDIRECT_URI")?.trim() || defaultRedirectUri,
  };
}

async function resolveProviderRuntimeConfig(
  admin: SupabaseClient,
  provider: ProviderKey,
  dealershipId: string,
): Promise<ProviderRuntimeConfig> {
  const envConfig = getProviderConfigFromEnv(provider);

  const { data: appRow, error } = await admin
    .from("dealership_classifieds_oauth_apps")
    .select(
      "oauth_client_id, oauth_client_secret_encrypted, token_url_override",
    )
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (error || !appRow?.oauth_client_id?.trim()) {
    return envConfig;
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
      "Não foi possível descriptografar o segredo OAuth da concessionária. Confirme CLASSIFIEDS_TOKENS_CRYPTO_SECRET ou guarde as credenciais novamente.",
    );
  }

  return {
    provider,
    tokenUrl: row.token_url_override?.trim() || envConfig.tokenUrl,
    clientId: row.oauth_client_id.trim(),
    clientSecret: clientSecretPlain.trim(),
    redirectUri: envConfig.redirectUri,
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
    <title>AutoPainel OAuth2</title>
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
        window.close();
      })();
    </script>
    <p>Conexão processada. Você já pode fechar esta janela.</p>
  </body>
</html>`;
}

async function exchangeCodeForTokens(
  config: ProviderRuntimeConfig,
  code: string,
  codeVerifier: string | null,
): Promise<TokenResponsePayload> {
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
  const provider = resolveProvider(url.searchParams.get("provider"));
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");

  if (!provider || !state) {
    return new Response(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error: "Callback inválido: provider/state ausente.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  let tokenCryptoSecret: string;
  let supabaseUrl: string;
  let serviceRoleKey: string;
  try {
    tokenCryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
    supabaseUrl = requireEnvVar("SUPABASE_URL");
    serviceRoleKey = requireEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    return new Response(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ambiente não configurado para OAuth2.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: session, error: sessionError } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id, dealership_id, provider, state, code_verifier, redirect_origin, expires_at")
    .eq("state", state)
    .eq("provider", provider)
    .eq("status", "pending")
    .single();

  if (sessionError || !session) {
    return new Response(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error: "Sessão OAuth2 expirada ou inválida. Tente novamente.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  const oauthSession = session as OAuthSessionRow;
  const sessionExpired = new Date(oauthSession.expires_at).getTime() < Date.now();
  if (sessionExpired) {
    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "oauth_session_expired",
      })
      .eq("id", oauthSession.id);

    return new Response(
      popupHtml({
        targetOrigin: oauthSession.redirect_origin,
        provider,
        success: false,
        error: "Sessão OAuth2 expirou. Reabra a conexão no painel.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
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
        last_error: errorText,
      },
      { onConflict: "dealership_id,provider" },
    );

    return new Response(
      popupHtml({
        targetOrigin: oauthSession.redirect_origin,
        provider,
        success: false,
        error: `Autorização recusada: ${errorText}`,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  }

  if (!code) {
    return new Response(
      popupHtml({
        targetOrigin: oauthSession.redirect_origin,
        provider,
        success: false,
        error: "Callback sem authorization code.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
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

    return new Response(
      popupHtml({
        targetOrigin: oauthSession.redirect_origin,
        provider,
        success: true,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao concluir autenticação OAuth2.";

    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "error",
        consumed_at: new Date().toISOString(),
        error_reason: errorMessage,
      })
      .eq("id", oauthSession.id);

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: oauthSession.dealership_id,
        provider,
        status: "error",
        last_error: errorMessage,
      },
      { onConflict: "dealership_id,provider" },
    );

    return new Response(
      popupHtml({
        targetOrigin: oauthSession.redirect_origin,
        provider,
        success: false,
        error: errorMessage,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 },
    );
  }
});
