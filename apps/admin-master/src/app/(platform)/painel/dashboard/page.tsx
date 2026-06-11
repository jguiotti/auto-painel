import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CircleCheck,
  Clock3,
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

import { fetchPlatformMetrics } from "@/lib/data/platform-metrics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await fetchPlatformMetrics();

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
      title: "Leads (7 dias)",
      value: m.platformLeadsLast7Days,
      description: "Contatos e simulações em todas as lojas",
      icon: MessageSquare,
      href: undefined,
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
      title: "Prospects comerciais",
      value: m.saasProspectCount,
      description: "Interessados no site institucional",
      icon: Sparkles,
      href: undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel global</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada da operação multitenant e funil comercial.
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
            <Link key={title} href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {card}
            </Link>
          );
        })}
      </div>

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
            <Link href="/painel/planos">Planos comerciais</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/financeiro">Financeiro</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/painel/documentacao/tecnica">Documentação técnica</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
