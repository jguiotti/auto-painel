"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@autopainel/shared/ui";
import { EmptyState } from "@autopainel/shared/components/empty-state";

import {
  cancelDealershipSalesAttributionAction,
  confirmDealershipSalesAttributionAction,
  createDealershipSalesAttributionAction,
} from "@/actions/platform-sales-attributions";
import {
  PLATFORM_SALES_ATTRIBUTION_STATUS_LABELS,
  PLATFORM_SALES_ATTRIBUTION_TYPE_LABELS,
  formatCommissionRateBps,
  type PlatformSalesAttributionListRow,
} from "@/lib/data/platform-sales-squad-shared";
import type { DealershipAdminRow } from "@/types/dealership-admin";

interface PlatformSalesRepPortfolioPanelProps {
  salesRepId: string;
  attributions: PlatformSalesAttributionListRow[];
  dealerships: DealershipAdminRow[];
}

function statusBadgeClass(status: string): string {
  if (status === "confirmed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "pending") {
    return "bg-amber-100 text-amber-900";
  }
  if (status === "disputed") {
    return "bg-orange-100 text-orange-900";
  }
  return "bg-muted text-muted-foreground";
}

export function PlatformSalesRepPortfolioPanel({
  salesRepId,
  attributions,
  dealerships,
}: PlatformSalesRepPortfolioPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    formData.set("sales_rep_id", salesRepId);
    formData.set("confirm_immediately", "true");

    startTransition(async () => {
      const result = await createDealershipSalesAttributionAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Loja vinculada à carteira.");
      setShowForm(false);
      router.refresh();
    });
  }

  function handleConfirm(attributionId: string) {
    startTransition(async () => {
      const result = await confirmDealershipSalesAttributionAction(attributionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Vínculo confirmado.");
      router.refresh();
    });
  }

  function handleCancel(attributionId: string) {
    startTransition(async () => {
      const result = await cancelDealershipSalesAttributionAction(attributionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Vínculo cancelado.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>Carteira de lojas</CardTitle>
          <CardDescription>
            Lojas fechadas vinculadas a este representante para comissão recorrente.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fechar formulário" : "Vincular loja"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm ? (
          <form action={handleCreate} className="space-y-4 rounded-lg border bg-muted/20 p-4">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dealership_id">Concessionária</Label>
                <select
                  id="dealership_id"
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
              <div className="space-y-2">
                <Label htmlFor="attribution_type">Papel no fechamento</Label>
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
              <div className="space-y-2">
                <Label htmlFor="first_invoice_amount">Primeira fatura (R$)</Label>
                <Input
                  id="first_invoice_amount"
                  name="first_invoice_amount"
                  placeholder="397,00"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_key">Plano (opcional)</Label>
                <Input id="plan_key" name="plan_key" placeholder="business" />
              </div>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Vinculando…" : "Confirmar vínculo"}
            </Button>
          </form>
        ) : null}

        {attributions.length === 0 ? (
          <EmptyState
            title="Carteira vazia"
            description="Vincule lojas fechadas para calcular comissões recorrentes."
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Participação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/painel/concessionarias/${row.dealership_id}/editar`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {row.dealership_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {PLATFORM_SALES_ATTRIBUTION_TYPE_LABELS[row.attribution_type]}
                    </TableCell>
                    <TableCell>
                      {formatCommissionRateBps(row.attribution_share_bps)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(row.status)}>
                        {PLATFORM_SALES_ATTRIBUTION_STATUS_LABELS[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {row.status === "pending" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => handleConfirm(row.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => handleCancel(row.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
