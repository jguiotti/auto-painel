import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import {
  type ClassifiedsOAuthProviderConfig,
  type ClassifiedsProvider,
  getClassifiedsOAuthProviderConfig,
} from "@/lib/classifieds/oauth-provider";

/**
 * Merge env defaults with optional per-dealership OAuth app (authorization URL + client id).
 * Client secret is never used on the authorize URL step — only in Edge token exchange.
 */
export async function resolveClassifiedsOAuthProviderConfigForDealership(params: {
  dealershipId: string;
  provider: ClassifiedsProvider;
}): Promise<ClassifiedsOAuthProviderConfig> {
  const envConfig = getClassifiedsOAuthProviderConfig(params.provider);

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return envConfig;
  }

  const { data: appRow, error } = await admin
    .from("dealership_classifieds_oauth_apps")
    .select("oauth_client_id, authorization_url_override")
    .eq("dealership_id", params.dealershipId)
    .eq("provider", params.provider)
    .maybeSingle();

  if (error || !appRow?.oauth_client_id?.trim()) {
    return envConfig;
  }

  return {
    provider: params.provider,
    authorizationUrl:
      appRow.authorization_url_override?.trim() || envConfig.authorizationUrl,
    clientId: appRow.oauth_client_id.trim(),
    scope: envConfig.scope,
    redirectUri: envConfig.redirectUri,
  };
}
