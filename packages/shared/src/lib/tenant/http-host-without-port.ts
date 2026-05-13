/**
 * Host header value without port (`Host: {slug}.localhost:3002` → `{slug}.localhost`).
 * Supports bracketed IPv6 with port (`[::1]:3002` → `::1`).
 */
export function httpHostWithoutPort(hostHeader: string | null | undefined): string {
  const raw = hostHeader?.trim() ?? "";
  if (!raw) {
    return "";
  }
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    if (end > 0) {
      return raw.slice(1, end).toLowerCase();
    }
  }
  const beforeColon = raw.split(":")[0]?.trim() ?? "";
  return beforeColon.toLowerCase();
}
