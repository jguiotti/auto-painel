/**
 * Per-dealership OAuth app credentials for classified integrations.
 * Rows live in `public.dealership_classifieds_oauth_apps` — RLS blocks JWT clients;
 * use service-role or Edge Functions to read/write ciphertext.
 */

export type ClassifiedsOauthProvider = "olx" | "webmotors";

/** Full row shape (server-side / service role only). */
export interface DealershipClassifiedsOauthAppRow {
  id: string;
  dealership_id: string;
  provider: ClassifiedsOauthProvider;
  oauth_client_id: string;
  oauth_client_secret_encrypted: string;
  authorization_url_override: string | null;
  token_url_override: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dealer-facing form payload: never send ciphertext from the browser —
 * encrypt server-side before insert/update.
 */
export interface DealershipClassifiedsOauthAppUpsertInput {
  provider: ClassifiedsOauthProvider;
  oauth_client_id: string;
  /** Plain secret; optional on update if the dealer only rotates the ID without changing the secret. */
  oauth_client_secret_plaintext?: string;
  authorization_url_override?: string | null;
  token_url_override?: string | null;
}

/** Safe subset for UI after loading via trusted server code (no secret fields). */
export interface DealershipClassifiedsOauthAppPublic {
  provider: ClassifiedsOauthProvider;
  oauth_client_id: string;
  has_client_secret: boolean;
  authorization_url_override: string | null;
  token_url_override: string | null;
  updated_at: string;
}
