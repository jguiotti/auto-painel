import { FinanceTable } from "@/components/finance-table";
import { fetchDealerships } from "@/lib/data/dealerships";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const rows = await fetchDealerships();
  return <FinanceTable rows={rows} />;
}
