import { redirect } from "next/navigation";

import type {
  DealershipEmployeePanelRow,
  DealershipSalesRankingRow,
} from "@autopainel/shared/types";

import { TeamPanel } from "@/components/team/team-panel";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

const RANKING_DAYS = 30;

export default async function TeamPage() {
  const { supabase, profile, dealershipId } = await requireDashboardSession(
    "/painel/equipe",
  );

  const canManageTeam =
    profile.role === "owner" || profile.role === "super_admin";

  if (!canManageTeam) {
    redirect("/painel/conta/perfil");
  }

  const [employeesRes, rankingRes] = await Promise.all([
    supabase.rpc("list_dealership_employees_for_panel", {
      p_dealership_id: dealershipId,
    }),
    supabase.rpc("get_dealership_sales_ranking", {
      p_dealership_id: dealershipId,
      p_days: RANKING_DAYS,
    }),
  ]);

  if (employeesRes.error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar a equipe: {employeesRes.error.message}
      </p>
    );
  }

  const employees = (employeesRes.data ?? []) as DealershipEmployeePanelRow[];
  const ranking = (rankingRes.data ?? []) as DealershipSalesRankingRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Equipe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastro de colaboradores, comissões e ranking de vendas.
        </p>
      </div>
      <TeamPanel
        employees={employees}
        ranking={ranking}
        rankingDays={RANKING_DAYS}
        canInvite={profile.role === "owner" || profile.role === "super_admin"}
      />
    </div>
  );
}
