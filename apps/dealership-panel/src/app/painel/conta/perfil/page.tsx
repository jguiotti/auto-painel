import Link from "next/link";
import { redirect } from "next/navigation";

import {
  EMPLOYEE_ROLE_LABELS,
  type DealershipEmployeePanelRow,
} from "@autopainel/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function MyEmployeeProfilePage() {
  const { supabase, profile, dealershipId, user } =
    await requireDashboardSession("/painel/conta/perfil");

  const { data, error } = await supabase.rpc("list_dealership_employees_for_panel", {
    p_dealership_id: dealershipId,
  });

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar seu perfil: {error.message}
      </p>
    );
  }

  const rows = (data ?? []) as DealershipEmployeePanelRow[];
  const me = rows.find((row) => row.user_id === user.id);

  if (!me) {
    redirect("/painel");
  }

  const canManageTeam =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus dados cadastrais e remuneração na loja.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{me.full_name}</CardTitle>
          <CardDescription>{me.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {EMPLOYEE_ROLE_LABELS[me.role] ?? me.role}
            </Badge>
            <Badge variant={me.is_active ? "default" : "secondary"}>
              {me.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Telefone</dt>
              <dd>{me.phone ?? "—"}</dd>
            </div>
            {me.can_view_compensation ? (
              <>
                <div>
                  <dt className="text-muted-foreground">Salário base</dt>
                  <dd>
                    {me.base_salary != null ? formatBrl(me.base_salary) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comissão (%)</dt>
                  <dd>
                    {me.commission_percent != null
                      ? `${me.commission_percent}%`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fixo por veículo</dt>
                  <dd>
                    {me.commission_fixed_per_vehicle != null
                      ? formatBrl(me.commission_fixed_per_vehicle)
                      : "—"}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

          <p className="text-xs text-muted-foreground">
            Para alterar CPF, endereço ou comissão, fale com o gestor da loja.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/painel/conta/senha">Alterar senha</Link>
        </Button>
        {canManageTeam ? (
          <Button asChild>
            <Link href="/painel/equipe">Gerenciar equipe</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
