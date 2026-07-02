import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getEnabledClassifiedsProviders,
  isClassifiedsProviderModuleEnabled,
  isDealershipFeatureEnabled,
  isSaleReceiptModuleEnabled,
  type ClassifiedsProvider,
} from "@autopainel/shared/lib/dealership-features";
import {
  resolveDealershipStorefrontPublicUrl,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";
import { Button } from "@autopainel/shared/ui";

import { VehicleDetailPanel, type VehicleDetailRecord } from "@/components/inventory/vehicle-detail-panel";
import {
  artifactTemplateLabel,
  getDealershipSocialCarouselSettings,
} from "@/lib/data/dealership-social-carousel-settings";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

interface VehicleViewPageProps {
  params: Promise<{ vehicleId: string }>;
}

function resolveStorefrontUrl(slug: string): string {
  return resolveDealershipStorefrontPublicUrl(slug);
}

function parseSocialPublicationJob(row: {
  id: string;
  status: string;
  channels: string[] | null;
  error_detail: string | null;
  published_at: string | null;
  created_at: string;
  step_payload: unknown;
  result_payload: unknown;
}) {
  const stepPayload =
    row.step_payload && typeof row.step_payload === "object"
      ? (row.step_payload as Record<string, unknown>)
      : null;
  const resultPayload =
    row.result_payload && typeof row.result_payload === "object"
      ? (row.result_payload as Record<string, unknown>)
      : null;

  const rawSlideUrls = stepPayload?.rendered_image_urls;
  const slideUrls = Array.isArray(rawSlideUrls)
    ? rawSlideUrls.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];

  const slideCount =
    typeof stepPayload?.slide_count === "number"
      ? stepPayload.slide_count
      : typeof resultPayload?.rendered_slide_count === "number"
        ? resultPayload.rendered_slide_count
        : slideUrls.length || null;

  const facebookResult = resultPayload?.facebook_page;
  const instagramResult = resultPayload?.instagram_feed;
  const facebookPostId =
    facebookResult &&
    typeof facebookResult === "object" &&
    typeof (facebookResult as { postId?: unknown }).postId === "string"
      ? (facebookResult as { postId: string }).postId
      : null;
  const instagramPostId =
    instagramResult &&
    typeof instagramResult === "object" &&
    typeof (instagramResult as { postId?: unknown }).postId === "string"
      ? (instagramResult as { postId: string }).postId
      : null;

  return {
    id: row.id,
    status: row.status,
    channels: (row.channels as string[]) ?? [],
    errorDetail: row.error_detail,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    slideUrls,
    slideCount,
    facebookPostId,
    instagramPostId,
  };
}

