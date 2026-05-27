export interface VehicleTypeSpecFields {
  gear_count: number | null;
  displacement_cc: number | null;
  engine_type: string | null;
  cooling_type: string | null;
  motorcycle_style: string | null;
  starter_type: string | null;
  brake_front: string | null;
  brake_rear: string | null;
  fuel_system: string | null;
  traction: string | null;
  axle_count: number | null;
  gross_weight_kg: number | null;
  passenger_capacity: number | null;
  cab_type: string | null;
  body_truck_type: string | null;
}

export const MOTORCYCLE_ENGINE_TYPE_OPTIONS = [
  "2 tempos",
  "4 tempos",
  "Elétrico",
] as const;

export const COOLING_TYPE_OPTIONS = ["Ar", "Líquido"] as const;

export const MOTORCYCLE_STYLE_OPTIONS = [
  "Street",
  "Sport",
  "Trail",
  "Scooter",
  "Custom",
  "Naked",
  "Touring",
] as const;

export const STARTER_TYPE_OPTIONS = ["Elétrica", "Pedal"] as const;

export const BRAKE_TYPE_OPTIONS = ["Disco", "Tambor"] as const;

export const FUEL_SYSTEM_OPTIONS = [
  "Injeção eletrônica",
  "Carburador",
] as const;

export const TRACTION_OPTIONS = [
  "4x2",
  "4x4",
  "AWD",
  "6x2",
  "6x4",
  "8x2",
] as const;

export const CAB_TYPE_OPTIONS = [
  "Simples",
  "Leito",
  "Dupla",
] as const;

export const BODY_TRUCK_TYPE_OPTIONS = [
  "Baú",
  "Graneleiro",
  "Caçamba",
  "Prancha",
  "Tanque",
  "Frigorífico",
  "Outro",
] as const;

export type VehicleTypeSpecCategory =
  | "motorcycle"
  | "heavy"
  | "passenger_commercial"
  | "light";

export function resolveVehicleTypeSpecCategory(
  vehicleType: string,
): VehicleTypeSpecCategory {
  switch (vehicleType) {
    case "motocicleta":
      return "motorcycle";
    case "caminhao":
      return "heavy";
    case "onibus":
    case "van":
      return "passenger_commercial";
    default:
      return "light";
  }
}

export function buildVehicleTypeSpecDisplayItems(
  vehicleType: string,
  specs: Partial<VehicleTypeSpecFields>,
): Array<{ label: string; value: string }> {
  const category = resolveVehicleTypeSpecCategory(vehicleType);
  const items: Array<{ label: string; value: string }> = [];

  if (specs.displacement_cc) {
    items.push({
      label: "Cilindrada",
      value: `${specs.displacement_cc.toLocaleString("pt-BR")} cc`,
    });
  }
  if (specs.gear_count) {
    items.push({ label: "Marchas", value: String(specs.gear_count) });
  }
  if (specs.engine_type) {
    items.push({ label: "Tipo de motor", value: specs.engine_type });
  }
  if (specs.cooling_type) {
    items.push({ label: "Refrigeração", value: specs.cooling_type });
  }
  if (specs.motorcycle_style && category === "motorcycle") {
    items.push({ label: "Estilo", value: specs.motorcycle_style });
  }
  if (specs.starter_type && category === "motorcycle") {
    items.push({ label: "Partida", value: specs.starter_type });
  }
  if (specs.brake_front) {
    items.push({ label: "Freio dianteiro", value: specs.brake_front });
  }
  if (specs.brake_rear) {
    items.push({ label: "Freio traseiro", value: specs.brake_rear });
  }
  if (specs.fuel_system) {
    items.push({ label: "Alimentação", value: specs.fuel_system });
  }
  if (specs.traction && category !== "motorcycle") {
    items.push({ label: "Tração", value: specs.traction });
  }
  if (specs.axle_count && category === "heavy") {
    items.push({ label: "Eixos", value: String(specs.axle_count) });
  }
  if (specs.gross_weight_kg && category === "heavy") {
    items.push({
      label: "Peso bruto",
      value: `${specs.gross_weight_kg.toLocaleString("pt-BR")} kg`,
    });
  }
  if (specs.passenger_capacity && category === "passenger_commercial") {
    items.push({
      label: "Lugares",
      value: String(specs.passenger_capacity),
    });
  }
  if (specs.cab_type && category === "heavy") {
    items.push({ label: "Cabine", value: specs.cab_type });
  }
  if (specs.body_truck_type && category === "heavy") {
    items.push({ label: "Carroceria", value: specs.body_truck_type });
  }

  return items;
}
