/** Platform commercial squad — sales reps, commissions, payouts (not dealership tenant scope). */

export const PLATFORM_SALES_REP_STATUSES = [
  "active",
  "inactive",
  "onboarding",
] as const;

export type PlatformSalesRepStatus =
  (typeof PLATFORM_SALES_REP_STATUSES)[number];

export const PLATFORM_SALES_ATTRIBUTION_TYPES = [
  "closer",
  "sdr",
  "referral",
] as const;

export type PlatformSalesAttributionType =
  (typeof PLATFORM_SALES_ATTRIBUTION_TYPES)[number];

export const PLATFORM_SALES_ATTRIBUTION_STATUSES = [
  "pending",
  "confirmed",
  "disputed",
  "cancelled",
] as const;

export type PlatformSalesAttributionStatus =
  (typeof PLATFORM_SALES_ATTRIBUTION_STATUSES)[number];

export const PLATFORM_COMMISSION_ENTRY_TYPES = [
  "commission",
  "bonus",
  "adjustment",
  "clawback",
] as const;

export type PlatformCommissionEntryType =
  (typeof PLATFORM_COMMISSION_ENTRY_TYPES)[number];

export const PLATFORM_COMMISSION_LEDGER_STATUSES = [
  "pending",
  "approved",
  "paid",
  "cancelled",
] as const;

export type PlatformCommissionLedgerStatus =
  (typeof PLATFORM_COMMISSION_LEDGER_STATUSES)[number];

export const PLATFORM_INCENTIVE_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "closed",
] as const;

export type PlatformIncentiveCampaignStatus =
  (typeof PLATFORM_INCENTIVE_CAMPAIGN_STATUSES)[number];

export const PLATFORM_PAYOUT_BATCH_STATUSES = [
  "draft",
  "processing",
  "paid",
] as const;

export type PlatformPayoutBatchStatus =
  (typeof PLATFORM_PAYOUT_BATCH_STATUSES)[number];

export const PLATFORM_SALES_PAYMENT_METHODS = ["pix", "ted"] as const;

export type PlatformSalesPaymentMethod =
  (typeof PLATFORM_SALES_PAYMENT_METHODS)[number];

export interface PlatformSalesRepRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  document_cpf: string | null;
  status: PlatformSalesRepStatus;
  hire_date: string | null;
  termination_date: string | null;
  default_commission_rate_bps: number;
  user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSalesRepBankAccountRecord {
  id: string;
  sales_rep_id: string;
  payment_method: PlatformSalesPaymentMethod;
  pix_key_type: "cpf" | "email" | "phone" | "random" | null;
  pix_key: string | null;
  bank_code: string | null;
  branch: string | null;
  account_number: string | null;
  account_holder_name: string;
  account_holder_document: string;
  is_primary: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformSalesRepDealershipAttributionRecord {
  id: string;
  sales_rep_id: string;
  dealership_id: string;
  saas_prospect_id: string | null;
  contract_id: string | null;
  attribution_type: PlatformSalesAttributionType;
  attribution_share_bps: number;
  closed_at: string;
  first_invoice_amount_cents: number | null;
  plan_key: string | null;
  status: PlatformSalesAttributionStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformCommissionLedgerEntryRecord {
  id: string;
  sales_rep_id: string;
  attribution_id: string | null;
  campaign_id: string | null;
  entry_type: PlatformCommissionEntryType;
  amount_cents: number;
  currency: string;
  description: string;
  reference_month: string;
  status: PlatformCommissionLedgerStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformSalesRepInput {
  full_name: string;
  email: string;
  phone?: string | null;
  document_cpf?: string | null;
  status?: PlatformSalesRepStatus;
  hire_date?: string | null;
  default_commission_rate_bps?: number;
  user_id?: string | null;
  notes?: string | null;
}

export interface CreateDealershipSalesAttributionInput {
  sales_rep_id: string;
  dealership_id: string;
  saas_prospect_id?: string | null;
  contract_id?: string | null;
  attribution_type: PlatformSalesAttributionType;
  attribution_share_bps?: number;
  closed_at?: string;
  first_invoice_amount_cents?: number | null;
  plan_key?: string | null;
}

export interface TransferSalesRepPortfolioResult {
  transfer_id: string;
  dealerships_moved: number;
}
