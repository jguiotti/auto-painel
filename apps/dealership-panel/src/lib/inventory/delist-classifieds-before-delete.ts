import { delistVehicleFromClassifiedsAction } from "@/app/painel/estoque/classified-actions";

/**
 * INT-2: enqueue delist before vehicle DELETE. Best-effort when never published.
 */
export async function delistClassifiedsBeforeVehicleDelete(vehicleId: string): Promise<void> {
  try {
    await delistVehicleFromClassifiedsAction(vehicleId);
  } catch {
    // Delete must proceed even when delist fails or nothing was published.
  }
}
