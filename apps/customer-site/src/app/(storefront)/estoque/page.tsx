import type { Metadata } from "next";

import { StorefrontInventoryPage } from "@/components/storefront/storefront-inventory-page";
import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";
import type { VehicleFilterValues } from "@/components/storefront/vehicle-filters-panel";
import { buildVehicleFilterOptions } from "@/lib/inventory/build-vehicle-filter-options";
import {
  parseInventorySearchParams,
  sortPublicVehicles,
  toRpcFilterArgs,
} from "@/lib/inventory/inventory-search-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Estoque",
  description: "Veículos disponíveis com filtros avançados.",
};

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const sp = await searchParams;
  const filters = parseInventorySearchParams(sp);

  const dealership = await getDealershipPublicRecord();
  if (!dealership) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "list_public_vehicles_filtered",
    toRpcFilterArgs(dealership.id, filters),
  );

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-red-600 dark:text-red-400">
          Não foi possível carregar o estoque: {error.message}
        </p>
      </div>
    );
  }

  const vehicles = sortPublicVehicles(
    (data ?? []) as PublicVehicleCardModel[],
    filters.sort,
  );

  const { data: catalogData } = await supabase.rpc("list_public_vehicles_filtered", {
    p_dealership_id: dealership.id,
  });

  const filterOptions = buildVehicleFilterOptions(
    ((catalogData ?? []) as PublicVehicleCardModel[]),
  );

  const filterDefaults: VehicleFilterValues = {
    brand: filters.brand,
    model: filters.model,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minYear: filters.minYear,
    maxYear: filters.maxYear,
    vehicleType: filters.vehicleType,
    minMileage: filters.minMileage,
    maxMileage: filters.maxMileage,
    fuelType: filters.fuelType,
    transmission: filters.transmission,
    color: filters.color,
    minDisplacementCc: filters.minDisplacementCc,
    maxDisplacementCc: filters.maxDisplacementCc,
    gearCount: filters.gearCount,
    sort: filters.sort,
  };

  return (
    <StorefrontInventoryPage
      vehicles={vehicles}
      totalCount={vehicles.length}
      filterDefaults={filterDefaults}
      filterOptions={filterOptions}
    />
  );
}
