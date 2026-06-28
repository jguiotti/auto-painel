/**
 * Growth operations epic — stock limits, support/upgrade requests, admin notifications,
 * contract opt-in, inventory aging metrics.
 */

export type DealershipSupportRequestType =
  | "plan_upgrade"
  | "technical_support"
  | "other";

export type DealershipSupportRequestStatus = "open" | "in_progress" | "done";

export interface DealershipStockLimitStatus {
  eligibleCount: number;
  maxActiveVehicles: number | null;
  planSlug: string | null;
  planName: string | null;
  suggestedUpgradeSlug: string | null;
  suggestedUpgradeName: string | null;
  atLimit: boolean;
  nearLimit: boolean;
  warningRatio: number;
}

export interface CreateDealershipSupportRequestInput {
  requestType: DealershipSupportRequestType;
  message?: string | null;
  desiredPlanSlug?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateDealershipSupportRequestResult {
  requestId: string;
  slaDueAt: string;
}

export type PlatformAdminNotificationKind =
  | "commercial_lead_new"
  | "trial_onboarding_new"
  | "plan_upgrade_request"
  | "technical_support_request"
  | "contract_sent_for_acceptance"
  | "contract_accepted"
  | "contract_declined"
  | "cancellation_request"
  | "billing_due_7"
  | "billing_due_3"
  | "billing_due_today"
  | "billing_overdue";

export interface PlatformAdminNotificationRow {
  id: string;
  kind: PlatformAdminNotificationKind;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  targetPath: string | null;
  readAt: string | null;
  createdAt: string;
}

export type PlatformContractStatus =
  | "draft"
  | "sent_for_acceptance"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";

/** @deprecated Use sent_for_acceptance */
export type LegacyPlatformContractStatus = "sent_for_signature" | "signed";

export type PlatformLegalAcceptanceKind =
  | "trial_adhesion"
  | "platform_terms"
  | "privacy_policy"
  | "saas_contract";

export interface PlatformLegalAcceptanceRecord {
  id: string;
  entityType: string;
  entityId: string;
  acceptanceKind: PlatformLegalAcceptanceKind;
  documentVersion: string;
  acceptedAt: string;
}

export interface InventoryAgingSummary {
  capitalImmobilized: number;
  averageDaysInStock: number;
  estimatedDailyCarryingCost: number;
  agedStockPercent: number;
  agedThresholdDays: number;
}

export interface InventoryAttentionVehicleRow {
  vehicleId: string;
  brand: string;
  model: string;
  salePrice: number;
  daysInStock: number;
  leadsLast30Days: number;
  estimatedCarryingCost: number;
  suggestionKey: string;
}

export interface GetDealershipInventoryAgingMetricsResult {
  summary: InventoryAgingSummary;
  attentionVehicles: InventoryAttentionVehicleRow[];
}

export interface PublicContractAcceptancePreview {
  contractId: string;
  counterpartyName: string;
  counterpartyEmail: string;
  planName: string | null;
  bodyMarkdown: string;
  expiresAt: string;
  isExpired: boolean;
  alreadyAccepted: boolean;
}

export interface SubmitPlatformContractAcceptanceInput {
  token: string;
  acceptContract: boolean;
  acceptPlatformTerms: boolean;
  acceptPrivacyPolicy: boolean;
}

export interface SubmitTrialOnboardingLegalAcceptancesInput {
  trialLegalVersion: string;
  trialAcceptedAt: string;
  platformTermsVersion: string;
  platformTermsAcceptedAt: string;
  privacyPolicyVersion: string;
  privacyPolicyAcceptedAt: string;
}
