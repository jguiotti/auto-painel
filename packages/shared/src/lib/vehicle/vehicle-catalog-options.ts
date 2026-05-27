export const VEHICLE_FUEL_TYPE_OPTIONS = [
  "Gasolina",
  "Etanol",
  "Flex",
  "Diesel",
  "Elétrico",
  "Híbrido",
  "GNV",
] as const;

export const VEHICLE_TRANSMISSION_OPTIONS = [
  "Manual",
  "Automática",
  "Automatizada",
  "CVT",
  "Semi-automática",
] as const;

export const VEHICLE_BODY_STYLE_OPTIONS = [
  "Hatch",
  "Sedan",
  "SUV",
  "Cupê",
  "Picape",
  "Van",
  "Perua",
  "Conversível",
  "Minivan",
] as const;

export const VEHICLE_FEATURE_OPTIONS = [
  "Airbag",
  "Alarme",
  "Ar-condicionado",
  "Ar quente",
  "Bancos com regulagem de altura",
  "Computador de bordo",
  "Controle de tração",
  "Desembaçador traseiro",
  "Encosto de cabeça traseiro",
  "Freios ABS",
  "Limpador traseiro",
  "Rodas de liga leve",
  "Travas elétricas",
  "Vidros elétricos",
  "Volante com regulagem de altura",
  "Bancos de couro",
  "Direção hidráulica",
  "GPS",
  "Sensor de estacionamento",
  "Câmera de ré",
  "Piloto automático",
  "Farol de neblina",
] as const;

export type VehicleFuelType = (typeof VEHICLE_FUEL_TYPE_OPTIONS)[number];
export type VehicleTransmission = (typeof VEHICLE_TRANSMISSION_OPTIONS)[number];
export type VehicleBodyStyle = (typeof VEHICLE_BODY_STYLE_OPTIONS)[number];
export type VehicleFeatureOption = (typeof VEHICLE_FEATURE_OPTIONS)[number];

export interface VehicleCatalogDetailFields {
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

export const VEHICLE_CONDITION_LABELS: Array<{
  key: keyof Pick<
    VehicleCatalogDetailFields,
    | "accepts_trade"
    | "single_owner"
    | "all_revisions_done"
    | "factory_warranty"
    | "ipva_paid"
    | "is_licensed"
  >;
  label: string;
}> = [
  { key: "accepts_trade", label: "Aceita troca" },
  { key: "single_owner", label: "Único dono" },
  { key: "all_revisions_done", label: "Todas as revisões em dia" },
  { key: "factory_warranty", label: "Garantia de fábrica" },
  { key: "ipva_paid", label: "IPVA pago" },
  { key: "is_licensed", label: "Licenciado" },
];
