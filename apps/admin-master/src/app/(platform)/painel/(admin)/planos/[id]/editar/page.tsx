import { notFound } from "next/navigation";

import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { PricingPlanForm } from "@/components/pricing-plan-form";
import {
  fetchPricingPlanByIdForAdmin,
  fetchPricingPlanModuleIdsForAdmin,
  fetchSaasModulesForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";

export const dynamic = "force-dynamic";

interface EditarPlanoPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPlanoPage({ params }: EditarPlanoPageProps) {
  const schema = await getPricingCatalogSchemaState();

  if (schema.kind !== "ok") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12 pt-6">
        <PricingCatalogSchemaWarning state={schema} />
      </div>
    );
  }

  const { id } = await params;
  const [plan, modules, selectedIds] = await Promise.all([
    fetchPricingPlanByIdForAdmin(id),
    fetchSaasModulesForAdmin(),
    fetchPricingPlanModuleIdsForAdmin(id),
  ]);

  if (!plan) {
    notFound();
  }

  return (
    <PricingPlanForm
      mode="edit"
      plan={plan}
      modules={modules}
      selectedModuleIds={selectedIds}
    />
  );
}
