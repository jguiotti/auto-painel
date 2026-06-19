/** Loss reason codes when lead status is `lost`. */
export const LEAD_LOSS_REASON_CODES = [
  "budget",
  "bought_competitor",
  "bought_private",
  "financing_denied",
  "no_credit",
  "postponed",
  "no_response",
  "other_model",
  "trade_rejected",
  "vehicle_sold",
  "distance",
  "documentation",
  "vehicle_condition",
  "other",
] as const;

export type LeadLossReasonCode = (typeof LEAD_LOSS_REASON_CODES)[number];

export const LEAD_LOSS_REASON_LABELS: Record<LeadLossReasonCode, string> = {
  budget: "Preço acima do orçamento",
  bought_competitor: "Comprou em outra loja",
  bought_private: "Comprou de particular / conhecido",
  financing_denied: "Financiamento negado",
  no_credit: "Sem entrada / sem crédito",
  postponed: "Adiou a compra",
  no_response: "Não respondeu / sumiu",
  other_model: "Preferiu outro modelo ou marca",
  trade_rejected: "Troca não aceita",
  vehicle_sold: "Veículo vendido antes do retorno",
  distance: "Distância / não pode buscar o carro",
  documentation: "Documentação ou restrição legal",
  vehicle_condition: "Condição do veículo (km, revisão, histórico)",
  other: "Outro",
};

export interface CustomerBillingAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface DealershipCustomerRecord {
  id: string;
  dealership_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  document_cpf: string | null;
  document_cnpj: string | null;
  billing_address: CustomerBillingAddress;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertDealershipCustomerInput {
  full_name: string;
  phone: string;
  email?: string | null;
  document_cpf?: string | null;
  document_cnpj?: string | null;
  billing_address?: CustomerBillingAddress;
  notes?: string | null;
  customer_id?: string | null;
}
