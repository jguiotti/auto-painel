"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

interface QrPrintToolbarProps {
  vehicleId: string;
  format: "a4" | "etiqueta";
}

export function QrPrintToolbar({ vehicleId, format }: QrPrintToolbarProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button
        type="button"
        onClick={() => window.print()}
        className="bg-[var(--dealer-primary)] text-white hover:opacity-95"
      >
        Imprimir
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/painel/estoque/${vehicleId}/qr?formato=a4`}>Formato A4</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/painel/estoque/${vehicleId}/qr?formato=etiqueta`}>
          Formato etiqueta
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/painel/estoque">Voltar ao estoque</Link>
      </Button>
      <span className="text-xs text-muted-foreground">
        Formato atual: {format === "a4" ? "A4" : "Etiqueta"}
      </span>
    </div>
  );
}
