import { DealershipsTable } from "@/components/dealerships-table";
import { fetchDealerships } from "@/lib/data/dealerships";
import { fetchPricingPlansForAdmin } from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function ConcessionariasPage() {
  const [rows, pricingPlans] = await Promise.all([
    fetchDealerships(),
    fetchPricingPlansForAdmin(),
  ]);
  const pricingPlanLabels = Object.fromEntries(
    pricingPlans.map((plan) => [plan.id, plan.name]),
  );
  return (
    <DealershipsTable rows={rows} pricingPlanLabels={pricingPlanLabels} />
  );
}
