import { createClient } from "npm:@supabase/supabase-js@2.104.0";

import { encryptSecretValue } from "../_shared/classifieds-crypto.ts";

interface MetaOAuthSessionRow {
  id: string;
  dealership_id: string;
  state: string;
  redirect_origin: string;
  expires_at: string;
}

interface GraphTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface InstagramBusinessAccountPayload {
  id?: string;
  username?: string;
}

interface PageAccount {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: InstagramBusinessAccountPayload;
}

interface AccountsResponse {
  data?: PageAccount[];
  paging?: { next?: string };
}

function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function resolveGraphVersion(): string {
  return Deno.env.get("META_GRAPH_API_VERSION")?.trim() || "21.0";
}

function resolveRedirectUri(defaultCallback: string): string {
  return Deno.env.get("META_OAUTH_REDIRECT_URI")?.trim() || defaultCallback;
}

function jsonForPopup(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replaceAll("</", "<\\/");
}

function popupHtml(params: {
  targetOrigin: string;
  success: boolean;
  error?: string;
}): string {
  const payload = {
    source: "autopainel_meta_oauth",
    success: params.success,
    error: params.error ?? null,
  };

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>AutoPainel — Meta</title>
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

async function graphFetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok || body.error) {
    throw new Error(
      body.error?.message ?? `Request failed with status ${response.status}.`,
    );
  }
  return body;
}

