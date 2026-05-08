import "server-only";

import { buildDealershipPublicVehicleUrl } from "@autopainel/shared/lib/dealership-public-url";
import {
  resolveDealershipBranding,
  resolveDealershipLogoUrl,
} from "@autopainel/shared/lib/theme/branding";
import { headers } from "next/headers";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { formatBrl } from "@/lib/format/format-brl";

export interface VehicleQrPrintPayload {
  vehicleId: string;
  publicVehicleUrl: string;
  dealershipName: string;
  dealershipLogoUrl: string | null;
  dealershipPrimaryColor: string;
  dealershipAccentColor: string;
  vehicleTitle: string;
  vehicleSubtitle: string;
  vehiclePriceFormatted: string;
  ctaText: string;
}

export type VehicleQrPrintPayloadResult =
  | { payload: VehicleQrPrintPayload; error?: never }
  | { payload?: never; error: string };

export async function getVehicleQrPrintPayload(
  vehicleId: string,
): Promise<VehicleQrPrintPayloadResult> {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}/qr`,
  );

  const { data: featureKeys, error: featureError } = await supabase.rpc(
    "effective_feature_keys_for_active_dealership",
    {
      p_dealership_id: dealershipId,
    },
  );
  if (featureError) {
    return { error: "Não foi possível validar os módulos ativos da concessionária." };
  }

  const hasQrGenerator = Array.isArray(featureKeys)
    ? featureKeys.includes("qr_generator")
    : false;
  if (!hasQrGenerator) {
    return { error: "O módulo Gerador de QR Code não está habilitado no seu plano." };
  }

  const [{ data: vehicle, error: vehicleError }, { data: dealership, error: dealershipError }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select(
          "id, brand, model, manufacturing_year, model_year, price, public_slug, status",
        )
        .eq("id", vehicleId)
        .eq("dealership_id", dealershipId)
        .single(),
      supabase
        .from("dealerships")
        .select("name, slug, custom_domain, logo_url, theme_settings")
        .eq("id", dealershipId)
        .single(),
    ]);

  if (vehicleError || !vehicle) {
    return { error: "Veículo não encontrado para esta concessionária." };
  }
  if (vehicle.status !== "available") {
    return { error: "Somente veículos disponíveis podem gerar QR Code." };
  }
  if (dealershipError || !dealership) {
    return { error: "Concessionária não encontrada para gerar a lâmina de QR." };
  }

  const headerList = await headers();
  const requestHost = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const requestProto = headerList.get("x-forwarded-proto") ?? "https";
  const requestOrigin = requestHost ? `${requestProto}://${requestHost}` : null;

  const publicVehicleUrl = buildDealershipPublicVehicleUrl({
    customDomain: dealership.custom_domain,
    dealershipSlug: dealership.slug,
    platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
    requestOrigin,
    publicSlug: vehicle.public_slug,
  });

  const branding = resolveDealershipBranding({
    theme_settings: dealership.theme_settings,
    theme_config: null,
  });
  const dealershipLogoUrl = resolveDealershipLogoUrl(null, dealership.logo_url);

  return {
    payload: {
      vehicleId: vehicle.id,
      publicVehicleUrl,
      dealershipName: dealership.name,
      dealershipLogoUrl,
      dealershipPrimaryColor: branding.primary,
      dealershipAccentColor: branding.accent,
      vehicleTitle: `${vehicle.brand} ${vehicle.model}`,
      vehicleSubtitle: `${vehicle.manufacturing_year}/${vehicle.model_year}`,
      vehiclePriceFormatted: formatBrl(Number(vehicle.price)),
      ctaText: "Escaneie para ver detalhes e simular financiamento",
    },
  };
}
