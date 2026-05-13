/**
 * Bare `localhost` / `127.0.0.1` multi-tenant resolution needs a forced dealership slug in local dev.
 * Next.js Edge middleware often does not expose non-`NEXT_PUBLIC_*` env vars, so `DEVELOPMENT_TENANT_SLUG`
 * may be undefined at runtime — `NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG` is the reliable fallback.
 */
export function readDevelopmentTenantSlugFromEnv(): string | null {
  const fromPrivate = process.env.DEVELOPMENT_TENANT_SLUG?.trim() ?? "";
  if (fromPrivate.length > 0) {
    return fromPrivate;
  }
  const fromPublic = process.env.NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG?.trim() ?? "";
  if (fromPublic.length > 0) {
    return fromPublic;
  }
  return null;
}

function normalizeHostWithoutPort(host: string): string {
  return host.split(":")[0]?.toLowerCase().trim() ?? "";
}

/**
 * When devs open the URL printed by Next (`http://localhost:PORT`), tenant resolution by host fails
 * (no subdomain). If a dev slug is configured, redirect once to `http://{slug}.localhost:PORT`.
 */
export function buildBareLocalhostTenantRedirectUrl(options: {
  requestUrl: URL;
  hostHeader: string | null;
  developmentTenantSlug: string | null;
}): URL | null {
  const slug = options.developmentTenantSlug?.trim() ?? "";
  if (!slug) {
    return null;
  }
  const hostRaw = options.hostHeader?.trim() ?? "";
  if (!hostRaw) {
    return null;
  }
  const hostWithoutPort = normalizeHostWithoutPort(hostRaw);
  if (hostWithoutPort !== "localhost" && hostWithoutPort !== "127.0.0.1") {
    return null;
  }
  const next = new URL(options.requestUrl.href);
  next.hostname = `${slug}.localhost`;
  return next;
}
