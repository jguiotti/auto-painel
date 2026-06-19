import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CircleCheck,
  Clock3,
  ExternalLink,
  HeartPulse,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { fetchUpcomingContentCalendarItems } from "@/lib/data/platform-content-calendar";
import {
  CONTENT_CALENDAR_CHANNEL_LABELS,
} from "@/lib/data/platform-content-calendar-shared";
import { fetchPlatformCommercialLeads } from "@/lib/data/platform-commercial-leads";
import { PLATFORM_LEAD_PIPELINE_LABELS } from "@/lib/data/platform-commercial-leads-shared";
import { fetchPlatformHealthSummary } from "@/lib/data/platform-health";
import { fetchPlatformMetrics } from "@/lib/data/platform-metrics";

export const dynamic = "force-dynamic";

const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "G-VR8MDJE9H1";
const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-MV99ZXW9";

function formatLeadDelta(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "Sem base no período anterior" : "Sem leads no período";
  }
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}% vs. 7 dias anteriores (${previous})`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "Sem registro";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatCalendarDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

export default async function DashboardPage() {
  const [m, health, upcomingContent, commercialLeads] = await Promise.all([
    fetchPlatformMetrics(),
    fetchPlatformHealthSummary(),
    fetchUpcomingContentCalendarItems(5),
    fetchPlatformCommercialLeads(),
  ]);

  const leadsTrendLabel = formatLeadDelta(
    m.platformLeadsLast7Days,
    m.platformLeadsPrevious7Days,
  );

  const openPipelineCount = commercialLeads.filter((lead) =>
    ["new", "qualification", "demo_scheduled", "demo_done", "proposal_sent", "negotiation"].includes(
      lead.pipeline_status,
    ),
  ).length;

  const pipelinePreview = ["new", "proposal_sent", "negotiation"] as const;

  const kpiCards = [
    {
      title: "Concessionárias",
      value: m.dealershipCount,
      description: "Total cadastrado na plataforma",
      icon: Building2,
      href: "/painel/concessionarias",
    },
    {
      title: "Lojas ativas",
      value: m.activeDealerships,
      description: "Status operacional ativo",
      icon: CircleCheck,
      href: "/painel/concessionarias?status=active",
    },
    {
      title: "Em trial",
      value: m.trialSubscriptions,
      description: "Contas no plano trial",
      icon: TrendingUp,
      href: "/painel/financeiro",
    },
    {
      title: "Leads vitrine (7d)",
      value: m.platformLeadsLast7Days,
      description: leadsTrendLabel,
      icon: MessageSquare,
      href: "/painel/leads-comerciais",
    },
    {
      title: "Pipeline B2B aberto",
      value: openPipelineCount,
      description: "Leads comerciais em andamento",
      icon: Sparkles,
      href: "/painel/leads-comerciais",
    },
    {
      title: "Configuração pendente",
      value: m.pendingSetupDealerships,
      description: "Lojas aguardando onboarding",
      icon: Clock3,
      href: "/painel/concessionarias?status=pending_setup",
    },
    {
      title: "Inadimplentes",
      value: m.pastDueSubscriptions,
      description: "Cobrança com status past_due",
      icon: Wallet,
      href: "/painel/financeiro",
    },
    {
      title: "Prospects marketing",
      value: m.saasProspectCount,
      description: "Formulários autopainel.com.br",
      icon: Sparkles,
      href: "/painel/leads-comerciais",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel global</h1>
        <p className="text-sm text-muted-foreground">
          Operação multitenant, funil comercial, saúde da plataforma e marketing.
        </p>
      </div>

      {m.pastDueSubscriptions > 0 ? (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Cobrança em atraso</p>
            <p className="mt-1 text-destructive/90">
              {m.pastDueSubscriptions} concessionária(s) com assinatura inadimplente. Revise em{" "}
              <Link href="/painel/financeiro" className="font-medium underline">
                Financeiro
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saúde Supabase</CardTitle>
            <HeartPulse className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Último ping:{" "}
              <span className="font-medium">{formatDateTime(health.lastPingAt)}</span>
            </p>
            <p className="text-muted-foreground">
              {health.lastSuccess === null
                ? "Sem histórico — cron GitHub ou npm run supabase:ping"
                : health.lastSuccess
                  ? `OK${health.lastLatencyMs != null ? ` · ${health.lastLatencyMs} ms` : ""}`
                  : "Falha no último ping"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics (GA4)</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              GA4: <code className="text-xs">{GA4_MEASUREMENT_ID}</code>
            </p>
            <p>
              GTM: <code className="text-xs">{GTM_CONTAINER_ID}</code>
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://analytics.google.com/analytics/web/#/p${GA4_MEASUREMENT_ID.replace("G-", "")}/reports/intelligenthome`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir GA4
                <ExternalLink className="ml-1 size-3.5" aria-hidden />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline B2B</CardTitle>
            <Sparkles className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {pipelinePreview.map((status) => {
              const count = commercialLeads.filter((l) => l.pipeline_status === status).length;
              return (
                <p key={status} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {PLATFORM_LEAD_PIPELINE_LABELS[status]}
                  </span>
                  <span className="font-medium tabular-nums">{count}</span>
                </p>
              );
            })}
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href="/painel/leads-comerciais">Ver pipeline completo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ title, value, description, icon: Icon, href }) => {
          const card = (
            <Card key={title} className={href ? "transition-colors hover:bg-muted/30" : undefined}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <CardDescription className="mt-1 text-xs">{description}</CardDescription>
              </CardContent>
            </Card>
          );

          if (!href) {
            return card;
          }

          return (
            <Link
              key={title}
              href={href}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {card}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Próximo conteúdo</CardTitle>
            <CardDescription>Calendário editorial marketing AutoPainel</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/painel/calendario-conteudo">Calendário completo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingContent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma peça agendada. Adicione em Calendário de conteúdo.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {upcomingContent.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground">
                    {formatCalendarDate(item.scheduled_for)} ·{" "}
                    {CONTENT_CALENDAR_CHANNEL_LABELS[item.channel]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações rápidas</CardTitle>
          <CardDescription>Atalhos para operação diária do time AutoPainel.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/painel/concessionarias/nova">
              <Plus className="size-4" aria-hidden />
              Nova concessionária
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/leads-comerciais">Leads comerciais</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/contratos/novo">Novo contrato</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/calendario-conteudo">Calendário</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/financeiro">Financeiro</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
