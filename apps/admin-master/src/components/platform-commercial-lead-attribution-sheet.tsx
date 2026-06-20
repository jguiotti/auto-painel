"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@autopainel/shared/ui";

import { createDealershipSalesAttributionAction } from "@/actions/platform-sales-attributions";
import type { DealershipAdminRow } from "@/types/dealership-admin";
import type { PlatformSalesRepListRow } from "@/lib/data/platform-sales-squad-shared";
import type { PlatformCommercialLeadRow } from "@/lib/data/platform-commercial-leads-shared";

interface PlatformCommercialLeadAttributionSheetProps {
  lead: PlatformCommercialLeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReps: PlatformSalesRepListRow[];
  dealerships: DealershipAdminRow[];
}

export function PlatformCommercialLeadAttributionSheet({
  lead,
  open,
  onOpenChange,
  salesReps,
  dealerships,
}: PlatformCommercialLeadAttributionSheetProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!lead) {
    return null;
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("saas_prospect_id", lead.id);
    formData.set("confirm_immediately", "true");

    startTransition(async () => {
      const result = await createDealershipSalesAttributionAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Vínculo comercial criado para o lead ganho.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Vincular representante comercial</SheetTitle>
          <SheetDescription>
            Lead ganho: <strong>{lead.full_name}</strong>
            {lead.company_name ? ` — ${lead.company_name}` : null}. Informe a loja e o
            representante para comissão recorrente.
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="attribution_sales_rep_id">Representante</Label>
            <select
              id="attribution_sales_rep_id"
              name="sales_rep_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione…
              </option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.full_name} ({rep.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribution_dealership_id">Concessionária</Label>
            <select
              id="attribution_dealership_id"
              name="dealership_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione a loja…
              </option>
              {dealerships.map((dealership) => (
                <option key={dealership.id} value={dealership.id}>
                  {dealership.name} ({dealership.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attribution_type">Papel</Label>
              <select
                id="attribution_type"
                name="attribution_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="closer"
              >
                <option value="closer">Fechamento</option>
                <option value="sdr">SDR</option>
                <option value="referral">Indicação</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attribution_share_percent">Participação (%)</Label>
              <Input
                id="attribution_share_percent"
                name="attribution_share_percent"
                defaultValue="100"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribution_first_invoice">Primeira fatura (R$)</Label>
            <Input
              id="attribution_first_invoice"
              name="first_invoice_amount"
              placeholder="397,00"
              inputMode="decimal"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Confirmar vínculo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Depois
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
