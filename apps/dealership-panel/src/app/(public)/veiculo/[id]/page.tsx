import { notFound, redirect } from "next/navigation";

import { resolveDealershipStorefrontPublicUrl } from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LegacyPublicVehicleRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyPublicVehicleRedirect({
  params,
}: LegacyPublicVehicleRedirectProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    redirect("/erro/concessionaria");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: dealershipRows }, { data: vehicleRows }] = await Promise.all([
    supabase.rpc("get_dealership_public_by_id", { p_id: dealershipId }),
    supabase.rpc("get_public_vehicle_by_id", {
      p_vehicle_id: id,
      p_dealership_id: dealershipId,
    }),
  ]);

  const dealership = Array.isArray(dealershipRows) ? dealershipRows[0] : null;
  const vehicle = Array.isArray(vehicleRows) ? vehicleRows[0] : null;
  const slug = typeof dealership?.slug === "string" ? dealership.slug : null;
  const publicSlug =
    vehicle && typeof vehicle.public_slug === "string" ? vehicle.public_slug : null;

  if (!slug || !publicSlug) {
    notFound();
  }

  const storefrontBase = resolveDealershipStorefrontPublicUrl(slug).replace(/\/$/, "");
  redirect(`${storefrontBase}/veiculo/${publicSlug}`);
}
