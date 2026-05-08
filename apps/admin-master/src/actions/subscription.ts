"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

import type { ActionResult } from "./dealerships";

const SUB_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "paused",
]);

export async function updateSubscriptionAction(
  dealershipId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const subscription_plan = String(
    formData.get("subscription_plan") ?? "",
  ).trim();
  const subscription_status = String(
    formData.get("subscription_status") ?? "",
  ).trim();
  const periodRaw = String(
    formData.get("subscription_current_period_end") ?? "",
  ).trim();
  const billing_notes = String(formData.get("billing_notes") ?? "").trim();

  if (subscription_plan.length < 1 || subscription_plan.length > 120) {
    return {
      error: "Informe a etiqueta do plano de cobrança (1 a 120 caracteres).",
    };
  }

  if (!SUB_STATUSES.has(subscription_status)) {
    return { error: "Status de assinatura inválido." };
  }

  let subscription_current_period_end: string | null = null;
  if (periodRaw.length > 0) {
    const d = new Date(periodRaw);
    if (Number.isNaN(d.getTime())) {
      return { error: "Data de fim do período inválida." };
    }
    subscription_current_period_end = d.toISOString();
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase
    .from("dealerships")
    .update({
      subscription_plan,
      subscription_status,
      subscription_current_period_end,
      billing_notes: billing_notes.length > 0 ? billing_notes : null,
    })
    .eq("id", dealershipId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/financeiro");
  revalidatePath("/painel/dashboard");
  revalidatePath("/painel/concessionarias");
  return { success: true };
}
