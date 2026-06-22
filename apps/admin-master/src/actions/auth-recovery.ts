"use server";

import { sendAutopainelPasswordRecoveryEmail } from "@autopainel/shared/lib/email/send-autopainel-auth-email";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface AdminRecoverPasswordActionResult {
  error?: string;
  success?: boolean;
}

async function isPlatformOperatorEmail(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  email: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
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
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      return profile?.role === "super_admin";
    }

    if (data.users.length < perPage) {
      return false;
    }
    page += 1;
  }
}

export async function requestAdminPasswordRecoveryAction(
  formData: FormData,
): Promise<AdminRecoverPasswordActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return { error: "Indique um e-mail válido." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return {
      error: "Configuração do servidor incompleta. Tente novamente em instantes.",
    };
  }

  const isOperator = await isPlatformOperatorEmail(supabase, email);
  if (isOperator) {
    const result = await sendAutopainelPasswordRecoveryEmail(supabase, { email });
    if (!result.ok && !result.skipped) {
      console.warn("[admin-recover-password] send failed", result.message);
    }
  }

  return { success: true };
}
