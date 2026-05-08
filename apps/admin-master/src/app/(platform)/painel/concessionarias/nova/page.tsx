import { DealershipForm } from "@/components/dealership-form";
import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import {
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function NovaConcessionariaPage() {
  const schema = await getPricingCatalogSchemaState();
  const pricingPlans = await fetchPricingPlansForAdmin();

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
      />
    </div>
  );
}
