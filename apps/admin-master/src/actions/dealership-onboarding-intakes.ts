"use server";

import { revalidatePath } from "next/cache";

import type { DealershipOnboardingIntakePayload } from "@autopainel/shared/types";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { fetchDealershipOnboardingIntakeById } from "@/lib/data/dealership-onboarding-intakes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DealershipOnboardingIntakeRow } from "@autopainel/shared/types";

export interface OnboardingIntakeActionResult {
  error?: string;
  success?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function friendlyIntakeRpcError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("forbidden")) {
    return "Você não tem permissão para esta ação.";
  }
  if (lower.includes("intake_not_found")) {
    return "Adesão não encontrada ou já arquivada.";
  }
  if (lower.includes("saas_prospect_not_found")) {
    return "Lead comercial não encontrado.";
  }
  if (lower.includes("intake_already_converted")) {
    return "Esta adesão já foi convertida em outra concessionária.";
  }
  if (lower.includes("intake_not_archivable")) {
    return "Não é possível arquivar: adesão convertida ou inexistente.";
  }
  if (lower.includes("dealership_not_found")) {
    return "Concessionária não encontrada.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function linkOnboardingIntakeToProspectAction(
  intakeId: string,
  saasProspectId: string,
): Promise<OnboardingIntakeActionResult> {
  await requireAdminSession();

  if (!UUID_RE.test(intakeId) || !UUID_RE.test(saasProspectId)) {
    return { error: "Identificador inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("link_dealership_onboarding_intake_to_prospect", {
    p_intake_id: intakeId,
    p_saas_prospect_id: saasProspectId,
  });

  if (error) {
    return { error: friendlyIntakeRpcError(error.message) };
  }

  revalidatePath("/painel/adesoes-trial");
  revalidatePath("/painel/leads-comerciais");
  return { success: true };
}

export async function archiveOnboardingIntakeAction(
  intakeId: string,
): Promise<OnboardingIntakeActionResult> {
  await requireAdminSession();

  if (!UUID_RE.test(intakeId)) {
    return { error: "Identificador inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_dealership_onboarding_intake", {
    p_intake_id: intakeId,
  });

  if (error) {
    return { error: friendlyIntakeRpcError(error.message) };
  }

  revalidatePath("/painel/adesoes-trial");
  return { success: true };
}

export async function markOnboardingIntakeConvertedAction(
  intakeId: string,
  dealershipId: string,
): Promise<OnboardingIntakeActionResult> {
  await requireAdminSession();

  if (!UUID_RE.test(intakeId) || !UUID_RE.test(dealershipId)) {
    return { error: "Identificador inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_dealership_onboarding_intake_converted", {
    p_intake_id: intakeId,
    p_dealership_id: dealershipId,
  });

  if (error) {
    return { error: friendlyIntakeRpcError(error.message) };
  }

  revalidatePath("/painel/adesoes-trial");
  revalidatePath("/painel/leads-comerciais");
  revalidatePath("/painel/concessionarias");
  return { success: true };
}

export type { DealershipOnboardingIntakePayload };

export async function fetchOnboardingIntakeForReviewAction(
  intakeId: string,
): Promise<{ data?: DealershipOnboardingIntakeRow; error?: string }> {
  await requireAdminSession();

  if (!UUID_RE.test(intakeId)) {
    return { error: "Identificador inválido." };
  }

  const row = await fetchDealershipOnboardingIntakeById(intakeId);
  if (!row) {
    return { error: "Adesão não encontrada." };
  }

  return { data: row };
}
