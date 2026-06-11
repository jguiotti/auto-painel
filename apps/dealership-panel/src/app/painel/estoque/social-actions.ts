"use server";

import { revalidatePath } from "next/cache";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import type {
  SocialPublicationChannel,
  SocialPublicationTriggerSource,
} from "@autopainel/shared/types/social-carousel";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { getDealershipSocialCarouselSettings } from "@/lib/data/dealership-social-carousel-settings";
import { dispatchSocialPublishWorker } from "@/lib/integrations/dispatch-social-publish-worker";
import { renderSocialCarouselSlides } from "@/lib/social/render-social-carousel-slides";

async function assertSocialModule(
  supabase: Awaited<ReturnType<typeof requireDashboardSession>>["supabase"],
  dealershipId: string,
) {
  const featureRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featureRes.data)
    ? featureRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (!isDealershipFeatureEnabled(activeFeatures, "social_media_kit")) {
    return { error: "Módulo de redes sociais não está ativo no plano da loja." as const };
  }

  return { activeFeatures };
}

async function buildPayloadSnapshot(
  dealershipId: string,
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version: string | null;
    public_slug: string;
    images: string[];
    sale_price: number | null;
    price: number;
    manufacturing_year: number;
    model_year: number;
  },
  dealership: {
    name: string;
    slug: string;
    logo_url: string | null;
    phone: string | null;
    layout_id: number | null;
  },
  watermarkEnabled: boolean,
) {
  return {
    vehicle: {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      version: vehicle.version,
      slug: vehicle.public_slug,
      price: vehicle.sale_price ?? vehicle.price,
      manufacturing_year: vehicle.manufacturing_year,
      model_year: vehicle.model_year,
      images: vehicle.images,
    },
    dealership: {
      name: dealership.name,
      slug: dealership.slug,
      logo_url: dealership.logo_url,
      phone: dealership.phone,
      layout_id: dealership.layout_id,
    },
    branding_mask: watermarkEnabled,
  };
}

export async function enqueueVehicleSocialShareAction(
  vehicleId: string,
  channels: SocialPublicationChannel[],
  triggerSource: SocialPublicationTriggerSource = "manual_share",
) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const gate = await assertSocialModule(supabase, dealershipId);
  if ("error" in gate) {
    return { error: gate.error };
  }

  if (channels.length === 0) {
    return { error: "Selecione ao menos um canal para compartilhar." };
  }

  const carouselSettings = await getDealershipSocialCarouselSettings(dealershipId);

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
      supabase
        .from("dealerships")
        .select("layout_id, name, slug, logo_url, phone")
        .eq("id", dealershipId)
        .maybeSingle(),
    ]);

  if (vehicleError || !vehicle) {
    return { error: "Veículo não encontrado." };
  }
  if (dealershipError || !dealership) {
    return { error: "Loja não encontrada." };
  }

  const { data: metaConnection } = await supabase
    .from("dealership_meta_connections")
    .select("status, instagram_business_account_id")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (metaConnection?.status !== "connected") {
    return {
      error: "Conecte Instagram e Facebook em Integrações antes de publicar.",
    };
  }

  const images = (vehicle.images as string[] | null)?.filter(Boolean) ?? [];
  if (images.length === 0) {
    return { error: "Adicione pelo menos uma foto ao veículo para publicar nas redes." };
  }

  if (
    channels.includes("instagram_feed") &&
    !metaConnection.instagram_business_account_id
  ) {
    return {
      error:
        "Conta Instagram Business não encontrada. Publique apenas no Facebook ou reconecte em Integrações.",
    };
  }

  const payloadSnapshot = await buildPayloadSnapshot(
    dealershipId,
    {
      ...vehicle,
      images,
      sale_price: vehicle.sale_price ? Number(vehicle.sale_price) : null,
      price: Number(vehicle.price),
    },
    {
      name: dealership.name,
      slug: dealership.slug,
      logo_url: dealership.logo_url ?? null,
      phone: dealership.phone ?? null,
      layout_id: dealership.layout_id,
    },
    carouselSettings.watermarkEnabled,
  );

  const { error: insertError } = await supabase.from("social_publication_jobs").insert({
    dealership_id: dealershipId,
    vehicle_id: vehicleId,
    channels,
    artifact_template: carouselSettings.artifactTemplate,
    payload_snapshot: payloadSnapshot,
    status: "queued",
    trigger_source: triggerSource,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  await dispatchSocialPublishWorker(1);

  revalidatePath(`/painel/estoque/${vehicleId}`);
  revalidatePath("/painel/estoque");

  return { success: true as const };
}

export async function previewVehicleCarouselAction(vehicleId: string) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const gate = await assertSocialModule(supabase, dealershipId);
  if ("error" in gate) {
    return { error: gate.error };
  }

  const carouselSettings = await getDealershipSocialCarouselSettings(dealershipId);

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
      supabase
        .from("dealerships")
        .select("name, slug, logo_url, phone, layout_id")
        .eq("id", dealershipId)
        .maybeSingle(),
    ]);

  if (vehicleError || !vehicle) {
    return { error: "Veículo não encontrado." };
  }
  if (dealershipError || !dealership) {
    return { error: "Loja não encontrada." };
  }

  const images = (vehicle.images as string[] | null)?.filter(Boolean) ?? [];
  if (images.length === 0) {
    return { error: "Adicione fotos ao veículo antes de gerar o preview." };
  }

  const payloadSnapshot = await buildPayloadSnapshot(
    dealershipId,
    {
      ...vehicle,
      images,
      sale_price: vehicle.sale_price ? Number(vehicle.sale_price) : null,
      price: Number(vehicle.price),
    },
    {
      name: dealership.name,
      slug: dealership.slug,
      logo_url: dealership.logo_url ?? null,
      phone: dealership.phone ?? null,
      layout_id: dealership.layout_id,
    },
    carouselSettings.watermarkEnabled,
  );

  try {
    const result = await renderSocialCarouselSlides({
      jobId: `preview-${vehicleId}`,
      dealershipId,
      artifactTemplate: carouselSettings.artifactTemplate,
      payloadSnapshot,
      previewOnly: true,
      watermarkEnabled: carouselSettings.watermarkEnabled,
    });
    return {
      success: true as const,
      imageUrls: result.imageUrls,
      slideCount: result.slideCount,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o preview do carrossel.",
    };
  }
}
