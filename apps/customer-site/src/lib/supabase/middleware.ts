import { type NextRequest, NextResponse } from "next/server";

import {
  COOKIE_DEALERSHIP_ID,
  HEADER_DEALERSHIP_ID,
} from "@/lib/tenant/constants";
import { pathRequiresDealershipResolution } from "@/lib/tenant/path-requires-tenant";
import { resolveDealershipIdFromHost } from "@/lib/tenant/resolve-dealership-id-from-host";

const DEALERSHIP_NOT_FOUND_PATH = "/erro/concessionaria";

export async function handleTenantFromHost(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathRequiresDealershipResolution(pathname)) {
    return NextResponse.next();
  }

  const dealershipId = await resolveDealershipIdFromHost({
    hostHeader: request.headers.get("host"),
    platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
    developmentTenantSlug: process.env.DEVELOPMENT_TENANT_SLUG ?? null,
  });

  if (!dealershipId) {
    return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_DEALERSHIP_ID, dealershipId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(COOKIE_DEALERSHIP_ID, dealershipId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
