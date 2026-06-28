import { notFound } from "next/navigation";

import { ContactQuickActions } from "@/components/contact-quick-actions";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{row.name}</h1>
          <p className="text-sm text-muted-foreground">{row.slug}</p>
        </div>
        <ContactQuickActions
          email={row.contact_email}
          phone={row.whatsapp_number}
          label={row.name}
        />
      </div>
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
