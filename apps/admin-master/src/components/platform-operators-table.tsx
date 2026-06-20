"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@autopainel/shared/ui";

import { EmptyState } from "@autopainel/shared/components/empty-state";

import { removePlatformOperatorAction } from "@/actions/platform-users";
import type { PlatformUserRow } from "@/types/platform-user";

interface PlatformOperatorsTableProps {
  operators: PlatformUserRow[];
}

export function PlatformOperatorsTable({ operators }: PlatformOperatorsTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlatformUserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return operators;
    }
    return operators.filter((user) => {
      const haystack = [user.email, user.full_name].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [operators, search]);

  function confirmRemove() {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      const result = await removePlatformOperatorAction(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      toast.success("Operador removido.");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Operadores AutoPainel</CardTitle>
          <CardDescription>
            Contas com acesso ao painel administrativo (super_admin). Não confundir com vendedores
            comerciais internos — ver PRD de equipe comercial abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Buscar por e-mail ou nome…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="sm:max-w-sm"
            />
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {filtered.length} de {operators.length}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum operador encontrado"
              description={
                operators.length === 0
                  ? "Não há super_admin cadastrados."
                  : "Ajuste a busca."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail / nome</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Conta Auth</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.email ?? "—"}</div>
                        {user.full_name ? (
                          <div className="text-xs text-muted-foreground">{user.full_name}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Painel administrativo</Badge>
                      </TableCell>
                      <TableCell>
                        {user.auth_exists ? (
                          <Badge variant="outline">Ativa</Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive text-destructive">
                            Órfão
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Ações">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => {
                                setDeleteError(null);
                                setDeleteTarget(user);
                              }}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Remover operador
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover operador da plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Remove o acesso administrativo de{" "}
                  <strong>{deleteTarget.email ?? deleteTarget.full_name ?? "este perfil"}</strong>.
                  Não é reversível.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={confirmRemove}>
              {pending ? "Removendo…" : "Remover definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
