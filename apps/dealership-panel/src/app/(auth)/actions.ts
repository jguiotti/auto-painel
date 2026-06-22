"use server";

import { sendDealershipPasswordRecoveryEmail } from "@autopainel/shared/lib/email/send-dealership-auth-email";
import { resolveDealershipPanelAuthRedirectOrigin } from "@autopainel/shared/lib/auth/resolve-auth-redirect-origins";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export interface RecoverPasswordActionResult {
  error?: string;
  success?: boolean;
}

async function profileExistsForDealershipEmail(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  params: { email: string; dealershipId: string },
): Promise<boolean> {
  const normalized = params.email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) {
      return false;
    }

    const user = data.users.find(
      (entry) => entry.email?.trim().toLowerCase() === normalized,
    );
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("dealership_id")
        .eq("id", user.id)
        .maybeSingle();
      return profile?.dealership_id === params.dealershipId;
    }

    if (data.users.length < perPage) {
      return false;
    }
    page += 1;
  }
}

export async function requestDealershipPasswordRecoveryAction(
  formData: FormData,
): Promise<RecoverPasswordActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return { error: "Indique um e-mail válido." };
  }

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    return { error: "Concessionária não identificada." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return {
      error: "Configuração do servidor incompleta. Tente novamente em instantes.",
    };
  }

  const { data: dealership } = await supabase
    .from("dealerships")
    .select("slug")
    .eq("id", dealershipId)
    .maybeSingle();

  const slug = dealership?.slug?.trim().toLowerCase();
  const redirectOrigin = slug ? resolveDealershipPanelAuthRedirectOrigin(slug) : null;
  if (!redirectOrigin) {
    return { error: "Host do painel não configurado." };
  }

  const hasProfile = await profileExistsForDealershipEmail(supabase, {
    email,
    dealershipId,
  });

  if (hasProfile) {
    const result = await sendDealershipPasswordRecoveryEmail(supabase, {
      email,
      dealershipId,
      redirectOrigin,
    });

    if (!result.ok && !result.skipped) {
      console.warn("[dealership-recover-password] send failed", result.message);
    }
  }

  return { success: true };
}
