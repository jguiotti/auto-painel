"use client";

import type { DealershipAdminRow } from "@/types/dealership-admin";

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
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  toast,
} from "@autopainel/shared/ui";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  addDealershipBillingHistoryLineAction,
  deleteDealershipBillingHistoryDocumentAction,
  getDealershipBillingDocumentSignedUrlAction,
  saveDealershipCommercialFinanceAction,
  uploadDealershipBillingHistoryDocumentAction,
} from "@/actions/dealership-operator-billing";
import type {
  BillingSupportingDocument,
  BillingSupportingDocKind,
  DealershipBillingHistoryRow,
  DealershipBillingRow,
} from "@/lib/data/dealership-operator-billing";

function formatBrl(n: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);
  } catch {
    return `${n}`;
  }
}

function statusPt(row: DealershipBillingHistoryRow): string {
  if (row.settlement_status === "paid") {
    return "Pago";
  }
  if (row.settlement_status === "pending") {
    return "Pendente";
  }
  return "Atrasado";
}

const DOC_KIND_PT: Record<BillingSupportingDocKind, string> = {
  contract: "Contrato",
  receipt: "Recibo",
  invoice: "Nota fiscal",
  other: "Outro",
};

interface DealershipOperatorFinancePanelProps {
  dealership: DealershipAdminRow;
  operatorBilling: DealershipBillingRow | null;
  billingHistory: DealershipBillingHistoryRow[];
  billingTablesUnavailable?: boolean;
}

