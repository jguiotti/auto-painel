import { Building2, CircleCheck, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";

import { fetchPlatformMetrics } from "@/lib/data/platform-metrics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await fetchPlatformMetrics();

  const cards = [
    {
      title: "Concessionárias",
      value: m.dealershipCount,
      description: "Total cadastrado na plataforma",
      icon: Building2,
    },
    {
      title: "Lojas ativas",
      value: m.activeDealerships,
      description: "Status operacional ativo na base",
      icon: CircleCheck,
    },
    {
      title: "Em trial",
      value: m.trialSubscriptions,
      description: "Contas no plano trial",
      icon: TrendingUp,
    },
    {
      title: "Leads institucionais",
      value: m.saasProspectCount,
      description: "Prospects do site AutoPainel (saas_prospects)",
      icon: Sparkles,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Painel global</h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada da operação multitenant e funil comercial.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
              <CardDescription className="mt-1 text-xs">{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
