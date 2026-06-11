"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

interface SaleReceiptPrintToolbarProps {
  vehicleId: string;
}

export function SaleReceiptPrintToolbar({ vehicleId }: SaleReceiptPrintToolbarProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button type="button" onClick={() => window.print()}>
        Imprimir recibo
      </Button>
      <Button variant="outline" asChild>
        <Link href={`/painel/estoque/${vehicleId}`}>Voltar ao veículo</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/painel/estoque">Voltar ao estoque</Link>
      </Button>
    </div>
  );
}
