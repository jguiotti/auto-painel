import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import {
  buildClassifiedsOAuthCallbackUrl,
  normalizeClassifiedsOAuthRedirectUri,
} from "@autopainel/shared/lib/classifieds-oauth-redirect";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";
import {
  isClassifiedsOAuthDevStubEnabled,
  isClassifiedsOAuthDevStubProvider,
} from "@autopainel/shared/lib/classifieds-oauth-dev-stub";

import type { ClassifiedsOAuthProviderConfig } from "@/lib/classifieds/oauth-provider";
import { getClassifiedsOAuthProviderConfig } from "@/lib/classifieds/oauth-provider";

interface PlatformClassifiedsOAuthRow {
  is_enabled: boolean;
  authorization_url: string | null;
  token_url: string | null;
  oauth_client_id: string | null;
  oauth_client_secret_encrypted: string | null;
  scope: string | null;
  redirect_uri: string | null;
}

function isPlatformRowConfigured(row: PlatformClassifiedsOAuthRow): boolean {
  return (
    row.is_enabled === true &&
    Boolean(row.authorization_url?.trim()) &&
    Boolean(row.oauth_client_id?.trim())
  );
}

/**
 * Reads platform-managed OAuth settings (enabled by AutoPainel ops in the database).
 * Returns null when disabled or incomplete.
 */
export async function tryResolvePlatformClassifiedsOAuthConfig(
  provider: ClassifiedsProvider,
  panelOrigin?: string,
): Promise<ClassifiedsOAuthProviderConfig | null> {
  if (isClassifiedsOAuthDevStubEnabled() && isClassifiedsOAuthDevStubProvider(provider)) {
    return null;
  }
  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await admin
    .from("platform_classifieds_oauth_providers")
    .select(
      "is_enabled, authorization_url, token_url, oauth_client_id, oauth_client_secret_encrypted, scope, redirect_uri",
    )
    .eq("provider", provider)
    .maybeSingle();

  if (error || !data || !isPlatformRowConfigured(data as PlatformClassifiedsOAuthRow)) {
    return null;
  }

  const row = data as PlatformClassifiedsOAuthRow;
  const envFallback = (() => {
    try {
      return getClassifiedsOAuthProviderConfig(provider);
    } catch {
      return null;
    }
  })();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const rawRedirectUri =
    row.redirect_uri?.trim() ||
    envFallback?.redirectUri ||
    (supabaseUrl ? buildClassifiedsOAuthCallbackUrl(supabaseUrl, provider) : "");

  return {
    provider,
    authorizationUrl: row.authorization_url!.trim(),
    clientId: row.oauth_client_id!.trim(),
    scope: row.scope?.trim() || envFallback?.scope || null,
    redirectUri: normalizeClassifiedsOAuthRedirectUri(provider, rawRedirectUri),
  };
}
