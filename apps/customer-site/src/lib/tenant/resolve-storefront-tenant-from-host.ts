import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import { httpHostWithoutPort } from "@autopainel/shared/lib/tenant/http-host-without-port";
import { resolveEffectivePlatformRootDomain } from "@autopainel/shared/lib/tenant/effective-platform-root-domain";

import type {
  ResolvedStorefrontTenant,
  StorefrontTenantStatus,
} from "@/lib/tenant/constants";

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

function coerceStatus(value: unknown): StorefrontTenantStatus | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "active" ||
    normalized === "suspended" ||
    normalized === "pending_setup" ||
    normalized === "churned"
  ) {
    return normalized;
  }
  return null;
}

function mapTenantRow(row: Record<string, unknown> | null): ResolvedStorefrontTenant | null {
  if (!row) {
    return null;
  }
  const dealershipId = row.dealership_id ?? row.id;
  const slug = row.dealership_slug ?? row.slug;
  const name = row.dealership_name ?? row.name;
  const status = coerceStatus(row.dealership_status ?? row.status);

  if (
    typeof dealershipId !== "string" ||
    dealershipId.length === 0 ||
    typeof slug !== "string" ||
    typeof name !== "string" ||
    !status
  ) {
    return null;
  }

  return {
    dealershipId,
    slug,
    name,
    status,
  };
}

interface ResolveStorefrontTenantParams {
  hostHeader: string | null;
  platformRootDomain: string | null;
  developmentTenantSlug: string | null;
}

export async function resolveStorefrontTenantFromHost(
  params: ResolveStorefrontTenantParams,
): Promise<ResolvedStorefrontTenant | null> {
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
    const { data, error } = await supabase.rpc("get_dealership_storefront_tenant_by_slug", {
      p_slug: params.developmentTenantSlug,
    });

    if (error) {
      console.warn("[tenant-host-resolve] slug RPC failed", {
        rpc: "get_dealership_storefront_tenant_by_slug",
        message: error.message,
        code: error.code,
      });
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    return mapTenantRow(row as Record<string, unknown> | null);
  }

  const effectivePlatformRoot = resolveEffectivePlatformRootDomain({
    envValue: params.platformRootDomain,
    hostWithoutPort,
  });

  const { data, error } = await supabase.rpc("resolve_dealership_storefront_tenant", {
    p_host: hostWithoutPort,
    p_platform_root_domain: effectivePlatformRoot,
  });

  if (error) {
    console.warn("[tenant-host-resolve] host RPC failed", {
      rpc: "resolve_dealership_storefront_tenant",
      hostRaw: host,
      hostNormalized: hostWithoutPort,
      platformRootDomainEnv: params.platformRootDomain,
      effectivePlatformRoot,
      message: error.message,
      code: error.code,
    });
    return null;
  }

  const row = Array.isArray(data) ? data[0] : null;
  return mapTenantRow(row as Record<string, unknown> | null);
}
