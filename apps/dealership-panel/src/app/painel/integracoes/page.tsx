import { redirect } from "next/navigation";

import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { ClassifiedsIntegrationCards } from "@/components/integrations/classifieds-integration-cards";
import { MetaDeveloperAppForm } from "@/components/integrations/meta-developer-app-form";
import { SocialMetaIntegrationCard } from "@/components/integrations/social-meta-integration-card";
import { getClassifiedsProviderAvailability } from "@/lib/classifieds/get-classifieds-provider-availability";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { getDealershipMetaOauthAppPublic } from "@/lib/data/dealership-meta-oauth-app";
import {
  hasMetaPlatformAppConfigured,
  isMetaPlatformConnectMode,
} from "@/lib/integrations/meta-platform-connect";

export default async function IntegracoesPage() {
  const { supabase, dealershipId } = await requireDashboardSession();

  const [featuresRes, connectionsRes, metaConnectionRes] = await Promise.all([
    supabase.rpc("effective_feature_keys_for_active_dealership", {
      p_dealership_id: dealershipId,
    }),
    supabase
      .from("dealership_classifieds_connections")
      .select("provider, status, token_expires_at, connected_at, last_error")
      .eq("dealership_id", dealershipId),
    supabase
      .from("dealership_meta_connections")
      .select(
        "status, page_name, instagram_username, token_expires_at, connected_at, last_error",
      )
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
  ]);

  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];
  const isClassifiedsSyncEnabled = isDealershipFeatureEnabled(
    activeFeatures,
    "classifieds_sync",
  );
  const isSocialMediaKitEnabled = isDealershipFeatureEnabled(
    activeFeatures,
    "social_media_kit",
  );

  if (!isClassifiedsSyncEnabled && !isSocialMediaKitEnabled) {
    redirect("/painel");
  }

  const connectionRows = (connectionsRes.data ?? []).filter(
    (row): row is {
      provider: "olx" | "webmotors";
      status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "error"
        | "reauth_required";
      token_expires_at: string | null;
      connected_at: string | null;
      last_error: string | null;
    } => row.provider === "olx" || row.provider === "webmotors",
  );

  const metaRow = metaConnectionRes.data;

  const metaAppRow = await getDealershipMetaOauthAppPublic(dealershipId);
  const metaPlatformConnect = isMetaPlatformConnectMode();
  const hasMetaAppForOAuth = metaPlatformConnect
    ? hasMetaPlatformAppConfigured()
    : !!(
        metaAppRow?.meta_app_id?.trim() ||
        process.env.META_APP_CLIENT_ID?.trim()
      );

  function isMetaConnectionStatus(
    value: string | null | undefined,
  ): value is
    | "disconnected"
    | "connecting"
    | "connected"
    | "error"
    | "reauth_required" {
    return (
      value === "disconnected" ||
      value === "connecting" ||
      value === "connected" ||
      value === "error" ||
      value === "reauth_required"
    );
  }

  const normalizedMetaConnection =
    metaRow && isMetaConnectionStatus(metaRow.status)
      ? {
          status: metaRow.status,
          page_name: metaRow.page_name ?? null,
          instagram_username: metaRow.instagram_username ?? null,
          token_expires_at: metaRow.token_expires_at ?? null,
          connected_at: metaRow.connected_at ?? null,
          last_error: metaRow.last_error ?? null,
        }
      : null;

  const classifiedsProviderAvailability = isClassifiedsSyncEnabled
    ? await getClassifiedsProviderAvailability({ dealershipId })
    : { olx: false, webmotors: false };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Integrações
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conecte sua loja aos canais de divulgação: redes sociais e portais de
          classificados. O login é feito em uma janela segura — você não precisa
          configurar nada técnico.
        </p>
      </section>

      {isSocialMediaKitEnabled ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Instagram e Facebook
          </h2>
          <div className="space-y-6">
            {!metaPlatformConnect ? (
              <MetaDeveloperAppForm
                initialMetaAppId={metaAppRow?.meta_app_id ?? ""}
                initialGraphOverride={
                  metaAppRow?.graph_api_version_override ?? ""
                }
              />
            ) : (
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Clique em <strong className="font-medium text-foreground">Conectar</strong> abaixo
                e faça login com a conta Facebook da sua loja. Não é necessário configurar App ID
                ou chaves técnicas.
              </p>
            )}
            <SocialMetaIntegrationCard
              isEnabled={isSocialMediaKitEnabled}
              connection={normalizedMetaConnection}
              canStartOAuth={hasMetaAppForOAuth}
            />
          </div>
        </section>
      ) : null}

      {isClassifiedsSyncEnabled ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            OLX e Webmotors
          </h2>
          <ClassifiedsIntegrationCards
            isEnabled={isClassifiedsSyncEnabled}
            connections={connectionRows}
            providerAvailability={classifiedsProviderAvailability}
          />
        </section>
      ) : null}
    </div>
  );
}
