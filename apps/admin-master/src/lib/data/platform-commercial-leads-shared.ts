export const PLATFORM_LEAD_PIPELINE_STATUSES = [
  "new",
  "qualification",
  "demo_scheduled",
  "demo_done",
  "proposal_sent",
  "negotiation",
  "won",
  "onboarding",
  "lost",
] as const;

export type PlatformLeadPipelineStatus =
  (typeof PLATFORM_LEAD_PIPELINE_STATUSES)[number];

export const PLATFORM_LEAD_PIPELINE_LABELS: Record<
  PlatformLeadPipelineStatus,
  string
> = {
  new: "Novo",
  qualification: "Qualificação",
  demo_scheduled: "Demo agendada",
  demo_done: "Demo realizada",
  proposal_sent: "Proposta enviada",
  negotiation: "Negociação",
  won: "Ganho",
  onboarding: "Onboarding",
  lost: "Perdido",
};

export interface PlatformCommercialLeadRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  pipeline_status: PlatformLeadPipelineStatus;
  lost_reason_code: string | null;
  lost_reason_note: string | null;
  created_at: string;
  updated_at: string;
}

export function readIntakeIdFromLeadMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const raw = metadata.intake_id;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export function readDealershipIdFromLeadMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const raw = metadata.dealership_id;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export const PLATFORM_LEAD_MANUAL_CHANNELS = [
  { value: "outbound", label: "Prospecção ativa" },
  { value: "referral", label: "Indicação" },
  { value: "event", label: "Evento / feira" },
  { value: "inbound_other", label: "Inbound (outro canal)" },
  { value: "other", label: "Outro" },
] as const;

export type PlatformLeadManualChannel =
  (typeof PLATFORM_LEAD_MANUAL_CHANNELS)[number]["value"];

export interface CommercialLeadDealershipPrefill {
  storeName: string;
  slugSuggestion: string;
  contactEmail: string;
  whatsapp: string;
  cnpj: string;
  legalRepresentativeName: string;
}

export function slugSuggestionFromLeadLabel(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug.length > 0 ? slug : "nova-loja";
}

export function mapCommercialLeadToDealershipPrefill(
  lead: PlatformCommercialLeadRow,
): CommercialLeadDealershipPrefill {
  const storeName = lead.company_name?.trim() || lead.full_name.trim();
  const metadata =
    lead.metadata && typeof lead.metadata === "object" ? lead.metadata : null;
  const cnpjRaw = metadata?.cnpj;
  const cnpj = typeof cnpjRaw === "string" ? cnpjRaw : "";

  return {
    storeName,
    slugSuggestion: slugSuggestionFromLeadLabel(storeName),
    contactEmail: lead.email,
    whatsapp: lead.phone?.trim() ?? "",
    cnpj,
    legalRepresentativeName: lead.full_name.trim(),
  };
}
