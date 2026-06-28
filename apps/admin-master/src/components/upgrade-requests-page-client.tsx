"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmActionDialog,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import {
  deleteDealershipSupportRequestAction,
  resolveDealershipSupportRequestAction,
} from "@/actions/dealership-support-requests";
import { ContactQuickActions } from "@/components/contact-quick-actions";

export interface UpgradeRequestRow {
  id: string;
  request_type: string;
  message: string | null;
  current_plan_slug: string | null;
  desired_plan_slug: string | null;
  status: string;
  sla_due_at: string;
  created_at: string;
  dealership: {
    name: string | null;
    slug: string | null;
    contact_email: string | null;
    whatsapp_number: string | null;
  } | null;
}

interface UpgradeRequestsPageClientProps {
  rows: UpgradeRequestRow[];
}

function formatRequestType(type: string): string {
  if (type === "plan_upgrade") {
    return "Upgrade";
  }
  if (type === "technical_support") {
    return "Suporte técnico";
  }
  return "Outros";
}

export function UpgradeRequestsPageClient({ rows }: UpgradeRequestsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refreshAfter(action: () => Promise<{ error?: string; success?: boolean }>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Solicitações de upgrade e suporte</h1>
        <p className="text-sm text-muted-foreground">
          Fila operacional com SLA de 1 dia útil. Marque como concluída ou exclua após o
          atendimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abertas ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma solicitação aberta.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isLate = new Date(row.sla_due_at).getTime() < Date.now();
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{row.dealership?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{row.dealership?.slug}</p>
                        {row.message ? (
                          <p className="mt-1 text-xs text-muted-foreground">{row.message}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatRequestType(row.request_type)}</TableCell>
                      <TableCell>
                        {row.current_plan_slug ?? "—"} → {row.desired_plan_slug ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isLate ? "outline" : "secondary"}
                          className={isLate ? "border-destructive text-destructive" : undefined}
                        >
                          {new Date(row.sla_due_at).toLocaleString("pt-BR")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ContactQuickActions
                          email={row.dealership?.contact_email}
                          phone={row.dealership?.whatsapp_number}
                          label={row.dealership?.name}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              refreshAfter(() =>
                                resolveDealershipSupportRequestAction(row.id, "done"),
                              )
                            }
                          >
                            <Check className="mr-1 size-4" />
                            Concluir
                          </Button>
                          <ConfirmActionDialog
                            title="Excluir solicitação?"
                            description={
                              <p>
                                A solicitação de{" "}
                                <strong>{row.dealership?.name ?? "loja"}</strong> será removida da
                                fila. Esta ação não pode ser desfeita.
                              </p>
                            }
                            confirmLabel="Excluir"
                            confirmVariant="destructive"
                            onConfirm={async () => {
                              const result = await deleteDealershipSupportRequestAction(row.id);
                              if (!result.error) {
                                router.refresh();
                              }
                              return result;
                            }}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={isPending}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Ver também{" "}
        <Link href="/painel/notificacoes" className="underline">
          notificações
        </Link>
        .
      </p>
    </div>
  );
}