export function DealershipOperatorFinancePanel({
  dealership,
  operatorBilling,
  billingHistory,
  billingTablesUnavailable = false,
}: DealershipOperatorFinancePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const billingDefaults =
    operatorBilling ?? {
      id: "",
      dealership_id: dealership.id,
      monthly_amount: 0,
      due_day: 10,
      payment_method: "",
      last_payment_date: null,
      agreement_status: "active",
      internal_notes: "",
      contract_started_on: null,
      contract_ends_on: null,
    };

  const lastPaidLocal =
    billingDefaults.last_payment_date?.length ?
      billingDefaults.last_payment_date.slice(0, 10)
    : "";

  function afterMutationMessage(
    result: { error?: string; success?: boolean; warning?: string },
    okMessage: string,
  ) {
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.success) {
      if (result.warning) {
        toast.success(okMessage, { description: result.warning });
      } else {
        toast.success(okMessage);
      }
      router.refresh();
    }
  }

  function handleOpenDocument(path: string) {
    startTransition(async () => {
      const r = await getDealershipBillingDocumentSignedUrlAction(
        dealership.id,
        path,
      );
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.signedUrl) {
        window.open(r.signedUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  function handleDeleteDocument(historyId: string, documentId: string) {
    if (!globalThis.confirm("Remover este documento do arquivo?")) {
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("history_id", historyId);
      fd.set("document_id", documentId);
      const r = await deleteDealershipBillingHistoryDocumentAction(
        dealership.id,
        fd,
      );
      afterMutationMessage(r, "Documento removido.");
    });
  }

  function renderAttachmentsCell(line: DealershipBillingHistoryRow) {
    const docs = line.supporting_documents;
    return (
      <div className="space-y-2">
        <ul className="space-y-1 text-xs">
          {docs.length === 0 ? (
            <li className="text-muted-foreground">Sem anexos</li>
          ) : (
            docs.map((d: BillingSupportingDocument) => (
              <li key={d.id} className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto min-h-0 p-0 text-xs font-normal underline-offset-2"
                  disabled={pending}
                  onClick={() => handleOpenDocument(d.stored_path)}
                >
                  {DOC_KIND_PT[d.doc_kind]} · {d.original_name}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  disabled={pending}
                  aria-label="Remover documento"
                  onClick={() => handleDeleteDocument(line.id, d.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))
          )}
        </ul>
        {billingTablesUnavailable ? null : (
          <div className="border-t border-border pt-2">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (pending) {
                  return;
                }
                const formEl = e.currentTarget;
                const fd = new FormData(formEl);
                startTransition(async () => {
                  const r = await uploadDealershipBillingHistoryDocumentAction(
                    dealership.id,
                    fd,
                  );
                  afterMutationMessage(r, "Documento enviado.");
                  if (!r.error && r.success) {
                    formEl.reset();
                  }
                });
              }}
            >
              <input type="hidden" name="history_id" value={line.id} />
              <div className="space-y-1">
                <Label
                  htmlFor={`doc-kind-${line.id}`}
                  className="text-[10px] uppercase text-muted-foreground"
                >
                  Tipo
                </Label>
                <select
                  id={`doc-kind-${line.id}`}
                  name="doc_kind"
                  disabled={pending}
                  className="flex h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {(Object.keys(DOC_KIND_PT) as BillingSupportingDocKind[]).map(
                    (k) => (
                      <option key={k} value={k}>
                        {DOC_KIND_PT[k]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="min-w-[10rem] space-y-1">
                <Label
                  htmlFor={`file-${line.id}`}
                  className="text-[10px] uppercase text-muted-foreground"
                >
                  Ficheiro
                </Label>
                <Input
                  id={`file-${line.id}`}
                  name="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  disabled={pending}
                  className="h-8 cursor-pointer py-1.5 text-xs"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="mr-2 size-3 animate-spin" />
                    Envio…
                  </>
                ) : (
                  "Enviar"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Cobrança comercial SaaS</CardTitle>
          <CardDescription>
            Estado da cobrança, valores mensais, contrato e histórico de pagamentos.
            O plano comercial desta loja é definido na aba «Plano».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(fd) => {
              startTransition(async () => {
                const result = await saveDealershipCommercialFinanceAction(
                  dealership.id,
                  fd,
                );
                afterMutationMessage(
                  result,
                  "Dados financeiros guardados.",
                );
              });
            }}
            className="space-y-8"
          >
            <input
              type="hidden"
              name="billing_agreement_status"
              value={billingDefaults.agreement_status}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription_status">Estado da cobrança</Label>
                <select
                  id="subscription_status"
                  name="subscription_status"
                  defaultValue={dealership.subscription_status}
                  disabled={pending}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="trialing">Período de teste</option>
                  <option value="active">Ativa (pagamento)</option>
                  <option value="past_due">Inadimplente</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="paused">Em pausa</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_monthly_amount">Valor mensal (R$)</Label>
                <Input
                  id="billing_monthly_amount"
                  name="billing_monthly_amount"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={String(billingDefaults.monthly_amount)}
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_contract_started_on">
                  Início do contrato comercial (opcional)
                </Label>
                <Input
                  id="billing_contract_started_on"
                  name="billing_contract_started_on"
                  type="date"
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                  defaultValue={billingDefaults.contract_started_on ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_contract_ends_on">
                  Fim do período contractual (opcional)
                </Label>
                <Input
                  id="billing_contract_ends_on"
                  name="billing_contract_ends_on"
                  type="date"
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                  defaultValue={billingDefaults.contract_ends_on ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se o contrato for por tempo indeterminado até aviso prévio.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_due_day">Dia de vencimento (1–28)</Label>
                <Input
                  id="billing_due_day"
                  name="billing_due_day"
                  type="number"
                  min={1}
                  max={28}
                  defaultValue={String(billingDefaults.due_day)}
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_payment_method">
                  Método de pagamento
                </Label>
                <Input
                  id="billing_payment_method"
                  name="billing_payment_method"
                  placeholder="PIX, TED, cartão corporativo…"
                  defaultValue={billingDefaults.payment_method ?? ""}
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing_last_payment_date">
                  Último pagamento registado pela operação (opcional)
                </Label>
                <Input
                  id="billing_last_payment_date"
                  name="billing_last_payment_date"
                  type="date"
                  defaultValue={lastPaidLocal}
                  disabled={
                    pending ||
                    billingTablesUnavailable
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_notes">Notas internas à equipa AutoPainel</Label>
              <Textarea
                id="billing_notes"
                name="billing_notes"
                rows={4}
                defaultValue={dealership.billing_notes ?? ""}
                placeholder="Breve texto para retorno comercial, contactos de faturação, etc."
                disabled={pending}
              />
            </div>

            {billingTablesUnavailable ? (
              <p className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                <strong>Infra em falta.</strong> Estado de cobrança e notas guardam‑se sempre;
                dívidas mensais/anexos exigem a migração do hub (+ colunas/anexos) neste projeto.
              </p>
            ) : null}

            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar bloco financeiro"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" aria-hidden />
            Histórico de mensalidades
          </CardTitle>
          <CardDescription>
            Cada mês aparece uma linha. Pode acrescentar comprovativos (contratos, recibos,
            notas fiscais ou outros PDFs/imagens até 25 MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {billingTablesUnavailable ? (
            <p className="text-sm text-muted-foreground">
              Indisponível enquanto faltarem as tabelas <code className="text-xs">dealership_billing_history</code>{" "}
              e o cofre <code className="text-xs">dealership-operator-billing</code> no projeto.
            </p>
          ) : (
            <>
              <form
                className="grid gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pending) {
                    return;
                  }
                  const formEl = e.currentTarget;
                  const fd = new FormData(formEl);
                  startTransition(async () => {
                    const result = await addDealershipBillingHistoryLineAction(
                      dealership.id,
                      fd,
                    );
                    afterMutationMessage(result, "Mensalidade registada.");
                    if (!result.error && result.success) {
                      formEl.reset();
                    }
                  });
                }}
              >
                <p className="text-sm font-medium text-foreground sm:col-span-2">
                  Nova mensalidade
                </p>
                <div className="space-y-2">
                  <Label htmlFor="history_period_start">
                    Competência / mês referência
                  </Label>
                  <Input
                    id="history_period_start"
                    name="history_period_start"
                    type="date"
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history_amount">Valor cobrado (R$)</Label>
                  <Input
                    id="history_amount"
                    name="history_amount"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history_due_date">
                    Data de vencimento deste mês
                  </Label>
                  <Input
                    id="history_due_date"
                    name="history_due_date"
                    type="date"
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history_status">Estado de liquidação</Label>
                  <select
                    id="history_status"
                    name="history_status"
                    defaultValue="pending"
                    disabled={pending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Liquidado</option>
                    <option value="overdue">Em atraso</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history_paid_at">Liquidado em (opcional)</Label>
                  <Input
                    id="history_paid_at"
                    name="history_paid_at"
                    type="datetime-local"
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="history_reference">Referência bancária (opcional)</Label>
                  <Input
                    id="history_reference"
                    name="history_reference"
                    disabled={pending}
                    placeholder="Número PIX, TED, série da NFS-e…"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="history_doc_kind">Tipo de documento (com o primeiro ficheiro)</Label>
                  <select
                    id="history_doc_kind"
                    name="history_doc_kind"
                    disabled={pending}
                    className="max-w-xs flex h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {(Object.keys(DOC_KIND_PT) as BillingSupportingDocKind[]).map((k) => (
                      <option key={k} value={k}>
                        {DOC_KIND_PT[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="history_attachment">
                    Anexar ficheiro (opcional ao criar a linha)
                  </Label>
                  <Input
                    id="history_attachment"
                    name="history_attachment"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    disabled={pending}
                    className="cursor-pointer py-3 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="outline" disabled={pending}>
                    {pending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      "Registar mensalidade"
                    )}
                  </Button>
                </div>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Liquidado</TableHead>
                    <TableHead className="min-w-[14rem]">Documentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground"
                      >
                        Sem mensalidades. Use o formulário acima para abrir a primeira competência.
                      </TableCell>
                    </TableRow>
                  ) : (
                    billingHistory.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-mono text-xs">
                          {line.billing_period_start.slice(0, 7)}
                        </TableCell>
                        <TableCell>{formatBrl(line.expected_amount)}</TableCell>
                        <TableCell>{line.due_date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              line.settlement_status === "paid"
                                ? "border-green-600/60 text-green-700"
                                : line.settlement_status === "overdue"
                                  ? "border-destructive/60 text-destructive"
                                  : ""
                            }
                          >
                            {statusPt(line)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {line.paid_at ?
                            line.paid_at.slice(0, 16).replace("T", " ")
                          : "—"}
                        </TableCell>
                        <TableCell className="align-top">
                          {renderAttachmentsCell(line)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
