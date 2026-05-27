"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
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

import { deleteDealershipAction } from "@/actions/dealerships";
import type { DealershipAdminRow } from "@/types/dealership-admin";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function swatch(theme: Record<string, unknown>) {
  const p = theme.primary;
  const color = typeof p === "string" && HEX_RE.test(p) ? p : "#cbd5e1";
  return (
    <span
      className="inline-block size-6 rounded border border-border shadow-sm"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

function formatDomain(row: DealershipAdminRow) {
  if (row.custom_domain && row.custom_domain.trim().length > 0) {
    return row.custom_domain.trim();
  }
  return row.slug;
}

function formatThemeModeLabel(mode: DealershipAdminRow["storefront_theme_mode"]) {
  return mode === "dark" ? "Escuro" : "Claro";
}

function statusLabel(status: DealershipAdminRow["status"]) {
  if (status === "active") {
    return "Ativa";
  }
  if (status === "pending_setup") {
    return "Configuração pendente";
  }
  if (status === "suspended") {
    return "Suspensa";
  }
  return "Encerrada";
}

function statusBadgeClass(status: DealershipAdminRow["status"]) {
  if (status === "active") {
    return "border-emerald-600/30 bg-emerald-600/10 text-emerald-700";
  }
  if (status === "pending_setup") {
    return "border-amber-600/30 bg-amber-600/10 text-amber-700";
  }
  if (status === "suspended") {
    return "border-orange-600/30 bg-orange-600/10 text-orange-700";
  }
  return "border-zinc-500/30 bg-zinc-500/10 text-zinc-700";
}

function resolvePlanLabel(
  row: DealershipAdminRow,
  pricingPlanLabels: Record<string, string>,
): string {
  if (row.pricing_plan_id && pricingPlanLabels[row.pricing_plan_id]) {
    return pricingPlanLabels[row.pricing_plan_id];
  }
  const legacy = row.subscription_plan?.trim();
  return legacy && legacy.length > 0 ? legacy : "—";
}

export function DealershipsTable({
  rows,
  pricingPlanLabels = {},
}: {
  rows: DealershipAdminRow[];
  pricingPlanLabels?: Record<string, string>;
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DealershipAdminRow | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    DealershipAdminRow["status"] | "all"
  >("all");
  const [themeFilter, setThemeFilter] = useState<
    DealershipAdminRow["storefront_theme_mode"] | "all"
  >("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const normalizedQuery = query.trim().toLowerCase();
  const planOptions = Array.from(
    new Set(
      rows
        .map((row) => resolvePlanLabel(row, pricingPlanLabels))
        .filter((value) => value !== "—"),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filteredRows = rows.filter((row) => {
    if (
      normalizedQuery.length > 0 &&
      ![
        row.name,
        row.slug,
        row.custom_domain ?? "",
        resolvePlanLabel(row, pricingPlanLabels),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }
    if (statusFilter !== "all" && row.status !== statusFilter) {
      return false;
    }
    if (themeFilter !== "all" && row.storefront_theme_mode !== themeFilter) {
      return false;
    }
    if (
      planFilter !== "all" &&
      resolvePlanLabel(row, pricingPlanLabels) !== planFilter
    ) {
      return false;
    }
    return true;
  });

  const statusCounters = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.status === "active") {
        acc.active += 1;
      } else if (row.status === "pending_setup") {
        acc.pending_setup += 1;
      } else if (row.status === "suspended") {
        acc.suspended += 1;
      } else {
        acc.churned += 1;
      }
      return acc;
    },
    {
      total: 0,
      active: 0,
      pending_setup: 0,
      suspended: 0,
      churned: 0,
    },
  );

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    const id = deleteTarget.id;
    startTransition(async () => {
      const result = await deleteDealershipAction(id);
      setDeleteTarget(null);
      if (!result.error) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concessionárias</h1>
          <p className="text-sm text-muted-foreground">
            Crie contas, defina subdomínio e cores da marca. Alterações aplicam-se
            à vitrine multitenant.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/painel/concessionarias/nova">
            <Plus className="size-4" aria-hidden />
            Nova concessionária
          </Link>
        </Button>
      </div>

      <Card className="mb-4 border-border shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscar loja
            </p>
            <Input
              placeholder="Nome, slug, domínio ou plano"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as DealershipAdminRow["status"] | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="pending_setup">Configuração pendente</SelectItem>
                <SelectItem value="suspended">Suspensa</SelectItem>
                <SelectItem value="churned">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tema
            </p>
            <Select
              value={themeFilter}
              onValueChange={(value) =>
                setThemeFilter(
                  value as DealershipAdminRow["storefront_theme_mode"] | "all",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plano
            </p>
            <Select value={planFilter} onValueChange={(value) => setPlanFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {planOptions.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">Total: {statusCounters.total}</Badge>
          <Badge className={statusBadgeClass("active")}>
            Ativas: {statusCounters.active}
          </Badge>
          <Badge className={statusBadgeClass("pending_setup")}>
            Pendentes: {statusCounters.pending_setup}
          </Badge>
          <Badge className={statusBadgeClass("suspended")}>
            Suspensas: {statusCounters.suspended}
          </Badge>
          <Badge className={statusBadgeClass("churned")}>
            Encerradas: {statusCounters.churned}
          </Badge>
        </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Subdomínio</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="w-[70px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {rows.length === 0
                    ? "Nenhuma concessionária cadastrada."
                    : "Nenhuma concessionária encontrada com os filtros atuais."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {formatDomain(row)}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {row.slug}
                    </code>
                  </TableCell>
                  <TableCell>{swatch(row.theme_settings)}</TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(row.status)}>
                      {statusLabel(row.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatThemeModeLabel(row.storefront_theme_mode)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {resolvePlanLabel(row, pricingPlanLabels)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/painel/concessionarias/${row.id}/editar`}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir concessionária?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a loja <strong>{deleteTarget?.name}</strong> e pode
              apagar estoque e dados vinculados (cascata). Não é reversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => confirmDelete()}
            >
              {pending ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
