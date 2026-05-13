import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import { httpHostWithoutPort } from "@autopainel/shared/lib/tenant/http-host-without-port";
import { resolveEffectivePlatformRootDomain } from "@autopainel/shared/lib/tenant/effective-platform-root-domain";

function normalizeHost(host: string): string {
  return httpHostWithoutPort(host);
}

function isLocalhostHost(hostWithoutPort: string): boolean {
  return (
    hostWithoutPort === "localhost" ||
    hostWithoutPort === "127.0.0.1" ||
    hostWithoutPort.endsWith(".localhost")
  );
}

function isBareLocalhost(hostWithoutPort: string): boolean {
  return hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1";
}

function coerceUuid(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const s = typeof value === "string" ? value : String(value);
  return s.length > 0 ? s : null;
}

interface ResolveDealershipIdParams {
  hostHeader: string | null;
  platformRootDomain: string | null;
  developmentTenantSlug: string | null;
}

export async function resolveDealershipIdFromHost(
  params: ResolveDealershipIdParams,
): Promise<string | null> {
  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch (cause) {
    console.warn("[tenant-host-resolve] anon client unavailable", cause);
    return null;
  }

  const host = params.hostHeader;
  if (!host) {
    return null;
  }

  const hostWithoutPort = normalizeHost(host);

  if (
    params.developmentTenantSlug &&
    isLocalhostHost(hostWithoutPort) &&
    isBareLocalhost(hostWithoutPort)
  ) {
    const { data, error } = await supabase.rpc(
      "get_dealership_public_by_slug",
      { p_slug: params.developmentTenantSlug },
    );

    if (error) {
      console.warn("[tenant-host-resolve] slug RPC failed", {
        rpc: "get_dealership_public_by_slug",
        message: error.message,
        code: error.code,
      });
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    return coerceUuid(row?.id);
  }

  const effectivePlatformRoot = resolveEffectivePlatformRootDomain({
    envValue: params.platformRootDomain,
    hostWithoutPort,
  });

  const { data, error } = await supabase.rpc("resolve_dealership_id_by_host", {
    p_host: hostWithoutPort,
    p_platform_root_domain: effectivePlatformRoot,
  });

  if (error) {
    console.warn("[tenant-host-resolve] host RPC failed", {
      rpc: "resolve_dealership_id_by_host",
      hostRaw: host,
      hostNormalized: hostWithoutPort,
      platformRootDomainEnv: params.platformRootDomain,
      effectivePlatformRoot,
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return coerceUuid(data);
}
