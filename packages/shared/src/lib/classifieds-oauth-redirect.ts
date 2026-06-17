import type { ClassifiedsProvider } from "./dealership-features";

/**
 * OLX registers a bare callback URL and replaces the entire query string on redirect.
 * Other portals may keep `?provider=` in the registered URI.
 */
export function buildClassifiedsOAuthCallbackUrl(
  supabaseUrl: string,
  provider: ClassifiedsProvider,
): string {
  const base = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/classifieds-oauth-callback`;
  if (provider === "olx") {
    return base;
  }
  return `${base}?provider=${provider}`;
}

export function normalizeClassifiedsOAuthRedirectUri(
  provider: ClassifiedsProvider,
  redirectUri: string,
): string {
  if (provider !== "olx") {
    return redirectUri;
  }

  try {
    const url = new URL(redirectUri);
    url.search = "";
    return url.toString().replace(/\/$/, "") || redirectUri;
  } catch {
    return redirectUri;
  }
}
