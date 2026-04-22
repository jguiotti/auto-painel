import { DealershipsTable } from "@/components/dealerships-table";
import { fetchDealerships } from "@/lib/data/dealerships";

export const dynamic = "force-dynamic";

export default async function ConcessionariasPage() {
  const rows = await fetchDealerships();
  return <DealershipsTable rows={rows} />;
}
