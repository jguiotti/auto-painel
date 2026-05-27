"use client";

import { Trash2 } from "lucide-react";
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
    <div className="relative flex flex-col items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        onClick={handleClick}
        disabled={isDeleting}
        aria-label={isDeleting ? "Excluindo veículo" : "Excluir veículo"}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
      {errorMessage ? (
        <span className="absolute top-full mt-1 max-w-[10rem] text-center text-xs text-destructive">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
