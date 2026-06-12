import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export async function POST(request: NextRequest) {
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

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Servidor sem credenciais para limpar a conexão." },
      { status: 500 },
    );
  }

  const { data: connection } = await admin
    .from("dealership_classifieds_connections")
    .select("status")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (connection?.status !== "connecting") {
    return NextResponse.json({ reset: false, status: connection?.status ?? "disconnected" });
  }

  const { data: pendingSessions } = await admin
    .from("dealership_classifieds_oauth_sessions")
    .select("id")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .eq("status", "pending");

  if (Array.isArray(pendingSessions) && pendingSessions.length > 0) {
    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "oauth_popup_closed_or_timeout",
      })
      .in(
        "id",
        pendingSessions.map((row) => row.id),
      );
  }

  await admin.from("dealership_classifieds_connections").upsert(
    {
      dealership_id: dealershipId,
      provider,
      status: "disconnected",
      last_error: "Conexão não concluída. Tente conectar novamente.",
    },
    { onConflict: "dealership_id,provider" },
  );

  return NextResponse.json({ reset: true, status: "disconnected" });
}
