import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";

import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";

export interface VehiclePriceRangeOption {
  label: string;
  minPrice: string;
  maxPrice: string;
}

export interface VehicleDisplacementRangeOption {
  label: string;
  minDisplacementCc: string;
  maxDisplacementCc: string;
}

export interface VehicleFilterOptionSet {
  brands: string[];
  modelsByBrand: Record<string, string[]>;
  years: number[];
  priceRanges: VehiclePriceRangeOption[];
  vehicleTypes: Array<{ value: string; label: string }>;
  fuelTypes: string[];
  transmissions: string[];
  colors: string[];
  gearCounts: number[];
  displacementRanges: VehicleDisplacementRangeOption[];
}

const PRICE_RANGE_BUCKETS: VehiclePriceRangeOption[] = [
  { label: "Qualquer faixa de preço", minPrice: "", maxPrice: "" },
  { label: "Até R$ 100 mil", minPrice: "", maxPrice: "100000" },
  { label: "R$ 100 mil a R$ 300 mil", minPrice: "100000", maxPrice: "300000" },
  { label: "R$ 300 mil a R$ 700 mil", minPrice: "300000", maxPrice: "700000" },
  { label: "Acima de R$ 700 mil", minPrice: "700000", maxPrice: "" },
];

const DISPLACEMENT_RANGE_BUCKETS: VehicleDisplacementRangeOption[] = [
  { label: "Qualquer cilindrada", minDisplacementCc: "", maxDisplacementCc: "" },
  { label: "Até 150 cc", minDisplacementCc: "", maxDisplacementCc: "150" },
  { label: "150 a 300 cc", minDisplacementCc: "150", maxDisplacementCc: "300" },
  { label: "300 a 600 cc", minDisplacementCc: "300", maxDisplacementCc: "600" },
  { label: "600 a 1.000 cc", minDisplacementCc: "600", maxDisplacementCc: "1000" },
  { label: "Acima de 1.000 cc", minDisplacementCc: "1000", maxDisplacementCc: "" },
];

export function buildVehicleFilterOptions(
  vehicles: PublicVehicleCardModel[],
): VehicleFilterOptionSet {
  const brandSet = new Set<string>();
  const modelsByBrand = new Map<string, Set<string>>();
  const yearSet = new Set<number>();
  const vehicleTypeSet = new Set<string>();
  const fuelTypeSet = new Set<string>();
  const transmissionSet = new Set<string>();
  const colorSet = new Set<string>();
  const gearCountSet = new Set<number>();

  vehicles.forEach((vehicle) => {
    const brand = vehicle.brand.trim();
    const model = vehicle.model.trim();
    if (brand) {
      brandSet.add(brand);
      const models = modelsByBrand.get(brand) ?? new Set<string>();
      if (model) {
        models.add(model);
      }
      modelsByBrand.set(brand, models);
    }
    if (vehicle.vehicle_type?.trim()) {
      vehicleTypeSet.add(vehicle.vehicle_type.trim());
    }
    if (vehicle.fuel_type?.trim()) {
      fuelTypeSet.add(vehicle.fuel_type.trim());
    }
    if (vehicle.transmission?.trim()) {
      transmissionSet.add(vehicle.transmission.trim());
    }
    if (vehicle.color?.trim()) {
      colorSet.add(vehicle.color.trim());
    }
    if (typeof vehicle.gear_count === "number" && vehicle.gear_count > 0) {
      gearCountSet.add(vehicle.gear_count);
    }
    yearSet.add(vehicle.model_year);
    yearSet.add(vehicle.manufacturing_year);
  });

  const brands = Array.from(brandSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const modelsRecord: Record<string, string[]> = {};
  brands.forEach((brand) => {
    modelsRecord[brand] = Array.from(modelsByBrand.get(brand) ?? []).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  });

  const years = Array.from(yearSet)
    .filter((year) => year > 1980)
    .sort((a, b) => b - a);

  const vehicleTypes = Array.from(vehicleTypeSet)
    .sort((a, b) =>
      resolveVehicleTypeLabel(a).localeCompare(resolveVehicleTypeLabel(b), "pt-BR"),
    )
    .map((value) => ({
      value,
      label: resolveVehicleTypeLabel(value),
    }));

  const hasDisplacement = vehicles.some(
    (vehicle) => typeof vehicle.displacement_cc === "number" && vehicle.displacement_cc > 0,
  );

  return {
    brands,
    modelsByBrand: modelsRecord,
    years,
    priceRanges: PRICE_RANGE_BUCKETS,
    vehicleTypes,
    fuelTypes: Array.from(fuelTypeSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
    transmissions: Array.from(transmissionSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
    colors: Array.from(colorSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
    gearCounts: Array.from(gearCountSet).sort((a, b) => a - b),
    displacementRanges: hasDisplacement ? DISPLACEMENT_RANGE_BUCKETS : [],
  };
}

function buildDisplacementRangeValue(minDisplacementCc: string, maxDisplacementCc: string): string {
  return `${minDisplacementCc}|${maxDisplacementCc}`;
}

export function parseDisplacementRangeValue(value: string): {
  minDisplacementCc: string;
  maxDisplacementCc: string;
} {
  const [minDisplacementCc = "", maxDisplacementCc = ""] = value.split("|");
  return { minDisplacementCc, maxDisplacementCc };
}

export { buildDisplacementRangeValue };
