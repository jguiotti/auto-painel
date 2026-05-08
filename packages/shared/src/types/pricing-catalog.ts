/** Row shape for `public.pricing_plans` (admin listing). */
export interface PricingPlanListRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Postgres numeric surfaced as string by PostgREST / JS client */
  price_amount: string;
  currency_code: string;
  is_active: boolean;
}

/** Row shape for `public.saas_modules` (admin listing). */
export interface SaasModuleListRow {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}
