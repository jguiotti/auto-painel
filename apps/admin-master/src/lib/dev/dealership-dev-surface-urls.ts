import {
  buildLocalhostDealershipPreviewUrls,
  type DealershipSubdomainSurfaceUrls,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";

/** Dev-only panel + storefront URLs (`{slug}.localhost:{port}`). */
export function resolveDealershipDevSurfaceUrls(
  slug: string,
): DealershipSubdomainSurfaceUrls | null {
  return buildLocalhostDealershipPreviewUrls(slug);
}
