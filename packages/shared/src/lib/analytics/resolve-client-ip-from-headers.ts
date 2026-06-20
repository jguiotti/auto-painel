/**
 * Resolves the client IP from reverse-proxy headers (Vercel, Cloudflare, etc.).
 */
export function resolveClientIpFromHeaders(
  headers: Pick<Headers, "get">,
): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstHop = forwarded.split(",")[0]?.trim();
    if (firstHop && firstHop.length > 0) {
      return firstHop;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0) {
    return realIp;
  }

  return null;
}
