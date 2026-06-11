import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getEnabledClassifiedsProviders,
  isAnyClassifiedsModuleEnabled,
  isDealershipFeatureEnabled,
  type ClassifiedsProvider,
} from "@autopainel/shared/lib/dealership-features";

import type { VehiclePromotionConfig } from "@/components/inventory/vehicle-promotion-section";

export async function getVehicleFormPromotionConfig(params: {
  supabase: SupabaseClient;
  dealershipId: string;
}): Promise<VehiclePromotionConfig | undefined> {
  const [featuresRes, metaRes, classifiedConnectionsRes] = await Promise.all([
    params.supabase.rpc("effective_feature_keys_for_active_dealership", {
      p_dealership_id: params.dealershipId,
    }),
    params.supabase
      .from("dealership_meta_connections")
      .select("status, instagram_business_account_id")
      .eq("dealership_id", params.dealershipId)
      .maybeSingle(),
    params.supabase
      .from("dealership_classifieds_connections")
      .select("provider, status")
      .eq("dealership_id", params.dealershipId),
  ]);

  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter(
        (entry: unknown): entry is string => typeof entry === "string",
      )
    : [];

  const socialEnabled = isDealershipFeatureEnabled(activeFeatures, "social_media_kit");
  const enabledClassifiedProviders = getEnabledClassifiedsProviders(activeFeatures);

  if (!socialEnabled && !isAnyClassifiedsModuleEnabled(activeFeatures)) {
    return undefined;
  }

  const connectedProviders =
    classifiedConnectionsRes.data
      ?.filter((row) => row.status === "connected")
      .map((row) => row.provider)
      .filter((provider): provider is ClassifiedsProvider =>
        enabledClassifiedProviders.includes(provider as ClassifiedsProvider),
      ) ?? [];

  return {
    socialEnabled,
    metaConnected: metaRes.data?.status === "connected",
    hasInstagramBusiness: Boolean(metaRes.data?.instagram_business_account_id),
    enabledClassifiedProviders,
    connectedProviders,
  };
}
