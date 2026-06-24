import { getSupabaseUrl } from "@autopainel/shared/lib/supabase";
import {
  buildClassifiedsOAuthCallbackUrl,
  normalizeClassifiedsOAuthRedirectUri,
} from "@autopainel/shared/lib/classifieds-oauth-redirect";
import {
  buildClassifiedsOAuthDevAuthorizePath,
  buildClassifiedsOAuthDevCallbackPath,
  CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_ID,
  isClassifiedsOAuthDevStubEnabled,
  isClassifiedsOAuthDevStubProvider,
  type ClassifiedsOAuthDevStubProvider,
} from "@autopainel/shared/lib/classifieds-oauth-dev-stub";

export const CLASSIFIEDS_OAUTH_PROVIDERS = ["olx", "webmotors"] as const;

export type ClassifiedsOAuthProvider = (typeof CLASSIFIEDS_OAUTH_PROVIDERS)[number];

/** @deprecated Use ClassifiedsOAuthProvider for OAuth flows. */
export const CLASSIFIEDS_PROVIDERS = CLASSIFIEDS_OAUTH_PROVIDERS;

/** @deprecated Use ClassifiedsOAuthProvider — OAuth-ready portals only. */
export type ClassifiedsProvider = ClassifiedsOAuthProvider;

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
  return normalizeClassifiedsOAuthRedirectUri(
    provider,
    buildClassifiedsOAuthCallbackUrl(supabaseUrl, provider),
  );
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

function resolveDevStubOAuthConfig(
  provider: ClassifiedsOAuthDevStubProvider,
  panelOrigin: string,
): ClassifiedsOAuthProviderConfig {
  const origin = panelOrigin.replace(/\/$/, "");
  return {
    provider,
    authorizationUrl: `${origin}${buildClassifiedsOAuthDevAuthorizePath(provider)}`,
    clientId: CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_ID,
    scope: "classifieds.dev_stub",
    redirectUri: `${origin}${buildClassifiedsOAuthDevCallbackPath(provider)}`,
  };
}

function resolveProductionOAuthConfig(provider: ClassifiedsProvider): ClassifiedsOAuthProviderConfig {
  if (provider === "olx") {
    return {
      provider,
      authorizationUrl: requireEnvVar("OLX_OAUTH_AUTHORIZATION_URL"),
      clientId: requireEnvVar("OLX_OAUTH_CLIENT_ID"),
      scope: process.env.OLX_OAUTH_SCOPE?.trim() || null,
      redirectUri: normalizeClassifiedsOAuthRedirectUri(
        provider,
        process.env.OLX_OAUTH_REDIRECT_URI?.trim() ||
          resolveDefaultCallbackUrl(provider),
      ),
    };
  }

  if (provider === "webmotors") {
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

  throw new Error(`Unsupported classifieds OAuth provider: ${provider}`);
}

/**
 * Env-only defaults for classifieds OAuth (used when no per-dealership row exists).
 * See {@link resolveClassifiedsOAuthProviderConfigForDealership} for merged config.
 */
export function tryGetClassifiedsOAuthProviderConfig(
  provider: ClassifiedsProvider,
  options?: { panelOrigin?: string },
): ClassifiedsOAuthProviderConfig | null {
  try {
    return getClassifiedsOAuthProviderConfig(provider, options);
  } catch {
    return null;
  }
}

export function getClassifiedsOAuthProviderConfig(
  provider: ClassifiedsProvider,
  options?: { panelOrigin?: string },
): ClassifiedsOAuthProviderConfig {
  if (
    isClassifiedsOAuthDevStubEnabled() &&
    isClassifiedsOAuthDevStubProvider(provider) &&
    options?.panelOrigin?.trim()
  ) {
    return resolveDevStubOAuthConfig(provider, options.panelOrigin.trim());
  }
  return resolveProductionOAuthConfig(provider);
}
