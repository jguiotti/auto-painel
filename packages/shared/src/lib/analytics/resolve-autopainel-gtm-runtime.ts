import { extractDealershipSlugFromHost } from "./extract-dealership-slug-from-host";
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

  return {
    containerId,
    dataLayer: {
      ap_app_surface: params.appSurface,
      ap_page_hostname: hostWithoutPort || null,
      ap_dealership_slug: dealershipSlug,
      ap_dealership_id: params.dealershipIdCookie?.trim() || null,
    },
  };
}
