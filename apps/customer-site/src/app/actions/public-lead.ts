"use server";

import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";

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

  const vehicleId = String(formData.get("vehicle_id") ?? "").trim();
  const clientName = String(formData.get("client_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const type = String(formData.get("type") ?? "contact").trim();
  const simulationRaw = String(formData.get("simulation_data") ?? "").trim();

  if (!vehicleId || !clientName || !phone) {
    return { error: "Preencha nome e telefone." };
  }

  if (type !== "contact" && type !== "simulation") {
    return { error: "Tipo de contato inválido." };
  }

  let simulationData: Record<string, unknown> = {};
  if (simulationRaw) {
    try {
      simulationData = JSON.parse(simulationRaw) as Record<string, unknown>;
    } catch {
      simulationData = {};
    }
  }

  const { data: vehicleRows, error: vehicleError } = await supabase.rpc(
    "get_public_vehicle_by_id",
    {
      p_vehicle_id: vehicleId,
      p_dealership_id: dealershipId,
    },
  );

  if (vehicleError || !vehicleRows?.length) {
    return { error: "Veículo indisponível ou não encontrado." };
  }

  if (type === "simulation") {
    if (!simulationRaw || !isValidSimulationSnapshot(simulationData)) {
      return { error: "Simulação inválida. Refaça o cálculo antes de enviar." };
    }

    const vehiclePrice = Number(simulationData.vehiclePrice);
    const downPayment = Number(simulationData.downPayment);
    if (downPayment >= vehiclePrice) {
      return { error: "A entrada deve ser menor que o valor do veículo." };
    }
  }

  const { error: insertError } = await supabase.from("leads").insert({
    dealership_id: dealershipId,
    vehicle_id: vehicleId,
    client_name: clientName,
    phone,
    type,
    simulation_data: simulationData,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true as const };
}