async function fetchShortLivedUserToken(params: {
  graphVersion: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<GraphTokenResponse> {
  const url =
    `https://graph.facebook.com/v${params.graphVersion}/oauth/access_token` +
    `?client_id=${encodeURIComponent(params.clientId)}` +
    `&redirect_uri=${encodeURIComponent(params.redirectUri)}` +
    `&client_secret=${encodeURIComponent(params.clientSecret)}` +
    `&code=${encodeURIComponent(params.code)}`;
  return graphFetchJson<GraphTokenResponse>(url);
}

async function fetchLongLivedUserToken(params: {
  clientId: string;
  clientSecret: string;
  shortLivedToken: string;
}): Promise<GraphTokenResponse> {
  const url =
    "https://graph.facebook.com/oauth/access_token" +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(params.clientId)}` +
    `&client_secret=${encodeURIComponent(params.clientSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(params.shortLivedToken)}`;
  return graphFetchJson<GraphTokenResponse>(url);
}

async function fetchAllPageAccounts(params: {
  graphVersion: string;
  userAccessToken: string;
}): Promise<PageAccount[]> {
  const aggregated: PageAccount[] = [];
  let nextUrl:
    | string
    | null = `https://graph.facebook.com/v${params.graphVersion}/me/accounts` +
    `?fields=name,access_token,instagram_business_account{id,username}` +
    "&limit=100" +
    `&access_token=${encodeURIComponent(params.userAccessToken)}`;

  while (nextUrl) {
    const page = await graphFetchJson<AccountsResponse>(nextUrl);
    if (Array.isArray(page.data)) {
      aggregated.push(...page.data);
    }
    nextUrl = page.paging?.next ?? null;
  }

  return aggregated;
}

function pickPrimaryPage(pages: PageAccount[]): PageAccount | null {
  const withInstagram = pages.find((item) =>
    item.instagram_business_account?.id
  );
  return withInstagram ?? pages[0] ?? null;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");

  const graphVersion = resolveGraphVersion();
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const serviceRoleKey = requireEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  const metaClientId = requireEnvVar("META_APP_CLIENT_ID");
  const metaClientSecret = requireEnvVar("META_APP_CLIENT_SECRET");
  const tokenCryptoSecret = requireEnvVar("META_TOKENS_CRYPTO_SECRET");
  const redirectUri = resolveRedirectUri(
    `${supabaseUrl}/functions/v1/meta-oauth-callback`,
  );

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function reply(params: {
    targetOrigin: string;
    success: boolean;
    error?: string;
    status: number;
  }): Promise<Response> {
    return new Response(
      popupHtml({
        targetOrigin: params.targetOrigin,
        success: params.success,
        error: params.error,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: params.status },
    );
  }

  if (!state) {
    return await reply({
      targetOrigin: "*",
      success: false,
      error: "Callback inválido: state ausente.",
      status: 400,
    });
  }

  const { data: session, error: sessionError } = await admin
    .from("dealership_meta_oauth_sessions")
    .select("id, dealership_id, state, redirect_origin, expires_at")
    .eq("state", state)
    .eq("status", "pending")
    .single();

  if (sessionError || !session) {
    return await reply({
      targetOrigin: "*",
      success: false,
      error: "Sessão OAuth expirada ou inválida. Tente novamente.",
      status: 400,
    });
  }

  const oauthSession = session as MetaOAuthSessionRow;
  const targetOrigin = oauthSession.redirect_origin;

  const sessionExpired = new Date(oauthSession.expires_at).getTime() < Date.now();
  if (sessionExpired) {
    await admin.from("dealership_meta_oauth_sessions").update({
      status: "expired",
      error_reason: "oauth_session_expired",
    }).eq("id", oauthSession.id);

    return await reply({
      targetOrigin,
      success: false,
      error: "Sessão OAuth expirou. Reabra a conexão no painel.",
      status: 400,
    });
  }

  const markSessionError = async (reason: string) => {
    await admin.from("dealership_meta_oauth_sessions").update({
      status: "error",
      error_reason: reason,
      consumed_at: new Date().toISOString(),
    }).eq("id", oauthSession.id);
  };

  async function flagConnectionAsError(message: string) {
    const updated = await admin
      .from("dealership_meta_connections")
      .update({
        status: "error",
        last_error: message,
      })
      .eq("dealership_id", oauthSession.dealership_id)
      .select("id");

    const updatedRows = Array.isArray(updated.data) ? updated.data.length : 0;
    if (updatedRows === 0) {
      await admin.from("dealership_meta_connections").insert({
        dealership_id: oauthSession.dealership_id,
        status: "error",
        last_error: message,
      });
    }
  }

  if (oauthError) {
    const errorText = oauthErrorDescription || oauthError;
    await markSessionError(errorText);
    await flagConnectionAsError(errorText);

    return await reply({
      targetOrigin,
      success: false,
      error: `Autorização recusada: ${errorText}`,
      status: 200,
    });
  }

  if (!code) {
    await markSessionError("missing_authorization_code");
    await flagConnectionAsError("Callback sem authorization code.");

    return await reply({
      targetOrigin,
      success: false,
      error: "Callback sem authorization code.",
      status: 400,
    });
  }

  try {
    const shortLived = await fetchShortLivedUserToken({
      graphVersion,
      clientId: metaClientId,
      clientSecret: metaClientSecret,
      redirectUri,
      code,
    });

    if (!shortLived.access_token) {
      throw new Error("Resposta OAuth sem access_token.");
    }

    const longLived = await fetchLongLivedUserToken({
      clientId: metaClientId,
      clientSecret: metaClientSecret,
      shortLivedToken: shortLived.access_token,
    });

    if (!longLived.access_token) {
      throw new Error("Não foi possível obter token de longa duração.");
    }

    const userTokenExpiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
      : null;

    const accounts = await fetchAllPageAccounts({
      graphVersion,
      userAccessToken: longLived.access_token,
    });

    const chosen = pickPrimaryPage(accounts);
    if (
      !chosen?.id ||
      !chosen.access_token ||
      typeof chosen.access_token !== "string"
    ) {
      throw new Error(
        "Nenhuma página Facebook com token foi encontrada. Confirme se você gerencia páginas e repetiu o login com todas as permissões.",
      );
    }

    const userTokenEncrypted = await encryptSecretValue(
      longLived.access_token,
      tokenCryptoSecret,
    );
    const pageTokenEncrypted = await encryptSecretValue(
      chosen.access_token,
      tokenCryptoSecret,
    );

    const { data: connectionRow, error: connectionError } = await admin
      .from("dealership_meta_connections")
      .upsert(
        {
          dealership_id: oauthSession.dealership_id,
          status: "connected",
          page_id: chosen.id,
          page_name: chosen.name ?? null,
          instagram_business_account_id:
            chosen.instagram_business_account?.id ?? null,
          instagram_username:
            chosen.instagram_business_account?.username ?? null,
          token_expires_at: userTokenExpiresAt,
          connected_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "dealership_id" },
      )
      .select("id")
      .single();

    if (connectionError || !connectionRow) {
      throw new Error(connectionError?.message ?? "Erro ao guardar conexão.");
    }

    const { error: credentialsError } = await admin
      .from("dealership_meta_credentials")
      .upsert(
        {
          connection_id: connectionRow.id,
          dealership_id: oauthSession.dealership_id,
          user_access_token_encrypted: userTokenEncrypted,
          page_access_token_encrypted: pageTokenEncrypted,
          expires_at: userTokenExpiresAt,
        },
        { onConflict: "connection_id" },
      );

    if (credentialsError) {
      throw new Error(credentialsError.message);
    }

    await admin.from("dealership_meta_oauth_sessions").update({
      status: "consumed",
      consumed_at: new Date().toISOString(),
      error_reason: null,
    }).eq("id", oauthSession.id);

    return await reply({
      targetOrigin,
      success: true,
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro ao concluir autenticação Meta.";

    await markSessionError(errorMessage);
    await flagConnectionAsError(errorMessage);

    return await reply({
      targetOrigin,
      success: false,
      error: errorMessage,
      status: 500,
    });
  }
});
