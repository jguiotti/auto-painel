import { VEHICLE_FEATURE_OPTIONS } from "@autopainel/shared/lib/vehicle/vehicle-catalog-options";

export interface ParsedVehicleCatalogForm {
  version: string | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;
  body_style: string | null;
  accepts_trade: boolean;
  single_owner: boolean;
  all_revisions_done: boolean;
  factory_warranty: boolean;
  ipva_paid: boolean;
  is_licensed: boolean;
  features: string[];
}

function parseOptionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseCheckbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "true";
}

export function parseVehicleCatalogForm(formData: FormData): ParsedVehicleCatalogForm {
  const selectedFeatures = VEHICLE_FEATURE_OPTIONS.filter((feature) =>
    formData.get(`feature_${feature}`) === "true",
  );

  return {
    version: parseOptionalText(formData.get("version")),
    fuel_type: parseOptionalText(formData.get("fuel_type")),
    transmission: parseOptionalText(formData.get("transmission")),
    color: parseOptionalText(formData.get("color")),
    body_style: parseOptionalText(formData.get("body_style")),
    accepts_trade: parseCheckbox(formData, "accepts_trade"),
    single_owner: parseCheckbox(formData, "single_owner"),
    all_revisions_done: parseCheckbox(formData, "all_revisions_done"),
    factory_warranty: parseCheckbox(formData, "factory_warranty"),
    ipva_paid: parseCheckbox(formData, "ipva_paid"),
    is_licensed: parseCheckbox(formData, "is_licensed"),
    features: selectedFeatures,
  };
}

export function vehicleCatalogToDbPayload(catalog: ParsedVehicleCatalogForm) {
  return {
    version: catalog.version,
    fuel_type: catalog.fuel_type,
    transmission: catalog.transmission,
    color: catalog.color,
    body_style: catalog.body_style,
    accepts_trade: catalog.accepts_trade,
    single_owner: catalog.single_owner,
    all_revisions_done: catalog.all_revisions_done,
    factory_warranty: catalog.factory_warranty,
    ipva_paid: catalog.ipva_paid,
    is_licensed: catalog.is_licensed,
    features: catalog.features,
  };
}
