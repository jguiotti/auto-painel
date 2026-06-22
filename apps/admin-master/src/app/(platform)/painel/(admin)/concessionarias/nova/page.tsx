import { DealershipForm } from "@/components/dealership-form";
import { PricingCatalogSchemaWarning } from "@/components/pricing-catalog-schema-warning";
import { fetchDealershipOnboardingIntakeById } from "@/lib/data/dealership-onboarding-intakes";
import { fetchPlatformCommercialLeadById } from "@/lib/data/platform-commercial-leads";
import { mapCommercialLeadToDealershipPrefill } from "@/lib/data/platform-commercial-leads-shared";
import {
  fetchPlanModulesMapForAdmin,
  fetchPricingPlansForAdmin,
  getPricingCatalogSchemaState,
} from "@/lib/data/pricing-catalog";
import type { DealershipOnboardingUnitDraft } from "@autopainel/shared/types";
import type { DealershipUnitAdminRow } from "@/lib/data/dealership-units";

export const dynamic = "force-dynamic";

function mapIntakeUnitsToInitialRows(
  intakeId: string,
  units: DealershipOnboardingUnitDraft[],
): DealershipUnitAdminRow[] {
  return units.map((unit, index) => ({
    id: `intake-${intakeId}-${index}`,
    dealership_id: "",
    name: unit.name,
    address: unit.address as Record<string, unknown>,
    sort_order: index,
  }));
}

export default async function NovaConcessionariaPage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string; lead?: string }>;
}) {
  const params = await searchParams;
  const intakeId = params.intake?.trim() ?? "";
  const leadId = params.lead?.trim() ?? "";
  const intake =
    intakeId.length > 0 ? await fetchDealershipOnboardingIntakeById(intakeId) : null;
  const lead =
    !intake && leadId.length > 0
      ? await fetchPlatformCommercialLeadById(leadId)
      : null;
  const leadPrefill = lead ? mapCommercialLeadToDealershipPrefill(lead) : null;

  const schema = await getPricingCatalogSchemaState();
  const [pricingPlans, planModulesByPlanId] = await Promise.all([
    fetchPricingPlansForAdmin(),
    fetchPlanModulesMapForAdmin(),
  ]);

  const initialUnits =
    intake && intake.payload.units?.length
      ? mapIntakeUnitsToInitialRows(intake.id, intake.payload.units)
      : [];

  return (
    <div className="space-y-6">
      {schema.kind !== "ok" ? (
        <PricingCatalogSchemaWarning state={schema} />
      ) : null}
      {intake ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
          <p className="font-medium text-foreground">
            Dados pré-preenchidos a partir da adesão trial
          </p>
          <p className="mt-1 text-muted-foreground">
            Revise identidade visual, textos da vitrine e plano antes de publicar. Intake:{" "}
            <span className="font-mono text-xs">{intake.id}</span>
          </p>
        </div>
      ) : null}
      {lead ? (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-4 text-sm">
          <p className="font-medium text-foreground">
            Dados pré-preenchidos a partir do lead comercial
          </p>
          <p className="mt-1 text-muted-foreground">
            {lead.full_name} · {lead.email}. Ao salvar, o lead avançará para onboarding e ficará
            vinculado à nova loja.
          </p>
        </div>
      ) : null}
      <DealershipForm
        key={`dealership-create-${intake?.id ?? lead?.id ?? "new"}`}
        mode="create"
        dealership={null}
        initialUnits={initialUnits}
        pricingPlans={pricingPlans}
        planModulesByPlanId={planModulesByPlanId}
        intakePrefill={intake?.payload ?? null}
        intakeId={intake?.id ?? null}
        leadPrefill={leadPrefill}
        leadId={lead?.id ?? null}
      />
    </div>
  );
}
