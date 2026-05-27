import { notFound } from "next/navigation";

import { DealershipOperatorSurfaceLinks } from "@/components/dealership-operator-surface-links";
import { DealershipForm } from "@/components/dealership-form";
import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { fetchDealershipById } from "@/lib/data/dealership-by-id";
import { fetchDealershipCollaborators } from "@/lib/data/dealership-collaborators";
import { fetchDealershipUnits } from "@/lib/data/dealership-units";
import { fetchDealershipOperatorBillingSuite } from "@/lib/data/dealership-operator-billing";
import {
  fetchPlanModulesMapForAdmin,
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

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
  const [units, pricingPlans, planModulesByPlanId, collaborators, billingSuite] =
    await Promise.all([
    fetchDealershipUnits(id),
    fetchPricingPlansForAdmin(),
    fetchPlanModulesMapForAdmin(),
    fetchDealershipCollaborators(id),
    fetchDealershipOperatorBillingSuite(id),
  ]);
  return (
    <div className="space-y-6">
      <DealershipOperatorSurfaceLinks slug={row.slug} />
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}
      <DealershipForm
        key={row.id}
        mode="edit"
        dealership={row}
        initialUnits={units}
        pricingPlans={pricingPlans}
        planModulesByPlanId={planModulesByPlanId}
        collaborators={collaborators}
        operatorBilling={billingSuite.billing}
        billingHistory={billingSuite.history}
        billingTablesUnavailable={billingSuite.tablesMissing}
      />
    </div>
  );
}
