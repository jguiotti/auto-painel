"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  isAttributionType,
  parseAttributionSharePercentToBps,
  parseMoneyToCents,
} from "@/lib/data/platform-sales-squad-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVALIDATE_PATHS = [
  "/painel/equipe/comercial",
  "/painel/leads-comerciais",
  "/painel/comercial/carteira",
];

interface ActionResult {
  error?: string;
  success?: boolean;
  attributionId?: string;
  ledgerEntryId?: string | null;
}

function revalidateAttributionPaths() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function createDealershipSalesAttributionAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const salesRepId = String(formData.get("sales_rep_id") ?? "").trim();
  const dealershipId = String(formData.get("dealership_id") ?? "").trim();
  const saasProspectId =
    String(formData.get("saas_prospect_id") ?? "").trim() || null;
  const contractId = String(formData.get("contract_id") ?? "").trim() || null;
  const attributionTypeRaw = String(formData.get("attribution_type") ?? "").trim();
  const shareRaw = String(formData.get("attribution_share_percent") ?? "100").trim();
  const closedAtRaw = String(formData.get("closed_at") ?? "").trim();
  const firstInvoiceRaw = String(formData.get("first_invoice_amount") ?? "").trim();
  const planKey = String(formData.get("plan_key") ?? "").trim() || null;
  const confirmImmediately =
    String(formData.get("confirm_immediately") ?? "false") === "true";

  if (!salesRepId || !dealershipId) {
    return { error: "Selecione o representante e a concessionária." };
  }
  if (!isAttributionType(attributionTypeRaw)) {
    return { error: "Tipo de vínculo inválido." };
  }

  const attributionShareBps = parseAttributionSharePercentToBps(shareRaw);
  if (attributionShareBps === null) {
    return { error: "Participação deve estar entre 0% e 100%." };
  }

  const firstInvoiceAmountCents = firstInvoiceRaw
    ? parseMoneyToCents(firstInvoiceRaw)
    : null;
  if (firstInvoiceRaw && firstInvoiceAmountCents === null) {
    return { error: "Valor da primeira fatura inválido." };
  }

  const closedAt = closedAtRaw
    ? new Date(closedAtRaw).toISOString()
    : new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_sales_rep_dealership_attributions")
    .insert({
      sales_rep_id: salesRepId,
      dealership_id: dealershipId,
      saas_prospect_id: saasProspectId,
      contract_id: contractId,
      attribution_type: attributionTypeRaw,
      attribution_share_bps: attributionShareBps,
      closed_at: closedAt,
      first_invoice_amount_cents: firstInvoiceAmountCents,
      plan_key: planKey,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Não foi possível criar o vínculo comercial." };
  }

  const attributionId = data.id as string;

  if (confirmImmediately) {
    const confirmResult = await confirmDealershipSalesAttributionAction(attributionId);
    if (confirmResult.error) {
      return {
        error: confirmResult.error,
        attributionId,
      };
    }
    return {
      success: true,
      attributionId,
      ledgerEntryId: confirmResult.ledgerEntryId,
    };
  }

  revalidateAttributionPaths();
  return { success: true, attributionId };
}

export async function confirmDealershipSalesAttributionAction(
  attributionId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!attributionId) {
    return { error: "Vínculo inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "confirm_dealership_sales_attribution",
    { p_attribution_id: attributionId },
  );

  if (error) {
    if (error.message.includes("attribution not found")) {
      return { error: "Vínculo comercial não encontrado." };
    }
    if (error.message.includes("forbidden")) {
      return { error: "Sem permissão para confirmar o vínculo." };
    }
    return { error: "Não foi possível confirmar o vínculo comercial." };
  }

  revalidateAttributionPaths();
  revalidatePath("/painel/comercial/extrato");
  return {
    success: true,
    attributionId,
    ledgerEntryId: (data as string | null) ?? null,
  };
}

export async function cancelDealershipSalesAttributionAction(
  attributionId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!attributionId) {
    return { error: "Vínculo inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: loadError } = await supabase
    .from("platform_sales_rep_dealership_attributions")
    .select("status")
    .eq("id", attributionId)
    .single();

  if (loadError || !existing) {
    return { error: "Vínculo comercial não encontrado." };
  }

  if (existing.status === "confirmed") {
    return {
      error: "Vínculos confirmados não podem ser cancelados — use repasse de carteira ou estorno.",
    };
  }

  const { error } = await supabase
    .from("platform_sales_rep_dealership_attributions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", attributionId);

  if (error) {
    return { error: "Não foi possível cancelar o vínculo." };
  }

  revalidateAttributionPaths();
  return { success: true, attributionId };
}

export async function disputeDealershipSalesAttributionAction(
  attributionId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!attributionId) {
    return { error: "Vínculo inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_sales_rep_dealership_attributions")
    .update({
      status: "disputed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", attributionId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    return { error: "Não foi possível marcar o vínculo em disputa." };
  }

  revalidateAttributionPaths();
  return { success: true, attributionId };
}
