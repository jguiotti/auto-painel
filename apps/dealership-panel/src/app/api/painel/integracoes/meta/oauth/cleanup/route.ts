import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

async function resetStaleMetaConnectingAttempt(params: {
  dealershipId: string;
  userId: string;
}): Promise<void> {
  const { dealershipId, userId } = params;
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("dealership_meta_oauth_sessions")
    .update({
      status: "expired",
      error_reason: "oauth_popup_closed_or_timeout",
    })
    .eq("dealership_id", dealershipId)
    .eq("status", "pending")
    .eq("created_by", userId);

  await supabase
    .from("dealership_meta_connections")
    .update({
      status: "disconnected",
      last_error: "Conexão não concluída. Tente conectar novamente.",
    })
    .eq("dealership_id", dealershipId)
    .eq("status", "connecting");

  try {
    const admin = createSupabaseServiceRoleClient();
    await admin
      .from("dealership_meta_oauth_sessions")
      .update({
        status: "expired",
        error_reason: "oauth_popup_closed_or_timeout",
      })
      .eq("dealership_id", dealershipId)
      .eq("status", "pending");

    await admin.from("dealership_meta_connections").upsert(
      {
        dealership_id: dealershipId,
        status: "disconnected",
        last_error: "Conexão não concluída. Tente conectar novamente.",
      },
      { onConflict: "dealership_id" },
    );
  } catch {
    // Auth-scoped updates above are enough when service role is unavailable.
  }
}

export async function POST() {
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
    .from("dealership_meta_connections")
    .select("status")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (connection?.status !== "connecting") {
    return NextResponse.json({ reset: false, status: connection?.status ?? "disconnected" });
  }

  await resetStaleMetaConnectingAttempt({
    dealershipId,
    userId: user.id,
  });

  return NextResponse.json({ reset: true, status: "disconnected" });
}
