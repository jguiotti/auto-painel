export interface DealershipAdminRow {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  theme_settings: Record<string, unknown>;
  whatsapp_number: string | null;
  contact_email: string | null;
  status: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_current_period_end: string | null;
  billing_notes: string | null;
  created_at: string;
  updated_at: string;
}
