import {
  buildBareLocalhostTenantRedirectUrl,
  readDevelopmentTenantSlugFromEnv,
} from "@autopainel/shared/lib/tenant/development-tenant-slug-env";
import { type NextRequest, NextResponse } from "next/server";

import {
  COOKIE_DEALERSHIP_ID,
  HEADER_DEALERSHIP_ID,
  HEADER_DEALERSHIP_STATUS,
  INACTIVE_STOREFRONT_PATH,
} from "@/lib/tenant/constants";
import { pathRequiresDealershipResolution } from "@/lib/tenant/path-requires-tenant";
import { resolveStorefrontTenantFromHost } from "@/lib/tenant/resolve-storefront-tenant-from-host";

const DEALERSHIP_NOT_FOUND_PATH = "/erro/concessionaria";

export async function handleTenantFromHost(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathRequiresDealershipResolution(pathname)) {
    return NextResponse.next();
  }

  const developmentTenantSlug = readDevelopmentTenantSlugFromEnv();
  const tenantRedirect = buildBareLocalhostTenantRedirectUrl({
    requestUrl: request.nextUrl,
    hostHeader: request.headers.get("host"),
    developmentTenantSlug,
  });
  if (tenantRedirect) {
    return NextResponse.redirect(tenantRedirect);
  }

  const tenant = await resolveStorefrontTenantFromHost({
    hostHeader: request.headers.get("host"),
    platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
    developmentTenantSlug,
  });

  if (!tenant) {
    return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_DEALERSHIP_ID, tenant.dealershipId);
  requestHeaders.set(HEADER_DEALERSHIP_STATUS, tenant.status);

  if (tenant.status !== "active" && pathname !== INACTIVE_STOREFRONT_PATH) {
    const inactiveRedirect = NextResponse.redirect(
      new URL(INACTIVE_STOREFRONT_PATH, request.url),
    );
    inactiveRedirect.cookies.set(COOKIE_DEALERSHIP_ID, tenant.dealershipId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return inactiveRedirect;
  }

  if (tenant.status === "active" && pathname === INACTIVE_STOREFRONT_PATH) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(COOKIE_DEALERSHIP_ID, tenant.dealershipId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
