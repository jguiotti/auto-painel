import { buildDealershipSubdomainSurfaceUrls } from "../tenant/dealership-subdomain-surface-urls";

const DEFAULT_ADMIN_ORIGIN = "https://admin.autopainel.com.br";

/**
 * Base URL for admin-master auth email redirects (recovery / invite).
 */
export function resolveAdminAuthRedirectOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_ADMIN_AUTH_REDIRECT_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_SITE_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }

  return DEFAULT_ADMIN_ORIGIN;
}

/**
 * Panel origin for a dealership slug (multitenant). Falls back to legacy single-origin env.
 */
export function resolveDealershipPanelAuthRedirectOrigin(slug: string): string | null {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const built = buildDealershipSubdomainSurfaceUrls(trimmed);
  if (built?.panelUrl) {
    return built.panelUrl.replace(/\/$/, "");
  }

  const legacy =
    process.env.NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN?.trim() ??
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_URL?.trim();

  return legacy ? legacy.replace(/\/$/, "") : null;
}
