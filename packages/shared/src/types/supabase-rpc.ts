/**
 * Typed contracts for Supabase RPCs and DB helpers used across apps.
 * When you add or change a Postgres function exposed to the client, update
 * the matching types here so all apps get autocomplete and compile-time checks.
 *
 * Prefer small, explicit interfaces per RPC over one giant Database type unless
 * you adopt `supabase gen types`.
 */

/** `public.effective_feature_keys_for_active_dealership` — merges plan pivot vs legacy enabled_features. */
export interface EffectiveFeatureKeysForDealershipArgs {
  p_dealership_id: string;
}

/** `public.resolve_dealership_id_by_host` — vitrine / público; só `dealerships.status = active`. */
export interface ResolveDealershipIdByHostArgs {
  p_host: string;
  p_platform_root_domain: string;
}

/** `public.resolve_dealership_id_by_host_for_dashboard` — painel; mesmos argumentos, sem filtro de status no resolver. */
export type ResolveDealershipIdByHostForDashboardArgs =
  ResolveDealershipIdByHostArgs;

/** Example: public list_public_vehicles_filtered */
export interface ListPublicVehiclesFilteredArgs {
  p_dealership_id: string;
  p_brand?: string | null;
  p_model?: string | null;
  p_min_price?: number | null;
  p_max_price?: number | null;
  p_min_year?: number | null;
  p_max_year?: number | null;
  p_vehicle_type?: string | null;
  p_min_mileage?: number | null;
  p_max_mileage?: number | null;
  p_fuel_type?: string | null;
  p_transmission?: string | null;
  p_color?: string | null;
  p_min_displacement_cc?: number | null;
  p_max_displacement_cc?: number | null;
  p_gear_count?: number | null;
  p_limit?: number | null;
  p_offset?: number | null;
  p_sort?: string | null;
}

/** public.count_public_vehicles_filtered — same filters as list, without pagination/sort. */
export type CountPublicVehiclesFilteredArgs = Omit<
  ListPublicVehiclesFilteredArgs,
  "p_limit" | "p_offset" | "p_sort"
>;

/** Row shape for public.platform_internal_documents (admin-master internal docs). */
export interface PlatformInternalDocumentRow {
  doc_slug: "business_rules" | "technical";
  body_md: string;
  updated_at: string;
  updated_by: string | null;
}

/** `public.enqueue_classifieds_sync_jobs` — tenant-scoped publish/delist queue. */
export interface EnqueueClassifiedsSyncJobsArgs {
  p_vehicle_id: string;
  p_action: "publish" | "delist";
  p_providers?: string[] | null;
}

export interface EnqueueClassifiedsSyncJobsResult {
  enqueued: number;
  message?: string;
}

/** `public.create_public_storefront_lead` — vitrine lead with LGPD consent. */
export interface CreatePublicStorefrontLeadArgs {
  p_dealership_id: string;
  p_client_name: string;
  p_phone: string;
  p_type: "contact" | "simulation";
  p_source: "vehicle_page" | "finance_simulator" | "contact_page" | "whatsapp_float";
  p_privacy_policy_version: string;
  p_marketing_consent: boolean;
  p_vehicle_id?: string | null;
  p_client_email?: string | null;
  p_message?: string | null;
  p_simulation_data?: Record<string, unknown>;
}

/** `public.is_dealership_panel_user_active` — BZ-EMP-003 panel access gate. */
export interface IsDealershipPanelUserActiveArgs {
  p_user_id?: string | null;
}

/** `public.is_showcase_demo_panel_manager` — shared gestor.demo@autopainel.demo account. */
export interface IsShowcaseDemoPanelManagerArgs {
  p_user_id?: string | null;
}

/** `public.is_showcase_demo_store_dealership` — demo / demo-2 / demo-3 active stores. */
export interface IsShowcaseDemoStoreDealershipArgs {
  p_dealership_id: string;
}

/** `public.bind_showcase_demo_panel_dealership` — rebind showcase manager to host tenant. */
export interface BindShowcaseDemoPanelDealershipArgs {
  p_dealership_id: string;
}

/** `public.generate_monthly_commission_ledger` — v1.1 recurring commission job. */
export interface GenerateMonthlyCommissionLedgerArgs {
  p_reference_month?: string | null;
}

/** `public.generate_payout_batch` — v1.1 group approved lines into payout batch. */
export interface GeneratePayoutBatchArgs {
  p_reference_month: string;
  p_payment_date?: string | null;
}

/** `public.mark_payout_batch_paid` — v1.1 finalize payout batch. */
export interface MarkPayoutBatchPaidArgs {
  p_payout_batch_id: string;
}

/** `public.provision_attribution_from_signed_contract` — v1.1 contract signed hook. */
export interface ProvisionAttributionFromSignedContractArgs {
  p_contract_id: string;
  p_sales_rep_id: string;
  p_dealership_id?: string | null;
  p_confirm_immediately?: boolean;
}

/** `public.list_dealership_employees_for_panel` */
export interface ListDealershipEmployeesForPanelArgs {
  p_dealership_id: string;
}

/** `public.upsert_dealership_employee_profile` */
export interface UpsertDealershipEmployeeProfileArgs {
  p_user_id: string;
  p_full_name: string;
  p_phone?: string | null;
  p_cpf?: string | null;
  p_rg?: string | null;
  p_photo_url?: string | null;
  p_address?: Record<string, unknown>;
  p_base_salary?: number | null;
  p_commission_percent?: number | null;
  p_commission_fixed_per_vehicle?: number | null;
  p_is_active?: boolean;
}

/** `public.get_dealership_sales_ranking` */
export interface GetDealershipSalesRankingArgs {
  p_dealership_id: string;
  p_days?: number;
}

