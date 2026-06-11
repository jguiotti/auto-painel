import type {
  SaleReceiptPaymentLine,
  SaleReceiptPaymentMethod,
  VehicleSaleReceiptRecord,
} from "@autopainel/shared/types/sale-receipt";

const PAYMENT_METHODS: SaleReceiptPaymentMethod[] = [
  "cash",
  "pix",
  "card",
  "bank_transfer",
  "financing",
  "trade_in",
];

function isPaymentMethod(value: string): value is SaleReceiptPaymentMethod {
  return PAYMENT_METHODS.includes(value as SaleReceiptPaymentMethod);
}

export function parsePaymentLinesFromDb(value: unknown): SaleReceiptPaymentLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const lines: SaleReceiptPaymentLine[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as { method?: unknown; amount?: unknown };
    const method = typeof record.method === "string" ? record.method : "";
    const amount = Number(record.amount);
    if (!isPaymentMethod(method) || Number.isNaN(amount) || amount < 0) {
      continue;
    }
    lines.push({ method, amount });
  }
  return lines;
}

export function mapSaleReceiptRow(row: {
  id: string;
  dealership_id: string;
  vehicle_id: string;
  buyer_name: string;
  buyer_document: string;
  buyer_billing_address: string;
  payment_lines: unknown;
  sale_amount: number | string;
  down_payment_amount: number | string | null;
  vehicle_license_plate: string | null;
  vehicle_renavam: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_version: string | null;
  vehicle_type: string;
  vehicle_type_custom: string | null;
  vehicle_manufacturing_year: number | null;
  vehicle_model_year: number | null;
  vehicle_mileage: number | null;
  issued_by: string | null;
  created_at: string;
  updated_at: string;
}): VehicleSaleReceiptRecord {
  return {
    id: row.id,
    dealership_id: row.dealership_id,
    vehicle_id: row.vehicle_id,
    buyer_name: row.buyer_name,
    buyer_document: row.buyer_document,
    buyer_billing_address: row.buyer_billing_address,
    payment_lines: parsePaymentLinesFromDb(row.payment_lines),
    sale_amount: Number(row.sale_amount),
    down_payment_amount:
      row.down_payment_amount === null ? null : Number(row.down_payment_amount),
    vehicle_license_plate: row.vehicle_license_plate,
    vehicle_renavam: row.vehicle_renavam,
    vehicle_brand: row.vehicle_brand,
    vehicle_model: row.vehicle_model,
    vehicle_version: row.vehicle_version,
    vehicle_type: row.vehicle_type,
    vehicle_type_custom: row.vehicle_type_custom,
    vehicle_manufacturing_year: row.vehicle_manufacturing_year,
    vehicle_model_year: row.vehicle_model_year,
    vehicle_mileage: row.vehicle_mileage,
    issued_by: row.issued_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
