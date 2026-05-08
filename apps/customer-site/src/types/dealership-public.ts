import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

export interface DealershipPublicRecord {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_settings: unknown;
  theme_config: unknown;
  content_config: unknown;
  enabled_features: string[] | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  layout_id: StorefrontLayoutTemplateId;
}
