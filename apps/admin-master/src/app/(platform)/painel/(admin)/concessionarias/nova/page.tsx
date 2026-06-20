import { DealershipForm } from "@/components/dealership-form";
import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import {
  fetchPlanModulesMapForAdmin,
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function NovaConcessionariaPage() {
  const schema = await getPricingCatalogSchemaState();
  const [pricingPlans, planModulesByPlanId] = await Promise.all([
    fetchPricingPlansForAdmin(),
    fetchPlanModulesMapForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}
      <DealershipForm
        key="dealership-create"
        mode="create"
        dealership={null}
        initialUnits={[]}
        pricingPlans={pricingPlans}
        planModulesByPlanId={planModulesByPlanId}
      />
    </div>
  );
}
