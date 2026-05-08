import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { NextResponse, type NextRequest } from "next/server";

import { createOAuthState } from "@/lib/classifieds/oauth-pkce";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

const META_OAUTH_DIALOG_PATH = "/dialog/oauth";

function resolveRedirectUri(): string {
  const explicit = process.env.META_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurado para montar redirect Meta.");
  }
  return `${base.replace(/\/$/, "")}/functions/v1/meta-oauth-callback`;
}

function resolveGraphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || "21.0";
}

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
  const metaClientId = process.env.META_APP_CLIENT_ID?.trim();
  if (!metaClientId) {
    return NextResponse.json(
      { error: "Integração Meta não configurada no servidor." },
      { status: 500 },
    );
  }

  let redirectUri: string;
  try {
    redirectUri = resolveRedirectUri();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível definir redirect OAuth Meta.",
      },
      { status: 500 },
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
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.dealership_id !== dealershipIdFromCookie) {
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

  const graphVersion = resolveGraphVersion();
  const scopeParam = encodeURIComponent(resolveMetaScopes());
  const authorizationUrl =
    `https://www.facebook.com/v${graphVersion}${META_OAUTH_DIALOG_PATH}` +
    `?client_id=${encodeURIComponent(metaClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${scopeParam}` +
    "&response_type=code";

  return NextResponse.json({
    authorizationUrl,
    expiresAt,
  });
}
