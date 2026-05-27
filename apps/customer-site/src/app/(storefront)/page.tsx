import { StorefrontHomeLayout } from "@/components/storefront/storefront-home-layout";
import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export default async function HomePage() {
  const dealership = await getDealershipPublicRecord();
  if (!dealership) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_public_vehicles_filtered", {
    p_dealership_id: dealership.id,
    p_brand: null,
    p_model: null,
    p_min_price: null,
    p_max_price: null,
    p_min_year: null,
    p_max_year: null,
    p_vehicle_type: null,
    p_min_mileage: null,
    p_max_mileage: null,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-red-600 dark:text-red-400">
          Não foi possível carregar o estoque: {error.message}
        </p>
      </div>
    );
  }

  const vehicles = (data ?? []) as PublicVehicleCardModel[];

  return (
    <StorefrontHomeLayout
      layoutId={dealership.layout_id}
      vehicles={vehicles}
      totalCount={vehicles.length}
    />
  );
}
