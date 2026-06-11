"use client";

import { useMemo, useState, useTransition } from "react";

import {
  SALE_RECEIPT_PAYMENT_METHOD_LABELS,
  type SaleReceiptPaymentLine,
  type SaleReceiptPaymentMethod,
  type VehicleSaleReceiptRecord,
} from "@autopainel/shared/types/sale-receipt";
import { Button, Input, Label } from "@autopainel/shared/ui";

import { saveVehicleSaleReceiptAction } from "@/app/painel/estoque/sale-receipt-actions";
import {
  buildSaleReceiptPreviewRecord,
  formatDealershipContact,
} from "@/lib/inventory/build-sale-receipt-preview";
import type {
  SaleReceiptDealershipHeader,
  SaleReceiptVehicleSummary,
} from "@/lib/inventory/get-vehicle-sale-receipt-page-context";

import { SaleReceiptPrintSheet } from "./sale-receipt-print-sheet";
import { SaleReceiptPrintToolbar } from "./sale-receipt-print-toolbar";

interface SaleReceiptWorkspaceProps {
  vehicle: SaleReceiptVehicleSummary;
  dealership: SaleReceiptDealershipHeader;
  initialReceipt: VehicleSaleReceiptRecord | null;
}

function buildDefaultPaymentLine(): SaleReceiptPaymentLine {
  return { method: "pix", amount: 0 };
}

