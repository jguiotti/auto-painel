"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@autopainel/shared/ui";

import { deleteVehicleAction } from "@/app/painel/estoque/actions";

interface DeleteVehicleButtonProps {
  vehicleId: string;
}

export function DeleteVehicleButton({ vehicleId }: DeleteVehicleButtonProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    if (
      !globalThis.confirm(
        "Excluir este veículo? Os contatos vinculados também serão removidos.",
      )
    ) {
      return;
    }
    setErrorMessage(null);
    setIsDeleting(true);
    const result = await deleteVehicleAction(vehicleId);
    setIsDeleting(false);
    if (result && "error" in result && result.error) {
      setErrorMessage(result.error);
      return;
    }
    router.push("/painel/estoque");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 text-destructive hover:text-destructive"
        onClick={handleClick}
        disabled={isDeleting}
      >
        {isDeleting ? "Excluindo…" : "Excluir"}
      </Button>
      {errorMessage ? (
        <span className="max-w-xs text-right text-xs text-destructive">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
