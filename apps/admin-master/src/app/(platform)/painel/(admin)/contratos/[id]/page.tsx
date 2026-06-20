import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@autopainel/shared/ui";

import { PlatformContractDetailActions } from "@/components/platform-contract-detail-actions";
import { fetchPlatformContractById } from "@/lib/data/platform-contracts";
import { fetchDealerships } from "@/lib/data/dealerships";
import { fetchPlatformSalesReps } from "@/lib/data/platform-sales-squad";

export const dynamic = "force-dynamic";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = await params;
  const [contract, salesReps, dealerships] = await Promise.all([
    fetchPlatformContractById(id),
    fetchPlatformSalesReps(),
    fetchDealerships(),
  ]);
  if (!contract) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contract.counterparty_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{contract.counterparty_email}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/painel/contratos">Lista</Link>
        </Button>
      </div>

      <PlatformContractDetailActions
        contract={contract}
        salesReps={salesReps}
        dealerships={dealerships}
      />

      <article className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Texto do contrato (snapshot)
        </h2>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {contract.body_snapshot_md}
        </pre>
      </article>
    </div>
  );
}
