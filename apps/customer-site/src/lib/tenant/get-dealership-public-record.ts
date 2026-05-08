import "server-only";

import { cache } from "react";

import { LEGACY_OPTIONAL_FEATURE_KEYS } from "@autopainel/shared/lib/dealership-features";
import { parseStorefrontLayoutId } from "@autopainel/shared/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";
import type { DealershipPublicRecord } from "@/types/dealership-public";

export const getDealershipPublicRecord = cache(
  async (): Promise<DealershipPublicRecord | null> => {
    const dealershipId = await getResolvedDealershipId();
    if (!dealershipId) {
      return null;
    }

    const supabase = await createSupabaseServerClient();

    const [pubRes, featRes] = await Promise.all([
      supabase.rpc("get_dealership_public_by_id", {
        p_id: dealershipId,
      }),
      supabase.rpc("effective_feature_keys_for_active_dealership", {
        p_dealership_id: dealershipId,
      }),
    ]);

    const row = Array.isArray(pubRes.data) ? pubRes.data[0] : null;
    if (!row || typeof row !== "object") {
      return null;
    }

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

    return {
      id: String(r.id ?? ""),
      name: String(r.name ?? ""),
      slug: String(r.slug ?? ""),
      logo_url: (r.logo_url as string | null) ?? null,
      theme_settings: r.theme_settings,
      theme_config: r.theme_config,
      content_config: r.content_config,
      enabled_features,
      whatsapp_number: (r.whatsapp_number as string | null) ?? null,
      contact_email: (r.contact_email as string | null) ?? null,
      layout_id: parseStorefrontLayoutId(r.layout_id),
    };
  },
);
