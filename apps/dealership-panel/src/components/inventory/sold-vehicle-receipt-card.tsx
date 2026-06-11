import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

interface SoldVehicleReceiptCardProps {
  vehicleId: string;
  hasReceipt: boolean;
  isSaleReceiptEnabled: boolean;
}

export function SoldVehicleReceiptCard({
  vehicleId,
  hasReceipt,
  isSaleReceiptEnabled,
}: SoldVehicleReceiptCardProps) {
  return (
    <div
      className={
        isSaleReceiptEnabled
          ? "rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20"
          : "rounded-lg border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900 dark:bg-amber-950/20"
      }
    >
      <p className="text-sm font-medium">Recibo de venda</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {!isSaleReceiptEnabled
          ? "O módulo recibo_compra não está no plano efetivo desta loja. Verifique plano Enterprise e módulos no admin."
          : hasReceipt
            ? "Recibo salvo. Você pode editar os dados ou imprimir novamente."
            : "Registre os dados do comprador e imprima o recibo simples da venda."}
      </p>
      <Button className="mt-4 w-full" variant="default" asChild>
        <Link href={`/painel/estoque/${vehicleId}/recibo`}>
          {hasReceipt ? "Ver e imprimir recibo" : "Emitir recibo"}
        </Link>
      </Button>
    </div>
  );
}