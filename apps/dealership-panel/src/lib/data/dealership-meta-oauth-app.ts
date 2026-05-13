import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { DealershipMetaOauthAppPublic } from "@autopainel/shared/types";

export async function getDealershipMetaOauthAppPublic(
  dealershipId: string,
): Promise<DealershipMetaOauthAppPublic | null> {
  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("dealership_meta_oauth_apps")
    .select("meta_app_id, graph_api_version_override")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !data?.meta_app_id?.trim()) {
    return null;
  }

  return {
    meta_app_id: data.meta_app_id.trim(),
    graph_api_version_override: data.graph_api_version_override ?? null,
  };
}
