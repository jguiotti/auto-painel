import { resolveOlxVehicleCatalogIds } from "./olx-catalog-resolve.ts";
import type {
  ClassifiedsProviderAdapter,
  ProviderSyncResult,
  VehicleListingPayload,
} from "./types.ts";

const OLX_IMPORT_URL = "https://apps.olx.com.br/autoupload/import";

function isDryRunEnabled(): boolean {
  const flag = Deno.env.get("CLASSIFIEDS_SYNC_DRY_RUN")?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function resolveImportUrl(): string {
  return Deno.env.get("OLX_LISTINGS_API_URL")?.trim() || OLX_IMPORT_URL;
}

function dryRunListingUrl(dryRunId: string): string {
  return `https://www.olx.com.br/vi/${encodeURIComponent(dryRunId)}`;
}

function buildOlxListingId(vehicleId: string, existingExternalId: string | null): string {
  if (existingExternalId?.trim()) {
    return existingExternalId.trim().slice(0, 19);
  }
  const compact = vehicleId.replace(/-/g, "");
  return `ap${compact}`.slice(0, 19);
}

function resolveOlxCategory(vehicleType: string | null): number {
  switch (vehicleType) {
    case "motocicleta":
      return 2060;
    case "onibus":
      return 2050;
    case "caminhao":
      return 2040;
    default:
      return 2020;
  }
}

function mapOlxFuelType(fuelType: string | null): string | null {
  if (!fuelType) {
    return null;
  }
  const normalized = fuelType.toLowerCase();
  if (normalized.includes("flex")) {
    return "3";
  }
  if (normalized.includes("gasolina")) {
    return "1";
  }
  if (normalized.includes("etanol") || normalized.includes("alcool")) {
    return "2";
  }
  if (normalized.includes("diesel")) {
    return "5";
  }
  if (normalized.includes("eletr")) {
    return "6";
  }
  if (normalized.includes("hibrid")) {
    return "7";
  }
  if (normalized.includes("gnv")) {
    return "4";
  }
  return null;
}

function mapOlxGearbox(transmission: string | null): string | null {
  if (!transmission) {
    return null;
  }
  const normalized = transmission.toLowerCase();
  if (normalized.includes("manual")) {
    return "1";
  }
  return "2";
}

function normalizePhoneDigits(phone: string | null): number {
  const digits = (phone ?? "").replace(/\D/g, "");
  const fallback = Deno.env.get("OLX_FALLBACK_PHONE")?.replace(/\D/g, "") ?? "";
  const resolved = digits.length >= 10 ? digits : fallback;
  if (resolved.length < 10 || resolved.length > 11) {
    throw new Error(
      "Telefone OLX inválido. Configure whatsapp da loja ou OLX_FALLBACK_PHONE com DDD + número.",
    );
  }
  return Number(resolved);
}

function normalizeZipcode(zipcode: string | null): string {
  const digits = (zipcode ?? "").replace(/\D/g, "").slice(0, 8);
  const fallback = Deno.env.get("OLX_FALLBACK_ZIPCODE")?.replace(/\D/g, "").slice(0, 8) ?? "";
  const resolved = digits.length === 8 ? digits : fallback;
  if (resolved.length !== 8) {
    throw new Error(
      "CEP OLX inválido. Preencha o CEP da unidade do veículo ou OLX_FALLBACK_ZIPCODE.",
    );
  }
  return resolved;
}

function buildDescription(description: string | null, brand: string, model: string): string {
  const trimmed = description?.trim();
  if (trimmed && trimmed.length >= 2) {
    return trimmed.slice(0, 6000);
  }
  return `${brand} ${model} disponível para venda.`.slice(0, 6000);
}

async function putOlxImport(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(resolveImportUrl(), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": "AutoPainel/1.0",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let body: Record<string, unknown> = {};
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  if (!response.ok) {
    throw new Error(`OLX import failed (${response.status}): ${rawBody.slice(0, 500)}`);
  }

  const statusCode = typeof body.statusCode === "number" ? body.statusCode : null;
  if (statusCode !== null && statusCode !== 0) {
    const statusMessage =
      typeof body.statusMessage === "string" ? body.statusMessage : "Erro na importação OLX.";
    throw new Error(`OLX import rejected (${statusCode}): ${statusMessage}`);
  }

  return body;
}

async function buildOlxPublishPayload(
  accessToken: string,
  vehicle: VehicleListingPayload,
  listingId: string,
): Promise<Record<string, unknown>> {
  const isMotorcycle = vehicle.vehicleType === "motocicleta";
  const catalogIds = await resolveOlxVehicleCatalogIds({
    accessToken,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    isMotorcycle,
  });

  const params: Record<string, string> = {
    vehicle_brand: catalogIds.vehicleBrandId,
    vehicle_model: catalogIds.vehicleModelId,
    vehicle_version: catalogIds.vehicleVersionId,
    regdate: String(vehicle.modelYear),
    mileage: String(vehicle.mileage),
  };

  const fuel = mapOlxFuelType(vehicle.fuelType);
  if (fuel) {
    params.fuel = fuel;
  }

  const gearbox = mapOlxGearbox(vehicle.transmission);
  if (gearbox) {
    params.gearbox = gearbox;
  }

  if (vehicle.color?.trim()) {
    params.carcolor = vehicle.color.trim();
  }

  return {
    access_token: accessToken,
    ad_list: [
      {
        id: listingId,
        operation: "insert",
        category: resolveOlxCategory(vehicle.vehicleType),
        subject: `${vehicle.brand} ${vehicle.model}`.trim().slice(0, 90),
        body: buildDescription(vehicle.description, vehicle.brand, vehicle.model),
        phone: normalizePhoneDigits(vehicle.contactPhone),
        type: "s",
        price: Math.round(vehicle.price),
        zipcode: normalizeZipcode(vehicle.zipcode),
        images: vehicle.images.slice(0, 20),
        params,
      },
    ],
  };
}

export function createOlxProviderAdapter(): ClassifiedsProviderAdapter {
  return {
    provider: "olx",
    async publish(
      accessToken: string,
      vehicle: VehicleListingPayload,
      existingExternalId: string | null,
    ): Promise<ProviderSyncResult> {
      const listingId = buildOlxListingId(vehicle.vehicleId, existingExternalId);

      if (isDryRunEnabled()) {
        const dryRunId = existingExternalId ?? `dry_run_olx_${listingId}`;
        return {
          externalListingId: dryRunId,
          externalListingUrl: dryRunListingUrl(dryRunId),
          mode: "dry_run",
        };
      }

      const payload = await buildOlxPublishPayload(accessToken, vehicle, listingId);
      const response = await putOlxImport(payload);

      return {
        externalListingId: listingId,
        externalListingUrl: null,
        mode: "live",
        raw: {
          ...response,
          import_token: typeof response.token === "string" ? response.token : null,
        },
      };
    },

    async delist(accessToken: string, externalListingId: string) {
      if (isDryRunEnabled()) {
        return { mode: "dry_run" as const };
      }

      await putOlxImport({
        access_token: accessToken,
        ad_list: [
          {
            id: externalListingId.slice(0, 19),
            operation: "delete",
          },
        ],
      });

      return { mode: "live" as const };
    },
  };
}
