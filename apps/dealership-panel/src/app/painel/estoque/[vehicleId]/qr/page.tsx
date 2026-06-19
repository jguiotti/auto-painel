import Link from "next/link";
import QRCode from "qrcode";

import { notFound } from "next/navigation";

import { QrPrintToolbar } from "@/components/inventory/qr-print-toolbar";
import { getVehicleQrPrintPayload } from "@/lib/inventory/get-vehicle-qr-print-payload";

interface VehicleQrPageProps {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ formato?: string; texto?: string }>;
}

export default async function VehicleQrPage({
  params,
  searchParams,
}: VehicleQrPageProps) {
  const { vehicleId } = await params;
  const { formato, texto } = await searchParams;
  const printFormat: "a4" | "etiqueta" = formato === "etiqueta" ? "etiqueta" : "a4";
  const promoText = typeof texto === "string" ? texto.trim() : "";

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
  const displayCta = promoText || payload.ctaText;
  const qrDataUrl = await QRCode.toDataURL(payload.publicVehicleUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: printFormat === "a4" ? 320 : 220,
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
            page-break-inside: avoid;
            max-width: none !important;
            width: 100% !important;
            min-height: auto !important;
          }
          @page {
            size: ${printFormat === "a4" ? "A4 landscape" : "100mm 150mm"};
            margin: ${printFormat === "a4" ? "8mm" : "4mm"};
          }
        }
      `}</style>

      <div className="no-print flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Lâmina de venda com QR Code
        </h1>
        <p className="text-sm text-muted-foreground">
          Confira o preview antes de imprimir. O QR direciona para a página pública do veículo.
        </p>
      </div>

      <QrPrintToolbar
        vehicleId={vehicleId}
        format={printFormat}
        initialPromoText={promoText}
      />

      <section
        className={`print-sheet mx-auto w-full rounded-2xl border bg-white text-zinc-900 shadow-sm ${
          printFormat === "a4"
            ? "max-w-[297mm] p-8"
            : "max-w-[100mm] min-h-[140mm] p-4"
        }`}
      >
        <header
          className={`flex items-center justify-between gap-4 border-b border-zinc-200 ${
            printFormat === "a4" ? "pb-5" : "pb-3"
          }`}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Concessionária
            </p>
            <h2
              className={`truncate font-bold ${printFormat === "a4" ? "text-xl" : "text-base"}`}
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
              className={`w-auto object-contain ${printFormat === "a4" ? "h-14 max-w-[160px]" : "h-10 max-w-[100px]"}`}
            />
          ) : null}
        </header>

        <div
          className={`grid gap-6 ${
            printFormat === "a4"
              ? "mt-6 grid-cols-[1.35fr_0.85fr] items-center"
              : "mt-4 grid-cols-1"
          }`}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Veículo
            </p>
            <h3 className={`font-bold ${printFormat === "a4" ? "text-3xl" : "text-xl"}`}>
              {payload.vehicleTitle}
            </h3>
            <p className="text-sm text-zinc-600">{payload.vehicleSubtitle}</p>
            <p
              className={`font-extrabold ${printFormat === "a4" ? "text-4xl" : "text-2xl"}`}
              style={{ color: "var(--dealer-accent)" }}
            >
              {payload.vehiclePriceFormatted}
            </p>
            <p
              className={`whitespace-pre-line text-zinc-700 ${
                printFormat === "a4" ? "text-base" : "text-xs"
              }`}
            >
              {displayCta}
            </p>
            {printFormat === "a4" ? (
              <p className="break-all text-xs text-zinc-500">{payload.publicVehicleUrl}</p>
            ) : null}
          </div>

          <div
            className={`flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 ${
              printFormat === "a4" ? "p-5" : "p-3"
            }`}
          >
            <p className="mb-3 text-center text-sm font-semibold text-zinc-700">
              Escaneie para ver detalhes
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code generated as data URL */}
            <img
              src={qrDataUrl}
              alt={`QR Code para ${payload.vehicleTitle}`}
              className={`block rounded-md border border-zinc-200 bg-white p-2 ${
                printFormat === "a4" ? "max-w-[240px]" : "max-w-[180px]"
              }`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
