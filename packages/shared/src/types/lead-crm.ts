export const LEAD_PIPELINE_STATUSES = [
  "new",
  "contacted",
  "hot",
  "won",
  "lost",
] as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

export const LEAD_PIPELINE_STATUS_LABELS: Record<LeadPipelineStatus, string> = {
  new: "Novo",
  contacted: "Contactado",
  hot: "Quente",
  won: "Ganho",
  lost: "Perdido",
};

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
