import { resolveEffectivePlatformRootDomain } from "../tenant/effective-platform-root-domain";
import { httpHostWithoutPort } from "../tenant/http-host-without-port";

/**
 * Derives the dealership slug from a multitenant host (e.g. `guiotti.autopainel.com.br`
 * with root `autopainel.com.br`, or `guiotti.loja.autopainel.com.br` with root
 * `loja.autopainel.com.br`). Returns null for apex/admin/marketing hosts.
 */
export function extractDealershipSlugFromHost(
  hostHeader: string | null | undefined,
  platformRootDomain: string | null | undefined,
): string | null {
  const hostWithoutPort = httpHostWithoutPort(hostHeader);
  if (!hostWithoutPort) {
    return null;
  }

  const effectiveRoot = resolveEffectivePlatformRootDomain({
    envValue: platformRootDomain,
    hostWithoutPort,
  });
  if (!effectiveRoot) {
    return null;
  }

  const suffix = `.${effectiveRoot.toLowerCase()}`;
  const normalizedHost = hostWithoutPort.toLowerCase();

  if (normalizedHost === effectiveRoot.toLowerCase() || !normalizedHost.endsWith(suffix)) {
    return null;
  }

  const prefix = normalizedHost.slice(0, -suffix.length);
  if (!prefix) {
    return null;
  }

  const slug = prefix.split(".")[0]?.trim();
  return slug && slug.length > 0 ? slug : null;
}
