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
  pipeline_status: PlatformLeadPipelineStatus;
  lost_reason_code: string | null;
  lost_reason_note: string | null;
  created_at: string;
  updated_at: string;
}
