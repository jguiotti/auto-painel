import { resolveClientIpFromHeaders } from "./resolve-client-ip-from-headers";

function parseInternalTrafficIps(): string[] {
  const raw = process.env.GA4_INTERNAL_TRAFFIC_IPS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function isInternalAnalyticsTrafficIp(clientIp: string | null): boolean {
  if (!clientIp) {
    return false;
  }

  const blockedIps = parseInternalTrafficIps();
  return blockedIps.includes(clientIp);
}

export function isInternalAnalyticsTrafficFromHeaders(
  headers: Pick<Headers, "get">,
): boolean {
  return isInternalAnalyticsTrafficIp(resolveClientIpFromHeaders(headers));
}
