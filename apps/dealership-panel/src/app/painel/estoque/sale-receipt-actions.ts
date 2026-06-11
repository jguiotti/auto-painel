"use server";

import { revalidatePath } from "next/cache";

import { isSaleReceiptModuleEnabled } from "@autopainel/shared/lib/dealership-features";
import type { UpsertVehicleSaleReceiptInput } from "@autopainel/shared/types/sale-receipt";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { mapSaleReceiptRow } from "@/lib/inventory/map-sale-receipt-row";
import { normalizeSaleReceiptInput } from "@/lib/inventory/validate-sale-receipt-input";

async function assertSaleReceiptModule(
  supabase: Awaited<ReturnType<typeof requireDashboardSession>>["supabase"],
  dealershipId: string,
) {
  const featureRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featureRes.data)
    ? featureRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (!isSaleReceiptModuleEnabled(activeFeatures)) {
    return { error: "A emissão de recibo de venda não está incluída no plano da sua loja." as const };
  }

  return { activeFeatures };
}

export async function saveVehicleSaleReceiptAction(input: UpsertVehicleSaleReceiptInput) {
  const normalized = normalizeSaleReceiptInput(input);
  if (!normalized.ok) {
    return { error: normalized.error };
  }

  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${input.vehicle_id}/recibo`,
  );

  const gate = await assertSaleReceiptModule(supabase, dealershipId);
  if ("error" in gate) {
    return gate;
  }

  const value = normalized.value;

  const { data, error } = await supabase.rpc("upsert_vehicle_sale_receipt", {
    p_vehicle_id: value.vehicle_id,
    p_buyer_name: value.buyer_name,
    p_buyer_document: value.buyer_document,
    p_buyer_billing_address: value.buyer_billing_address,
    p_payment_lines: value.payment_lines,
    p_sale_amount: value.sale_amount,
    p_down_payment_amount: value.down_payment_amount,
    p_vehicle_license_plate: value.vehicle_license_plate,
    p_vehicle_renavam: value.vehicle_renavam,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("vehicle_not_sold")) {
      return { error: "Só é possível emitir recibo para veículos marcados como vendidos." };
    }
    if (message.includes("module_not_enabled")) {
      return { error: "A emissão de recibo de venda não está incluída no plano da sua loja." };
    }
    return { error: "Não foi possível salvar o recibo. Tente novamente." };
  }

  if (value.vehicle_license_plate || value.vehicle_renavam) {
    await supabase
      .from("vehicles")
      .update({
        license_plate: value.vehicle_license_plate,
        renavam: value.vehicle_renavam,
        updated_at: new Date().toISOString(),
      })
      .eq("id", value.vehicle_id)
      .eq("dealership_id", dealershipId);
  }

  const receipt = mapSaleReceiptRow(data as Parameters<typeof mapSaleReceiptRow>[0]);

  revalidatePath(`/painel/estoque/${value.vehicle_id}`);
  revalidatePath(`/painel/estoque/${value.vehicle_id}/recibo`);

  return { success: true as const, receipt };
}
