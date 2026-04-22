import Link from "next/link";

import {
  Button,
  Card,
  CardDescription,
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

export default async function DashboardHomePage() {
  const { supabase, user } = await requireDashboardSession();

  const [
    totalVehiclesRes,
    availableRes,
    soldRes,
    leadsRes,
    inventoryValueRes,
    recentLeadsRes,
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("status", "available"),
    supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("status", "sold"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("price").eq("status", "available"),
    supabase
      .from("leads")
      .select(
        "id, client_name, phone, type, created_at, vehicles(brand, model)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalVehicles = totalVehiclesRes.count ?? 0;
  const availableCount = availableRes.count ?? 0;
  const soldCount = soldRes.count ?? 0;
  const leadsCount = leadsRes.count ?? 0;

  const inventoryRows = inventoryValueRes.data ?? [];
  const inventoryValue = inventoryRows.reduce(
    (sum, row) => sum + Number(row.price ?? 0),
    0,
  );

  const recentLeads = recentLeadsRes.data ?? [];

  const typeLabel: Record<string, string> = {
    contact: "Contato",
    simulation: "Simulação",
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Painel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Olá, {user.email ?? user.id}. Estes números refletem apenas a sua loja: o
          Supabase aplica RLS por <code className="rounded bg-muted px-1">dealership_id</code>{" "}
          e validamos o cookie de tenant em cada requisição.
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
            <CardDescription>Contatos recebidos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{leadsCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

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
          <p className="mt-2 text-sm text-muted-foreground">Nenhum contato ainda.</p>
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
