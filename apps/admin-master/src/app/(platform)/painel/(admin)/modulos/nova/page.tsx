import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { SaasModuleCreateForm } from "@/components/saas-module-create-form";
import { getPricingCatalogSchemaState } from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

export default async function NovaModuloPage() {
  const schema = await getPricingCatalogSchemaState();

  if (schema.kind !== "ok") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-12 pt-6">
        <PricingCatalogSchemaWarning state={schema} />
      </div>
    );
  }

  return <SaasModuleCreateForm />;
}
