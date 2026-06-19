"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Label, Textarea } from "@autopainel/shared/ui";

interface QrPrintToolbarProps {
  vehicleId: string;
  format: "a4" | "etiqueta";
  initialPromoText: string;
}

function buildQrHref(
  vehicleId: string,
  format: "a4" | "etiqueta",
  promoText: string,
): string {
  const params = new URLSearchParams();
  params.set("formato", format);
  const trimmed = promoText.trim();
  if (trimmed) {
    params.set("texto", trimmed);
  }
  return `/painel/estoque/${vehicleId}/qr?${params.toString()}`;
}

export function QrPrintToolbar({
  vehicleId,
  format,
  initialPromoText,
}: QrPrintToolbarProps) {
  const router = useRouter();
  const [promoText, setPromoText] = useState(initialPromoText);

  function applyPromoText() {
    router.push(buildQrHref(vehicleId, format, promoText));
  }

  return (
    <div className="no-print space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => window.print()}
          className="bg-[var(--dealer-primary)] text-white hover:opacity-95"
        >
          Imprimir
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildQrHref(vehicleId, "a4", promoText)}>Formato A4</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={buildQrHref(vehicleId, "etiqueta", promoText)}>Formato etiqueta</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/painel/estoque">Voltar ao estoque</Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Formato atual: {format === "a4" ? "A4 paisagem" : "Etiqueta (1 página)"}
        </span>
      </div>

      <div className="max-w-2xl space-y-2 rounded-xl border border-border bg-card p-4">
        <Label htmlFor="qr-promo-text">Texto promocional (opcional)</Label>
        <Textarea
          id="qr-promo-text"
          value={promoText}
          onChange={(event) => setPromoText(event.target.value)}
          placeholder="Ex.: Financiamento em até 60x · Aceitamos seu usado como entrada"
          rows={3}
          maxLength={280}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={applyPromoText}>
            Aplicar texto no preview
          </Button>
          <p className="text-xs text-muted-foreground">
            Aparece na lâmina impressa abaixo do preço. Máximo 280 caracteres.
          </p>
        </div>
      </div>
    </div>
  );
}
