import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { PlatformContractsTable } from "@/components/platform-contracts-ui";
import { fetchPlatformContracts } from "@/lib/data/platform-contracts";

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  const rows = await fetchPlatformContracts();
  const drafts = rows.filter((row) => row.status === "draft").length;
  const pendingSignature = rows.filter((row) => row.status === "sent_for_signature").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos comerciais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rascunho → revisão interna → envio para assinatura. Texto congelado após envio.
          </p>
        </div>
        <Button asChild>
          <Link href="/painel/contratos/novo">Novo contrato</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Em revisão</p>
          <p className="text-2xl font-semibold">{drafts}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aguardando assinatura</p>
          <p className="text-2xl font-semibold">{pendingSignature}</p>
        </div>
      </div>

      <PlatformContractsTable rows={rows} />
    </div>
  );
}
