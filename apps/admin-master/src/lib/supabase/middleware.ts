import { createSupabaseServerClient } from "@autopainel/shared/lib/supabase";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase auth session from cookies and requires a logged-in user for /painel.
 * Role check (super_admin) runs in requireAdminSession (server layout).
 */
export async function updateAdminSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  if (!requestHeaders.has("x-pathname")) {
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createSupabaseServerClient({
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/painel")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
