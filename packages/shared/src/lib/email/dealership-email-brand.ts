import type { SupabaseClient } from "@supabase/supabase-js";

import {
  collectDealershipLogoCandidateUrls,
  resolveDealershipBranding,
} from "../theme/branding";

export interface DealershipEmailBrand {
  dealershipId: string;
  dealershipName: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  panelUrl: string;
}

export async function loadDealershipEmailBrand(
  supabase: SupabaseClient,
  dealershipId: string,
): Promise<DealershipEmailBrand | null> {
  const { data, error } = await supabase
    .from("dealerships")
    .select("id, name, slug, logo_url, theme_config")
    .eq("id", dealershipId)
    .maybeSingle();

  if (error || !data?.slug || !data.name) {
    return null;
  }

  const logoCandidates = collectDealershipLogoCandidateUrls(
    data.theme_config,
    data.logo_url,
  );
  const theme = resolveDealershipBranding({ theme_config: data.theme_config });
  const slug = String(data.slug).trim().toLowerCase();
  const panelOrigin =
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_URL_TEMPLATE?.replace(
      "{slug}",
      slug,
    ) ?? `https://${slug}.loja.autopainel.com.br`;

  return {
    dealershipId: data.id,
    dealershipName: String(data.name),
    slug,
    logoUrl: logoCandidates[0] ?? null,
    primaryColor: theme.primary,
    panelUrl: panelOrigin.replace(/\/$/, ""),
  };
}
