"use client";

import { AlertTriangle, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
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
  toast,
} from "@autopainel/shared/ui";

import { EmptyState } from "@autopainel/shared/components/empty-state";

import { removePlatformStoreUserAction } from "@/actions/platform-users";
import type { PlatformProfileRole, PlatformUserRow } from "@/types/platform-user";

const ROLE_LABEL_PT: Record<PlatformProfileRole, string> = {
  super_admin: "Operador plataforma",
  owner: "Titular",
  manager: "Gestor(a)",
  seller: "Vendedor(a)",
  admin: "Admin loja",
};

interface PlatformStoreUsersTableProps {
  users: PlatformUserRow[];
}

export function PlatformStoreUsersTable({ users }: PlatformStoreUsersTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<PlatformUserRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        user.email,
        user.full_name,
        user.dealership_name,
        user.dealership_slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter]);

  function confirmRemove() {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      const result = await removePlatformStoreUserAction(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      toast.success("Usuário removido da plataforma.");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Usuários das concessionárias</CardTitle>
          <CardDescription>
            Titulares, gestores e vendedores com acesso ao painel da loja. Perfis órfãos (sem
            conta Auth) aparecem marcados — remova-os para liberar exclusão da concessionária.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Buscar por e-mail, nome ou loja…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="owner">Titular</SelectItem>
                <SelectItem value="manager">Gestor(a)</SelectItem>
                <SelectItem value="seller">Vendedor(a)</SelectItem>
                <SelectItem value="admin">Admin loja</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {filtered.length} de {users.length}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum usuário encontrado"
              description={
                users.length === 0
                  ? "Ainda não há perfis vinculados a concessionárias."
                  : "Ajuste os filtros ou a busca."
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail / nome</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Papel</TableHead>
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
                        {user.dealership_name ? (
                          <Link
                            href={`/painel/concessionarias/${user.dealership_id}/editar`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {user.dealership_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ROLE_LABEL_PT[user.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.auth_exists ? (
                          <Badge variant="outline">Ativa</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 border-destructive text-destructive"
                          >
                            <AlertTriangle className="size-3" aria-hidden />
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
                              Remover da plataforma
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
            <AlertDialogTitle>Remover usuário da plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Esta ação remove{" "}
                  <strong>{deleteTarget.email ?? deleteTarget.full_name ?? "este perfil"}</strong>{" "}
                  {deleteTarget.dealership_name
                    ? ` da loja ${deleteTarget.dealership_name}`
                    : ""}
                  . Não é reversível.
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
