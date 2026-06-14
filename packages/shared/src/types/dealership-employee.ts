import type { BrazilianAddressFields } from "./dealership-config";

export interface DealershipEmployeePanelRow {
  user_id: string;
  role: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  photo_url: string | null;
  address: BrazilianAddressFields | Record<string, unknown>;
  base_salary: number | null;
  commission_percent: number | null;
  commission_fixed_per_vehicle: number | null;
  is_active: boolean;
  can_view_compensation: boolean;
}

export interface DealershipSalesRankingRow {
  user_id: string;
  full_name: string;
  role: string;
  won_leads_count: number;
  estimated_commission: number | null;
  can_view_compensation: boolean;
}

export const EMPLOYEE_ROLE_LABELS: Record<string, string> = {
  owner: "Titular",
  manager: "Gestor(a)",
  seller: "Vendedor(a)",
};
