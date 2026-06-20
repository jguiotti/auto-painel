import Link from "next/link";

import { Badge, Button } from "@autopainel/shared/ui";
import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  PLATFORM_SALES_ATTRIBUTION_STATUS_LABELS,
  PLATFORM_SALES_ATTRIBUTION_TYPE_LABELS,
  formatCommissionRateBps,
} from "@/lib/data/platform-sales-squad-shared";
import { fetchOwnSalesRepAttributions } from "@/lib/data/platform-sales-squad-rep-portal";

export const dynamic = "force-dynamic";

export default async function RepCarteiraPage() {
  const attributions = await fetchOwnSalesRepAttributions();
  const confirmed = attributions.filter((row) => row.status === "confirmed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha carteira</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lojas vinculadas ao seu cadastro comercial.
        </p>
      </div>

      {confirmed.length === 0 ? (
        <EmptyState
          title="Nenhuma loja na carteira"
          description="Quando um vínculo comercial for confirmado, as lojas aparecerão aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {confirmed.map((row) => (
            <div key={row.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.dealership_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {PLATFORM_SALES_ATTRIBUTION_TYPE_LABELS[row.attribution_type]} ·{" "}
                    {formatCommissionRateBps(row.attribution_share_bps)}
                  </p>
                </div>
                <Badge>{PLATFORM_SALES_ATTRIBUTION_STATUS_LABELS[row.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href="/painel/comercial/extrato">Ver extrato</Link>
      </Button>
    </div>
  );
}
