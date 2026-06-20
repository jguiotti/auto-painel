import Link from "next/link";

import { Badge, Button } from "@autopainel/shared/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import {
  fetchPricingPlanModuleCountsForAdmin,
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return `${amount} ${currency}`;
  }
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.length === 3 ? currency : "BRL",
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default async function PlanosComerciaisPage() {
  const schema = await getPricingCatalogSchemaState();
  const [plans, moduleCounts] = await Promise.all([
    fetchPricingPlansForAdmin(),
    fetchPricingPlanModuleCountsForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 pt-6">
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/dashboard"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Painel
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Planos comerciais</h1>
          <p className="text-sm text-muted-foreground">
            Defina preço e quais funcionalidades cada plano inclui. Depois, atribua
            um plano a cada concessionária — nunca módulos avulsos por loja.
          </p>
        </div>
        {schema.kind === "ok" ? (
          <Button asChild>
            <Link href="/painel/planos/nova">Novo plano</Link>
          </Button>
        ) : (
          <Button type="button" disabled>
            Novo plano
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de planos</CardTitle>
          <CardDescription>
            Slug estável por plano; edite nome, preço e módulos a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {schema.kind !== "ok"
                ? "Corrija a configuração da base acima para carregar os planos."
                : "Nenhum plano encontrado. Crie o primeiro plano pelo botão acima."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.slug}
                    </TableCell>
                    <TableCell>
                      {formatMoney(plan.price_amount, plan.currency_code)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {moduleCounts[plan.id] ?? 0}
                    </TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge>Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/painel/planos/${plan.id}/editar`}>
                          Editar
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
