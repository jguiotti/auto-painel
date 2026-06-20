"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
  approveSalesCommissionLedgerEntriesAction,
  createManualCommissionAdjustmentAction,
} from "@/actions/platform-sales-ledger";
import {
  PLATFORM_COMMISSION_ENTRY_TYPE_LABELS,
  PLATFORM_COMMISSION_LEDGER_STATUS_LABELS,
  formatCentsToBrl,
  type PlatformCommissionLedgerListRow,
} from "@/lib/data/platform-sales-squad-shared";

interface PlatformSalesRepLedgerPanelProps {
  salesRepId: string;
  entries: PlatformCommissionLedgerListRow[];
  allowApprove?: boolean;
  allowAdjustments?: boolean;
  readOnly?: boolean;
}

function statusBadgeClass(status: string): string {
  if (status === "approved") {
    return "bg-blue-100 text-blue-900";
  }
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "pending") {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-muted text-muted-foreground";
}

export function PlatformSalesRepLedgerPanel({
  salesRepId,
  entries,
  allowApprove = false,
  allowAdjustments = false,
  readOnly = false,
}: PlatformSalesRepLedgerPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [showAdjustment, setShowAdjustment] = useState(false);

  const filtered = useMemo(() => {
    if (!monthFilter) {
      return entries;
    }
    return entries.filter((entry) => entry.reference_month.startsWith(monthFilter));
  }, [entries, monthFilter]);

  const summary = useMemo(() => {
    let receivable = 0;
    let paidThisMonth = 0;
    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const entry of entries) {
      if (entry.status === "pending" || entry.status === "approved") {
        receivable += entry.amount_cents;
      }
      if (entry.status === "paid" && entry.reference_month.startsWith(currentMonth)) {
        paidThisMonth += entry.amount_cents;
      }
    }

    return { receivable, paidThisMonth };
  }, [entries]);

  function toggleEntry(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    );
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveSalesCommissionLedgerEntriesAction(selected);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.approvedCount ?? 0} linha(s) aprovada(s).`);
      setSelected([]);
      router.refresh();
    });
  }

  function handleAdjustment(formData: FormData) {
    formData.set("sales_rep_id", salesRepId);
    startTransition(async () => {
      const result = await createManualCommissionAdjustmentAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Ajuste registrado.");
      setShowAdjustment(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>A receber</CardDescription>
            <CardTitle className="text-2xl">{formatCentsToBrl(summary.receivable)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximo pagamento</CardDescription>
            <CardTitle className="text-lg">Dia 10</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pago no mês</CardDescription>
            <CardTitle className="text-2xl">{formatCentsToBrl(summary.paidThisMonth)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Extrato de comissões</CardTitle>
            <CardDescription>
              Lançamentos por competência — comissões, bônus, ajustes e estornos.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowAdjustments ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdjustment((value) => !value)}
              >
                {showAdjustment ? "Fechar ajuste" : "Novo ajuste"}
              </Button>
            ) : null}
            {allowApprove && selected.length > 0 ? (
              <Button type="button" disabled={pending} onClick={handleApprove}>
                Aprovar selecionados ({selected.length})
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAdjustment && allowAdjustments ? (
            <form
              action={handleAdjustment}
              className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="reference_month">Competência</Label>
                <Input id="reference_month" name="reference_month" type="month" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input id="amount" name="amount" placeholder="-50,00 ou 100,00" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" required />
              </div>
              <input type="hidden" name="entry_type" value="adjustment" />
              <Button type="submit" disabled={pending} className="sm:col-span-2 sm:w-fit">
                Registrar ajuste
              </Button>
            </form>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className="sm:max-w-xs"
              aria-label="Filtrar por competência"
            />
            <p className="text-sm text-muted-foreground sm:ml-auto">
              {filtered.length} lançamento(s)
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum lançamento no extrato"
              description="Comissões aparecem após confirmar vínculos com lojas fechadas."
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {allowApprove ? <TableHead className="w-10" /> : null}
                    <TableHead>Competência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      {allowApprove ? (
                        <TableCell>
                          {entry.status === "pending" ? (
                            <input
                              type="checkbox"
                              checked={selected.includes(entry.id)}
                              onChange={(event) =>
                                toggleEntry(entry.id, event.target.checked)
                              }
                              aria-label={`Selecionar ${entry.description}`}
                              className="size-4 rounded border border-input"
                            />
                          ) : null}
                        </TableCell>
                      ) : null}
                      <TableCell>{entry.reference_month.slice(0, 7)}</TableCell>
                      <TableCell>
                        {PLATFORM_COMMISSION_ENTRY_TYPE_LABELS[entry.entry_type]}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell
                        className={
                          entry.amount_cents < 0 ? "text-destructive" : "text-foreground"
                        }
                      >
                        {formatCentsToBrl(entry.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(entry.status)}>
                          {PLATFORM_COMMISSION_LEDGER_STATUS_LABELS[entry.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
