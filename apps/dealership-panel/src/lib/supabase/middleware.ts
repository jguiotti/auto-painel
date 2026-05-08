import { createSupabaseServerClient } from "@autopainel/shared/lib/supabase";
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

  if (pathRequiresDealershipResolution(pathname)) {
    const resolutionMode =
      pathname.startsWith("/painel") || pathname.startsWith("/login")
        ? "dashboard"
        : "public";

    const dealershipId = await resolveDealershipIdFromHost({
      hostHeader: request.headers.get("host"),
      platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
      developmentTenantSlug: process.env.DEVELOPMENT_TENANT_SLUG ?? null,
      resolutionMode,
    });

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
  }

  return response;
}
