import { notFound } from "next/navigation";

import { PlatformSalesRepDetailNav } from "@/components/platform-sales-rep-detail-nav";
import { PortfolioTransferWizard } from "@/components/portfolio-transfer-wizard";
import {
  fetchPlatformSalesAttributions,
  fetchPlatformSalesRepById,
  fetchPlatformSalesReps,
} from "@/lib/data/platform-sales-squad";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function RepresentanteComercialRepassePage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  await requireAdminSession();
  const { repId } = await params;

  const [rep, allReps, attributions] = await Promise.all([
    fetchPlatformSalesRepById(repId),
    fetchPlatformSalesReps(),
    fetchPlatformSalesAttributions({ salesRepId: repId }),
  ]);

  if (!rep) {
    notFound();
  }

  const fromRep = allReps.find((row) => row.id === rep.id);
  if (!fromRep) {
    notFound();
  }

  const activeReps = allReps.filter((row) => row.status === "active");

  return (
    <div className="space-y-8">
      <PlatformSalesRepDetailNav repId={rep.id} repName={rep.full_name} />
      <PortfolioTransferWizard
        fromRep={fromRep}
        activeReps={activeReps}
        attributions={attributions}
      />
    </div>
  );
}
