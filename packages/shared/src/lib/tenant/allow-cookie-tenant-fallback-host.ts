import { httpHostWithoutPort } from "./http-host-without-port";

/**
 * When the dashboard host does not map to a tenant (bare localhost, loopback, LAN IP), we may
 * reuse the existing `ap-dealership-id` cookie after the browser visited the canonical subdomain once.
 * Operators should rely on hostname or custom-domain resolution; LAN opt-in avoids surprising behaviour.
 */
export function allowCookieTenantFallbackHost(hostHeader: string | null | undefined): boolean {
  const host = httpHostWithoutPort(hostHeader);
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1"
  ) {
    return true;
  }
  if (process.env.NEXT_PUBLIC_ALLOW_LAN_HOST_TENANT_COOKIE === "true") {
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return true;
    }
  }
  return false;
}
