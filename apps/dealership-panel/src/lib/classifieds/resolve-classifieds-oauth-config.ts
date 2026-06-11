import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";
import {
  type ClassifiedsOAuthProviderConfig,
  tryGetClassifiedsOAuthProviderConfig,
} from "@/lib/classifieds/oauth-provider";
import { tryResolvePlatformClassifiedsOAuthConfig } from "@/lib/classifieds/resolve-platform-classifieds-oauth";

/**
 * Resolves OAuth authorize-step config: platform settings → env → optional per-dealership client id override.
 */
export async function resolveClassifiedsOAuthProviderConfigForDealership(params: {
  dealershipId: string;
  provider: ClassifiedsProvider;
  panelOrigin?: string;
}): Promise<ClassifiedsOAuthProviderConfig> {
  const platformConfig = await tryResolvePlatformClassifiedsOAuthConfig(
    params.provider,
    params.panelOrigin,
  );
  const envConfig = tryGetClassifiedsOAuthProviderConfig(params.provider, {
    panelOrigin: params.panelOrigin,
  });
  const baseConfig = platformConfig ?? envConfig;

  if (!baseConfig) {
    throw new ClassifiedsOAuthNotConfiguredError(params.provider);
  }

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return baseConfig;
  }

  const { data: appRow, error } = await admin
    .from("dealership_classifieds_oauth_apps")
    .select("oauth_client_id, authorization_url_override")
    .eq("dealership_id", params.dealershipId)
    .eq("provider", params.provider)
    .maybeSingle();

  if (error || !appRow?.oauth_client_id?.trim()) {
    return baseConfig;
  }

  return {
    provider: params.provider,
    authorizationUrl:
      appRow.authorization_url_override?.trim() || baseConfig.authorizationUrl,
    clientId: appRow.oauth_client_id.trim(),
    scope: baseConfig.scope,
    redirectUri: baseConfig.redirectUri,
  };
}
