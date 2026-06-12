import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

async function resetStaleConnectingAttempt(params: {
  dealershipId: string;
  provider: string;
  userId: string;
}): Promise<void> {
  const { dealershipId, provider, userId } = params;

  const supabase = await createSupabaseServerClient();

  await supabase
    .from("dealership_classifieds_oauth_sessions")
    .update({
      status: "expired",
      error_reason: "oauth_popup_closed_or_timeout",
    })
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .eq("status", "pending")
    .eq("created_by", userId);

  await supabase
    .from("dealership_classifieds_connections")
    .update({
      status: "disconnected",
      last_error: "Conexão não concluída. Tente conectar novamente.",
    })
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .eq("status", "connecting");

  try {
    const admin = createSupabaseServiceRoleClient();
    await admin
      .from("dealership_classifieds_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "oauth_popup_closed_or_timeout",
      })
      .eq("dealership_id", dealershipId)
      .eq("provider", provider)
      .eq("status", "pending");

    await admin.from("dealership_classifieds_connections").upsert(
      {
        dealership_id: dealershipId,
        provider,
        status: "disconnected",
        last_error: "Conexão não concluída. Tente conectar novamente.",
      },
      { onConflict: "dealership_id,provider" },
    );
  } catch {
    // Auth-scoped updates above are enough when service role is unavailable.
  }
}

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

  const { data: connection } = await supabase
    .from("dealership_classifieds_connections")
    .select("status")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (connection?.status !== "connecting") {
    return NextResponse.json({ reset: false, status: connection?.status ?? "disconnected" });
  }

  await resetStaleConnectingAttempt({
    dealershipId,
    provider,
    userId: user.id,
  });

  return NextResponse.json({ reset: true, status: "disconnected" });
}
