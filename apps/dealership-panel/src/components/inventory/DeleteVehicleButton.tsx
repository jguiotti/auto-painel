"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, ConfirmActionDialog } from "@autopainel/shared/ui";

import { deleteVehicleAction } from "@/app/painel/estoque/actions";

interface DeleteVehicleButtonProps {
  vehicleId: string;
}

export function DeleteVehicleButton({ vehicleId }: DeleteVehicleButtonProps) {
  const router = useRouter();

  async function handleConfirm() {
    const result = await deleteVehicleAction(vehicleId);
    if (result && "error" in result && result.error) {
      return { error: result.error };
    }
    router.push("/painel/estoque");
    router.refresh();
  }

  return (
    <ConfirmActionDialog
      title="Excluir veículo?"
      description={
        <p>
          Esta ação remove o veículo do estoque. Os contatos vinculados também serão
          removidos. Não é possível desfazer.
        </p>
      }
      confirmLabel="Excluir veículo"
      confirmPendingLabel="Excluindo…"
      confirmVariant="destructive"
      onConfirm={handleConfirm}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          aria-label="Excluir veículo"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      }
    />
  );
}
