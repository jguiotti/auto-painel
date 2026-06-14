import Link from "next/link";
import { Inbox } from "lucide-react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";
import { formatDatePt } from "@/lib/format/format-date-pt";
import {
  buildLeadWhatsAppMessage,
  buildWhatsAppUrl,
} from "@/lib/phone/build-whatsapp-url";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

const RANGE_OPTIONS = [7, 30, 90] as const;
type MetricsRangeDays = (typeof RANGE_OPTIONS)[number];

interface DashboardHomePageProps {
  searchParams: Promise<{ periodo?: string }>;
}

interface LeadsByType {
  contact: number;
  simulation: number;
}

function parseRangeDays(raw: string | undefined): MetricsRangeDays {
  const parsed = Number(raw);
  if (parsed === 7 || parsed === 30 || parsed === 90) {
    return parsed;
  }
  return 30;
}

function toDayKey(dateValue: Date): string {
  return dateValue.toISOString().slice(0, 10);
}

function percentDelta(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

function isPostgrestTableMissing(error: { code?: string; message?: string }): boolean {
  if (error.code === "PGRST205") {
    return true;
  }
  const msg = error.message ?? "";
  return msg.includes("Could not find the table") && msg.includes("schema cache");
}

export default async function DashboardHomePage({
  searchParams,
}: DashboardHomePageProps) {
  const { periodo } = await searchParams;
  const rangeDays = parseRangeDays(periodo);
  const { supabase, dealershipId } = await requireDashboardSession();

  const featureRes = await supabase.rpc("effective_feature_keys_for_active_dealership", {
    p_dealership_id: dealershipId,
  });
  const activeFeatures = Array.isArray(featureRes.data)
    ? featureRes.data.filter((x): x is string => typeof x === "string")
    : [];
  const isAdvancedMetricsEnabled = isDealershipFeatureEnabled(
    activeFeatures,
    "advanced_metrics",
  );

  const [
    totalVehiclesRes,
    availableRes,
    soldRes,
    leadsRes,
    inventoryValueRes,
    recentLeadsRes,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("dealership_id", dealershipId),
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("dealership_id", dealershipId)
      .eq("status", "available"),
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("dealership_id", dealershipId)
      .eq("status", "sold"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("dealership_id", dealershipId),
    supabase
      .from("vehicles")
      .select("price, created_at")
      .eq("dealership_id", dealershipId)
      .eq("status", "available"),
    supabase
      .from("leads")
      .select(
        "id, client_name, phone, type, created_at, vehicles!leads_vehicle_id_fkey(brand, model)",
      )
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalVehicles = totalVehiclesRes.count ?? 0;
  const availableCount = availableRes.count ?? 0;
  const soldCount = soldRes.count ?? 0;
  const leadsCount = leadsRes.count ?? 0;

  const inventoryRows = inventoryValueRes.data ?? [];
  const now = new Date();
  const inventoryValue = inventoryRows.reduce(
    (sum, row) => sum + Number(row.price ?? 0),
    0,
  );
  const averageStockAgingDays =
    inventoryRows.length > 0
      ? inventoryRows.reduce((sum, row) => {
          const createdAt = new Date(row.created_at);
          const diffMs = now.getTime() - createdAt.getTime();
          const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          return sum + diffDays;
        }, 0) / inventoryRows.length
      : 0;

  const recentLeads = recentLeadsRes.data ?? [];
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - rangeDays);
  const previousPeriodStart = new Date(now);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - rangeDays * 2);

  let leadsCurrentCount = 0;
  let leadsPreviousCount = 0;
  let leadsByType: LeadsByType = { contact: 0, simulation: 0 };
  let leadsTrend: Array<{ day: string; count: number }> = [];
  let topViewedVehicles: Array<{
    vehicleId: string;
    publicSlug: string;
    label: string;
    views: number;
  }> = [];
  let advancedMetricsError: string | null = null;

  if (isAdvancedMetricsEnabled) {
    const [leadsCurrentRes, leadsPreviousRes, viewEventsRes] = await Promise.all([
      supabase
        .from("leads")
        .select("type, created_at")
        .eq("dealership_id", dealershipId)
        .gte("created_at", periodStart.toISOString()),
      supabase
        .from("leads")
        .select("id")
        .eq("dealership_id", dealershipId)
        .gte("created_at", previousPeriodStart.toISOString())
        .lt("created_at", periodStart.toISOString()),
      supabase
        .from("vehicle_view_events")
        .select("vehicle_id, viewed_at, vehicles(brand, model, public_slug)")
        .eq("dealership_id", dealershipId)
        .gte("viewed_at", periodStart.toISOString()),
    ]);

    if (leadsCurrentRes.error) {
      advancedMetricsError = leadsCurrentRes.error.message;
    } else {
      const rows = leadsCurrentRes.data ?? [];
      leadsCurrentCount = rows.length;
      leadsByType = rows.reduce<LeadsByType>(
        (acc, row) => {
          if (row.type === "simulation") {
            acc.simulation += 1;
          } else {
            acc.contact += 1;
          }
          return acc;
        },
        { contact: 0, simulation: 0 },
      );

      const trendMap = new Map<string, number>();
      rows.forEach((row) => {
        const dayKey = toDayKey(new Date(row.created_at));
        trendMap.set(dayKey, (trendMap.get(dayKey) ?? 0) + 1);
      });

      const trendDays = Math.min(rangeDays, 14);
      leadsTrend = Array.from({ length: trendDays }).map((_, index) => {
        const day = new Date(now);
        day.setDate(day.getDate() - (trendDays - index - 1));
        const dayKey = toDayKey(day);
        return { day: dayKey.slice(5), count: trendMap.get(dayKey) ?? 0 };
      });
    }

    if (leadsPreviousRes.error) {
      advancedMetricsError = leadsPreviousRes.error.message;
    } else {
      leadsPreviousCount = leadsPreviousRes.data?.length ?? 0;
    }

    if (viewEventsRes.error) {
      if (!isPostgrestTableMissing(viewEventsRes.error)) {
        advancedMetricsError = viewEventsRes.error.message;
      }
    } else {
      const viewRows = viewEventsRes.data ?? [];
      const topMap = new Map<
        string,
        { vehicleId: string; publicSlug: string; label: string; views: number }
      >();

      viewRows.forEach((row) => {
        const embedded = row.vehicles as
          | { brand: string; model: string; public_slug: string }
          | { brand: string; model: string; public_slug: string }[]
          | null;
        const vehicle = Array.isArray(embedded) ? embedded[0] : embedded;
        if (!vehicle) {
          return;
        }
        const existing = topMap.get(row.vehicle_id);
        if (existing) {
          existing.views += 1;
          return;
        }
        topMap.set(row.vehicle_id, {
          vehicleId: row.vehicle_id,
          publicSlug: vehicle.public_slug,
          label: `${vehicle.brand} ${vehicle.model}`,
          views: 1,
        });
      });

      topViewedVehicles = Array.from(topMap.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    }
  }

  const typeLabel: Record<string, string> = {
    contact: "Contato",
    simulation: "Simulação",
  };
  const leadsDelta = percentDelta(leadsCurrentCount, leadsPreviousCount);
  const leadsDeltaLabel = `${leadsDelta >= 0 ? "+" : ""}${leadsDelta.toFixed(1)}%`;
  const maxTrend = Math.max(1, ...leadsTrend.map((point) => point.count));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Painel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe estoque, contatos e resultados da sua concessionária em um só lugar.
        </p>
      </div>

      <section aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Veículos cadastrados</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{totalVehicles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disponíveis / vendidos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {availableCount}{" "}
              <span className="text-xl font-normal text-muted-foreground">/</span>{" "}
              {soldCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor em estoque (disponíveis)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatBrl(inventoryValue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leads recebidos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{leadsCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {isAdvancedMetricsEnabled ? (
        <section aria-label="Métricas avançadas" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Métricas avançadas
              </h2>
              <p className="text-sm text-muted-foreground">
                Janela atual: últimos {rangeDays} dias.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  asChild
                  size="sm"
                  variant={option === rangeDays ? "default" : "outline"}
                >
                  <Link href={`/painel?periodo=${option}`}>{option} dias</Link>
                </Button>
              ))}
            </div>
          </div>

          {advancedMetricsError ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Não foi possível carregar parte das métricas avançadas:{" "}
              {advancedMetricsError}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Leads no período</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {leadsCurrentCount}
                </CardTitle>
              </CardHeader>
              <CardFooter>
                <span className="text-xs text-muted-foreground">
                  Período anterior: {leadsPreviousCount} ({leadsDeltaLabel})
                </span>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Aging médio de estoque</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {averageStockAgingDays.toFixed(1)} dias
                </CardTitle>
              </CardHeader>
              <CardFooter>
                <span className="text-xs text-muted-foreground">
                  Base: veículos disponíveis
                </span>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Origem dos leads</CardDescription>
                <CardTitle className="text-xl tabular-nums">
                  Contato {leadsByType.contact} · Simulação {leadsByType.simulation}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Contato</span>
                    <span>{leadsByType.contact}</span>
                  </div>
                  <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded bg-blue-500"
                      style={{
                        width: `${(leadsByType.contact / Math.max(1, leadsCurrentCount)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Simulação</span>
                    <span>{leadsByType.simulation}</span>
                  </div>
                  <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded bg-emerald-500"
                      style={{
                        width: `${(leadsByType.simulation / Math.max(1, leadsCurrentCount)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendência de leads</CardTitle>
                <CardDescription>
                  Últimos {Math.min(rangeDays, 14)} dias da janela selecionada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  {leadsTrend.map((point) => (
                    <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-[var(--dealer-primary,#18181b)]"
                        style={{
                          height: `${Math.max(8, (point.count / maxTrend) * 110)}px`,
                        }}
                        title={`${point.day}: ${point.count}`}
                      />
                      <span className="text-[10px] text-muted-foreground">{point.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 veículos mais vistos</CardTitle>
                <CardDescription>
                  Visualizações de vitrine no período selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topViewedVehicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ainda sem visualizações registradas neste período.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {topViewedVehicles.map((item) => (
                      <li
                        key={item.vehicleId}
                        className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.publicSlug}
                          </p>
                        </div>
                        <Badge variant="secondary" className="tabular-nums">
                          {item.views} visualizações
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Métricas detalhadas de desempenho não estão incluídas no seu plano atual. Fale
          com nosso time comercial se quiser acompanhar tendências de leads e visualizações.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/painel/estoque">Gerenciar estoque</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/painel/contatos">Ver contatos</Link>
        </Button>
      </div>

      <section aria-label="Contatos recentes">
        <h2 className="text-lg font-semibold text-foreground">Contatos recentes</h2>
        {recentLeads.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Inbox}
            title="Nenhum contato ainda"
            description="Quando clientes enviarem mensagens pela vitrine, eles aparecerão aqui."
            action={{ label: "Ver contatos", href: "/painel/contatos" }}
          />
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {recentLeads.map((lead) => {
              const v = lead.vehicles as
                | { brand: string; model: string }
                | { brand: string; model: string }[]
                | null;
              const vehicleRow = Array.isArray(v) ? v[0] : v;
              const vehicleLabel = vehicleRow
                ? `${vehicleRow.brand} ${vehicleRow.model}`
                : null;
              const wa = buildWhatsAppUrl(
                lead.phone,
                buildLeadWhatsAppMessage({
                  clientName: lead.client_name,
                  vehicleLabel,
                }),
              );
              return (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {lead.client_name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDatePt(lead.created_at)} ·{" "}
                      {typeLabel[lead.type] ?? lead.type}
                    </span>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
