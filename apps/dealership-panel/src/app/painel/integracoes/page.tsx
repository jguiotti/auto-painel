import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import { Card, CardContent, CardHeader, CardTitle } from "@autopainel/shared/ui";

import { ClassifiedsIntegrationCards } from "@/components/integrations/classifieds-integration-cards";
import { SocialMetaIntegrationCard } from "@/components/integrations/social-meta-integration-card";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function IntegracoesPage() {
  const { supabase, dealershipId } = await requireDashboardSession();

  const [featuresRes, connectionsRes, metaConnectionRes] = await Promise.all([
    supabase.rpc("effective_feature_keys_for_active_dealership", {
      p_dealership_id: dealershipId,
    }),
    supabase
      .from("dealership_classifieds_connections")
      .select("provider, status, token_expires_at, connected_at, last_error"),
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

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Integrações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ligações OAuth com portais externos: redes Meta (Instagram / Facebook) e
          classificados quando incluídos no plano da loja.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Meta (Instagram e Facebook)
        </h2>
        {!isSocialMediaKitEnabled ? (
          <Card>
            <CardHeader>
              <CardTitle>Módulo indisponível no plano atual</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              O kit de redes sociais (Meta) ainda não está habilitado para esta
              concessionária.
            </CardContent>
          </Card>
        ) : (
          <SocialMetaIntegrationCard
            isEnabled={isSocialMediaKitEnabled}
            connection={normalizedMetaConnection}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Classificados
        </h2>
        {!isClassifiedsSyncEnabled ? (
          <Card>
            <CardHeader>
              <CardTitle>Módulo indisponível no plano atual</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              O módulo de integrações com classificados ainda não está habilitado para
              esta concessionária.
            </CardContent>
          </Card>
        ) : (
          <ClassifiedsIntegrationCards
            isEnabled={isClassifiedsSyncEnabled}
            connections={connectionRows}
          />
        )}
      </section>
    </div>
  );
}
