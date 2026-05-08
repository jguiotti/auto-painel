import { FinanceTable } from "@/components/finance-table";
import { PlatformFinanceSettingsForm } from "@/components/platform-finance-settings-form";
import { getPlatformFinanceSettings } from "@/lib/data/platform-finance-settings";
import { fetchDealerships } from "@/lib/data/dealerships";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const financeSettings = await getPlatformFinanceSettings();
  const rows = await fetchDealerships();
  return (
    <div className="space-y-6">
      <PlatformFinanceSettingsForm
        monthlyRatePercent={financeSettings.finance_monthly_interest_rate_percent}
      />
      <FinanceTable rows={rows} />
    </div>
  );
}
