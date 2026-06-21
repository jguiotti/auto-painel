import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";

const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface PublicVehicleSeoRecord {
  brand: string;
  model: string;
  version?: string | null;
  model_year: number;
  price: number;
  description?: string | null;
  images?: string[] | null;
  public_slug: string;
}

export async function fetchPublicVehicleForSeo(
  slug: string,
): Promise<PublicVehicleSeoRecord | null> {
  if (!PUBLIC_SLUG_RE.test(slug)) {
    return null;
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_vehicle_by_slug", {
    p_dealership_id: dealershipId,
    p_public_slug: slug,
  });

  const vehicle = Array.isArray(data) ? data[0] : null;
  if (!vehicle) {
    return null;
  }

  return vehicle as PublicVehicleSeoRecord;
}
