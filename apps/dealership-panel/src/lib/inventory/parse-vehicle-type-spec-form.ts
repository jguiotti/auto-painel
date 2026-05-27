import type { VehicleTypeSpecFields } from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";

function parseOptionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }
  const parsed = Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

export function parseVehicleTypeSpecForm(formData: FormData): VehicleTypeSpecFields {
  return {
    gear_count: parseOptionalInt(formData.get("gear_count")),
    displacement_cc: parseOptionalInt(formData.get("displacement_cc")),
    engine_type: parseOptionalText(formData.get("engine_type")),
    cooling_type: parseOptionalText(formData.get("cooling_type")),
    motorcycle_style: parseOptionalText(formData.get("motorcycle_style")),
    starter_type: parseOptionalText(formData.get("starter_type")),
    brake_front: parseOptionalText(formData.get("brake_front")),
    brake_rear: parseOptionalText(formData.get("brake_rear")),
    fuel_system: parseOptionalText(formData.get("fuel_system")),
    traction: parseOptionalText(formData.get("traction")),
    axle_count: parseOptionalInt(formData.get("axle_count")),
    gross_weight_kg: parseOptionalInt(formData.get("gross_weight_kg")),
    passenger_capacity: parseOptionalInt(formData.get("passenger_capacity")),
    cab_type: parseOptionalText(formData.get("cab_type")),
    body_truck_type: parseOptionalText(formData.get("body_truck_type")),
  };
}

export function vehicleTypeSpecToDbPayload(specs: VehicleTypeSpecFields) {
  return { ...specs };
}
