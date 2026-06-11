import type {
  ClassifiedsProviderAdapter,
  ClassifiedsProviderKey,
  ProviderSyncResult,
  VehicleListingPayload,
} from "./types.ts";

function isDryRunEnabled(): boolean {
  const flag = Deno.env.get("CLASSIFIEDS_SYNC_DRY_RUN")?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function resolvePublishUrl(provider: ClassifiedsProviderKey): string | null {
  if (provider === "olx") {
    return Deno.env.get("OLX_LISTINGS_API_URL")?.trim() || null;
  }
  return Deno.env.get("WEBMOTORS_LISTINGS_API_URL")?.trim() || null;
}

function resolveDelistUrl(provider: ClassifiedsProviderKey, externalId: string): string | null {
  const base =
    provider === "olx"
      ? Deno.env.get("OLX_LISTINGS_API_URL")?.trim()
      : Deno.env.get("WEBMOTORS_LISTINGS_API_URL")?.trim();
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(externalId)}`;
}

function buildListingBody(vehicle: VehicleListingPayload): Record<string, unknown> {
  return {
    external_reference: vehicle.vehicleId,
    title: `${vehicle.brand} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""}`.trim(),
    year: vehicle.modelYear,
    manufacturing_year: vehicle.manufacturingYear,
    mileage_km: vehicle.mileage,
    price: vehicle.price,
    description: vehicle.description,
    slug: vehicle.publicSlug,
    images: vehicle.images,
    fuel_type: vehicle.fuelType,
    transmission: vehicle.transmission,
    color: vehicle.color,
  };
}

function createAdapter(provider: ClassifiedsProviderKey): ClassifiedsProviderAdapter {
  return {
    provider,
    async publish(
      accessToken: string,
      vehicle: VehicleListingPayload,
      existingExternalId: string | null,
    ): Promise<ProviderSyncResult> {
      const publishUrl = resolvePublishUrl(provider);
      if (isDryRunEnabled() || !publishUrl) {
        const suffix = existingExternalId ?? crypto.randomUUID();
        return {
          externalListingId: `dry_run_${provider}_${suffix}`,
          mode: "dry_run",
        };
      }

      const method = existingExternalId ? "PUT" : "POST";
      const url = existingExternalId
        ? `${publishUrl.replace(/\/$/, "")}/${encodeURIComponent(existingExternalId)}`
        : publishUrl;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildListingBody(vehicle)),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${provider} publish failed (${response.status}): ${text.slice(0, 500)}`);
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const externalListingId =
        (typeof payload.id === "string" && payload.id) ||
        (typeof payload.listing_id === "string" && payload.listing_id) ||
        existingExternalId;

      if (!externalListingId) {
        throw new Error(`${provider} publish response missing listing id.`);
      }

      return {
        externalListingId,
        mode: "live",
        raw: payload,
      };
    },

    async delist(accessToken: string, externalListingId: string) {
      const delistUrl = resolveDelistUrl(provider, externalListingId);
      if (isDryRunEnabled() || !delistUrl) {
        return { mode: "dry_run" as const };
      }

      const response = await fetch(delistUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new Error(`${provider} delist failed (${response.status}): ${text.slice(0, 500)}`);
      }

      return { mode: "live" as const };
    },
  };
}

const adapters: Record<ClassifiedsProviderKey, ClassifiedsProviderAdapter> = {
  olx: createAdapter("olx"),
  webmotors: createAdapter("webmotors"),
};

export function createClassifiedsProviderAdapter(
  provider: ClassifiedsProviderKey,
): ClassifiedsProviderAdapter {
  return adapters[provider];
}
