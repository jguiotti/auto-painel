import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { NextResponse, type NextRequest } from "next/server";

import { createOAuthState } from "@/lib/classifieds/oauth-pkce";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMetaOAuthStartParams } from "@/lib/integrations/resolve-meta-oauth-start";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

const META_OAUTH_DIALOG_PATH = "/dialog/oauth";

function resolveMetaScopes(): string {
  const configured = process.env.META_OAUTH_SCOPES?.trim();
  if (configured) {
    return configured;
  }
  return [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");
}

export async function POST(request: NextRequest) {
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
  if (!isDealershipFeatureEnabled(activeFeatures, "social_media_kit")) {
    return NextResponse.json(
      { error: "Módulo de redes sociais não habilitado no plano da loja." },
      { status: 403 },
    );
  }

  let startParams;
  try {
    startParams = await resolveMetaOAuthStartParams({
      dealershipId: dealershipIdFromCookie,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível preparar o URL de autorização Meta.",
      },
      { status: 500 },
    );
  }

  if (!startParams) {
    return NextResponse.json(
      {
        error:
          "Salve o App ID e o App Secret do Meta na seção de integrações para habilitar a conexão.",
      },
      { status: 503 },
    );
  }

  const state = createOAuthState();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: sessionError } = await supabase
    .from("dealership_meta_oauth_sessions")
    .insert({
      dealership_id: dealershipIdFromCookie,
      created_by: user.id,
      state,
      redirect_origin: request.nextUrl.origin,
      status: "pending",
      expires_at: expiresAt,
    });

  if (sessionError) {
    return NextResponse.json(
      { error: `Falha ao iniciar sessão Meta: ${sessionError.message}` },
      { status: 500 },
    );
  }

  const { error: connectionError } = await supabase
    .from("dealership_meta_connections")
    .upsert(
      {
        dealership_id: dealershipIdFromCookie,
        status: "connecting",
        last_error: null,
      },
      { onConflict: "dealership_id" },
    );

  if (connectionError) {
    return NextResponse.json(
      { error: `Falha ao preparar estado da conexão: ${connectionError.message}` },
      { status: 500 },
    );
  }

  const scopeParam = encodeURIComponent(resolveMetaScopes());
  const authorizationUrl =
    `https://www.facebook.com/v${startParams.graphVersion}${META_OAUTH_DIALOG_PATH}` +
    `?client_id=${encodeURIComponent(startParams.metaAppId)}` +
    `&redirect_uri=${encodeURIComponent(startParams.redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${scopeParam}` +
    "&response_type=code";

  return NextResponse.json({
    authorizationUrl,
    expiresAt,
  });
}
