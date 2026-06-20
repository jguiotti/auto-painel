import {
  PLATFORM_COMMISSION_ENTRY_TYPES,
  PLATFORM_COMMISSION_LEDGER_STATUSES,
  PLATFORM_INCENTIVE_CAMPAIGN_STATUSES,
  PLATFORM_SALES_ATTRIBUTION_STATUSES,
  PLATFORM_SALES_ATTRIBUTION_TYPES,
  PLATFORM_SALES_PAYMENT_METHODS,
  PLATFORM_SALES_REP_STATUSES,
  type PlatformCommissionEntryType,
  type PlatformCommissionLedgerStatus,
  type PlatformIncentiveCampaignStatus,
  type PlatformSalesAttributionStatus,
  type PlatformSalesAttributionType,
  type PlatformSalesPaymentMethod,
  type PlatformSalesRepBankAccountRecord,
  type PlatformSalesRepDealershipAttributionRecord,
  type PlatformSalesRepRecord,
  type PlatformSalesRepStatus,
} from "@autopainel/shared/types";

export {
  PLATFORM_COMMISSION_ENTRY_TYPES,
  PLATFORM_COMMISSION_LEDGER_STATUSES,
  PLATFORM_INCENTIVE_CAMPAIGN_STATUSES,
  PLATFORM_SALES_ATTRIBUTION_STATUSES,
  PLATFORM_SALES_ATTRIBUTION_TYPES,
  PLATFORM_SALES_PAYMENT_METHODS,
  PLATFORM_SALES_REP_STATUSES,
};

export type {
  PlatformCommissionEntryType,
  PlatformCommissionLedgerStatus,
  PlatformIncentiveCampaignStatus,
  PlatformSalesAttributionStatus,
  PlatformSalesAttributionType,
  PlatformSalesPaymentMethod,
  PlatformSalesRepBankAccountRecord,
  PlatformSalesRepDealershipAttributionRecord,
  PlatformSalesRepRecord,
  PlatformSalesRepStatus,
};

export const PLATFORM_SALES_REP_STATUS_LABELS: Record<
  PlatformSalesRepStatus,
  string
> = {
  active: "Ativo",
  inactive: "Inativo",
  onboarding: "Em integração",
};

export const PLATFORM_SALES_ATTRIBUTION_TYPE_LABELS: Record<
  PlatformSalesAttributionType,
  string
> = {
  closer: "Fechamento",
  sdr: "SDR",
  referral: "Indicação",
};

export const PLATFORM_SALES_ATTRIBUTION_STATUS_LABELS: Record<
  PlatformSalesAttributionStatus,
  string
> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  disputed: "Em disputa",
  cancelled: "Cancelado",
};

export const PLATFORM_COMMISSION_LEDGER_STATUS_LABELS: Record<
  PlatformCommissionLedgerStatus,
  string
> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  cancelled: "Cancelado",
};

export const PLATFORM_COMMISSION_ENTRY_TYPE_LABELS: Record<
  PlatformCommissionEntryType,
  string
> = {
  commission: "Comissão",
  bonus: "Bônus",
  adjustment: "Ajuste",
  clawback: "Estorno",
};

export const PLATFORM_INCENTIVE_CAMPAIGN_STATUS_LABELS: Record<
  PlatformIncentiveCampaignStatus,
  string
> = {
  draft: "Rascunho",
  active: "Ativa",
  closed: "Encerrada",
};

export interface PlatformSalesRepListRow extends PlatformSalesRepRecord {
  confirmed_attributions_count: number;
}

export interface PlatformSalesAttributionListRow
  extends PlatformSalesRepDealershipAttributionRecord {
  dealership_name: string;
  sales_rep_name: string;
}

export interface PlatformCommissionLedgerListRow {
  id: string;
  sales_rep_id: string;
  sales_rep_name: string;
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

export interface PlatformIncentiveCampaignRow {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  goal_metric: "closed_dealerships" | "mrr_total_cents" | "setup_count";
  goal_target: number;
  bonus_amount_cents: number;
  eligible_rep_ids: string[] | null;
  status: PlatformIncentiveCampaignStatus;
  created_at: string;
  updated_at: string;
}

export function formatCommissionRateBps(bps: number): string {
  const percent = bps / 100;
  return `${percent.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatCentsToBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function maskPixKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }
  return `•••• ${trimmed.slice(-4)}`;
}

export function parseCommissionRatePercentToBps(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const percent = Number(normalized);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return null;
  }
  return Math.round(percent * 100);
}

export function parseAttributionSharePercentToBps(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return 10000;
  }
  const percent = Number(normalized);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    return null;
  }
  return Math.round(percent * 100);
}

export function parseMoneyToCents(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) {
    return null;
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount * 100);
}

export function isSalesRepStatus(value: string): value is PlatformSalesRepStatus {
  return (PLATFORM_SALES_REP_STATUSES as readonly string[]).includes(value);
}

export function isAttributionType(
  value: string,
): value is PlatformSalesAttributionType {
  return (PLATFORM_SALES_ATTRIBUTION_TYPES as readonly string[]).includes(value);
}

export function isAttributionStatus(
  value: string,
): value is PlatformSalesAttributionStatus {
  return (PLATFORM_SALES_ATTRIBUTION_STATUSES as readonly string[]).includes(
    value,
  );
}

export function isPaymentMethod(
  value: string,
): value is PlatformSalesPaymentMethod {
  return (PLATFORM_SALES_PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isIncentiveCampaignStatus(
  value: string,
): value is PlatformIncentiveCampaignStatus {
  return (PLATFORM_INCENTIVE_CAMPAIGN_STATUSES as readonly string[]).includes(
    value,
  );
}
