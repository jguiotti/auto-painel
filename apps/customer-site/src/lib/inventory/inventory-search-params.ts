import type { ListPublicVehiclesFilteredArgs } from "@autopainel/shared/types";

import type { VehicleFilterValues } from "@/components/storefront/vehicle-filters-panel";
import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";

export type InventorySortKey =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "mileage_asc";

export interface ParsedInventorySearchParams extends VehicleFilterValues {
  minMileage: string;
  maxMileage: string;
  sort: InventorySortKey;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n;
}

function parseOptionalInt(value: string | undefined): number | null {
  const n = parseOptionalNumber(value);
  if (n === null) {
    return null;
  }
  return Math.trunc(n);
}

function parseSort(value: string | undefined): InventorySortKey {
  if (
    value === "price_asc" ||
    value === "price_desc" ||
    value === "year_desc" ||
    value === "mileage_asc"
  ) {
    return value;
  }
  return "newest";
}

export function parseInventorySearchParams(
  sp: Record<string, string | string[] | undefined>,
): ParsedInventorySearchParams {
  const str = (key: string) => {
    const value = sp[key];
    return typeof value === "string" ? value : undefined;
  };

  return {
    brand: str("brand") ?? "",
    model: str("model") ?? "",
    minPrice: str("minPrice") ?? "",
    maxPrice: str("maxPrice") ?? "",
    minYear: str("minYear") ?? "",
    maxYear: str("maxYear") ?? "",
    vehicleType: str("vehicleType") ?? "",
    minMileage: str("minMileage") ?? "",
    maxMileage: str("maxMileage") ?? "",
    fuelType: str("fuelType") ?? "",
    transmission: str("transmission") ?? "",
    color: str("color") ?? "",
    minDisplacementCc: str("minDisplacementCc") ?? "",
    maxDisplacementCc: str("maxDisplacementCc") ?? "",
    gearCount: str("gearCount") ?? "",
    sort: parseSort(str("sort")),
  };
}

export function toRpcFilterArgs(
  dealershipId: string,
  filters: ParsedInventorySearchParams,
): ListPublicVehiclesFilteredArgs {
  return {
    p_dealership_id: dealershipId,
    p_brand: filters.brand.trim() || null,
    p_model: filters.model.trim() || null,
    p_min_price: parseOptionalNumber(filters.minPrice),
    p_max_price: parseOptionalNumber(filters.maxPrice),
    p_min_year: parseOptionalInt(filters.minYear),
    p_max_year: parseOptionalInt(filters.maxYear),
    p_vehicle_type: filters.vehicleType.trim() || null,
    p_min_mileage: parseOptionalInt(filters.minMileage),
    p_max_mileage: parseOptionalInt(filters.maxMileage),
    p_fuel_type: filters.fuelType.trim() || null,
    p_transmission: filters.transmission.trim() || null,
    p_color: filters.color.trim() || null,
    p_min_displacement_cc: parseOptionalInt(filters.minDisplacementCc),
    p_max_displacement_cc: parseOptionalInt(filters.maxDisplacementCc),
    p_gear_count: parseOptionalInt(filters.gearCount),
  };
}

export function sortPublicVehicles(
  vehicles: PublicVehicleCardModel[],
  sort: InventorySortKey,
): PublicVehicleCardModel[] {
  const copy = [...vehicles];
  copy.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return Number(a.price) - Number(b.price);
      case "price_desc":
        return Number(b.price) - Number(a.price);
      case "year_desc":
        return b.model_year - a.model_year;
      case "mileage_asc":
        return a.mileage - b.mileage;
      case "newest":
      default:
        return 0;
    }
  });
  return copy;
}
