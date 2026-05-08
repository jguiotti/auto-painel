import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

export interface DealershipAdminRow {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  custom_domain: string | null;
  logo_url: string | null;
  theme_settings: Record<string, unknown>;
  theme_config: Record<string, unknown>;
  content_config: Record<string, unknown>;
  enabled_features: string[];
  whatsapp_number: string | null;
  contact_email: string | null;
  status: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_current_period_end: string | null;
  billing_notes: string | null;
  pricing_plan_id: string | null;
  layout_id: StorefrontLayoutTemplateId;
  created_at: string;
  updated_at: string;
}
