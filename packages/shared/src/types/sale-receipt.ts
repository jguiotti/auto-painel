/**
 * Sale receipt module — simple non-fiscal purchase/sale receipt for sold vehicles.
 */

export type SaleReceiptPaymentMethod =
  | "cash"
  | "pix"
  | "card"
  | "bank_transfer"
  | "financing"
  | "trade_in";

export interface SaleReceiptPaymentLine {
  method: SaleReceiptPaymentMethod;
  amount: number;
}

export interface VehicleSaleReceiptRecord {
  id: string;
  dealership_id: string;
  vehicle_id: string;
  buyer_name: string;
  buyer_document: string;
  buyer_billing_address: string;
  payment_lines: SaleReceiptPaymentLine[];
  sale_amount: number;
  down_payment_amount: number | null;
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
}

export interface UpsertVehicleSaleReceiptInput {
  vehicle_id: string;
  buyer_name: string;
  buyer_document: string;
  buyer_billing_address: string;
  payment_lines: SaleReceiptPaymentLine[];
  sale_amount: number;
  down_payment_amount?: number | null;
  vehicle_license_plate?: string | null;
  vehicle_renavam?: string | null;
}

export const SALE_RECEIPT_PAYMENT_METHOD_LABELS: Record<
  SaleReceiptPaymentMethod,
  string
> = {
  cash: "Dinheiro",
  pix: "PIX",
  card: "Cartão",
  bank_transfer: "Transferência bancária",
  financing: "Financiamento",
  trade_in: "Permuta",
};

export const SALE_RECEIPT_MODULE_KEY = "recibo_compra" as const;

export const SALE_RECEIPT_FISCAL_DISCLAIMER =
  "Documento emitido para fins informativos. Sem validade fiscal. Não substitui nota fiscal eletrônica.";
