import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";
import { buildVehicleFilterOptions } from "@/lib/inventory/build-vehicle-filter-options";
import {
  parseInventorySearchParams,
  STOREFRONT_INVENTORY_PAGE_SIZE,
  toRpcCountArgs,
  toRpcPagedListArgs,
} from "@/lib/inventory/inventory-search-params";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { StorefrontInventoryPage } from "@/components/storefront/storefront-inventory-page";
import type { VehicleFilterValues } from "@/components/storefront/vehicle-filters-panel";
import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";

interface EstoquePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const sp = await searchParams;
  const filters = parseInventorySearchParams(sp);

  const dealership = await getDealershipPublicRecord();
  if (!dealership) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const listArgs = toRpcPagedListArgs(dealership.id, filters);
  const countArgs = toRpcCountArgs(dealership.id, filters);

  const [{ data, error }, { data: totalCountRaw, error: countError }, { data: catalogData }] =
    await Promise.all([
      supabase.rpc("list_public_vehicles_filtered", listArgs),
      supabase.rpc("count_public_vehicles_filtered", countArgs),
      supabase.rpc("list_public_vehicles_filtered", {
        p_dealership_id: dealership.id,
      }),
    ]);

  if (error || countError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-red-600 dark:text-red-400">
          Não foi possível carregar o estoque: {error?.message ?? countError?.message}
        </p>
      </div>
    );
  }

  const vehicles = (data ?? []) as PublicVehicleCardModel[];
  const totalCount = Number(totalCountRaw ?? vehicles.length);
  const pageCount = Math.max(1, Math.ceil(totalCount / STOREFRONT_INVENTORY_PAGE_SIZE));
  const safePage = Math.min(filters.page, pageCount);
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
      totalCount={totalCount}
      page={safePage}
      pageCount={pageCount}
      pageSize={STOREFRONT_INVENTORY_PAGE_SIZE}
      filterDefaults={filterDefaults}
      filterOptions={filterOptions}
      searchFilters={filters}
    />
  );
}
