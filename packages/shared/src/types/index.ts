/**
 * Cross-app TypeScript definitions. Migrate domain types here gradually.
 */
export * from "./supabase-rpc";
export * from "./classifieds-oauth-app";
export * from "./meta-oauth-app";
export * from "./dealership-config";
export * from "./dealership-storefront";
export * from "./pricing-catalog";
export * from "./finance-simulation";
export * from "./social-carousel";
export * from "./integrations-hub";
export * from "./sale-receipt";
export * from "./lead-crm";
export * from "./customer-crm";
export * from "./dealership-employee";
export * from "./platform-sales-squad";

export type BrandSlug = string;

/** Matches public.dealerships.status check constraint. */
export type DealershipStatus =
  | "active"
  | "suspended"
  | "pending_setup"
  | "churned";

/** Row shape for marketing-site inserts into public.saas_prospects (server-side). */
export interface SaasProspectInsert {
  full_name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  message?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
  privacy_policy_accepted_at: string;
  privacy_policy_version: string;
  marketing_consent: boolean;
  marketing_consent_at?: string | null;
}
