import Link from "next/link";
import { notFound } from "next/navigation";

import { SaleReceiptWorkspace } from "@/components/inventory/sale-receipt-workspace";
import { getVehicleSaleReceiptPageContext } from "@/lib/inventory/get-vehicle-sale-receipt-page-context";

interface VehicleSaleReceiptPageProps {
  params: Promise<{ vehicleId: string }>;
}

export default async function VehicleSaleReceiptPage({ params }: VehicleSaleReceiptPageProps) {
  const { vehicleId } = await params;

  if (!vehicleId || vehicleId.length < 10) {
    notFound();
  }

  const context = await getVehicleSaleReceiptPageContext(vehicleId);

  if (context.error && !context.enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Recibo de venda</h1>
        <p className="text-sm text-destructive">{context.error}</p>
        <Link href={`/painel/estoque/${vehicleId}`} className="text-sm font-medium underline">
          Voltar ao veículo
        </Link>
      </div>
    );
  }

  if (context.error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Recibo de venda</h1>
        <p className="text-sm text-destructive">{context.error}</p>
        <Link href={`/painel/estoque/${vehicleId}`} className="text-sm font-medium underline">
          Voltar ao veículo
        </Link>
      </div>
    );
  }

  return (
    <SaleReceiptWorkspace
      vehicle={context.vehicle}
      dealership={context.dealership}
      initialReceipt={context.receipt}
      leadOptions={context.leadOptions}
    />
  );
}
