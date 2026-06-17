import { createClassifiedsProviderAdapter as createGenericAdapter } from "./olx-webmotors-adapter.ts";
import { createOlxProviderAdapter } from "./olx-adapter.ts";
import { createWebMotorsProviderAdapter } from "./webmotors-adapter.ts";
import type { ClassifiedsProviderKey } from "./types.ts";

export function getClassifiedsProviderAdapter(provider: ClassifiedsProviderKey) {
  if (provider === "olx") {
    return createOlxProviderAdapter();
  }
  if (provider === "webmotors") {
    return createWebMotorsProviderAdapter();
  }
  return createGenericAdapter(provider);
}
export type { ClassifiedsProviderKey, VehicleListingPayload } from "./types.ts";
