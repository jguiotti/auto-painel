import {
  buildClassifiedsOAuthDevStubTokenPayload,
  isClassifiedsOAuthDevStubEnabled,
} from "@autopainel/shared/lib/classifieds-oauth-dev-stub";
import { isClassifiedsProviderModuleEnabled } from "@autopainel/shared/lib/dealership-features";
import { encryptClassifiedsSecretValue } from "@autopainel/shared/lib/classifieds-token-crypto";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import { NextResponse, type NextRequest } from "next/server";

import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";
import {
  exchangeICarrosPasswordGrantToken,
  ICarrosPasswordGrantError,
} from "@/lib/classifieds/exchange-icarros-password-grant";
import { resolveICarrosPlatformConfig } from "@/lib/classifieds/resolve-icarros-platform-config";
import { classifiedsProviderUnavailableMessage } from "@/lib/integrations/integration-user-messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

interface ConnectBody {
  username?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    return NextResponse.json(
      { error: "Concessionária não resolvida para este domínio." },
      { status: 403 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("dealership_id, role")
    .eq("id", user.id)
    .single();

  const canAccessDealership =
    profile?.role === "super_admin" || profile?.dealership_id === dealershipId;
  if (profileError || !profile || !canAccessDealership) {
    return NextResponse.json(
      { error: "Perfil sem acesso à concessionária ativa." },
      { status: 403 },
    );
  }

  const featuresRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((item): item is string => typeof item === "string")
    : [];
  if (!isClassifiedsProviderModuleEnabled(activeFeatures, "icarros")) {
    return NextResponse.json(
      { error: "Este integrador não está habilitado no plano da loja." },
      { status: 403 },
    );
  }

  let body: ConnectBody;
  try {
    body = (await request.json()) as ConnectBody;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "Informe o usuário e a senha da sua conta iCarros." },
      { status: 400 },
    );
  }

  let tokenPayload: {
    accessToken: string;
    expiresIn: number | null;
    refreshToken: string | null;
    scope: string | null;
  };

  if (isClassifiedsOAuthDevStubEnabled()) {
    const stub = buildClassifiedsOAuthDevStubTokenPayload("icarros");
    tokenPayload = {
      accessToken: stub.access_token,
      expiresIn: stub.expires_in,
      refreshToken: stub.refresh_token,
      scope: stub.scope,
    };
  } else {
    let platformConfig;
    try {
      platformConfig = await resolveICarrosPlatformConfig();
    } catch (error) {
      if (error instanceof ClassifiedsOAuthNotConfiguredError) {
        return NextResponse.json(
          {
            code: error.code,
            provider: error.provider,
            error: classifiedsProviderUnavailableMessage(error.provider),
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "Não foi possível iniciar a conexão. Tente novamente em instantes." },
        { status: 500 },
      );
    }

    try {
      tokenPayload = await exchangeICarrosPasswordGrantToken({
        tokenUrl: platformConfig.tokenUrl,
        clientId: platformConfig.clientId,
        clientSecret: platformConfig.clientSecret,
        username,
        password,
        scope: platformConfig.scope,
      });
    } catch (error) {
      const supportCode =
        error instanceof ICarrosPasswordGrantError ? error.supportCode : "icarros_auth_failed";
      const message =
        error instanceof ICarrosPasswordGrantError
          ? error.message
          : "Não foi possível validar a conta iCarros. Tente novamente.";

      const admin = createSupabaseServiceRoleClient();
      await admin.from("dealership_classifieds_connections").upsert(
        {
          dealership_id: dealershipId,
          provider: "icarros",
          status: "error",
          last_error: supportCode,
        },
        { onConflict: "dealership_id,provider" },
      );

      return NextResponse.json({ error: message, code: supportCode }, { status: 400 });
    }
  }

  const cryptoSecret = process.env.CLASSIFIEDS_TOKENS_CRYPTO_SECRET?.trim();
  if (!cryptoSecret) {
    return NextResponse.json(
      { error: "Configuração de segurança indisponível. Fale com o suporte." },
      { status: 500 },
    );
  }

  const accessTokenEncrypted = await encryptClassifiedsSecretValue(
    tokenPayload.accessToken,
    cryptoSecret,
  );
  const refreshTokenEncrypted = tokenPayload.refreshToken
    ? await encryptClassifiedsSecretValue(tokenPayload.refreshToken, cryptoSecret)
    : null;
  const integratorPasswordEncrypted = await encryptClassifiedsSecretValue(password, cryptoSecret);
  const tokenExpiresAt = tokenPayload.expiresIn
    ? new Date(Date.now() + tokenPayload.expiresIn * 1000).toISOString()
    : null;

  const admin = createSupabaseServiceRoleClient();

  const { data: connectionRow, error: connectionError } = await admin
    .from("dealership_classifieds_connections")
    .upsert(
      {
        dealership_id: dealershipId,
        provider: "icarros",
        status: "connected",
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString(),
        last_error: null,
      },
      { onConflict: "dealership_id,provider" },
    )
    .select("id")
    .single();

  if (connectionError || !connectionRow?.id) {
    return NextResponse.json(
      { error: "Não foi possível salvar a conexão. Tente novamente." },
      { status: 500 },
    );
  }

  const { error: credentialsError } = await admin.from("dealership_classifieds_credentials").upsert(
    {
      connection_id: connectionRow.id,
      dealership_id: dealershipId,
      provider: "icarros",
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      scope: tokenPayload.scope,
      expires_at: tokenExpiresAt,
    },
    { onConflict: "connection_id" },
  );

  if (credentialsError) {
    return NextResponse.json(
      { error: "Não foi possível guardar as credenciais. Tente novamente." },
      { status: 500 },
    );
  }

  const { error: integratorError } = await admin
    .from("dealership_classifieds_integrator_accounts")
    .upsert(
      {
        dealership_id: dealershipId,
        provider: "icarros",
        integrator_username: username,
        integrator_password_encrypted: integratorPasswordEncrypted,
      },
      { onConflict: "dealership_id,provider" },
    );

  if (integratorError) {
    return NextResponse.json(
      { error: "Conexão criada, mas não foi possível guardar a conta. Tente reconectar." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    provider: "icarros",
    status: "connected",
    connectedAt: new Date().toISOString(),
  });
}
