import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

/**
 * Resolve Meta dialog URL inputs: prefer per-dealership app id from DB, else env (dev fallback).
 */
export async function resolveMetaOAuthStartParams(params: {
  dealershipId: string;
}): Promise<{
  metaAppId: string;
  graphVersion: string;
  redirectUri: string;
} | null> {
  const envAppId = process.env.META_APP_CLIENT_ID?.trim();
  const graphVersion =
    process.env.META_GRAPH_API_VERSION?.trim() || "21.0";

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    if (!envAppId) {
      return null;
    }
    const redirectUri = resolveMetaRedirectUri();
    return { metaAppId: envAppId, graphVersion, redirectUri };
  }

  const { data: row } = await admin
    .from("dealership_meta_oauth_apps")
    .select("meta_app_id, graph_api_version_override")
    .eq("dealership_id", params.dealershipId)
    .maybeSingle();

  const fromDb = row?.meta_app_id?.trim();
  const metaAppId = fromDb || envAppId || "";
  if (!metaAppId) {
    return null;
  }

  const gv =
    row?.graph_api_version_override?.trim() || graphVersion;
  const redirectUri = resolveMetaRedirectUri();

  return { metaAppId, graphVersion: gv, redirectUri };
}

function resolveMetaRedirectUri(): string {
  const explicit = process.env.META_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurado.");
  }
  return `${base.replace(/\/$/, "")}/functions/v1/meta-oauth-callback`;
}
