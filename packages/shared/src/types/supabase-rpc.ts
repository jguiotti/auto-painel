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

/** `public.platform_health_ping` — harmless keep-alive for scheduled cron. */
export interface PlatformHealthPingResult {
  ok: boolean;
  pinged_at: string;
  database: string;
}
