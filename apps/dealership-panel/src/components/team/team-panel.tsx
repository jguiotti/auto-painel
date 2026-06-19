"use client";

import { useState } from "react";

import {
  EMPLOYEE_ROLE_LABELS,
  type DealershipEmployeePanelRow,
  type DealershipSalesRankingRow,
} from "@autopainel/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { EmployeeEditDialog } from "@/components/team/employee-edit-dialog";
import { TeamInviteDialog } from "@/components/team/team-invite-dialog";
import { formatBrl } from "@/lib/format/format-brl";

interface TeamPanelProps {
  employees: DealershipEmployeePanelRow[];
  ranking: DealershipSalesRankingRow[];
  rankingDays: number;
  canInvite: boolean;
}

export function TeamPanel({
  employees,
  ranking,
  rankingDays,
  canInvite,
}: TeamPanelProps) {
  const [editEmployee, setEditEmployee] =
    useState<DealershipEmployeePanelRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Ranking de vendas</CardTitle>
          <CardDescription>
            Leads ganhos nos últimos {rankingDays} dias (por responsável).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Comissão est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((row) => (
                <TableRow key={row.user_id}>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>
                    {EMPLOYEE_ROLE_LABELS[row.role] ?? row.role}
                  </TableCell>
                  <TableCell className="text-right">{row.won_leads_count}</TableCell>
                  <TableCell className="text-right">
                    {row.can_view_compensation && row.estimated_commission != null
                      ? formatBrl(row.estimated_commission)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              Perfis de RH e comissão. O titular pode convidar vendedores e gestores.
            </CardDescription>
          </div>
          {canInvite ? (
            <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
              Convidar colaborador
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.user_id}>
                  <TableCell className="font-medium">{employee.full_name}</TableCell>
                  <TableCell>{employee.email ?? "—"}</TableCell>
                  <TableCell>
                    {EMPLOYEE_ROLE_LABELS[employee.role] ?? employee.role}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditEmployee(employee)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeEditDialog
        employee={editEmployee}
        open={editEmployee !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditEmployee(null);
          }
        }}
      />

      <TeamInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
