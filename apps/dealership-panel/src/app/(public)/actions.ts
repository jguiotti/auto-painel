"use server";

import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import { revalidatePath } from "next/cache";

import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export async function submitPublicLeadAction(formData: FormData) {
  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return { error: "Configuração do servidor incompleta." };
  }

  const dealershipId = await getDealershipIdFromCookies();
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

  revalidatePath("/painel");
  revalidatePath("/painel/contatos");
  return { success: true as const };
}
