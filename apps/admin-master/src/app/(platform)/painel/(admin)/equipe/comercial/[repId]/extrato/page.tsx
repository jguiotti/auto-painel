import { notFound } from "next/navigation";

import { PlatformSalesRepDetailNav } from "@/components/platform-sales-rep-detail-nav";
import { PlatformSalesRepLedgerPanel } from "@/components/platform-sales-rep-ledger-panel";
import {
  fetchPlatformCommissionLedgerEntries,
  fetchPlatformSalesRepById,
} from "@/lib/data/platform-sales-squad";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function RepresentanteComercialExtratoPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  await requireAdminSession();
  const { repId } = await params;

  const [rep, entries] = await Promise.all([
    fetchPlatformSalesRepById(repId),
    fetchPlatformCommissionLedgerEntries({ salesRepId: repId }),
  ]);

  if (!rep) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PlatformSalesRepDetailNav repId={rep.id} repName={rep.full_name} />
      <PlatformSalesRepLedgerPanel
        salesRepId={rep.id}
        entries={entries}
        allowApprove
        allowAdjustments
      />
    </div>
  );
}
