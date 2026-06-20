import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { VehicleDetailLayout } from "@/components/storefront/vehicle-detail-layout";
import { getPlatformFinanceMonthlyRatePercent } from "@/lib/finance/get-platform-finance-rate";
import { buildVehiclePageMetadata } from "@/lib/seo/build-vehicle-page-metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";

const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function resolveVehiclePageUrl(slug: string): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  if (!host) {
    return `/veiculo/${slug}`;
  }

  const protocol =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${protocol}://${host}/veiculo/${slug}`;
}

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!PUBLIC_SLUG_RE.test(slug)) {
    return { title: "Veículo" };
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    return { title: "Veículo" };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_vehicle_by_slug", {
    p_dealership_id: dealershipId,
    p_public_slug: slug,
  });

  const vehicle = Array.isArray(data) ? data[0] : null;
  if (!vehicle) {
    return { title: "Veículo" };
  }

  const pageUrl = await resolveVehiclePageUrl(slug);
  return buildVehiclePageMetadata(vehicle, pageUrl);
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params;
  if (!PUBLIC_SLUG_RE.test(slug)) {
    notFound();
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_vehicle_by_slug", {
    p_dealership_id: dealershipId,
    p_public_slug: slug,
  });

  if (error || !data?.length) {
    notFound();
  }

  const vehicle = data[0];
  const monthlyRatePercent = await getPlatformFinanceMonthlyRatePercent();

  void supabase
    .from("vehicle_view_events")
    .insert({
      dealership_id: dealershipId,
      vehicle_id: vehicle.id,
      source: "customer_site",
    })
    .then(({ error: viewEventError }) => {
      if (viewEventError) {
        console.error("vehicle_view_events insert failed", viewEventError.message);
      }
    });

  return (
    <VehicleDetailLayout vehicle={vehicle} monthlyRatePercent={monthlyRatePercent} />
  );
}
