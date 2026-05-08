"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface PlatformFinanceSettingsActionResult {
  error?: string;
  success?: true;
}

export async function updatePlatformFinanceSettingsAction(
  formData: FormData,
): Promise<PlatformFinanceSettingsActionResult> {
  await requireAdminSession();

  const rateRaw = String(
    formData.get("finance_monthly_interest_rate_percent") ?? "",
  ).trim();
  const parsedRate = Number(rateRaw.replace(",", "."));

  if (!Number.isFinite(parsedRate)) {
    return { error: "Informe uma taxa mensal válida." };
  }
  if (parsedRate < 0 || parsedRate > 100) {
    return { error: "A taxa mensal deve ficar entre 0% e 100%." };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("platform_finance_settings").upsert({
    id: 1,
    finance_monthly_interest_rate_percent: parsedRate,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/financeiro");
  revalidatePath("/veiculo/[slug]", "page");
  revalidatePath("/simular-financiamento");

  return { success: true };
}
