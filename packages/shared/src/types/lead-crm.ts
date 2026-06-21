export const LEAD_PIPELINE_STATUSES = [
  "new",
  "in_progress",
  "hot",
  "cold",
  "won",
  "lost",
] as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

export const LEAD_PIPELINE_STATUS_LABELS: Record<LeadPipelineStatus, string> = {
  new: "Novo",
  in_progress: "Em atendimento",
  hot: "Contato quente",
  cold: "Contato frio",
  won: "Venda ganha",
  lost: "Venda perdida",
};

/** @deprecated migrated to in_progress — kept for legacy reads */
export const LEGACY_LEAD_STATUS_CONTACTED = "contacted" as const;

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  vehicle_page: "Veículo",
  finance_simulator: "Financiamento",
  contact_page: "Página de contato",
  whatsapp_float: "WhatsApp",
  manual: "Cadastro manual",
};

export interface LeadNoteItem {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

export interface SoldVehicleOption {
  id: string;
  brand: string;
  model: string;
}

export interface InventoryVehicleOption {
  id: string;
  brand: string;
  model: string;
  status: string;
  model_year?: number | null;
}

export interface LeadCustomerProfile {
  customer_id: string | null;
  document_cpf: string | null;
  document_cnpj: string | null;
  billing_address: Record<string, unknown>;
}
