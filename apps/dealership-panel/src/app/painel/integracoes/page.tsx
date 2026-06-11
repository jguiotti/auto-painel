import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getEnabledClassifiedsProviders,
  isAnyClassifiedsModuleEnabled,
  isDealershipFeatureEnabled,
  type ClassifiedsProvider,
} from "@autopainel/shared/lib/dealership-features";

import { CarouselAppearanceCard } from "@/components/integrations/carousel-appearance-card";
import { ClassifiedsIntegrationCards } from "@/components/integrations/classifieds-integration-cards";
import { IntegrationOnboardingBanner } from "@/components/integrations/integration-onboarding-banner";
import { MetaDeveloperAppForm } from "@/components/integrations/meta-developer-app-form";
import { SocialMetaIntegrationCard } from "@/components/integrations/social-meta-integration-card";
import { getClassifiedsProviderOAuthReady } from "@/lib/classifieds/get-classifieds-provider-availability";
import { getDealershipSocialCarouselSettings } from "@/lib/data/dealership-social-carousel-settings";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { getDealershipMetaOauthAppPublic } from "@/lib/data/dealership-meta-oauth-app";
import {
  hasMetaPlatformAppConfigured,
  isMetaPlatformConnectMode,
} from "@/lib/integrations/meta-platform-connect";

const CLASSIFIEDS_SECTION_LABEL: Record<ClassifiedsProvider, string> = {
  olx: "OLX",
  webmotors: "WebMotors",
  icarros: "iCarros",
};

function formatClassifiedsSectionTitle(providers: ClassifiedsProvider[]): string {
  if (providers.length === 0) {
    return "Classificados";
  }
  return providers.map((provider) => CLASSIFIEDS_SECTION_LABEL[provider]).join(", ");
}

export default async function IntegracoesPage() {
  const { supabase, dealershipId } = await requireDashboardSession();

  const [featuresRes, connectionsRes, metaConnectionRes, dealershipRes, carouselSettings] =
    await Promise.all([
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
      supabase.from("dealerships").select("logo_url").eq("id", dealershipId).maybeSingle(),
      getDealershipSocialCarouselSettings(dealershipId),
    ]);

  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];
  const enabledClassifiedProviders = getEnabledClassifiedsProviders(activeFeatures);
  const isSocialMediaKitEnabled = isDealershipFeatureEnabled(
    activeFeatures,
    "social_media_kit",
  );

  if (!isAnyClassifiedsModuleEnabled(activeFeatures) && !isSocialMediaKitEnabled) {
    redirect("/painel");
  }

  const connectionRows = (connectionsRes.data ?? []).filter(
    (row): row is {
      provider: ClassifiedsProvider;
      status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "error"
        | "reauth_required";
      token_expires_at: string | null;
      connected_at: string | null;
      last_error: string | null;
    } =>
      enabledClassifiedProviders.includes(row.provider as ClassifiedsProvider) &&
      (row.provider === "olx" ||
        row.provider === "webmotors" ||
        row.provider === "icarros"),
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
    | "reauth_required"
    | "page_selection_required" {
    return (
      value === "disconnected" ||
      value === "connecting" ||
      value === "connected" ||
      value === "error" ||
      value === "reauth_required" ||
      value === "page_selection_required"
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

  const classifiedsProviderOAuthReady =
    enabledClassifiedProviders.length > 0
      ? await getClassifiedsProviderOAuthReady({
          dealershipId,
          enabledProviders: enabledClassifiedProviders,
          panelOrigin: process.env.NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN?.replace(/\/$/, "") ||
            undefined,
        })
      : { olx: false, webmotors: false, icarros: false };

  const showOnboarding =
    !carouselSettings.integrationsOnboardingDismissedAt &&
    normalizedMetaConnection?.status !== "connected";

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Integrações
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conecte sua loja aos canais incluídos no seu plano. O login abre em uma janela
          segura — sem códigos nem configuração técnica.
        </p>
      </section>

      <IntegrationOnboardingBanner visible={showOnboarding} />

      {isSocialMediaKitEnabled ? (
        <section id="redes-sociais" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Instagram e Facebook
            </h2>
            <Link href="#aparencia-carrossel" className="text-sm text-primary hover:underline">
              Aparência do carrossel
            </Link>
          </div>
          <div className="space-y-6">
            {!metaPlatformConnect ? (
              <MetaDeveloperAppForm
                initialMetaAppId={metaAppRow?.meta_app_id ?? ""}
                initialGraphOverride={
                  metaAppRow?.graph_api_version_override ?? ""
                }
              />
            ) : null}
            <SocialMetaIntegrationCard
              isEnabled={isSocialMediaKitEnabled}
              connection={normalizedMetaConnection}
              canStartOAuth={hasMetaAppForOAuth}
            />
          </div>
        </section>
      ) : null}

      {isSocialMediaKitEnabled ? (
        <section id="aparencia-carrossel">
          <CarouselAppearanceCard
            initialTemplate={carouselSettings.artifactTemplate}
            initialWatermarkEnabled={carouselSettings.watermarkEnabled}
            hasLogo={Boolean(dealershipRes.data?.logo_url)}
          />
        </section>
      ) : null}

      {enabledClassifiedProviders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {formatClassifiedsSectionTitle(enabledClassifiedProviders)}
          </h2>
          <ClassifiedsIntegrationCards
            enabledProviders={enabledClassifiedProviders}
            connections={connectionRows}
            providerOAuthReady={classifiedsProviderOAuthReady}
          />
        </section>
      ) : null}
    </div>
  );
}
