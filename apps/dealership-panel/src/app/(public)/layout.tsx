import { LEGACY_OPTIONAL_FEATURE_KEYS } from "@autopainel/shared/lib/dealership-features";
import { parseStorefrontLayoutId } from "@autopainel/shared/types";

import { PublicSiteShell } from "@/components/public/PublicSiteShell";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export default async function PublicSiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dealershipId = await getDealershipIdFromCookies();
  const supabase = await createSupabaseServerClient();

  let dealership = null;
  if (dealershipId) {
    const [pubRes, featRes] = await Promise.all([
      supabase.rpc("get_dealership_public_by_id", {
        p_id: dealershipId,
      }),
      supabase.rpc("effective_feature_keys_for_active_dealership", {
        p_dealership_id: dealershipId,
      }),
    ]);

    const row = Array.isArray(pubRes.data) ? pubRes.data[0] : null;
    if (row) {
      const r = row as Record<string, unknown>;

      let enabled_features: string[] | null = null;
      if (!featRes.error && Array.isArray(featRes.data)) {
        enabled_features = featRes.data.filter(
          (x): x is string => typeof x === "string",
        );
      } else {
        const raw = (r.enabled_features as string[] | null) ?? null;
        enabled_features =
          !raw || raw.length === 0
            ? [...LEGACY_OPTIONAL_FEATURE_KEYS]
            : raw.filter((x): x is string => typeof x === "string");
      }

      dealership = {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        logo_url: (row.logo_url as string | null) ?? null,
        theme_settings: row.theme_settings,
        theme_config: row.theme_config,
        content_config: row.content_config,
        enabled_features,
        whatsapp_number: (row.whatsapp_number as string | null) ?? null,
        contact_email: (row.contact_email as string | null) ?? null,
        layout_id: parseStorefrontLayoutId(
          (row as Record<string, unknown>).layout_id,
        ),
      };
    }
  }

  return <PublicSiteShell dealership={dealership}>{children}</PublicSiteShell>;
}
