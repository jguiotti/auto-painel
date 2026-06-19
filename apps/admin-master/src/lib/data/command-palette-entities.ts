import "server-only";

import { fetchDealerships } from "@/lib/data/dealerships";
import {
  fetchPricingPlansForAdmin,
  fetchSaasModulesForAdmin,
} from "@/lib/data/pricing-catalog";

export interface CommandPaletteEntity {
  id: string;
  kind: "dealership" | "plan" | "module" | "nav";
  label: string;
  href: string;
  searchValue: string;
}

const NAV_ENTITIES: CommandPaletteEntity[] = [
  {
    id: "nav-dashboard",
    kind: "nav",
    label: "Painel global",
    href: "/painel/dashboard",
    searchValue: "painel global dashboard início",
  },
  {
    id: "nav-dealerships",
    kind: "nav",
    label: "Concessionárias",
    href: "/painel/concessionarias",
    searchValue: "concessionárias lojas tenants",
  },
  {
    id: "nav-plans",
    kind: "nav",
    label: "Planos comerciais",
    href: "/painel/planos",
    searchValue: "planos comerciais pricing",
  },
  {
    id: "nav-modules",
    kind: "nav",
    label: "Módulos",
    href: "/painel/modulos",
    searchValue: "módulos saas features",
  },
  {
    id: "nav-users",
    kind: "nav",
    label: "Usuários",
    href: "/painel/usuarios",
    searchValue: "usuários gestores provisionamento owner",
  },
  {
    id: "nav-leads",
    kind: "nav",
    label: "Leads comerciais",
    href: "/painel/leads-comerciais",
    searchValue: "leads comerciais crm b2b pipeline vendas",
  },
  {
    id: "nav-contracts",
    kind: "nav",
    label: "Contratos comerciais",
    href: "/painel/contratos",
    searchValue: "contratos assinatura comercial saas",
  },
  {
    id: "nav-content-calendar",
    kind: "nav",
    label: "Calendário de conteúdo",
    href: "/painel/calendario-conteudo",
    searchValue: "calendário conteúdo marketing editorial",
  },
  {
    id: "nav-finance",
    kind: "nav",
    label: "Financeiro",
    href: "/painel/financeiro",
    searchValue: "financeiro cobrança inadimplência trial",
  },
  {
    id: "nav-docs",
    kind: "nav",
    label: "Documentação interna",
    href: "/painel/documentacao",
    searchValue: "documentação interna técnica regras",
  },
];

export async function fetchCommandPaletteEntities(): Promise<CommandPaletteEntity[]> {
  const [dealerships, plans, modules] = await Promise.all([
    fetchDealerships(),
    fetchPricingPlansForAdmin(),
    fetchSaasModulesForAdmin(),
  ]);

  const dealershipEntities: CommandPaletteEntity[] = dealerships.map((row) => ({
    id: `dealership-${row.id}`,
    kind: "dealership",
    label: row.name,
    href: `/painel/concessionarias/${row.id}/editar`,
    searchValue: `${row.name} ${row.slug} ${row.custom_domain ?? ""} concessionária loja ${row.status}`,
  }));

  const planEntities: CommandPaletteEntity[] = plans.map((plan) => ({
    id: `plan-${plan.id}`,
    kind: "plan",
    label: plan.name,
    href: `/painel/planos/${plan.id}/editar`,
    searchValue: `${plan.name} ${plan.slug} plano comercial`,
  }));

  const moduleEntities: CommandPaletteEntity[] = modules.map((mod) => ({
    id: `module-${mod.id}`,
    kind: "module",
    label: mod.display_name,
    href: `/painel/modulos/${mod.id}/editar`,
    searchValue: `${mod.display_name} ${mod.key} módulo saas`,
  }));

  return [...NAV_ENTITIES, ...dealershipEntities, ...planEntities, ...moduleEntities];
}
