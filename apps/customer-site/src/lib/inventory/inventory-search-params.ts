import type {
  CountPublicVehiclesFilteredArgs,
  ListPublicVehiclesFilteredArgs,
} from "@autopainel/shared/types";

import type { VehicleFilterValues } from "@/components/storefront/vehicle-filters-panel";
import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";

export const STOREFRONT_INVENTORY_PAGE_SIZE = 12;

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
  page: number;
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

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
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
    page: parsePositiveInt(str("page"), 1),
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

export function toRpcCountArgs(
  dealershipId: string,
  filters: ParsedInventorySearchParams,
): CountPublicVehiclesFilteredArgs {
  return toRpcFilterArgs(dealershipId, filters);
}

export function toRpcPagedListArgs(
  dealershipId: string,
  filters: ParsedInventorySearchParams,
): ListPublicVehiclesFilteredArgs {
  const offset = (filters.page - 1) * STOREFRONT_INVENTORY_PAGE_SIZE;
  return {
    ...toRpcFilterArgs(dealershipId, filters),
    p_limit: STOREFRONT_INVENTORY_PAGE_SIZE,
    p_offset: offset,
    p_sort: filters.sort,
  };
}

export function buildStorefrontInventoryQueryString(
  filters: ParsedInventorySearchParams,
): string {
  const search = new URLSearchParams();
  if (filters.brand) search.set("brand", filters.brand);
  if (filters.model) search.set("model", filters.model);
  if (filters.minPrice) search.set("minPrice", filters.minPrice);
  if (filters.maxPrice) search.set("maxPrice", filters.maxPrice);
  if (filters.minYear) search.set("minYear", filters.minYear);
  if (filters.maxYear) search.set("maxYear", filters.maxYear);
  if (filters.vehicleType) search.set("vehicleType", filters.vehicleType);
  if (filters.minMileage) search.set("minMileage", filters.minMileage);
  if (filters.maxMileage) search.set("maxMileage", filters.maxMileage);
  if (filters.fuelType) search.set("fuelType", filters.fuelType);
  if (filters.transmission) search.set("transmission", filters.transmission);
  if (filters.color) search.set("color", filters.color);
  if (filters.minDisplacementCc) search.set("minDisplacementCc", filters.minDisplacementCc);
  if (filters.maxDisplacementCc) search.set("maxDisplacementCc", filters.maxDisplacementCc);
  if (filters.gearCount) search.set("gearCount", filters.gearCount);
  if (filters.sort !== "newest") search.set("sort", filters.sort);
  if (filters.page > 1) search.set("page", String(filters.page));
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

/** @deprecated Sort is applied server-side via RPC when paginating. */
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
