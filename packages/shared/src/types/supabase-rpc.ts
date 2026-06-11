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
}

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

/** `public.platform_health_ping` — harmless keep-alive for scheduled cron. */
export interface PlatformHealthPingResult {
  ok: boolean;
  pinged_at: string;
  database: string;
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
