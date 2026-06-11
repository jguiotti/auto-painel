"use client";

import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, ConfirmActionDialog } from "@autopainel/shared/ui";

import { unmarkVehicleAsSoldAction } from "@/app/painel/estoque/actions";

interface UnmarkVehicleAsSoldButtonProps {
  vehicleId: string;
  vehicleLabel?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function UnmarkVehicleAsSoldButton({
  vehicleId,
  vehicleLabel,
  variant = "outline",
  size = "default",
  showLabel = true,
  className,
}: UnmarkVehicleAsSoldButtonProps) {
  const router = useRouter();
  const label = vehicleLabel?.trim() || "este veículo";

  async function handleConfirm() {
    const result = await unmarkVehicleAsSoldAction(vehicleId);
    if (result && "error" in result && result.error) {
      return { error: result.error };
    }
    router.refresh();
  }

  const dialogDescription = (
    <>
      <p>
        Desfazer a venda de <strong>{label}</strong>?
      </p>
      <p>
        O veículo volta a aparecer como disponível no estoque. Se você já salvou um recibo, os
        dados permanecem para quando marcar como vendido novamente.
      </p>
    </>
  );

  if (size === "icon") {
    return (
      <ConfirmActionDialog
        title="Desfazer venda"
        description={dialogDescription}
        confirmLabel="Desfazer venda"
        confirmPendingLabel="Salvando…"
        onConfirm={handleConfirm}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-8 text-muted-foreground hover:text-foreground ${className ?? ""}`}
            title="Desfazer venda"
            aria-label="Desfazer venda"
          >
            <Undo2 className="size-4" aria-hidden />
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmActionDialog
      title="Desfazer venda"
      description={dialogDescription}
      confirmLabel="Desfazer venda"
      confirmPendingLabel="Salvando…"
      onConfirm={handleConfirm}
      trigger={
        <Button type="button" variant={variant} size={size} className={className}>
          {showLabel ? "Desfazer venda" : null}
        </Button>
      }
    />
  );
}
