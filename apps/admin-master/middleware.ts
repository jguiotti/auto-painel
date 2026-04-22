import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { COOKIE_NAME } from "@/lib/auth/cookie-name";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || token.length < 10) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/concessionarias/:path*",
    "/financeiro/:path*",
  ],
};
