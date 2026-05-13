export interface DealershipSubdomainSurfaceUrls {
  panelUrl: string;
  storefrontUrl: string;
}

function applyTemplate(
  template: string,
  parts: Record<"protocol" | "slug" | "root", string>,
): string {
  return template
    .replace(/\{protocol\}/g, parts.protocol)
    .replace(/\{slug\}/g, parts.slug)
    .replace(/\{root\}/g, parts.root);
}

/**
 * Canonical operator URLs per dealership using the platform wildcard host
 * `{slug}.{NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}` (e.g. production `loja.autopainel.com.br`).
 * Override templates when panel and vitrine sit on different host patterns.
 *
 * When `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` is `localhost` and no URL templates are set,
 * builds `http://{slug}.localhost:{panelPort}` / `:storefrontPort` so Admin Master buttons work in dev.
 */
export function buildDealershipSubdomainSurfaceUrls(
  slug: string,
): DealershipSubdomainSurfaceUrls | null {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const root =
    process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN?.trim().toLowerCase();
  if (!root) {
    return null;
  }

  const panelTemplateEnv =
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE?.trim();
  const storefrontTemplateEnv =
    process.env.NEXT_PUBLIC_CUSTOMER_SITE_URL_TEMPLATE?.trim();

  const localhostMultiTenant =
    root === "localhost" && !panelTemplateEnv && !storefrontTemplateEnv;

  const protocol = localhostMultiTenant
    ? "http"
    : process.env.NEXT_PUBLIC_PLATFORM_URL_USE_HTTP === "true"
      ? "http"
      : "https";

  const panelTemplate =
    panelTemplateEnv || "{protocol}://{slug}.{root}";
  const storefrontTemplate =
    storefrontTemplateEnv || "{protocol}://{slug}.{root}";

  const parts = { protocol, slug: trimmed, root };

  let panelUrl = applyTemplate(panelTemplate, parts);
  let storefrontUrl = applyTemplate(storefrontTemplate, parts);

  if (localhostMultiTenant) {
    const panelPort =
      process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_DEV_PORT?.trim() || "3002";
    const storefrontPort =
      process.env.NEXT_PUBLIC_CUSTOMER_SITE_DEV_PORT?.trim() || "3003";
    panelUrl = `${protocol}://${trimmed}.${root}:${panelPort}`;
    storefrontUrl = `${protocol}://${trimmed}.${root}:${storefrontPort}`;
  }

  return {
    panelUrl,
    storefrontUrl,
  };
}

/**
 * Development multitenant URLs: `http://{slug}.localhost:{panel|storefront port}`.
 * Independent of `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN`, so Admin Master buttons still reach local Next apps when the root env targets production DNS.
 */
export function buildLocalhostDealershipPreviewUrls(
  slug: string,
): DealershipSubdomainSurfaceUrls | null {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const protocol = "http";
  const panelPort =
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_DEV_PORT?.trim() || "3002";
  const storefrontPort =
    process.env.NEXT_PUBLIC_CUSTOMER_SITE_DEV_PORT?.trim() || "3003";

  return {
    panelUrl: `${protocol}://${trimmed}.localhost:${panelPort}`,
    storefrontUrl: `${protocol}://${trimmed}.localhost:${storefrontPort}`,
  };
}
