import { extractDealershipSlugFromHost } from "./extract-dealership-slug-from-host";
import { buildHotjarRecordingTags } from "./build-hotjar-recording-tags";
import { resolveGtmContainerId } from "./gtm-container-id";
import type {
  AutopainelAppSurface,
  AutopainelGtmRuntime,
} from "./gtm-types";
import { httpHostWithoutPort } from "../tenant/http-host-without-port";

interface ResolveAutopainelGtmRuntimeParams {
  appSurface: AutopainelAppSurface;
  hostHeader: string | null;
  platformRootDomain?: string | null;
  dealershipIdCookie?: string | null;
  analyticsConsentGranted?: boolean;
}

export function resolveAutopainelGtmRuntime(
  params: ResolveAutopainelGtmRuntimeParams,
): AutopainelGtmRuntime | null {
  const containerId = resolveGtmContainerId(params.appSurface);
  if (!containerId) {
    return null;
  }

  const platformRoot =
    params.platformRootDomain?.trim() ||
    process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN?.trim() ||
    null;

  const hostWithoutPort = httpHostWithoutPort(params.hostHeader);
  const dealershipSlug = extractDealershipSlugFromHost(
    params.hostHeader,
    platformRoot,
  );

  const analyticsConsentGranted = params.analyticsConsentGranted ?? true;

  const dataLayer = {
    ap_app_surface: params.appSurface,
    ap_page_hostname: hostWithoutPort || null,
    ap_dealership_slug: dealershipSlug,
    ap_dealership_id: params.dealershipIdCookie?.trim() || null,
    ap_analytics_consent: analyticsConsentGranted ? ("granted" as const) : ("denied" as const),
    ap_hotjar_tags: buildHotjarRecordingTags({
      ap_app_surface: params.appSurface,
      ap_dealership_slug: dealershipSlug,
    }),
  };

  return {
    containerId,
    dataLayer,
  };
}
