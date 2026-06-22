import type { BrazilianAddressFields, StorefrontHomeLayoutCopy, StorefrontHomeLayoutKey, StorefrontThemeMode } from "./dealership-config";
import type { StorefrontLayoutTemplateId } from "./dealership-storefront";

export interface DealershipOnboardingUnitDraft {
  name: string;
  whatsapp_number: string;
  address: BrazilianAddressFields;
  is_primary: boolean;
}

export interface DealershipOnboardingIntakePayload {
  general: {
    store_name: string;
    cnpj: string;
    slug: string;
    wants_custom_domain: boolean;
    custom_domain: string;
    contact_email: string;
    whatsapp: string;
    legal_representative_name: string;
    legal_representative_cpf: string;
    billing_address: BrazilianAddressFields;
  };
  branding: {
    primary_color: string;
    primary_foreground_color: string;
    secondary_color: string;
    logo_dark_url: string;
    logo_light_url: string;
    footer_logo_url: string;
    favicon_url: string;
    google_font_heading: string;
    google_font_body: string;
  };
  storefront: {
    theme_mode: StorefrontThemeMode;
    layout_id: StorefrontLayoutTemplateId;
    hero_background_url: string;
    home_copy_by_layout: Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>>;
  };
  institutional: {
    about_text: string;
    social_instagram: string;
    social_facebook: string;
    social_website: string;
  };
  units: DealershipOnboardingUnitDraft[];
  /** Campaign metadata set by marketing-site on submit (optional). */
  campaign?: {
    trial_waitlist?: boolean;
    setup_fee_waived?: boolean;
  };
}

export type DealershipOnboardingIntakeStatus =
  | "submitted"
  | "linked"
  | "converted"
  | "archived";

export type DealershipOnboardingIntakeRpcErrorCode =
  | "payload_required"
  | "trial_legal_version_required"
  | "trial_acceptance_required"
  | "store_name_required"
  | "contact_email_invalid"
  | "saas_prospect_not_found"
  | "forbidden"
  | "intake_not_found"
  | "intake_already_converted"
  | "intake_not_archivable"
  | "intake_not_updatable"
  | "dealership_not_found";

export interface SubmitDealershipOnboardingIntakeResult {
  intake_id: string;
}

export interface DealershipOnboardingIntakeRow {
  id: string;
  saas_prospect_id: string | null;
  status: DealershipOnboardingIntakeStatus;
  payload: DealershipOnboardingIntakePayload;
  converted_dealership_id: string | null;
  trial_legal_version: string | null;
  trial_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Recommended hero banner dimensions for onboarding form help text. */
export const ONBOARDING_HERO_BANNER_SPEC = {
  width: 1920,
  height: 800,
  maxBytes: 5 * 1024 * 1024,
  acceptMime: ["image/jpeg", "image/png", "image/webp"] as const,
};

export const ONBOARDING_BRAND_ASSET_SPEC = {
  maxBytes: 2 * 1024 * 1024,
  acceptMime: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
};
