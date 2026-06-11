"use server";

import { revalidatePath } from "next/cache";

import {
  getEnabledClassifiedsProviders,
  isAnyClassifiedsModuleEnabled,
  isClassifiedsProviderModuleEnabled,
  type ClassifiedsProvider,
} from "@autopainel/shared/lib/dealership-features";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { dispatchClassifiedsSyncWorker } from "@/lib/integrations/dispatch-classifieds-sync-worker";

function parseEnqueueResult(data: unknown): { enqueued: number; message?: string } {
  if (!data || typeof data !== "object") {
    return { enqueued: 0 };
  }
  const record = data as { enqueued?: number; message?: string };
  return {
    enqueued: typeof record.enqueued === "number" ? record.enqueued : 0,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

function filterProvidersByPlan(
  activeFeatures: string[],
  providers?: ClassifiedsProvider[],
): ClassifiedsProvider[] {
  const enabled = getEnabledClassifiedsProviders(activeFeatures);
  if (!providers?.length) {
    return enabled;
  }
  return providers.filter((provider) => isClassifiedsProviderModuleEnabled(activeFeatures, provider));
}

async function assertClassifiedsEnabled(
  supabase: Awaited<ReturnType<typeof requireDashboardSession>>["supabase"],
  dealershipId: string,
) {
  const featureRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featureRes.data)
    ? featureRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (!isAnyClassifiedsModuleEnabled(activeFeatures)) {
    return { error: "Nenhum integrador de classificados está ativo no plano da loja." as const };
  }

  return { activeFeatures };
}

export async function publishVehicleToClassifiedsAction(
  vehicleId: string,
  providers?: ClassifiedsProvider[],
) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const gate = await assertClassifiedsEnabled(supabase, dealershipId);
  if ("error" in gate) {
    return gate;
  }

  const scopedProviders = filterProvidersByPlan(gate.activeFeatures, providers);
  if (scopedProviders.length === 0) {
    return { error: "Nenhum portal de classificados habilitado no plano para esta ação." };
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, status, is_active, images")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (vehicleError || !vehicle) {
    return { error: "Veículo não encontrado." };
  }

  const images = (vehicle.images as string[] | null)?.filter(Boolean) ?? [];
  if (vehicle.status !== "available" || vehicle.is_active === false) {
    return { error: "Só veículos disponíveis e ativos podem ser publicados nos portais." };
  }
  if (images.length === 0) {
    return { error: "Cadastre ao menos uma foto antes de publicar nos classificados." };
  }

  const { data, error } = await supabase.rpc("enqueue_classifieds_sync_jobs", {
    p_vehicle_id: vehicleId,
    p_action: "publish",
    p_providers: scopedProviders,
  });

  if (error) {
    return { error: "Não foi possível enfileirar a publicação. Tente novamente." };
  }

  const result = parseEnqueueResult(data);
  if (result.enqueued === 0) {
    return {
      error:
        result.message === "no_connected_providers"
          ? "Conecte um portal em Integrações antes de publicar."
          : "Nenhuma publicação enfileirada. Verifique se os portais estão conectados.",
    };
  }

  await dispatchClassifiedsSyncWorker(result.enqueued);

  revalidatePath(`/painel/estoque/${vehicleId}`);
  revalidatePath("/painel/estoque");

  return {
    success: true as const,
    enqueued: result.enqueued,
  };
}

export async function delistVehicleFromClassifiedsAction(
  vehicleId: string,
  providers?: ClassifiedsProvider[],
) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const gate = await assertClassifiedsEnabled(supabase, dealershipId);
  if ("error" in gate) {
    return gate;
  }

  const scopedProviders = filterProvidersByPlan(gate.activeFeatures, providers);

  const { data, error } = await supabase.rpc("enqueue_classifieds_sync_jobs", {
    p_vehicle_id: vehicleId,
    p_action: "delist",
    p_providers: scopedProviders.length > 0 ? scopedProviders : null,
  });

  if (error) {
    return { error: "Não foi possível enfileirar a remoção. Tente novamente." };
  }

  const result = parseEnqueueResult(data);
  if (result.enqueued === 0) {
    return { error: "Este veículo não está publicado em nenhum portal conectado." };
  }

  await dispatchClassifiedsSyncWorker(result.enqueued);

  revalidatePath(`/painel/estoque/${vehicleId}`);

  return {
    success: true as const,
    enqueued: result.enqueued,
  };
}
