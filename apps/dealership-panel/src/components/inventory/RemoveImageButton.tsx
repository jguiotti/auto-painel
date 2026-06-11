"use client";

import { useRouter } from "next/navigation";

import { Button, ConfirmActionDialog } from "@autopainel/shared/ui";

import { removeVehicleImageAction } from "@/app/painel/estoque/actions";

interface RemoveImageButtonProps {
  vehicleId: string;
  imageUrl: string;
}

export function RemoveImageButton({
  vehicleId,
  imageUrl,
}: RemoveImageButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    await removeVehicleImageAction(vehicleId, imageUrl);
    router.refresh();
  }

  return (
    <ConfirmActionDialog
      title="Remover imagem?"
      description={
        <p>A foto será removida do veículo. Você pode enviar outra imagem depois.</p>
      }
      confirmLabel="Remover imagem"
      confirmPendingLabel="Removendo…"
      confirmVariant="destructive"
      onConfirm={handleConfirm}
      trigger={
        <Button
          type="button"
          variant="link"
          className="mt-1 h-auto p-0 text-xs text-destructive hover:text-destructive"
        >
          Remover
        </Button>
      }
    />
  );
}
