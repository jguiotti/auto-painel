import Link from "next/link";
import { notFound } from "next/navigation";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import {
  buildDealershipSubdomainSurfaceUrls,
  buildLocalhostDealershipPreviewUrls,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";
import { Button } from "@autopainel/shared/ui";

import { VehicleDetailPanel, type VehicleDetailRecord } from "@/components/inventory/vehicle-detail-panel";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

interface VehicleViewPageProps {
  params: Promise<{ vehicleId: string }>;
}

function resolveStorefrontUrl(slug: string): string {
  const canonical = buildDealershipSubdomainSurfaceUrls(slug);
  if (canonical?.storefrontUrl) {
    return canonical.storefrontUrl;
  }
  return buildLocalhostDealershipPreviewUrls(slug)?.storefrontUrl ?? "/";
}

function artifactTemplateLabel(layoutId: number | null | undefined): string {
  if (layoutId === 2) {
    return "Performance / Bold";
  }
  if (layoutId === 3) {
    return "Tech / Modern";
  }
  return "Classic / Clean";
}

export default async function VehicleViewPage({ params }: VehicleViewPageProps) {
  const { vehicleId } = await params;
  const { supabase, dealershipId } = await requireDashboardSession(`/painel/estoque/${vehicleId}`);

  const [vehicleResult, dealershipResult, unitsResult, metaResult, featuresResult] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .eq("dealership_id", dealershipId)
        .maybeSingle(),
      supabase.from("dealerships").select("slug, layout_id").eq("id", dealershipId).maybeSingle(),
      supabase
        .from("dealership_units")
        .select("id, name")
        .eq("dealership_id", dealershipId),
      supabase
        .from("dealership_meta_connections")
        .select("status")
        .eq("dealership_id", dealershipId)
        .maybeSingle(),
      supabase.rpc("effective_feature_keys_for_active_dealership", {
        p_dealership_id: dealershipId,
      }),
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
  const layoutId = dealershipResult.data?.layout_id;

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
        artifactTemplateLabel={artifactTemplateLabel(layoutId)}
        isQrGeneratorEnabled={isDealershipFeatureEnabled(activeFeatures, "qr_generator")}
      />
    </div>
  );
}
