"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  isIncentiveCampaignStatus,
  parseMoneyToCents,
} from "@/lib/data/platform-sales-squad-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVALIDATE_PATH = "/painel/equipe/comercial/campanhas";

interface ActionResult {
  error?: string;
  success?: boolean;
  campaignId?: string;
}

const GOAL_METRICS = new Set([
  "closed_dealerships",
  "mrr_total_cents",
  "setup_count",
]);

export async function createPlatformIncentiveCampaignAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();
  const goalMetric = String(formData.get("goal_metric") ?? "").trim();
  const goalTargetRaw = String(formData.get("goal_target") ?? "").trim();
  const bonusRaw = String(formData.get("bonus_amount") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "draft").trim();
  const eligibleRepIdsRaw = String(formData.get("eligible_rep_ids") ?? "").trim();

  if (name.length < 3) {
    return { error: "Informe o nome da campanha." };
  }
  if (!startsAtRaw || !endsAtRaw) {
    return { error: "Informe início e fim da campanha." };
  }
  if (!GOAL_METRICS.has(goalMetric)) {
    return { error: "Métrica de meta inválida." };
  }
  const goalTarget = Number(goalTargetRaw);
  if (!Number.isFinite(goalTarget) || goalTarget <= 0) {
    return { error: "Informe uma meta válida maior que zero." };
  }
  const bonusAmountCents = parseMoneyToCents(bonusRaw);
  if (bonusAmountCents === null || bonusAmountCents <= 0) {
    return { error: "Informe um bônus válido maior que zero." };
  }
  if (!isIncentiveCampaignStatus(statusRaw)) {
    return { error: "Status da campanha inválido." };
  }

  const eligibleRepIds =
    eligibleRepIdsRaw.length > 0
      ? eligibleRepIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
      : null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_incentive_campaigns")
    .insert({
      name,
      starts_at: new Date(startsAtRaw).toISOString(),
      ends_at: new Date(endsAtRaw).toISOString(),
      goal_metric: goalMetric,
      goal_target: goalTarget,
      bonus_amount_cents: bonusAmountCents,
      eligible_rep_ids: eligibleRepIds,
      status: statusRaw,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar a campanha." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true, campaignId: data.id as string };
}

export async function updatePlatformIncentiveCampaignStatusAction(
  campaignId: string,
  status: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!campaignId) {
    return { error: "Campanha inválida." };
  }
  if (!isIncentiveCampaignStatus(status)) {
    return { error: "Status inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_incentive_campaigns")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) {
    return { error: "Não foi possível atualizar a campanha." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true, campaignId };
}
