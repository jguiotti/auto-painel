"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@autopainel/shared/ui";

import { createDealershipSalesAttributionAction } from "@/actions/platform-sales-attributions";
import type { DealershipAdminRow } from "@/types/dealership-admin";
import {
  readDealershipIdFromLeadMetadata,
  type PlatformCommercialLeadRow,
} from "@/lib/data/platform-commercial-leads-shared";
import type { PlatformSalesRepListRow } from "@/lib/data/platform-sales-squad-shared";

interface PlatformCommercialLeadAttributionSheetProps {
  lead: PlatformCommercialLeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReps: PlatformSalesRepListRow[];
  dealerships: DealershipAdminRow[];
}

function resolveDefaultDealershipId(
  lead: PlatformCommercialLeadRow,
  dealerships: DealershipAdminRow[],
): string {
  const fromMetadata = readDealershipIdFromLeadMetadata(lead.metadata);
  if (fromMetadata && dealerships.some((dealership) => dealership.id === fromMetadata)) {
    return fromMetadata;
  }

  const company = lead.company_name?.trim().toLowerCase();
  if (company) {
    const exact = dealerships.find(
      (dealership) => dealership.name.trim().toLowerCase() === company,
    );
    if (exact) {
      return exact.id;
    }

    const slugGuess = company
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const bySlug = dealerships.find((dealership) => dealership.slug === slugGuess);
    if (bySlug) {
      return bySlug.id;
    }
  }

  return "";
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
  const [salesRepId, setSalesRepId] = useState("");
  const [dealershipId, setDealershipId] = useState("");
  const [attributionType, setAttributionType] = useState("closer");

  const selectableReps = useMemo(
    () => salesReps.filter((rep) => rep.status === "active" || rep.status === "onboarding"),
    [salesReps],
  );

  useEffect(() => {
    if (!lead || !open) {
      return;
    }
    setError(null);
    setSalesRepId("");
    setAttributionType("closer");
    setDealershipId(resolveDefaultDealershipId(lead, dealerships));
  }, [dealerships, lead, open]);

  if (!lead) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) {
      return;
    }

    if (!salesRepId) {
      setError("Selecione o representante comercial.");
      return;
    }
    if (!dealershipId) {
      setError("Selecione a concessionária.");
      return;
    }

    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("sales_rep_id", salesRepId);
    formData.set("dealership_id", dealershipId);
    formData.set("attribution_type", attributionType);
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

        <form key={lead.id} onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="attribution_sales_rep_id">Representante</Label>
            {selectableReps.length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Nenhum representante ativo cadastrado.{" "}
                <Link href="/painel/equipe/comercial/novo" className="underline">
                  Cadastrar representante
                </Link>
              </div>
            ) : (
              <Select value={salesRepId} onValueChange={setSalesRepId}>
                <SelectTrigger id="attribution_sales_rep_id" aria-label="Representante comercial">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {selectableReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.full_name} ({rep.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attribution_dealership_id">Concessionária</Label>
            <Select value={dealershipId} onValueChange={setDealershipId}>
              <SelectTrigger id="attribution_dealership_id" aria-label="Concessionária">
                <SelectValue placeholder="Selecione a loja…" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {dealerships.map((dealership) => (
                  <SelectItem key={dealership.id} value={dealership.id}>
                    {dealership.name} ({dealership.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attribution_type">Papel</Label>
              <Select value={attributionType} onValueChange={setAttributionType}>
                <SelectTrigger id="attribution_type" aria-label="Papel no fechamento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="closer">Fechamento</SelectItem>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="referral">Indicação</SelectItem>
                </SelectContent>
              </Select>
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
            <Button
              type="submit"
              disabled={pending || selectableReps.length === 0 || !dealershipId}
            >
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
