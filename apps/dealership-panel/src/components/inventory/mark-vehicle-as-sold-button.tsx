"use client";

import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button, ConfirmActionDialog } from "@autopainel/shared/ui";

import { markVehicleAsSoldAction } from "@/app/painel/estoque/actions";

interface MarkVehicleAsSoldButtonProps {
  vehicleId: string;
  vehicleLabel?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
  className?: string;
  /** After marking sold, open the vehicle detail page (shows receipt card). */
  redirectToVehiclePage?: boolean;
}

export function MarkVehicleAsSoldButton({
  vehicleId,
  vehicleLabel,
  variant = "outline",
  size = "default",
  showLabel = true,
  className,
  redirectToVehiclePage = false,
}: MarkVehicleAsSoldButtonProps) {
  const router = useRouter();
  const label = vehicleLabel?.trim() || "este veículo";

  async function handleConfirm() {
    const result = await markVehicleAsSoldAction(vehicleId);
    if (result && "error" in result && result.error) {
      return { error: result.error };
    }
    if (redirectToVehiclePage) {
      router.push(`/painel/estoque/${vehicleId}`);
    } else {
      router.refresh();
    }
  }

  const dialogDescription = (
    <>
      <p>
        Marcar <strong>{label}</strong> como vendido?
      </p>
      <p>
        O anúncio sai da vitrine e, se houver integração com portais, a baixa será enfileirada
        automaticamente.
      </p>
    </>
  );

  if (size === "icon") {
    return (
      <ConfirmActionDialog
        title="Marcar como vendido"
        description={dialogDescription}
        confirmLabel="Marcar como vendido"
        confirmPendingLabel="Salvando…"
        onConfirm={handleConfirm}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-8 text-emerald-700 hover:text-emerald-800 ${className ?? ""}`}
            title="Marcar como vendido"
            aria-label="Marcar como vendido"
          >
            <BadgeCheck className="size-4" aria-hidden />
          </Button>
        }
      />
    );
  }

  return (
    <ConfirmActionDialog
      title="Marcar como vendido"
      description={dialogDescription}
      confirmLabel="Marcar como vendido"
      confirmPendingLabel="Salvando…"
      onConfirm={handleConfirm}
      trigger={
        <Button type="button" variant={variant} size={size} className={className}>
          {showLabel ? "Marcar como vendido" : null}
        </Button>
      }
    />
  );
}
