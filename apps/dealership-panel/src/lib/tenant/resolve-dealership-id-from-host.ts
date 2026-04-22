import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

function normalizeHost(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isLocalhostHost(hostWithoutPort: string): boolean {
  return (
    hostWithoutPort === "localhost" ||
    hostWithoutPort === "127.0.0.1" ||
    hostWithoutPort.endsWith(".localhost")
  );
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
  } catch {
    return null;
  }

  const host = params.hostHeader;
  if (!host) {
    return null;
  }

  const hostWithoutPort = normalizeHost(host);

  if (
    params.developmentTenantSlug &&
    isLocalhostHost(hostWithoutPort)
  ) {
    const { data, error } = await supabase.rpc(
      "get_dealership_public_by_slug",
      { p_slug: params.developmentTenantSlug },
    );

    if (error) {
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    return row?.id ?? null;
  }

  const { data, error } = await supabase.rpc("resolve_dealership_id_by_host", {
    p_host: host,
    p_platform_root_domain: params.platformRootDomain ?? "",
  });

  if (error) {
    return null;
  }

  return typeof data === "string" ? data : null;
}
