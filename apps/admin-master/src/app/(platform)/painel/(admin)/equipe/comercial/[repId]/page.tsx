import { notFound } from "next/navigation";

import { PlatformSalesRepBankForm } from "@/components/platform-sales-rep-bank-form";
import { PlatformSalesRepDetailNav } from "@/components/platform-sales-rep-detail-nav";
import { PlatformSalesRepForm } from "@/components/platform-sales-rep-form";
import { PlatformSalesRepPortfolioPanel } from "@/components/platform-sales-rep-portfolio-panel";
import { fetchDealerships } from "@/lib/data/dealerships";
import {
  fetchPlatformSalesAttributions,
  fetchPlatformSalesRepBankAccounts,
  fetchPlatformSalesRepById,
} from "@/lib/data/platform-sales-squad";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function RepresentanteComercialDetailPage({
  params,
}: {
  params: Promise<{ repId: string }>;
}) {
  await requireAdminSession();
  const { repId } = await params;

  const [rep, bankAccounts, attributions, dealerships] = await Promise.all([
    fetchPlatformSalesRepById(repId),
    fetchPlatformSalesRepBankAccounts(repId),
    fetchPlatformSalesAttributions({ salesRepId: repId }),
    fetchDealerships(),
  ]);

  if (!rep) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PlatformSalesRepDetailNav repId={rep.id} repName={rep.full_name} />
      <PlatformSalesRepForm mode="edit" rep={rep} />
      <PlatformSalesRepBankForm salesRepId={rep.id} accounts={bankAccounts} />
      <PlatformSalesRepPortfolioPanel
        salesRepId={rep.id}
        attributions={attributions}
        dealerships={dealerships}
      />
    </div>
  );
}
