export const DEFAULT_AUTOPAINEL_SITE_URL = "https://autopainel.com.br";

/**
 * Canonical marketing site origin (no trailing slash).
 * Used for public CTAs when a tenant store is not found.
 */
export function resolveAutopainelSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AUTOPAINEL_SITE_URL?.trim();
  if (!raw) {
    return DEFAULT_AUTOPAINEL_SITE_URL;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_AUTOPAINEL_SITE_URL;
    }
    return url.origin;
  } catch {
    return DEFAULT_AUTOPAINEL_SITE_URL;
  }
}
