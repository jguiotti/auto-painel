import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { PricingPlanForm } from "@/components/pricing-plan-form";
import {
  fetchSaasModulesForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function NovoPlanoPage() {
  const schema = await getPricingCatalogSchemaState();
  const modules = await fetchSaasModulesForAdmin();

  if (schema.kind !== "ok") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-6">
        <PricingCatalogSchemaWarning state={schema} />
      </div>
    );
  }

  return (
    <PricingPlanForm mode="create" modules={modules} selectedModuleIds={[]} />
  );
}
