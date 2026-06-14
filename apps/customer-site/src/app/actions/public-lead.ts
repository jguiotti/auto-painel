"use server";

import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

import { STOREFRONT_LEGAL_VERSION } from "@/lib/legal/constants";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";

export type StorefrontLeadSource =
  | "vehicle_page"
  | "finance_simulator"
  | "contact_page"
  | "whatsapp_float";

function isValidSimulationSnapshot(
  value: Record<string, unknown>,
): value is {
  vehiclePrice: number;
  downPayment: number;
  financedAmount: number;
  monthlyRatePercent: number;
  termMonths: number;
  estimatedInstallment: number;
  estimatedTotalPayable: number;
  estimatedTotalInterest: number;
} {
  const parsedTerm = Number(value.termMonths);
  return (
    Number.isFinite(Number(value.vehiclePrice)) &&
    Number.isFinite(Number(value.downPayment)) &&
    Number.isFinite(Number(value.financedAmount)) &&
    Number.isFinite(Number(value.monthlyRatePercent)) &&
    Number.isFinite(parsedTerm) &&
    [12, 24, 36, 48, 60].includes(parsedTerm) &&
    Number.isFinite(Number(value.estimatedInstallment)) &&
    Number.isFinite(Number(value.estimatedTotalPayable)) &&
    Number.isFinite(Number(value.estimatedTotalInterest))
  );
}

function parsePrivacyConsent(formData: FormData): boolean {
  const raw = String(formData.get("privacy_consent") ?? "").trim();
  return raw === "true" || raw === "on";
}

function parseMarketingConsent(formData: FormData): boolean {
  const raw = String(formData.get("marketing_consent") ?? "").trim();
  return raw === "true" || raw === "on";
}

export async function submitPublicLeadAction(formData: FormData) {
  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return { error: "Configuração do servidor incompleta." };
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    return { error: "Concessionária não identificada." };
  }

  if (!parsePrivacyConsent(formData)) {
    return { error: "Aceite a Política de Privacidade para continuar." };
  }

  const vehicleIdRaw = String(formData.get("vehicle_id") ?? "").trim();
  const vehicleId = vehicleIdRaw.length > 0 ? vehicleIdRaw : null;
  const clientName = String(formData.get("client_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const type = String(formData.get("type") ?? "contact").trim();
  const source = String(formData.get("source") ?? "vehicle_page").trim() as StorefrontLeadSource;
  const simulationRaw = String(formData.get("simulation_data") ?? "").trim();
  const marketingConsent = parseMarketingConsent(formData);

  if (!clientName || !phone) {
    return { error: "Preencha nome e telefone." };
  }

  if (type !== "contact" && type !== "simulation") {
    return { error: "Tipo de contato inválido." };
  }

  const allowedSources: StorefrontLeadSource[] = [
    "vehicle_page",
    "finance_simulator",
    "contact_page",
    "whatsapp_float",
  ];
  if (!allowedSources.includes(source)) {
    return { error: "Origem de contato inválida." };
  }

  let simulationData: Record<string, unknown> = {};
  if (simulationRaw) {
    try {
      simulationData = JSON.parse(simulationRaw) as Record<string, unknown>;
    } catch {
      simulationData = {};
    }
  }

  if (type === "simulation") {
    if (!vehicleId) {
      return { error: "Veículo não informado para simulação." };
    }
    if (!simulationRaw || !isValidSimulationSnapshot(simulationData)) {
      return { error: "Simulação inválida. Refaça o cálculo antes de enviar." };
    }

    const vehiclePrice = Number(simulationData.vehiclePrice);
    const downPayment = Number(simulationData.downPayment);
    if (downPayment >= vehiclePrice) {
      return { error: "A entrada deve ser menor que o valor do veículo." };
    }
  }

  const { data: leadId, error: rpcError } = await supabase.rpc("create_public_storefront_lead", {
    p_dealership_id: dealershipId,
    p_client_name: clientName,
    p_phone: phone,
    p_type: type,
    p_source: source,
    p_privacy_policy_version: STOREFRONT_LEGAL_VERSION,
    p_marketing_consent: marketingConsent,
    p_vehicle_id: vehicleId,
    p_client_email: clientEmail || null,
    p_message: message || null,
    p_simulation_data: simulationData,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  return { success: true as const, leadId: leadId as string | null };
}
