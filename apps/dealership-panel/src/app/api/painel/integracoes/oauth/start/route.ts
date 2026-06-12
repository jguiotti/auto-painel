import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import {
  isClassifiedsProviderModuleEnabled,
} from "@autopainel/shared/lib/dealership-features";
import { NextResponse, type NextRequest } from "next/server";

import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";
import { classifiedsProviderUnavailableMessage } from "@/lib/integrations/integration-user-messages";
import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { resolveClassifiedsOAuthProviderConfigForDealership } from "@/lib/classifieds/resolve-classifieds-oauth-config";
import {
  createOAuthState,
  createPkceChallenge,
  createPkceVerifier,
  providerUsesPkce,
} from "@/lib/classifieds/oauth-pkce";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";
import { resolveDealershipPanelOrigin } from "@/lib/tenant/resolve-dealership-panel-origin";

export async function POST(request: NextRequest) {
  const provider = parseClassifiedsProvider(
    request.nextUrl.searchParams.get("provider"),
  );
  if (!provider) {
    return NextResponse.json(
      { error: "Fornecedor inválido." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const dealershipIdFromCookie = await getDealershipIdFromCookies();
  if (!dealershipIdFromCookie) {
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
    profile?.role === "super_admin" ||
    profile?.dealership_id === dealershipIdFromCookie;
  if (profileError || !profile || !canAccessDealership) {
    return NextResponse.json(
      { error: "Perfil sem acesso à concessionária ativa." },
      { status: 403 },
    );
  }

  const featuresRes = await supabase.rpc(
    "effective_feature_keys_for_active_dealership",
    {
      p_dealership_id: dealershipIdFromCookie,
    },
  );
  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((item): item is string => typeof item === "string")
    : [];
  if (!isClassifiedsProviderModuleEnabled(activeFeatures, provider)) {
    return NextResponse.json(
      { error: "Este integrador não está habilitado no plano da loja." },
      { status: 403 },
    );
  }

  const panelOrigin = resolveDealershipPanelOrigin(request);

  try {
    const admin = createSupabaseServiceRoleClient();
    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "replaced_by_new_attempt",
      })
      .eq("dealership_id", dealershipIdFromCookie)
      .eq("provider", provider)
      .eq("status", "pending");
  } catch {
    await supabase
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "replaced_by_new_attempt",
      })
      .eq("dealership_id", dealershipIdFromCookie)
      .eq("provider", provider)
      .eq("status", "pending")
      .eq("created_by", user.id);
  }

  let providerConfig;
  try {
    providerConfig = await resolveClassifiedsOAuthProviderConfigForDealership({
      dealershipId: dealershipIdFromCookie,
      provider,
      panelOrigin,
    });
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
      {
        error: "Não foi possível iniciar a conexão. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }

  const state = createOAuthState();
  const usesPkce = providerUsesPkce(provider);
  const codeVerifier = usesPkce ? createPkceVerifier() : null;
  const codeChallenge = codeVerifier ? createPkceChallenge(codeVerifier) : null;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: sessionError } = await supabase
    .from("dealership_classifieds_oauth_sessions")
    .insert({
      dealership_id: dealershipIdFromCookie,
      provider,
      created_by: user.id,
      state,
      code_verifier: codeVerifier,
      redirect_origin: panelOrigin,
      status: "pending",
      expires_at: expiresAt,
    });

  if (sessionError) {
    return NextResponse.json(
      { error: "Não foi possível iniciar a conexão. Tente novamente." },
      { status: 500 },
    );
  }

  const { error: connectionError } = await supabase
    .from("dealership_classifieds_connections")
    .upsert(
      {
        dealership_id: dealershipIdFromCookie,
        provider,
        status: "connecting",
        last_error: null,
      },
      { onConflict: "dealership_id,provider" },
    );

  if (connectionError) {
    return NextResponse.json(
      { error: "Não foi possível preparar a conexão. Tente novamente." },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: providerConfig.clientId,
    redirect_uri: providerConfig.redirectUri,
    state,
  });
  if (usesPkce && codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }
  if (providerConfig.scope) {
    params.set("scope", providerConfig.scope);
  }

  const authorizationUrl = `${providerConfig.authorizationUrl}${
    providerConfig.authorizationUrl.includes("?") ? "&" : "?"
  }${params.toString()}`;

  return NextResponse.json({
    provider,
    authorizationUrl,
    expiresAt,
  });
}
