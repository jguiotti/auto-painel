"use server";

import { revalidatePath } from "next/cache";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { dispatchSocialPublishWorker } from "@/lib/integrations/dispatch-social-publish-worker";

type SocialChannel = "instagram_feed" | "facebook_page";
type ArtifactTemplate = "classic" | "performance" | "tech";

function layoutIdToArtifactTemplate(layoutId: number | null | undefined): ArtifactTemplate {
  if (layoutId === 2) {
    return "performance";
  }
  if (layoutId === 3) {
    return "tech";
  }
  return "classic";
}

export async function enqueueVehicleSocialShareAction(
  vehicleId: string,
  channels: SocialChannel[],
) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const featureRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featureRes.data)
    ? featureRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (!isDealershipFeatureEnabled(activeFeatures, "social_media_kit")) {
    return { error: "Módulo de redes sociais não está ativo no plano da loja." };
  }

  if (channels.length === 0) {
    return { error: "Selecione ao menos um canal para compartilhar." };
  }

  const [{ data: vehicle, error: vehicleError }, { data: dealership, error: dealershipError }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select(
          "id, brand, model, version, public_slug, images, sale_price, price, manufacturing_year, model_year",
        )
        .eq("id", vehicleId)
        .eq("dealership_id", dealershipId)
        .maybeSingle(),
      supabase.from("dealerships").select("layout_id, name, slug").eq("id", dealershipId).maybeSingle(),
    ]);

  if (vehicleError || !vehicle) {
    return { error: "Veículo não encontrado." };
  }
  if (dealershipError || !dealership) {
    return { error: "Loja não encontrada." };
  }

  const { data: metaConnection } = await supabase
    .from("dealership_meta_connections")
    .select("status")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (metaConnection?.status !== "connected") {
    return {
      error:
        "Conecte Facebook/Instagram em Integrações antes de compartilhar nas redes sociais.",
    };
  }

  const images = (vehicle.images as string[] | null)?.filter(Boolean) ?? [];
  if (images.length === 0) {
    return { error: "Cadastre ao menos uma foto do veículo antes de compartilhar." };
  }

  const artifactTemplate = layoutIdToArtifactTemplate(dealership.layout_id);
  const payloadSnapshot = {
    vehicle: {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      version: vehicle.version,
      slug: vehicle.public_slug,
      price: vehicle.sale_price ?? vehicle.price,
      manufacturing_year: vehicle.manufacturing_year,
      model_year: vehicle.model_year,
      images,
    },
    dealership: {
      name: dealership.name,
      slug: dealership.slug,
      layout_id: dealership.layout_id,
    },
    branding_mask: true,
  };

  const { error: insertError } = await supabase.from("social_publication_jobs").insert({
    dealership_id: dealershipId,
    vehicle_id: vehicleId,
    channels,
    artifact_template: artifactTemplate,
    payload_snapshot: payloadSnapshot,
    status: "queued",
  });

  if (insertError) {
    return { error: insertError.message };
  }

  await dispatchSocialPublishWorker(1);

  revalidatePath(`/painel/estoque/${vehicleId}`);
  revalidatePath("/painel/estoque");

  return { success: true as const };
}
