import { headers } from "next/headers";

import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import {
  collectDealershipLogoCandidateUrls,
  resolveDealershipFaviconUrl,
} from "@autopainel/shared/lib/theme/branding";

import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";
import { resolveDealershipIdFromHost } from "@/lib/tenant/resolve-dealership-id-from-host";

export interface AuthDealershipBranding {
  dealershipName: string;
  logoUrl: string | null;
  logoCandidateUrls: string[];
  faviconUrl: string | null;
}

async function fetchBrandingForDealershipId(
  dealershipId: string,
): Promise<AuthDealershipBranding | null> {
  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase.rpc("get_dealership_public_by_id", {
    p_id: dealershipId,
  });

  if (error) {
    return null;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;

  const columnLogoUrl = (record.logo_url as string | null) ?? null;
  const logoCandidateUrls = collectDealershipLogoCandidateUrls(
    record.theme_config,
    columnLogoUrl,
  );

  return {
    dealershipName: String(record.name ?? "Painel"),
    logoUrl: logoCandidateUrls[0] ?? null,
    logoCandidateUrls,
    faviconUrl: resolveDealershipFaviconUrl(record.theme_config, columnLogoUrl),
  };
}

export async function resolveAuthDealershipBranding(): Promise<AuthDealershipBranding | null> {
  const headersList = await headers();
  const host = headersList.get("host");

  let dealershipId = await resolveDealershipIdFromHost({
    hostHeader: host,
    platformRootDomain: process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? null,
    developmentTenantSlug: process.env.DEVELOPMENT_TENANT_SLUG ?? null,
    resolutionMode: "dashboard",
  });

  if (!dealershipId) {
    dealershipId = await getDealershipIdFromCookies();
  }

  if (!dealershipId) {
    return null;
  }

  return fetchBrandingForDealershipId(dealershipId);
}
