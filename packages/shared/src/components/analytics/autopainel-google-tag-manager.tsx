import { cookies, headers } from "next/headers";

import { isInternalAnalyticsTrafficFromHeaders } from "../../lib/analytics/is-internal-analytics-traffic";
import { resolveAutopainelGtmRuntime } from "../../lib/analytics/resolve-autopainel-gtm-runtime";
import type { AutopainelAppSurface } from "../../lib/analytics/gtm-types";
import { AnalyticsExclusionBootstrap } from "./analytics-exclusion-bootstrap";
import { AutopainelHotjarRecordingTags } from "./autopainel-hotjar-recording-tags";
import {
  GoogleTagManagerBody,
  GoogleTagManagerDataLayerBootstrap,
  GoogleTagManagerHead,
} from "./google-tag-manager";
import { GoogleTagManagerConsentDefault } from "./google-tag-manager-consent-default";

const DEALERSHIP_ID_COOKIE = "ap-dealership-id";

interface AutopainelGoogleTagManagerHeadProps {
  appSurface: AutopainelAppSurface;
  platformRootDomain?: string | null;
  /** Defaults to true (painel/admin). Vitrine/marketing pass cookie state. */
  analyticsConsentGranted?: boolean;
}

export async function AutopainelGoogleTagManagerHead({
  appSurface,
  platformRootDomain,
  analyticsConsentGranted = true,
}: AutopainelGoogleTagManagerHeadProps) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const isInternalTraffic = isInternalAnalyticsTrafficFromHeaders(headerStore);

  const runtime = resolveAutopainelGtmRuntime({
    appSurface,
    hostHeader: headerStore.get("host"),
    platformRootDomain,
    dealershipIdCookie: cookieStore.get(DEALERSHIP_ID_COOKIE)?.value ?? null,
    analyticsConsentGranted,
    isInternalTraffic,
  });

  if (!runtime) {
    return null;
  }

  const effectiveAnalyticsGranted =
    !isInternalTraffic && analyticsConsentGranted;

  return (
    <>
      {isInternalTraffic ? <AnalyticsExclusionBootstrap /> : null}
      <GoogleTagManagerConsentDefault analyticsGranted={effectiveAnalyticsGranted} />
      <GoogleTagManagerDataLayerBootstrap context={runtime.dataLayer} />
      <GoogleTagManagerHead containerId={runtime.containerId} />
    </>
  );
}

interface AutopainelGoogleTagManagerBodyProps {
  appSurface: AutopainelAppSurface;
  platformRootDomain?: string | null;
  analyticsConsentGranted?: boolean;
}

export async function AutopainelGoogleTagManagerBody({
  appSurface,
  platformRootDomain,
  analyticsConsentGranted = true,
}: AutopainelGoogleTagManagerBodyProps) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const isInternalTraffic = isInternalAnalyticsTrafficFromHeaders(headerStore);

  const runtime = resolveAutopainelGtmRuntime({
    appSurface,
    hostHeader: headerStore.get("host"),
    platformRootDomain,
    dealershipIdCookie: cookieStore.get(DEALERSHIP_ID_COOKIE)?.value ?? null,
    analyticsConsentGranted,
    isInternalTraffic,
  });

  if (!runtime) {
    return null;
  }

  const effectiveAnalyticsGranted =
    !isInternalTraffic && analyticsConsentGranted;

  return (
    <>
      <GoogleTagManagerBody containerId={runtime.containerId} />
      <AutopainelHotjarRecordingTags
        tags={runtime.dataLayer.ap_hotjar_tags}
        enabled={effectiveAnalyticsGranted}
      />
    </>
  );
}
