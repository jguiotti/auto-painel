"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from "@autopainel/shared/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  inviteDealershipCollaboratorAction,
  removeDealershipCollaboratorAction,
  updateDealershipCollaboratorRoleAction,
} from "@/actions/dealership-collaborators";
import type { DealershipCollaboratorRow } from "@/lib/data/dealership-collaborators";

const ROLE_LABEL_PT: Record<DealershipCollaboratorRow["role"], string> = {
  owner: "Titular (owner)",
  manager: "Gestor(a)",
  seller: "Vendedor(a)",
};

interface DealershipCollaboratorsPanelProps {
  dealershipId: string;
  collaborators: DealershipCollaboratorRow[];
}

export function DealershipCollaboratorsPanel({
  dealershipId,
  collaborators: initialCollaborators,
}: DealershipCollaboratorsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tempPasswordBanner, setTempPasswordBanner] = useState<string | null>(
    null,
  );

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Pessoas com acesso ao painel da loja</CardTitle>
        <CardDescription>
          Estas credenciais abrem o <strong>painel da concessionária</strong>{" "}
          (não este painel central). Transmita passwords provisórias apenas por canal
          seguro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {tempPasswordBanner ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
            <p className="font-medium">Palavra-passe provisória gerada</p>
            <p className="mt-1 font-mono text-xs break-all">{tempPasswordBanner}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(tempPasswordBanner);
                toast.success("Copiado para a área de transferência.");
              }}
            >
              Copiar
            </Button>
          </div>
        ) : null}

        <form
          action={(formData) => {
            startTransition(async () => {
              setTempPasswordBanner(null);
              const result = await inviteDealershipCollaboratorAction(
                dealershipId,
                formData,
              );
              if (result.error) {
                toast.error(result.error);
                return;
              }
              if (result.temporary_password) {
                setTempPasswordBanner(result.temporary_password);
              }
              toast.success("Pessoa convidada e conta criada.");
              router.refresh();
            });
          }}
          className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4"
        >
          <p className="text-sm font-medium text-foreground">
            Adicionar pessoa colaboradora
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-email">E-mail para início de sessão</Label>
              <Input
                id="invite-email"
                name="invite_email"
                type="email"
                autoComplete="off"
                placeholder="nome@correio.pt"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome completo</Label>
              <Input
                id="invite-name"
                name="invite_full_name"
                placeholder="Maria Silva"
                required
                minLength={2}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Papel</Label>
              <select
                id="invite-role"
                name="invite_role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="seller"
                disabled={pending}
              >
                <option value="seller">Vendedor(a)</option>
                <option value="manager">Gestor(a)</option>
                <option value="owner">Titular</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "A criar…" : "Criar conta e perfil"}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Lista de pessoas ({initialCollaborators.length})
          </p>
          <ul className="divide-y rounded-md border border-border">
            {initialCollaborators.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">
                Ainda não existem perfis ligados à concessionária.
              </li>
            ) : (
              initialCollaborators.map((row) => (
                <li key={row.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {row.full_name ?? "Sem nome no perfil"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {row.email ?? "E-mail não disponível"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ID:{" "}
                        <span className="font-mono" title={row.id}>
                          {row.id.slice(0, 8)}…
                        </span>
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          disabled={pending}
                        >
                          Remover acesso
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remover esta pessoa?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            A conta de utilizador será apagada. Esta ação não pode
                            ser anulada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              startTransition(async () => {
                                const result =
                                  await removeDealershipCollaboratorAction(
                                    dealershipId,
                                    row.id,
                                  );
                                if (result.error) {
                                  toast.error(result.error);
                                  return;
                                }
                                toast.success("Acesso removido.");
                                router.refresh();
                              });
                            }}
                          >
                            Confirmar remoção
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <form
                    action={(fd) => {
                      startTransition(async () => {
                        const result =
                          await updateDealershipCollaboratorRoleAction(
                            dealershipId,
                            row.id,
                            fd,
                          );
                        if (result.error) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Papel atualizado.");
                        router.refresh();
                      });
                    }}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <div className="space-y-1">
                      <Label htmlFor={`role-${row.id}`}>Papel</Label>
                      <select
                        id={`role-${row.id}`}
                        name="profile_role"
                        className="flex h-10 min-w-[11rem] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        defaultValue={row.role}
                        disabled={pending}
                      >
                        <option value="seller">{ROLE_LABEL_PT.seller}</option>
                        <option value="manager">{ROLE_LABEL_PT.manager}</option>
                        <option value="owner">{ROLE_LABEL_PT.owner}</option>
                      </select>
                    </div>
                    <Button type="submit" variant="outline" size="sm" disabled={pending}>
                      Guardar papel
                    </Button>
                  </form>
                </li>
              ))
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
