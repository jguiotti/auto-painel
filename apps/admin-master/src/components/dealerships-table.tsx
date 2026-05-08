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
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export function DealershipsTable({ rows }: { rows: DealershipAdminRow[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DealershipAdminRow | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

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

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Domínio</TableHead>
              <TableHead>Subdomínio</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="w-[70px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhuma concessionária cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
                  <TableCell className="capitalize">{row.status}</TableCell>
                  <TableCell className="capitalize">{row.subscription_plan}</TableCell>
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
