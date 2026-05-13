/**
 * Per-dealership Meta (Facebook) developer application credentials.
 * Table: `public.dealership_meta_oauth_apps` — RLS blocks JWT; service role only.
 */

export interface DealershipMetaOauthAppRow {
  dealership_id: string;
  meta_app_id: string;
  meta_app_secret_encrypted: string;
  graph_api_version_override: string | null;
  created_at: string;
  updated_at: string;
}

/** Public fields loaded server-side for the integrations form (no secret). */
export interface DealershipMetaOauthAppPublic {
  meta_app_id: string;
  graph_api_version_override: string | null;
}
