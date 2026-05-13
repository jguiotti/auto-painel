import { createSupabaseServerClient } from "@autopainel/shared/lib/supabase";
import { allowCookieTenantFallbackHost } from "@autopainel/shared/lib/tenant/allow-cookie-tenant-fallback-host";
import { looksLikeDealershipUuid } from "@autopainel/shared/lib/tenant/looks-like-dealership-uuid";
import { type NextRequest, NextResponse } from "next/server";

import {
  COOKIE_DEALERSHIP_ID,
  DEALERSHIP_NOT_FOUND_PATH,
} from "@/lib/tenant/constants";
import { pathRequiresDealershipResolution } from "@/lib/tenant/path-requires-tenant";
import { resolveDealershipIdFromHost } from "@/lib/tenant/resolve-dealership-id-from-host";

function forwardCookies(from: NextResponse, to: NextResponse) {
  for (const { name, value, ...options } of from.cookies.getAll()) {
    to.cookies.set(name, value, options);
  }
}

export async function handleAuthAndTenant(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  function nextWithPath(): NextResponse {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-dashboard-path", pathname);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let response = nextWithPath();

  const supabase = createSupabaseServerClient({
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      response = nextWithPath();
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    },
  });

  await supabase.auth.getUser();

  if (!pathRequiresDealershipResolution(pathname)) {
    return response;
  }

  const hostHeader = request.headers.get("host");

  /** Canonical: Host maps to dealership (e.g. slug.autopainel.com.br). */
  let dealershipId = await resolveDealershipIdFromHost({
    hostHeader,
    platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
    developmentTenantSlug: null,
    resolutionMode: "dashboard",
  });

  if (!dealershipId && allowCookieTenantFallbackHost(hostHeader)) {
    const cookieId = request.cookies.get(COOKIE_DEALERSHIP_ID)?.value;
    if (cookieId && looksLikeDealershipUuid(cookieId)) {
      dealershipId = cookieId;
    }
  }

  if (!dealershipId) {
    const redirectResponse = NextResponse.redirect(
      new URL(DEALERSHIP_NOT_FOUND_PATH, request.url),
    );
    forwardCookies(response, redirectResponse);
    return redirectResponse;
  }

  response.cookies.set(COOKIE_DEALERSHIP_ID, dealershipId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
