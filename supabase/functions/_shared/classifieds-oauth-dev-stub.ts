/** Mirror of packages/shared/src/lib/classifieds-oauth-dev-stub.ts for Edge runtime. */

export const CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_ID = "autopainel-dev-stub-client";
export const CLASSIFIEDS_OAUTH_DEV_STUB_CLIENT_SECRET = "autopainel-dev-stub-secret";
export const CLASSIFIEDS_OAUTH_DEV_STUB_CODE_PREFIX = "autopainel_dev_stub:";

export type ClassifiedsOAuthDevStubProvider = "olx" | "webmotors" | "icarros";

export function isClassifiedsOAuthDevStubEnabled(): boolean {
  const flag = Deno.env.get("CLASSIFIEDS_OAUTH_DEV_STUB")?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function isClassifiedsOAuthDevStubProvider(
  provider: string,
): provider is ClassifiedsOAuthDevStubProvider {
  return provider === "olx" || provider === "webmotors" || provider === "icarros";
}

export function parseClassifiedsOAuthDevStubCode(code: string): {
  provider: ClassifiedsOAuthDevStubProvider;
  state: string;
} | null {
  if (!code.startsWith(CLASSIFIEDS_OAUTH_DEV_STUB_CODE_PREFIX)) {
    return null;
  }
  const rest = code.slice(CLASSIFIEDS_OAUTH_DEV_STUB_CODE_PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon < 1) {
    return null;
  }
  const provider = rest.slice(0, colon);
  const state = rest.slice(colon + 1);
  if (!isClassifiedsOAuthDevStubProvider(provider) || !state.trim()) {
    return null;
  }
  return { provider, state };
}

export function buildClassifiedsOAuthDevStubTokenPayload(provider: ClassifiedsOAuthDevStubProvider): {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
} {
  return {
    access_token: `dev_stub_access_${provider}_${crypto.randomUUID()}`,
    refresh_token: `dev_stub_refresh_${provider}_${crypto.randomUUID()}`,
    expires_in: 3600,
    scope: "classifieds.dev_stub",
  };
}
