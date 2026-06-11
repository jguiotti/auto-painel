import type { NextRequest } from "next/server";

/** Panel origin for OAuth redirects — prefer Host header (tenant subdomain) over URL object origin. */
export function resolveDealershipPanelOrigin(request: NextRequest): string {
  const host = request.headers.get("host")?.trim();
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
  }
  return request.nextUrl.origin;
}
