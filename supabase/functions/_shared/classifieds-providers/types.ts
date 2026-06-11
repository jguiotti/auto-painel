export type ClassifiedsProviderKey = "olx" | "webmotors" | "icarros";

export type ClassifiedsSyncAction = "publish" | "delist";

export interface VehicleListingPayload {
  vehicleId: string;
  dealershipId: string;
  brand: string;
  model: string;
  version: string | null;
  publicSlug: string;
  manufacturingYear: number;
  modelYear: number;
  mileage: number;
  price: number;
  description: string | null;
  images: string[];
  fuelType: string | null;
  transmission: string | null;
  color: string | null;
}

export interface ProviderSyncResult {
  externalListingId: string;
  externalListingUrl?: string | null;
  mode: "live" | "dry_run";
  raw?: Record<string, unknown>;
}

export interface ClassifiedsProviderAdapter {
  provider: ClassifiedsProviderKey;
  publish(
    accessToken: string,
    vehicle: VehicleListingPayload,
    existingExternalId: string | null,
  ): Promise<ProviderSyncResult>;
  delist(
    accessToken: string,
    externalListingId: string,
  ): Promise<{ mode: "live" | "dry_run" }>;
}
