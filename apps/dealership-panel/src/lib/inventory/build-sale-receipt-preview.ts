import type {
  SaleReceiptPaymentMethod,
  VehicleSaleReceiptRecord,
} from "@autopainel/shared/types/sale-receipt";

import type {
  SaleReceiptDealershipHeader,
  SaleReceiptVehicleSummary,
} from "@/lib/inventory/get-vehicle-sale-receipt-page-context";

export interface SaleReceiptFormPreviewState {
  buyerName: string;
  buyerDocument: string;
  buyerBillingAddress: string;
  saleAmount: string;
  downPaymentAmount: string;
  licensePlate: string;
  renavam: string;
  paymentLines: Array<{ method: SaleReceiptPaymentMethod; amount: string }>;
}

function parseAmount(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function buildSaleReceiptPreviewRecord(
  vehicle: SaleReceiptVehicleSummary,
  form: SaleReceiptFormPreviewState,
  savedReceipt: VehicleSaleReceiptRecord | null,
): VehicleSaleReceiptRecord {
  const now = savedReceipt?.updated_at ?? new Date().toISOString();
  const saleAmount = parseAmount(form.saleAmount) || vehicle.salePrice;

  const paymentLines =
    form.paymentLines.length > 0
      ? form.paymentLines.map((line) => ({
          method: line.method,
          amount: parseAmount(line.amount),
        }))
      : [{ method: "pix" as const, amount: saleAmount }];

  return {
    id: savedReceipt?.id ?? "preview",
    dealership_id: savedReceipt?.dealership_id ?? "",
    vehicle_id: vehicle.id,
    buyer_name: form.buyerName.trim() || "—",
    buyer_document: form.buyerDocument.trim() || "—",
    buyer_billing_address: form.buyerBillingAddress.trim() || "—",
    payment_lines: paymentLines,
    sale_amount: saleAmount,
    down_payment_amount: form.downPaymentAmount.trim()
      ? parseAmount(form.downPaymentAmount)
      : null,
    vehicle_license_plate: form.licensePlate.trim() || null,
    vehicle_renavam: form.renavam.trim() || null,
    vehicle_brand: vehicle.brand,
    vehicle_model: vehicle.model,
    vehicle_version: vehicle.version,
    vehicle_type: vehicle.vehicleType,
    vehicle_type_custom: vehicle.vehicleTypeCustom,
    vehicle_manufacturing_year: vehicle.manufacturingYear,
    vehicle_model_year: vehicle.modelYear,
    vehicle_mileage: vehicle.mileage,
    issued_by: savedReceipt?.issued_by ?? null,
    created_at: savedReceipt?.created_at ?? now,
    updated_at: now,
  };
}

export function formatDealershipContact(dealership: SaleReceiptDealershipHeader): string {
  return [dealership.phone, dealership.email].filter(Boolean).join(" · ");
}
