import { getSupabaseUrl } from "@autopainel/shared/lib/supabase";

export const CLASSIFIEDS_PROVIDERS = ["olx", "webmotors"] as const;

export type ClassifiedsProvider = (typeof CLASSIFIEDS_PROVIDERS)[number];

export interface ClassifiedsOAuthProviderConfig {
  provider: ClassifiedsProvider;
  authorizationUrl: string;
  clientId: string;
  scope: string | null;
  redirectUri: string;
}

function requireEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function resolveDefaultCallbackUrl(provider: ClassifiedsProvider): string {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/functions/v1/classifieds-oauth-callback?provider=${provider}`;
}

export function parseClassifiedsProvider(
  raw: string | null | undefined,
): ClassifiedsProvider | null {
  if (!raw) {
    return null;
  }
  if (raw === "olx" || raw === "webmotors") {
    return raw;
  }
  return null;
}

export function getClassifiedsOAuthProviderConfig(
  provider: ClassifiedsProvider,
): ClassifiedsOAuthProviderConfig {
  if (provider === "olx") {
    return {
      provider,
      authorizationUrl: requireEnvVar("OLX_OAUTH_AUTHORIZATION_URL"),
      clientId: requireEnvVar("OLX_OAUTH_CLIENT_ID"),
      scope: process.env.OLX_OAUTH_SCOPE?.trim() || null,
      redirectUri:
        process.env.OLX_OAUTH_REDIRECT_URI?.trim() ||
        resolveDefaultCallbackUrl(provider),
    };
  }

  return {
    provider,
    authorizationUrl: requireEnvVar("WEBMOTORS_OAUTH_AUTHORIZATION_URL"),
    clientId: requireEnvVar("WEBMOTORS_OAUTH_CLIENT_ID"),
    scope: process.env.WEBMOTORS_OAUTH_SCOPE?.trim() || null,
    redirectUri:
      process.env.WEBMOTORS_OAUTH_REDIRECT_URI?.trim() ||
      resolveDefaultCallbackUrl(provider),
  };
}
