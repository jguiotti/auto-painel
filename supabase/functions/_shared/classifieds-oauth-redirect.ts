type ClassifiedsProvider = "olx" | "webmotors" | "icarros";

/**
 * OLX registers redirect URIs without query strings. Provider is resolved from OAuth `state`.
 */
export function normalizeClassifiedsOAuthRedirectUri(
  provider: ClassifiedsProvider,
  redirectUri: string,
): string {
  if (provider !== "olx") {
    return redirectUri;
  }

  try {
    const url = new URL(redirectUri);
    if (url.pathname.includes("classifieds-oauth-callback")) {
      url.search = "";
      return url.toString();
    }
  } catch {
    return redirectUri;
  }

  return redirectUri;
}
