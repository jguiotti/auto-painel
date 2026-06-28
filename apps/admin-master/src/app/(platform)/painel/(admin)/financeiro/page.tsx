import { PlatformFinanceDashboardClient } from "@/components/platform-finance-dashboard-client";
import { fetchDealershipsForAdminList } from "@/lib/data/dealerships";
import {
  fetchAllPlatformExpenseEntries,
  fetchAllPlatformRevenueEntries,
  fetchPlatformFinanceDashboard,
} from "@/lib/data/platform-internal-finance";
import { getPlatformFinanceSettings } from "@/lib/data/platform-finance-settings";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const [financeSettings, subscriptionRows, snapshot, revenueEntries, expenseEntries] =
    await Promise.all([
      getPlatformFinanceSettings(),
      fetchDealershipsForAdminList(),
      fetchPlatformFinanceDashboard(),
      fetchAllPlatformRevenueEntries(),
      fetchAllPlatformExpenseEntries(),
    ]);

  return (
    <PlatformFinanceDashboardClient
      snapshot={snapshot}
      allRevenueEntries={revenueEntries}
      allExpenseEntries={expenseEntries}
      subscriptionRows={subscriptionRows}
      monthlyRatePercent={financeSettings.finance_monthly_interest_rate_percent}
    />
  );
}
