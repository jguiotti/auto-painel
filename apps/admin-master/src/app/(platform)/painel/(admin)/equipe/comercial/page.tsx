import { EquipeHubTabs } from "@/components/equipe-hub-tabs";
import { PlatformSalesRepsTable } from "@/components/platform-sales-reps-table";
import { fetchPlatformSalesReps } from "@/lib/data/platform-sales-squad";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function EquipeComercialPage() {
  await requireAdminSession();
  const reps = await fetchPlatformSalesReps();
  const activeCount = reps.filter((rep) => rep.status === "active").length;

  return (
    <div className="space-y-6">
      <EquipeHubTabs />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipe comercial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comissões, carteira e pagamentos — representantes comerciais internos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Representantes ativos</p>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total cadastrados</p>
          <p className="text-2xl font-semibold">{reps.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Lojas na carteira</p>
          <p className="text-2xl font-semibold">
            {reps.reduce((sum, rep) => sum + rep.confirmed_attributions_count, 0)}
          </p>
        </div>
      </div>

      <PlatformSalesRepsTable reps={reps} />
    </div>
  );
}
