"use client";

import { MoreHorizontal, Pencil, Receipt, Shuffle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";
import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  PLATFORM_SALES_REP_STATUS_LABELS,
  PLATFORM_SALES_REP_STATUSES,
  formatCommissionRateBps,
  type PlatformSalesRepListRow,
} from "@/lib/data/platform-sales-squad-shared";

interface PlatformSalesRepsTableProps {
  reps: PlatformSalesRepListRow[];
}

function statusBadgeClass(status: string): string {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "onboarding") {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-muted text-muted-foreground";
}

export function PlatformSalesRepsTable({ reps }: PlatformSalesRepsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reps.filter((rep) => {
      if (statusFilter !== "all" && rep.status !== statusFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [rep.full_name, rep.email, rep.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reps, search, statusFilter]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Representantes comerciais</CardTitle>
          <CardDescription>
            Cadastre a equipe de vendas, acompanhe carteiras, comissões e pagamentos.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/painel/equipe/comercial/novo">Novo representante</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PLATFORM_SALES_REP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {PLATFORM_SALES_REP_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground sm:ml-auto">
            {filtered.length} de {reps.length}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum representante cadastrado"
            description={
              reps.length === 0
                ? "Adicione representantes comerciais para vincular lojas fechadas e calcular comissões recorrentes."
                : "Ajuste a busca ou o filtro de status."
            }
            action={
              reps.length === 0
                ? {
                    label: "Cadastrar primeiro representante",
                    href: "/painel/equipe/comercial/novo",
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Lojas na carteira</TableHead>
                  <TableHead>Comissão padrão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/painel/equipe/comercial/${rep.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {rep.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rep.email}</TableCell>
                    <TableCell>{rep.confirmed_attributions_count}</TableCell>
                    <TableCell>
                      {formatCommissionRateBps(rep.default_commission_rate_bps)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(rep.status)}>
                        {PLATFORM_SALES_REP_STATUS_LABELS[rep.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/painel/equipe/comercial/${rep.id}`}>
                              <Pencil className="size-4" />
                              Editar cadastro
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/painel/equipe/comercial/${rep.id}/extrato`}>
                              <Receipt className="size-4" />
                              Ver extrato
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/painel/equipe/comercial/${rep.id}/repasse`}>
                              <Shuffle className="size-4" />
                              Repassar carteira
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
