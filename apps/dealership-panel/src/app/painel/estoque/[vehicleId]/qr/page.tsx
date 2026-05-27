import Link from "next/link";
import QRCode from "qrcode";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";
import { notFound } from "next/navigation";

import { QrPrintToolbar } from "@/components/inventory/qr-print-toolbar";
import { getVehicleQrPrintPayload } from "@/lib/inventory/get-vehicle-qr-print-payload";

interface VehicleQrPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ formato?: string }>;
}

export default async function VehicleQrPage({
  params,
  searchParams,
}: VehicleQrPageProps) {
  const { vehicleId } = await params;
  const { formato } = await searchParams;
  const printFormat: "a4" | "etiqueta" = formato === "etiqueta" ? "etiqueta" : "a4";

  if (!vehicleId || vehicleId.length < 10) {
    notFound();
  }

  const result = await getVehicleQrPrintPayload(vehicleId);
  if (result.error || !result.payload) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Gerar QR Code</h1>
        <p className="text-sm text-red-600 dark:text-red-400">
          {result.error ?? "Não foi possível gerar a lâmina de QR."}
        </p>
        <Link href="/painel/estoque" className="text-sm font-medium underline">
          Voltar ao estoque
        </Link>
      </div>
    );
  }

  const payload = result.payload;
  const qrDataUrl = await QRCode.toDataURL(payload.publicVehicleUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: printFormat === "a4" ? 360 : 240,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return (
    <div
      style={
        {
          "--dealer-primary": payload.dealershipPrimaryColor,
          "--dealer-accent": payload.dealershipAccentColor,
        } as React.CSSProperties
      }
      className="space-y-4"
    >
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          [data-dashboard-shell] main {
            padding: 0 !important;
          }
          body {
            background: #fff !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            break-inside: avoid;
            max-width: none !important;
            width: 100% !important;
          }
          @page {
            size: ${printFormat === "a4" ? "A4" : "100mm 150mm"};
            margin: ${printFormat === "a4" ? "10mm" : "4mm"};
          }
        }
      `}</style>

      <div className="no-print flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Lâmina de venda com QR Code
        </h1>
        <p className="text-sm text-muted-foreground">
          Confira o preview antes de imprimir. O QR direciona para a página pública do
          veículo.
        </p>
      </div>

      <QrPrintToolbar vehicleId={vehicleId} format={printFormat} />

      <section
        className={`print-sheet mx-auto w-full rounded-2xl border bg-white text-zinc-900 shadow-sm ${
          printFormat === "a4" ? "max-w-[210mm] p-8" : "max-w-[100mm] p-5"
        }`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Concessionária
            </p>
            <h2
              className="truncate text-lg font-bold"
              style={{ color: "var(--dealer-primary)" }}
            >
              {payload.dealershipName}
            </h2>
          </div>
          {payload.dealershipLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- whitelabel logo source is dynamic
            <img
              src={payload.dealershipLogoUrl}
              alt={payload.dealershipName}
              className="h-12 w-auto max-w-[140px] object-contain"
            />
          ) : null}
        </header>

        <div
          className={`mt-6 grid gap-6 ${
            printFormat === "a4" ? "grid-cols-[1.2fr_1fr]" : "grid-cols-1"
          }`}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Veículo
            </p>
            <h3 className="text-2xl font-bold">{payload.vehicleTitle}</h3>
            <p className="text-sm text-zinc-600">{payload.vehicleSubtitle}</p>
            <p
              className="text-3xl font-extrabold"
              style={{ color: "var(--dealer-accent)" }}
            >
              {payload.vehiclePriceFormatted}
            </p>
            <p className="text-sm text-zinc-700">{payload.ctaText}</p>
            <p className="break-all text-xs text-zinc-500">{payload.publicVehicleUrl}</p>
          </div>

          <Card className="border-zinc-200 bg-zinc-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">QR Code do veículo</CardTitle>
              <CardDescription>
                Escaneie para abrir os detalhes e a simulação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* eslint-disable-next-line @next/next/no-img-element -- QR code generated as data URL */}
              <img
                src={qrDataUrl}
                alt={`QR Code para ${payload.vehicleTitle}`}
                className="mx-auto block w-full max-w-[260px] rounded-md border border-zinc-200 bg-white p-2"
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
