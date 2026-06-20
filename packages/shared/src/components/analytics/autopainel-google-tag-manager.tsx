import { cookies, headers } from "next/headers";

import { isInternalAnalyticsTrafficFromHeaders } from "../../lib/analytics/is-internal-analytics-traffic";
import { resolveAutopainelGtmRuntime } from "../../lib/analytics/resolve-autopainel-gtm-runtime";
import type { AutopainelAppSurface } from "../../lib/analytics/gtm-types";
import { AnalyticsExclusionBootstrap } from "./analytics-exclusion-bootstrap";
import {
  GoogleTagManagerBody,
  GoogleTagManagerDataLayerBootstrap,
  GoogleTagManagerHead,
} from "./google-tag-manager";

const DEALERSHIP_ID_COOKIE = "ap-dealership-id";

interface AutopainelGoogleTagManagerHeadProps {
  appSurface: AutopainelAppSurface;
  platformRootDomain?: string | null;
}

export async function AutopainelGoogleTagManagerHead({
  appSurface,
  platformRootDomain,
}: AutopainelGoogleTagManagerHeadProps) {
  const headerStore = await headers();
  const cookieStore = await cookies();

  if (isInternalAnalyticsTrafficFromHeaders(headerStore)) {
    return <AnalyticsExclusionBootstrap />;
  }

  const runtime = resolveAutopainelGtmRuntime({
    appSurface,
    hostHeader: headerStore.get("host"),
    platformRootDomain,
    dealershipIdCookie: cookieStore.get(DEALERSHIP_ID_COOKIE)?.value ?? null,
  });

  if (!runtime) {
    return null;
  }

  return (
    <>
      <GoogleTagManagerDataLayerBootstrap context={runtime.dataLayer} />
      <GoogleTagManagerHead containerId={runtime.containerId} />
    </>
  );
}

interface AutopainelGoogleTagManagerBodyProps {
  appSurface: AutopainelAppSurface;
  platformRootDomain?: string | null;
}

export async function AutopainelGoogleTagManagerBody({
  appSurface,
  platformRootDomain,
}: AutopainelGoogleTagManagerBodyProps) {
  const headerStore = await headers();
  const cookieStore = await cookies();

  if (isInternalAnalyticsTrafficFromHeaders(headerStore)) {
    return null;
  }

  const runtime = resolveAutopainelGtmRuntime({
    appSurface,
    hostHeader: headerStore.get("host"),
    platformRootDomain,
    dealershipIdCookie: cookieStore.get(DEALERSHIP_ID_COOKIE)?.value ?? null,
  });

  if (!runtime) {
    return null;
  }

  return <GoogleTagManagerBody containerId={runtime.containerId} />;
}
