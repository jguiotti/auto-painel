"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@autopainel/shared/ui";

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
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleClick() {
    if (!globalThis.confirm("Remover esta imagem?")) {
      return;
    }
    setIsRemoving(true);
    await removeVehicleImageAction(vehicleId, imageUrl);
    router.refresh();
    setIsRemoving(false);
  }

  return (
    <Button
      type="button"
      variant="link"
      className="mt-1 h-auto p-0 text-xs text-destructive hover:text-destructive"
      onClick={handleClick}
      disabled={isRemoving}
    >
      {isRemoving ? "Removendo…" : "Remover"}
    </Button>
  );
}