/** `public.create_dealership_manual_lead` — panel manual CRM lead. */
export interface CreateDealershipManualLeadArgs {
  p_client_name: string;
  p_phone: string;
  p_client_email?: string | null;
  p_message?: string | null;
  p_vehicle_id?: string | null;
  p_assign_to_self?: boolean;
  p_document_cpf?: string | null;
  p_document_cnpj?: string | null;
  p_billing_address?: Record<string, unknown> | null;
}

/** `public.list_dealership_public_units` — contact page unit addresses. */
export type ListDealershipPublicUnitsResult = Array<{
  id: string;
  name: string;
  address: Record<string, unknown>;
  sort_order: number;
}>;

/** `public.list_public_pricing_marketing_catalog` — marketing-site /planos module matrix. */
export type ListPublicPricingMarketingCatalogResult = {
  plans: Array<{
    slug: string;
    name: string;
    description: string | null;
    price_amount: number | string;
    currency_code: string;
  }>;
  modules: Array<{
    key: string;
    label: string;
    description: string;
    plan_slugs: string[];
  }>;
};

/** `public.platform_health_ping` — harmless keep-alive for scheduled cron. */
export interface PlatformHealthPingResult {
  ok: boolean;
  pinged_at: string;
  database: string;
}

/** `public.resolve_dealership_storefront_tenant` — vitrine tenant incl. suspended/pending_setup. */
export interface ResolveDealershipStorefrontTenantArgs {
  p_host: string;
  p_platform_root_domain: string;
}

export type ResolveDealershipStorefrontTenantResult = Array<{
  dealership_id: string;
  dealership_slug: string;
  dealership_name: string;
  dealership_status: string;
}>;

/** `public.get_dealership_storefront_tenant_by_slug` — dev localhost tenant. */
export interface GetDealershipStorefrontTenantBySlugArgs {
  p_slug: string;
}

/** `public.get_dealership_storefront_shell_by_id` — inactive storefront shell. */
export interface GetDealershipStorefrontShellByIdArgs {
  p_id: string;
}

/** `public.upsert_dealership_social_carousel_settings` — template + watermark per dealership. */
export interface UpsertDealershipSocialCarouselSettingsRpcArgs {
  p_artifact_template: "classic" | "performance" | "tech";
  p_watermark_enabled: boolean;
}

/** Row returned by upsert_dealership_social_carousel_settings. */
export interface DealershipSocialCarouselSettingsRow {
  dealership_id: string;
  artifact_template: "classic" | "performance" | "tech";
  watermark_enabled: boolean;
  integrations_onboarding_dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** `public.list_dealership_meta_page_candidates` — non-sensitive pending pages after OAuth. */
export type ListDealershipMetaPageCandidatesRpcResult = Array<{
  page_id: string;
  page_name: string;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
}>;

/** `public.dismiss_integrations_onboarding` — no args; uses auth.uid() dealership. */

/** `public.upsert_vehicle_sale_receipt` — create/update receipt for sold vehicle. */
export interface UpsertVehicleSaleReceiptArgs {
  p_vehicle_id: string;
  p_buyer_name: string;
  p_buyer_document: string;
  p_buyer_billing_address: string;
  p_payment_lines: Array<{ method: string; amount: number }>;
  p_sale_amount: number;
  p_down_payment_amount?: number | null;
  p_vehicle_license_plate?: string | null;
  p_vehicle_renavam?: string | null;
}

/** `public.get_vehicle_sale_receipt` */
export interface GetVehicleSaleReceiptArgs {
  p_vehicle_id: string;
}

/** `public.claim_dealership_lead` — seller assumes unassigned lead from pool. */
export interface ClaimDealershipLeadArgs {
  p_lead_id: string;
}

/** `public.reassign_dealership_lead` — owner/manager moves lead between staff. */
export interface ReassignDealershipLeadArgs {
  p_lead_id: string;
  p_assignee_user_id: string;
}

/** `public.count_dealership_leads_needing_attention` — sidebar badge count. */
export interface CountDealershipLeadsNeedingAttentionArgs {
  p_dealership_id: string;
}

/** `public.update_vehicle_featured_sort_orders` — batch featured order on storefront. */
export interface UpdateVehicleFeaturedSortOrdersArgs {
  p_updates: Array<{ vehicle_id: string; featured_sort_order: number }>;
}

/** `public.upsert_dealership_customer` — enriched CRM customer profile. */
export interface UpsertDealershipCustomerArgs {
  p_full_name: string;
  p_phone: string;
  p_email?: string | null;
  p_document_cpf?: string | null;
  p_document_cnpj?: string | null;
  p_billing_address?: Record<string, unknown>;
  p_notes?: string | null;
  p_customer_id?: string | null;
}

/** `public.transfer_sales_rep_portfolio` — move confirmed attributions to another rep. */
export interface TransferSalesRepPortfolioArgs {
  p_from_sales_rep_id: string;
  p_to_sales_rep_id: string;
  p_effective_at: string;
  p_dealership_ids?: string[] | null;
  p_notes?: string | null;
}

/** `public.confirm_dealership_sales_attribution` — confirm link and seed first ledger line. */
export interface ConfirmDealershipSalesAttributionArgs {
  p_attribution_id: string;
}

/** `public.clawback_dealership_sales_commissions` — estorno churn 30d. */
export interface ClawbackDealershipSalesCommissionsArgs {
  p_dealership_id: string;
}

/** `public.approve_sales_commission_ledger_entries` — bulk approve pending lines. */
export interface ApproveSalesCommissionLedgerEntriesArgs {
  p_entry_ids: string[];
}
