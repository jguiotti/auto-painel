import { publishVehicleToClassifiedsAction } from "@/app/painel/estoque/classified-actions";

export const SKIP_CLASSIFIEDS_PROMOTION_FIELD = "skip_classifieds_promotion";

export function shouldSkipClassifiedsPromotion(formData: FormData): boolean {
  return formData.get(SKIP_CLASSIFIEDS_PROMOTION_FIELD) === "true";
}

/**
 * Enqueues publish jobs for all connected classifieds portals after a normal save
 * (CA-INT-001 / INT-1). Best-effort: save must not fail when portals are offline.
 */
export async function maybeAutoPublishVehicleToClassifieds(
  vehicleId: string,
  formData: FormData,
): Promise<void> {
  if (formData.get("submit_intent") === "save_and_promote") {
    return;
  }
  if (shouldSkipClassifiedsPromotion(formData)) {
    return;
  }

  try {
    await publishVehicleToClassifiedsAction(vehicleId);
  } catch {
    // Auto-publish must not block vehicle save.
  }
}
