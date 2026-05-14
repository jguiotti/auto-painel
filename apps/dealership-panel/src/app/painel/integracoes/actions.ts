"use server";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { encryptTextWithSecret } from "@/lib/crypto/aes-gcm-text-secret";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

function resolveMetaTokensCryptoSecret(): string {
  const s = process.env.META_TOKENS_CRYPTO_SECRET?.trim();
  if (!s) {
    throw new Error("META_TOKENS_CRYPTO_SECRET não configurado no servidor.");
  }
  return s;
}

export type SaveMetaOauthAppState = { ok: true } | { ok: false; error: string };

export async function saveDealershipMetaOauthAppAction(
  _prev: SaveMetaOauthAppState | undefined,
  formData: FormData,
): Promise<SaveMetaOauthAppState> {
  try {
    const { dealershipId, supabase, profile } = await requireDashboardSession(
      "/painel/integracoes",
    );
    if (
      profile.role !== "owner" &&
      profile.role !== "manager" &&
      profile.role !== "super_admin"
    ) {
      return { ok: false, error: "Sem permissão para alterar credenciais Meta." };
    }

    const featuresRes = await supabase.rpc(
      "effective_feature_keys_for_active_dealership",
      { p_dealership_id: dealershipId },
    );
    const activeFeatures = Array.isArray(featuresRes.data)
      ? featuresRes.data.filter((item): item is string => typeof item === "string")
      : [];
    if (!isDealershipFeatureEnabled(activeFeatures, "social_media_kit")) {
      return { ok: false, error: "Módulo de redes sociais não está habilitado." };
    }

    const metaAppId = String(formData.get("meta_app_id") ?? "").trim();
    const metaAppSecretRaw = String(formData.get("meta_app_secret") ?? "");
    const graphOverride = String(
      formData.get("graph_api_version_override") ?? "",
    ).trim();

    if (!metaAppId) {
      return { ok: false, error: "Informe o ID da aplicação Meta (App ID)." };
    }

    const cryptoSecret = resolveMetaTokensCryptoSecret();
    const admin = createSupabaseServiceRoleClient();

    const { data: existing } = await admin
      .from("dealership_meta_oauth_apps")
      .select("meta_app_secret_encrypted")
      .eq("dealership_id", dealershipId)
      .maybeSingle();

    let metaAppSecretEncrypted: string;
    if (metaAppSecretRaw.trim()) {
      metaAppSecretEncrypted = await encryptTextWithSecret(
        metaAppSecretRaw.trim(),
        cryptoSecret,
      );
    } else if (existing?.meta_app_secret_encrypted) {
      metaAppSecretEncrypted = existing.meta_app_secret_encrypted;
    } else {
      return {
        ok: false,
        error:
          "Informe o App Secret na primeira configuração ou ao substituir o segredo.",
      };
    }

    const { error } = await admin.from("dealership_meta_oauth_apps").upsert(
      {
        dealership_id: dealershipId,
        meta_app_id: metaAppId,
        meta_app_secret_encrypted: metaAppSecretEncrypted,
        graph_api_version_override: graphOverride || null,
      },
      { onConflict: "dealership_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Não foi possível guardar as credenciais Meta.",
    };
  }
}
