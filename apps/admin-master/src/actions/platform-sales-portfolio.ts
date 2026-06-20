"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TransferSalesRepPortfolioResult } from "@autopainel/shared/types";

const REVALIDATE_PATHS = [
  "/painel/equipe/comercial",
  "/painel/comercial/carteira",
];

interface ActionResult {
  error?: string;
  success?: boolean;
  result?: TransferSalesRepPortfolioResult;
}

export async function transferSalesRepPortfolioAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const fromSalesRepId = String(formData.get("from_sales_rep_id") ?? "").trim();
  const toSalesRepId = String(formData.get("to_sales_rep_id") ?? "").trim();
  const effectiveAtRaw = String(formData.get("effective_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dealershipIdsRaw = String(formData.get("dealership_ids") ?? "").trim();

  if (!fromSalesRepId || !toSalesRepId) {
    return { error: "Selecione o representante de origem e destino." };
  }
  if (fromSalesRepId === toSalesRepId) {
    return { error: "Origem e destino devem ser representantes diferentes." };
  }

  const effectiveAt = effectiveAtRaw
    ? new Date(effectiveAtRaw).toISOString()
    : new Date().toISOString();

  const dealershipIds =
    dealershipIdsRaw.length > 0
      ? dealershipIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
      : null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("transfer_sales_rep_portfolio", {
    p_from_sales_rep_id: fromSalesRepId,
    p_to_sales_rep_id: toSalesRepId,
    p_effective_at: effectiveAt,
    p_dealership_ids: dealershipIds,
    p_notes: notes,
  });

  if (error) {
    if (error.message.includes("destination rep must be active")) {
      return { error: "O representante de destino precisa estar ativo." };
    }
    if (error.message.includes("forbidden")) {
      return { error: "Sem permissão para repassar carteira." };
    }
    return { error: "Não foi possível repassar a carteira." };
  }

  const payload = data as {
    transfer_id?: string;
    dealerships_moved?: number;
  } | null;

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath("/painel/comercial/extrato");

  return {
    success: true,
    result: {
      transfer_id: payload?.transfer_id ?? "",
      dealerships_moved: payload?.dealerships_moved ?? 0,
    },
  };
}
