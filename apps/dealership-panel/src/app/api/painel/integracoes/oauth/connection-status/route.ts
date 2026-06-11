import { NextResponse, type NextRequest } from "next/server";

import { isClassifiedsProviderModuleEnabled } from "@autopainel/shared/lib/dealership-features";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export async function GET(request: NextRequest) {
  const provider = parseClassifiedsProvider(request.nextUrl.searchParams.get("provider"));
  if (!provider) {
    return NextResponse.json({ error: "Fornecedor inválido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    return NextResponse.json({ error: "Concessionária não resolvida." }, { status: 403 });
  }

  const featuresRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((item): item is string => typeof item === "string")
    : [];
  if (!isClassifiedsProviderModuleEnabled(activeFeatures, provider)) {
    return NextResponse.json({ error: "Integrador não habilitado no plano." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("dealership_classifieds_connections")
    .select("status, connected_at, last_error")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Não foi possível consultar a conexão." }, { status: 500 });
  }

  return NextResponse.json({
    provider,
    status: data?.status ?? "disconnected",
    connectedAt: data?.connected_at ?? null,
    lastError: data?.last_error ?? null,
  });
}
