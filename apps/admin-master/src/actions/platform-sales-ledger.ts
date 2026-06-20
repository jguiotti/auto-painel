"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { parseMoneyToCents } from "@/lib/data/platform-sales-squad-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVALIDATE_PATHS = [
  "/painel/equipe/comercial",
  "/painel/comercial/extrato",
];

interface ActionResult {
  error?: string;
  success?: boolean;
  approvedCount?: number;
  entryId?: string;
}

function revalidateLedgerPaths() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function approveSalesCommissionLedgerEntriesAction(
  entryIds: string[],
): Promise<ActionResult> {
  await requireAdminSession();

  const ids = entryIds.filter(Boolean);
  if (ids.length === 0) {
    return { error: "Selecione ao menos uma linha do extrato." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "approve_sales_commission_ledger_entries",
    { p_entry_ids: ids },
  );

  if (error) {
    if (error.message.includes("forbidden")) {
      return { error: "Sem permissão para aprovar comissões." };
    }
    return { error: "Não foi possível aprovar as linhas selecionadas." };
  }

  revalidateLedgerPaths();
  return { success: true, approvedCount: typeof data === "number" ? data : 0 };
}

export async function createManualCommissionAdjustmentAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const salesRepId = String(formData.get("sales_rep_id") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const referenceMonth = String(formData.get("reference_month") ?? "").trim();
  const entryTypeRaw = String(formData.get("entry_type") ?? "adjustment").trim();

  if (!salesRepId) {
    return { error: "Selecione o representante." };
  }
  if (description.length < 3) {
    return { error: "Informe uma descrição para o ajuste." };
  }
  if (!referenceMonth) {
    return { error: "Informe a competência (mês/ano)." };
  }

  const amountCents = parseMoneyToCents(amountRaw);
  if (amountCents === null || amountCents === 0) {
    return { error: "Informe um valor válido diferente de zero." };
  }

  const allowedTypes = new Set(["adjustment", "bonus"]);
  if (!allowedTypes.has(entryTypeRaw)) {
    return { error: "Tipo de lançamento inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_commission_ledger_entries")
    .insert({
      sales_rep_id: salesRepId,
      entry_type: entryTypeRaw,
      amount_cents: amountCents,
      description,
      reference_month: referenceMonth,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível registrar o ajuste." };
  }

  revalidateLedgerPaths();
  return { success: true, entryId: data.id as string };
}

export async function cancelPendingLedgerEntryAction(
  entryId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!entryId) {
    return { error: "Linha do extrato inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_commission_ledger_entries")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("status", "pending");

  if (error) {
    return { error: "Não foi possível cancelar a linha pendente." };
  }

  revalidateLedgerPaths();
  return { success: true, entryId };
}

export async function runDealershipChurnClawbackAction(
  dealershipId: string,
): Promise<ActionResult & { clawbackRows?: number }> {
  await requireAdminSession();

  if (!dealershipId) {
    return { error: "Concessionária inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "clawback_dealership_sales_commissions",
    { p_dealership_id: dealershipId },
  );

  if (error) {
    return { error: "Não foi possível executar o estorno de comissões." };
  }

  revalidateLedgerPaths();
  return {
    success: true,
    clawbackRows: typeof data === "number" ? data : 0,
  };
}