function receiptToFormState(
  vehicle: SaleReceiptVehicleSummary,
  receipt: VehicleSaleReceiptRecord | null,
) {
  return {
    buyerName: receipt?.buyer_name ?? "",
    buyerDocument: receipt?.buyer_document ?? "",
    buyerBillingAddress: receipt?.buyer_billing_address ?? "",
    saleAmount: String(receipt?.sale_amount ?? vehicle.salePrice),
    downPaymentAmount:
      receipt?.down_payment_amount != null ? String(receipt.down_payment_amount) : "",
    licensePlate: receipt?.vehicle_license_plate ?? vehicle.licensePlate ?? "",
    renavam: receipt?.vehicle_renavam ?? vehicle.renavam ?? "",
    paymentLines:
      receipt?.payment_lines.length && receipt.payment_lines.length > 0
        ? receipt.payment_lines.map((line) => ({
            method: line.method,
            amount: String(line.amount),
          }))
        : [{ method: "pix" as SaleReceiptPaymentMethod, amount: String(vehicle.salePrice) }],
  };
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export function SaleReceiptWorkspace({
  vehicle,
  dealership,
  initialReceipt,
}: SaleReceiptWorkspaceProps) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [form, setForm] = useState(() => receiptToFormState(vehicle, initialReceipt));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const vehicleTitle = [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");

  const previewReceipt = useMemo(
    () => buildSaleReceiptPreviewRecord(vehicle, form, receipt),
    [vehicle, form, receipt],
  );

  const paymentMethodOptions = useMemo(
    () =>
      Object.entries(SALE_RECEIPT_PAYMENT_METHOD_LABELS) as Array<
        [SaleReceiptPaymentMethod, string]
      >,
    [],
  );

  function updatePaymentLine(
    index: number,
    patch: Partial<{ method: SaleReceiptPaymentMethod; amount: string }>,
  ) {
    setForm((current) => ({
      ...current,
      paymentLines: current.paymentLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addPaymentLine() {
    setForm((current) => ({
      ...current,
      paymentLines: [...current.paymentLines, buildDefaultPaymentLine()].map((line) => ({
        method: line.method,
        amount: line.amount ? String(line.amount) : "",
      })),
    }));
  }

  function removePaymentLine(index: number) {
    setForm((current) => ({
      ...current,
      paymentLines: current.paymentLines.filter((_, lineIndex) => lineIndex !== index),
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await saveVehicleSaleReceiptAction({
        vehicle_id: vehicle.id,
        buyer_name: form.buyerName,
        buyer_document: form.buyerDocument,
        buyer_billing_address: form.buyerBillingAddress,
        sale_amount: Number(form.saleAmount.replace(",", ".")),
        down_payment_amount: form.downPaymentAmount.trim()
          ? Number(form.downPaymentAmount.replace(",", "."))
          : null,
        vehicle_license_plate: form.licensePlate.trim() || null,
        vehicle_renavam: form.renavam.trim() || null,
        payment_lines: form.paymentLines.map((line) => ({
          method: line.method,
          amount: Number(line.amount.replace(",", ".")),
        })),
      });

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }

      if ("success" in result && result.success && result.receipt) {
        setReceipt(result.receipt);
        setForm(receiptToFormState(vehicle, result.receipt));
        setMessage("Venda registrada. Você já pode imprimir o recibo.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          [data-dashboard-shell] main { padding: 0 !important; }
          body { background: #fff !important; }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            max-width: none !important;
            width: 100% !important;
          }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="no-print space-y-2">
        <h1 className="text-2xl font-semibold">Recibo de venda</h1>
        <p className="text-sm text-muted-foreground">
          Dados da loja e do veículo vêm do cadastro. Preencha o comprador e confira o preview
          antes de imprimir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="no-print space-y-6 rounded-lg border bg-card p-5">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Recibo simples, sem validade fiscal. Não substitui nota fiscal eletrônica.
        </div>

        <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Dados da loja</p>
            <p className="text-xs text-muted-foreground">
              Preenchido automaticamente a partir do cadastro da concessionária.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            {dealership.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic dealership logo
              <img
                src={dealership.logoUrl}
                alt={dealership.name}
                className="h-12 w-auto max-w-[140px] object-contain"
              />
            ) : null}
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <ReadonlyField label="Razão social / nome" value={dealership.name} />
              <ReadonlyField label="CNPJ" value={dealership.cnpj} />
              <ReadonlyField label="Endereço" value={dealership.address} />
              <ReadonlyField label="Contato" value={formatDealershipContact(dealership) || null} />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">Dados do veículo</p>
            <p className="text-xs text-muted-foreground">
              Preenchido a partir do estoque. Placa e RENAVAM podem ser ajustados abaixo se
              faltarem no cadastro.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ReadonlyField label="Marca / modelo" value={vehicleTitle} />
            <ReadonlyField label="Tipo" value={vehicle.vehicleTypeLabel} />
            <ReadonlyField
              label="Ano (fab. / mod.)"
              value={`${vehicle.manufacturingYear} / ${vehicle.modelYear}`}
            />
            <ReadonlyField
              label="Quilometragem"
              value={`${vehicle.mileage.toLocaleString("pt-BR")} km`}
            />
            <ReadonlyField label="Valor de venda" value={vehicle.salePriceFormatted} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="license_plate">Placa</Label>
              <Input
                id="license_plate"
                value={form.licensePlate}
                onChange={(event) => setForm({ ...form, licensePlate: event.target.value })}
                placeholder="Ex.: ABC1D23"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renavam">RENAVAM</Label>
              <Input
                id="renavam"
                value={form.renavam}
                onChange={(event) => setForm({ ...form, renavam: event.target.value })}
                placeholder="Somente números"
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium">Dados do comprador</p>
            <p className="text-xs text-muted-foreground">Informe os dados do cliente da venda.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyer_name">Nome completo</Label>
              <Input
                id="buyer_name"
                value={form.buyerName}
                onChange={(event) => setForm({ ...form, buyerName: event.target.value })}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer_document">CPF ou CNPJ</Label>
              <Input
                id="buyer_document"
                value={form.buyerDocument}
                onChange={(event) => setForm({ ...form, buyerDocument: event.target.value })}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="buyer_billing_address">Endereço de cobrança</Label>
              <Input
                id="buyer_billing_address"
                value={form.buyerBillingAddress}
                onChange={(event) =>
                  setForm({ ...form, buyerBillingAddress: event.target.value })
                }
                required
                disabled={isPending}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium">Pagamento</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale_amount">Valor total da venda (R$)</Label>
              <Input
                id="sale_amount"
                inputMode="decimal"
                value={form.saleAmount}
                onChange={(event) => setForm({ ...form, saleAmount: event.target.value })}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="down_payment_amount">Valor de entrada (opcional)</Label>
              <Input
                id="down_payment_amount"
                inputMode="decimal"
                value={form.downPaymentAmount}
                onChange={(event) =>
                  setForm({ ...form, downPaymentAmount: event.target.value })
                }
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Formas de pagamento</p>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentLine}>
                Adicionar forma de pagamento
              </Button>
            </div>
            {form.paymentLines.map((line, index) => (
              <div key={`payment-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <Label>Forma</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={line.method}
                    onChange={(event) =>
                      updatePaymentLine(index, {
                        method: event.target.value as SaleReceiptPaymentMethod,
                      })
                    }
                    disabled={isPending}
                  >
                    {paymentMethodOptions.map(([method, label]) => (
                      <option key={method} value={method}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    inputMode="decimal"
                    value={line.amount}
                    onChange={(event) => updatePaymentLine(index, { amount: event.target.value })}
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || form.paymentLines.length <= 1}
                    onClick={() => removePaymentLine(index)}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message ? (
          <p
            className={`text-sm ${message.includes("já pode") ? "text-emerald-700" : "text-destructive"}`}
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : receipt ? "Salvar alterações" : "Salvar e preparar impressão"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="no-print space-y-1">
          <h2 className="text-lg font-semibold">Preview do recibo</h2>
          <p className="text-sm text-muted-foreground">
            {receipt
              ? "Recibo salvo. Ajustes no formulário atualizam o preview; salve de novo antes de imprimir."
              : "Preview com dados do cadastro. Salve para registrar a venda no sistema."}
          </p>
        </div>
        <SaleReceiptPrintToolbar vehicleId={vehicle.id} />
        <SaleReceiptPrintSheet
          dealership={dealership}
          vehicle={vehicle}
          receipt={previewReceipt}
        />
      </div>
    </div>
  );
}
