export const PLATFORM_CONTRACT_STATUSES = [
  "draft",
  "sent_for_acceptance",
  "accepted",
  "declined",
  "expired",
  "cancelled",
  "sent_for_signature",
  "signed",
] as const;

export type PlatformContractStatus = (typeof PLATFORM_CONTRACT_STATUSES)[number];

export const PLATFORM_CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent_for_acceptance: "Aguardando aceite",
  accepted: "Aceite confirmado",
  declined: "Aceite recusado",
  expired: "Link expirado",
  cancelled: "Cancelado",
  sent_for_signature: "Aguardando aceite",
  signed: "Aceite confirmado",
};

export interface PlatformContractRow {
  id: string;
  template_id: string;
  template_version: number;
  saas_prospect_id: string | null;
  dealership_id: string | null;
  counterparty_name: string;
  counterparty_email: string;
  plan_name: string | null;
  monthly_amount: number | string | null;
  status: PlatformContractStatus;
  review_notes: string | null;
  body_snapshot_md: string;
  signature_provider_ref: string | null;
  sent_for_signature_at: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformContractTemplateRow {
  id: string;
  slug: string;
  name: string;
  version: number;
  body_md: string;
  is_active: boolean;
}
