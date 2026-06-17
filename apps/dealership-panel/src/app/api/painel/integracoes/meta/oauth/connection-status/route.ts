import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export async function GET() {
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
  if (!isDealershipFeatureEnabled(activeFeatures, "social_media_kit")) {
    return NextResponse.json(
      { error: "Módulo de redes sociais não habilitado no plano." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("dealership_meta_connections")
    .select("status, connected_at, last_error, page_name, instagram_username")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Não foi possível consultar a conexão." }, { status: 500 });
  }

  return NextResponse.json({
    status: data?.status ?? "disconnected",
    connectedAt: data?.connected_at ?? null,
    lastError: data?.last_error ?? null,
    pageName: data?.page_name ?? null,
    instagramUsername: data?.instagram_username ?? null,
  });
}