export default async function VehicleViewPage({ params }: VehicleViewPageProps) {
  const { vehicleId } = await params;
  const { supabase, dealershipId } = await requireDashboardSession(`/painel/estoque/${vehicleId}`);

  const [
    vehicleResult,
    dealershipResult,
    unitsResult,
    metaResult,
    featuresResult,
    listingsResult,
    jobsResult,
    classifiedConnectionsResult,
    socialJobsResult,
    carouselSettings,
    saleReceiptResult,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
    supabase.from("dealerships").select("slug").eq("id", dealershipId).maybeSingle(),
    supabase
      .from("dealership_units")
      .select("id, name")
      .eq("dealership_id", dealershipId),
    supabase
      .from("dealership_meta_connections")
      .select("status, instagram_business_account_id")
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
    supabase.rpc("effective_feature_keys_for_active_dealership", {
      p_dealership_id: dealershipId,
    }),
    supabase
      .from("vehicle_classifieds_listings")
      .select("provider, sync_status, last_synced_at, last_error, external_listing_url")
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId),
    supabase
      .from("classifieds_sync_jobs")
      .select("provider, action, status, last_error, created_at")
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("dealership_classifieds_connections")
      .select("provider, status")
      .eq("dealership_id", dealershipId),
    supabase
      .from("social_publication_jobs")
      .select(
        "id, status, channels, error_detail, published_at, created_at, step_payload, result_payload",
      )
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false })
      .limit(5),
    getDealershipSocialCarouselSettings(dealershipId),
    supabase
      .from("vehicle_sale_receipts")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
  ]);

  const vehicle = vehicleResult.data;
  if (!vehicle) {
    notFound();
  }

  const unitName =
    unitsResult.data?.find((unit) => unit.id === vehicle.dealership_unit_id)?.name ?? null;

  const activeFeatures = Array.isArray(featuresResult.data)
    ? featuresResult.data.filter((entry): entry is string => typeof entry === "string")
    : [];

  const record: VehicleDetailRecord = {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? null,
    vehicle_type: vehicle.vehicle_type,
    vehicle_type_custom: vehicle.vehicle_type_custom,
    public_slug: vehicle.public_slug,
    manufacturing_year: vehicle.manufacturing_year,
    model_year: vehicle.model_year,
    mileage: vehicle.mileage,
    fipe_price: vehicle.fipe_price ? Number(vehicle.fipe_price) : null,
    sale_price: vehicle.sale_price ? Number(vehicle.sale_price) : null,
    price: Number(vehicle.price),
    description: vehicle.description,
    status: vehicle.status,
    is_featured: Boolean(vehicle.is_featured),
    is_active: vehicle.is_active !== false,
    images: (vehicle.images as string[] | null) ?? [],
    fuel_type: vehicle.fuel_type ?? null,
    transmission: vehicle.transmission ?? null,
    color: vehicle.color ?? null,
    body_style: vehicle.body_style ?? null,
    accepts_trade: Boolean(vehicle.accepts_trade),
    single_owner: Boolean(vehicle.single_owner),
    all_revisions_done: Boolean(vehicle.all_revisions_done),
    factory_warranty: Boolean(vehicle.factory_warranty),
    ipva_paid: Boolean(vehicle.ipva_paid),
    is_licensed: Boolean(vehicle.is_licensed),
    features: (vehicle.features as string[] | null) ?? [],
    unit_name: unitName,
    gear_count: vehicle.gear_count ?? null,
    displacement_cc: vehicle.displacement_cc ?? null,
    engine_type: vehicle.engine_type ?? null,
    cooling_type: vehicle.cooling_type ?? null,
    motorcycle_style: vehicle.motorcycle_style ?? null,
    starter_type: vehicle.starter_type ?? null,
    brake_front: vehicle.brake_front ?? null,
    brake_rear: vehicle.brake_rear ?? null,
    fuel_system: vehicle.fuel_system ?? null,
    traction: vehicle.traction ?? null,
    axle_count: vehicle.axle_count ?? null,
    gross_weight_kg: vehicle.gross_weight_kg ?? null,
    passenger_capacity: vehicle.passenger_capacity ?? null,
    cab_type: vehicle.cab_type ?? null,
    body_truck_type: vehicle.body_truck_type ?? null,
  };

  const slug = dealershipResult.data?.slug ?? "";

  const classifiedsListings =
    listingsResult.data
      ?.filter(
        (row): row is {
          provider: ClassifiedsProvider;
          sync_status: "pending" | "published" | "delisted" | "error";
          last_synced_at: string | null;
          last_error: string | null;
          external_listing_url: string | null;
        } =>
          (row.provider === "olx" || row.provider === "webmotors") &&
          isClassifiedsProviderModuleEnabled(activeFeatures, row.provider as ClassifiedsProvider),
      )
      .map((row) => ({
        provider: row.provider,
        syncStatus: row.sync_status,
        lastSyncedAt: row.last_synced_at,
        lastError: row.last_error,
        externalListingUrl: row.external_listing_url,
      })) ?? [];

  const classifiedsRecentJobs =
    jobsResult.data
      ?.filter(
        (row): row is {
          provider: ClassifiedsProvider;
          action: "publish" | "delist";
          status: string;
          last_error: string | null;
          created_at: string;
        } =>
          (row.provider === "olx" || row.provider === "webmotors") &&
          (row.action === "publish" || row.action === "delist"),
      )
      .map((row) => ({
        provider: row.provider,
        action: row.action,
        status: row.status,
        lastError: row.last_error,
      })) ?? [];

  const classifiedsConnectedProviders =
    classifiedConnectionsResult.data
      ?.filter((row) => row.status === "connected")
      .map((row) => row.provider)
      .filter((provider): provider is ClassifiedsProvider =>
        (provider === "olx" || provider === "webmotors") &&
        isClassifiedsProviderModuleEnabled(activeFeatures, provider as ClassifiedsProvider),
      ) ?? [];

  const socialRecentJobs =
    socialJobsResult.data?.map((row) => parseSocialPublicationJob(row)) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/painel/estoque">← Estoque</Link>
        </Button>
      </div>
      <VehicleDetailPanel
        vehicle={record}
        storefrontUrl={resolveStorefrontUrl(slug)}
        socialShareEnabled={isDealershipFeatureEnabled(activeFeatures, "social_media_kit")}
        metaConnected={metaResult.data?.status === "connected"}
        hasInstagramBusiness={Boolean(metaResult.data?.instagram_business_account_id)}
        artifactTemplateLabel={artifactTemplateLabel(carouselSettings.artifactTemplate)}
        socialRecentJobs={socialRecentJobs}
        isQrGeneratorEnabled={isDealershipFeatureEnabled(activeFeatures, "qr_generator")}
        enabledClassifiedProviders={getEnabledClassifiedsProviders(activeFeatures)}
        classifiedsConnectedProviders={classifiedsConnectedProviders}
        classifiedsListings={classifiedsListings}
        classifiedsRecentJobs={classifiedsRecentJobs}
        isSaleReceiptEnabled={isSaleReceiptModuleEnabled(activeFeatures)}
        hasSaleReceipt={Boolean(saleReceiptResult.data?.id)}
      />
    </div>
  );
}
