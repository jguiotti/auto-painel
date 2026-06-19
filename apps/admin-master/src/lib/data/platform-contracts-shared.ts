export const PLATFORM_CONTRACT_STATUSES = [
  "draft",
  "sent_for_signature",
  "signed",
  "cancelled",
] as const;

export type PlatformContractStatus = (typeof PLATFORM_CONTRACT_STATUSES)[number];

export const PLATFORM_CONTRACT_STATUS_LABELS: Record<PlatformContractStatus, string> = {
  draft: "Rascunho (revisão)",
  sent_for_signature: "Enviado para assinatura",
  signed: "Assinado",
  cancelled: "Cancelado",
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
