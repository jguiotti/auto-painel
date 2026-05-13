/**
 * Host→slug RPCs require the configured platform root (e.g. `autopainel.com.br` or `localhost`).
 * Next.js Edge middleware often omits `NEXT_PUBLIC_*` env vars even when `.env.local` is correct.
 *
 * **RFC 6761 `*.localhost`:** When the request host is `{slug}.localhost` (not bare `localhost`),
 * the effective root **must** be `localhost` so Postgres `resolve_dealership_id_by_host*` can match
 * the suffix `.localhost` — even if `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN` is already set to the
 * production domain (common in local dev). Otherwise `guiotti.localhost` is compared against
 * `.autopainel.com.br` and resolution always returns null.
 */
export function resolveEffectivePlatformRootDomain(options: {
  envValue: string | null | undefined;
  hostWithoutPort: string;
}): string {
  const h = options.hostWithoutPort.toLowerCase();

  if (h.endsWith(".localhost") && h !== "localhost") {
    return "localhost";
  }

  const raw = options.envValue?.trim() ?? "";
  if (raw.length > 0) {
    const noPort = raw.split(":")[0]?.toLowerCase().trim() ?? "";
    return noPort;
  }

  return "";
}
