type ClassifiedsProvider = "olx" | "webmotors" | "icarros";

/**
 * Classifieds portals register exact redirect URIs (often including `?provider=`).
 * Keep the URI unchanged so authorize and token exchange match portal registration.
 */
export function normalizeClassifiedsOAuthRedirectUri(
  _provider: ClassifiedsProvider,
  redirectUri: string,
): string {
  return redirectUri;
}
