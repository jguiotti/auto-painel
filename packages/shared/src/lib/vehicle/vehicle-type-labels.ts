export const VEHICLE_TYPE_KEYS = [
  "automovel",
  "motocicleta",
  "caminhonete",
  "van",
  "suv",
  "utilitario",
  "caminhao",
  "onibus",
  "outro",
] as const;

export type VehicleTypeKey = (typeof VEHICLE_TYPE_KEYS)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleTypeKey, string> = {
  automovel: "Automóvel",
  motocicleta: "Motocicleta",
  caminhonete: "Caminhonete",
  van: "Van",
  suv: "SUV",
  utilitario: "Utilitário",
  caminhao: "Caminhão",
  onibus: "Ônibus",
  outro: "Outro",
};

export function resolveVehicleTypeLabel(
  vehicleType: string,
  vehicleTypeCustom?: string | null,
): string {
  if (vehicleType === "outro" && vehicleTypeCustom?.trim()) {
    return vehicleTypeCustom.trim();
  }
  const label = VEHICLE_TYPE_LABELS[vehicleType as VehicleTypeKey];
  return label ?? vehicleType;
}
