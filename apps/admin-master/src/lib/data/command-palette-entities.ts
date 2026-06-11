import "server-only";

import { fetchDealerships } from "@/lib/data/dealerships";
import { fetchPricingPlansForAdmin } from "@/lib/data/pricing-catalog";

export interface CommandPaletteEntity {
  id: string;
  kind: "dealership" | "plan" | "nav";
  label: string;
  href: string;
  searchValue: string;
}

export async function fetchCommandPaletteEntities(): Promise<CommandPaletteEntity[]> {
  const [dealerships, plans] = await Promise.all([
    fetchDealerships(),
    fetchPricingPlansForAdmin(),
  ]);

  const dealershipEntities: CommandPaletteEntity[] = dealerships.map((row) => ({
    id: `dealership-${row.id}`,
    kind: "dealership",
    label: row.name,
    href: `/painel/concessionarias/${row.id}/editar`,
    searchValue: `${row.name} ${row.slug} ${row.custom_domain ?? ""} concessionária loja`,
  }));

  const planEntities: CommandPaletteEntity[] = plans.map((plan) => ({
    id: `plan-${plan.id}`,
    kind: "plan",
    label: plan.name,
    href: `/painel/planos/${plan.id}/editar`,
    searchValue: `${plan.name} ${plan.slug} plano comercial`,
  }));

  return [...dealershipEntities, ...planEntities];
}
