"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@autopainel/shared/ui";

import { updateSubscriptionAction } from "@/actions/subscription";
import type { DealershipAdminRow } from "@/types/dealership-admin";

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SubscriptionDialog({
  open,
  onOpenChange,
  dealership,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealership: DealershipAdminRow | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dealership) {
      return;
    }
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await updateSubscriptionAction(dealership.id, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  if (!dealership) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assinatura — {dealership.name}</DialogTitle>
          <DialogDescription>
            Plano, status de cobrança e fim do período atual. Campos internos da
            operação AutoPainel.
          </DialogDescription>
        </DialogHeader>
        <form
          key={dealership.id}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          {error ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="sub-plan">Etiqueta do plano (cobrança)</Label>
            <Input
              id="sub-plan"
              name="subscription_plan"
              required
              minLength={1}
              maxLength={120}
              placeholder="trial, enterprise ou nome personalizado"
              defaultValue={dealership.subscription_plan}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Texto livre para faturação e relatórios. Os módulos efetivos vêm do
              plano dinâmico ligado à concessionária, quando existir.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-status">Status da assinatura</Label>
            <select
              id="sub-status"
              name="subscription_status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={dealership.subscription_status}
              disabled={pending}
            >
              <option value="trialing">Em trial</option>
              <option value="active">Ativa</option>
              <option value="past_due">Inadimplente</option>
              <option value="cancelled">Cancelada</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-end">Fim do período atual</Label>
            <Input
              id="sub-end"
              name="subscription_current_period_end"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(
                dealership.subscription_current_period_end,
              )}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para limpar a data.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub-notes">Notas internas</Label>
            <Textarea
              id="sub-notes"
              name="billing_notes"
              placeholder="Contrato, NFe, observações de cobrança…"
              defaultValue={dealership.billing_notes ?? ""}
              disabled={pending}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Fechar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar assinatura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
