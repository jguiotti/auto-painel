import { AdesoesTrialPageClient } from "@/components/adesoes-trial-page-client";
import { fetchDealershipOnboardingIntakes } from "@/lib/data/dealership-onboarding-intakes";
import { fetchPlatformCommercialLeads } from "@/lib/data/platform-commercial-leads";

export const dynamic = "force-dynamic";

export default async function AdesoesTrialPage() {
  const [rows, commercialLeads] = await Promise.all([
    fetchDealershipOnboardingIntakes(),
    fetchPlatformCommercialLeads(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Adesões trial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Formulários públicos de onboarding — vincule ao lead comercial e converta em
          concessionária.
        </p>
      </div>

      <AdesoesTrialPageClient rows={rows} commercialLeads={commercialLeads} />
    </div>
  );
}
