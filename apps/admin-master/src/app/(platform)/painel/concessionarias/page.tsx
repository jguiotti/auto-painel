import { DealershipsTable } from "@/components/dealerships-table";
import { fetchDealerships } from "@/lib/data/dealerships";
import { fetchPricingPlansForAdmin } from "@/lib/data/pricing-catalog";
import type { DealershipAdminRow } from "@/types/dealership-admin";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = new Set<DealershipAdminRow["status"]>([
  "active",
  "pending_setup",
  "suspended",
  "churned",
]);

function parseStatusFilter(
  value: string | undefined,
): DealershipAdminRow["status"] | undefined {
  if (!value) {
    return undefined;
  }
  return STATUS_FILTERS.has(value as DealershipAdminRow["status"])
    ? (value as DealershipAdminRow["status"])
    : undefined;
}

interface ConcessionariasPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ConcessionariasPage({
  searchParams,
}: ConcessionariasPageProps) {
  const params = await searchParams;
  const initialStatusFilter = parseStatusFilter(params.status?.trim());

  const [rows, pricingPlans] = await Promise.all([
    fetchDealerships(),
    fetchPricingPlansForAdmin(),
  ]);
  const pricingPlanLabels = Object.fromEntries(
    pricingPlans.map((plan) => [plan.id, plan.name]),
  );
  return (
    <DealershipsTable
      rows={rows}
      pricingPlanLabels={pricingPlanLabels}
      initialStatusFilter={initialStatusFilter}
    />
  );
}
