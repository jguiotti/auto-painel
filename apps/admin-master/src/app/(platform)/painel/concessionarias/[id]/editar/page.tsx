import type { PricingPlanListRow } from "@autopainel/shared/types";
import { notFound } from "next/navigation";

import { DealershipForm } from "@/components/dealership-form";
import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { fetchDealershipById } from "@/lib/data/dealership-by-id";
import { fetchDealershipCollaborators } from "@/lib/data/dealership-collaborators";
import { fetchDealershipUnits } from "@/lib/data/dealership-units";
import { fetchDealershipOperatorBillingSuite } from "@/lib/data/dealership-operator-billing";
import {
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";
import type { DealershipAdminRow } from "@/types/dealership-admin";

function resolveCommercialPlanLabel(
  plans: PricingPlanListRow[],
  dealership: DealershipAdminRow,
): string {
  if (dealership.pricing_plan_id) {
    const hit = plans.find((p) => p.id === dealership.pricing_plan_id);
    if (hit?.name.trim()) {
      return hit.name.trim();
    }
  }
  const legacy = dealership.subscription_plan?.trim();
  if (legacy && legacy.length > 0) {
    return legacy;
  }
  return "—";
}

export const dynamic = "force-dynamic";

interface EditarConcessionariaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarConcessionariaPage({
  params,
}: EditarConcessionariaPageProps) {
  const { id } = await params;
  const row = await fetchDealershipById(id);
  if (!row) {
    notFound();
  }
  const schema = await getPricingCatalogSchemaState();
  const [units, pricingPlans, collaborators, billingSuite] = await Promise.all([
    fetchDealershipUnits(id),
    fetchPricingPlansForAdmin(),
    fetchDealershipCollaborators(id),
    fetchDealershipOperatorBillingSuite(id),
  ]);
  return (
    <div className="space-y-6">
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}
      <DealershipForm
        key={row.id}
        mode="edit"
        dealership={row}
        initialUnits={units}
        pricingPlans={pricingPlans}
        commercialPlanLabel={resolveCommercialPlanLabel(pricingPlans, row)}
        collaborators={collaborators}
        operatorBilling={billingSuite.billing}
        billingHistory={billingSuite.history}
        billingTablesUnavailable={billingSuite.tablesMissing}
      />
    </div>
  );
}
