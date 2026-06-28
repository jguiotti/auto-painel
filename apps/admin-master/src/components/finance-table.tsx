"use client";

import { Pencil, Wallet } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@autopainel/shared/components/empty-state";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@autopainel/shared/ui";

import type { DealershipAdminRow } from "@/types/dealership-admin";

import { SubscriptionDialog } from "./subscription-dialog";

function formatDate(iso: string | null) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function FinanceTable({
  rows,
  embedded = false,
}: {
  rows: DealershipAdminRow[];
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DealershipAdminRow | null>(null);

  return (
    <>
      {!embedded ? (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Controle de planos e status de assinatura das concessionárias.
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concessionária</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fim do período</TableHead>
              <TableHead className="w-[100px] text-right">Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    className="m-4 border-0 bg-transparent"
                    icon={Wallet}
                    title="Nenhuma concessionária para faturar"
                    description="Cadastre lojas em Concessionárias para controlar planos e assinaturas aqui."
                    action={{ label: "Ver concessionárias", href: "/painel/concessionarias" }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="capitalize">{row.subscription_plan}</TableCell>
                  <TableCell className="capitalize">{row.subscription_status}</TableCell>
                  <TableCell>{formatDate(row.subscription_current_period_end)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setSelected(row);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Assinatura
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubscriptionDialog
        open={open}
        onOpenChange={setOpen}
        dealership={selected}
      />
    </>
  );
}
