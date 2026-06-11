import { formatBuyerDocumentForDisplay } from "@autopainel/shared/lib/validators/buyer-document";
import {
  SALE_RECEIPT_FISCAL_DISCLAIMER,
  SALE_RECEIPT_PAYMENT_METHOD_LABELS,
} from "@autopainel/shared/types/sale-receipt";
import type { VehicleSaleReceiptRecord } from "@autopainel/shared/types/sale-receipt";

import { formatBrl } from "@/lib/format/format-brl";
import type {
  SaleReceiptDealershipHeader,
  SaleReceiptVehicleSummary,
} from "@/lib/inventory/get-vehicle-sale-receipt-page-context";

interface SaleReceiptPrintSheetProps {
  dealership: SaleReceiptDealershipHeader;
  vehicle: SaleReceiptVehicleSummary;
  receipt: VehicleSaleReceiptRecord;
}

function formatIssuedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SaleReceiptPrintSheet({
  dealership,
  vehicle,
  receipt,
}: SaleReceiptPrintSheetProps) {
  const vehicleTitle = [receipt.vehicle_brand, receipt.vehicle_model, receipt.vehicle_version]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="print-sheet mx-auto w-full max-w-[210mm] rounded-2xl border bg-white p-8 text-zinc-900 shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="min-w-0 space-y-2">
          {dealership.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic dealership logo
            <img
              src={dealership.logoUrl}
              alt={dealership.name}
              className="h-12 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <p className="text-lg font-bold">{dealership.name}</p>
          )}
          <div className="space-y-1 text-sm text-zinc-700">
            <p className="font-medium">{dealership.name}</p>
            <p>
              CNPJ:{" "}
              <span className="inline-block min-w-[140px] border-b border-zinc-300">
                {dealership.cnpj ?? "\u00A0"}
              </span>
            </p>
            <p>
              Endereço:{" "}
              <span className="inline-block min-w-[220px] border-b border-zinc-300">
                {dealership.address ?? "\u00A0"}
              </span>
            </p>
            <p>
              Contato:{" "}
              <span className="inline-block min-w-[160px] border-b border-zinc-300">
                {[dealership.phone, dealership.email].filter(Boolean).join(" · ") || "\u00A0"}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-zinc-600">
          <p className="font-semibold uppercase tracking-wide text-zinc-500">Recibo de venda</p>
          <p>{formatIssuedAt(receipt.updated_at)}</p>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {SALE_RECEIPT_FISCAL_DISCLAIMER}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Dados do comprador
            </p>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-zinc-500">Nome</dt>
                <dd className="font-medium">{receipt.buyer_name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">CPF ou CNPJ</dt>
                <dd>
                  {receipt.buyer_document === "—"
                    ? "—"
                    : formatBuyerDocumentForDisplay(receipt.buyer_document)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Endereço de cobrança</dt>
                <dd>{receipt.buyer_billing_address}</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Veículo</p>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-zinc-500">Modelo</dt>
                <dd className="font-medium">{vehicleTitle}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Tipo</dt>
                <dd>{vehicle.vehicleTypeLabel}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-zinc-500">Placa</dt>
                  <dd>{receipt.vehicle_license_plate ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">RENAVAM</dt>
                  <dd>{receipt.vehicle_renavam ?? "—"}</dd>
                </div>
              </div>
              <div>
                <dt className="text-zinc-500">Ano / KM</dt>
                <dd>
                  {receipt.vehicle_manufacturing_year}/{receipt.vehicle_model_year}
                  {receipt.vehicle_mileage != null
                    ? ` · ${receipt.vehicle_mileage.toLocaleString("pt-BR")} km`
                    : ""}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pagamento
          </p>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="py-2 pr-4 font-medium">Forma</th>
                <th className="py-2 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {receipt.payment_lines.map((line) => (
                <tr key={`${line.method}-${line.amount}`} className="border-b border-zinc-100">
                  <td className="py-2 pr-4">
                    {SALE_RECEIPT_PAYMENT_METHOD_LABELS[line.method]}
                  </td>
                  <td className="py-2">{formatBrl(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {receipt.down_payment_amount != null ? (
                <tr>
                  <td className="py-2 pr-4 font-medium">Valor de entrada</td>
                  <td className="py-2 font-medium">
                    {formatBrl(receipt.down_payment_amount)}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td className="py-2 pr-4 text-base font-semibold">Total da venda</td>
                <td className="py-2 text-base font-semibold">
                  {formatBrl(receipt.sale_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid gap-8 pt-8 md:grid-cols-2">
          <div>
            <div className="border-t border-zinc-400 pt-2">
              <p className="text-sm font-medium">Assinatura da loja</p>
              <p className="text-xs text-zinc-500">{dealership.name}</p>
            </div>
          </div>
          <div>
            <div className="border-t border-zinc-400 pt-2">
              <p className="text-sm font-medium">Assinatura do comprador</p>
              <p className="text-xs text-zinc-500">{receipt.buyer_name}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
