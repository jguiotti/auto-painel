import { NextResponse, type NextRequest } from "next/server";

import { encryptClassifiedsSecretValue } from "@autopainel/shared/lib/classifieds-token-crypto";
import {
  buildClassifiedsOAuthDevStubCode,
  buildClassifiedsOAuthDevStubTokenPayload,
  isClassifiedsOAuthDevStubEnabled,
  parseClassifiedsOAuthDevStubCode,
} from "@autopainel/shared/lib/classifieds-oauth-dev-stub";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";

function jsonForPopup(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replaceAll("</", "<\\/");
}

function popupHtml(params: {
  targetOrigin: string;
  provider: string | null;
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
  <head><meta charset="utf-8" /><title>Conexão concluída</title></head>
  <body>
    <script>
      (function () {
        const payload = ${jsonForPopup(payload)};
        const targetOrigin = ${JSON.stringify(params.targetOrigin)};
        try {
          if (window.opener && !window.opener.closed && typeof window.opener.postMessage === "function") {
            window.opener.postMessage(payload, targetOrigin);
          }
        } catch (_) {}
        setTimeout(function () {
          window.close();
        }, 120);
      })();
    </script>
    <p>Login processado. Esta janela pode ser fechada.</p>
  </body>
</html>`;
}

function requireCryptoSecret(): string {
  const secret = process.env.CLASSIFIEDS_TOKENS_CRYPTO_SECRET?.trim();
  if (!secret) {
    throw new Error("CLASSIFIEDS_TOKENS_CRYPTO_SECRET ausente.");
  }
  return secret;
}

export async function GET(request: NextRequest) {
  if (!isClassifiedsOAuthDevStubEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const provider = parseClassifiedsProvider(request.nextUrl.searchParams.get("provider"));
  const state = request.nextUrl.searchParams.get("state")?.trim();
  const code = request.nextUrl.searchParams.get("code")?.trim();
  const oauthError = request.nextUrl.searchParams.get("error");

  if (!provider) {
    return new NextResponse(
      popupHtml({
        targetOrigin: "*",
        provider: null,
        success: false,
        error: "Fornecedor inválido.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  if (!state) {
    return new NextResponse(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error: "State OAuth ausente.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return new NextResponse(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error: "Servidor sem credenciais Supabase.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 },
    );
  }

  const { data: session, error: sessionError } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id, dealership_id, provider, state, redirect_origin, expires_at, status")
    .eq("state", state)
    .eq("provider", provider)
    .eq("status", "pending")
    .maybeSingle();

  if (sessionError || !session) {
    return new NextResponse(
      popupHtml({
        targetOrigin: "*",
        provider,
        success: false,
        error: "Sessão OAuth expirada ou inválida.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  const targetOrigin = session.redirect_origin;

  if (oauthError) {
    return new NextResponse(
      popupHtml({
        targetOrigin,
        provider,
        success: false,
        error: "Login cancelado.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  }

  if (!code) {
    return new NextResponse(
      popupHtml({
        targetOrigin,
        provider,
        success: false,
        error: "Código OAuth ausente.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  const stubPayload = parseClassifiedsOAuthDevStubCode(code);
  if (!stubPayload || stubPayload.state !== state || stubPayload.provider !== provider) {
    return new NextResponse(
      popupHtml({
        targetOrigin,
        provider,
        success: false,
        error: "Código OAuth de desenvolvimento inválido.",
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 },
    );
  }

  try {
    const tokenPayload = buildClassifiedsOAuthDevStubTokenPayload(provider);
    const cryptoSecret = requireCryptoSecret();
    const accessTokenEncrypted = await encryptClassifiedsSecretValue(
      tokenPayload.access_token,
      cryptoSecret,
    );
    const refreshTokenEncrypted = await encryptClassifiedsSecretValue(
      tokenPayload.refresh_token,
      cryptoSecret,
    );
    const tokenExpiresAt = new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString();

    const { data: connectionRow, error: connectionError } = await admin
      .from("dealership_classifieds_connections")
      .upsert(
        {
          dealership_id: session.dealership_id,
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
      throw new Error(connectionError?.message ?? "Could not upsert connection.");
    }

    const { error: credentialsError } = await admin.from("dealership_classifieds_credentials").upsert(
      {
        connection_id: connectionRow.id,
        dealership_id: session.dealership_id,
        provider,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        scope: tokenPayload.scope,
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
      .eq("id", session.id);

    return new NextResponse(
      popupHtml({
        targetOrigin,
        provider,
        success: true,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao concluir autenticação OAuth.";

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: session.dealership_id,
        provider,
        status: "error",
        last_error: message,
      },
      { onConflict: "dealership_id,provider" },
    );

    return new NextResponse(
      popupHtml({
        targetOrigin,
        provider,
        success: false,
        error: message,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 },
    );
  }
}
