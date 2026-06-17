import { resolveWebMotorsVehicleCatalogIds } from "./webmotors-catalog-resolve.ts";
import {
  resolveWebMotorsEstoqueBaseUrl,
  webMotorsApiRequest,
} from "./webmotors-api-client.ts";
import type {
  ClassifiedsProviderAdapter,
  ProviderSyncResult,
  VehicleListingPayload,
} from "./types.ts";

function isDryRunEnabled(): boolean {
  const flag = Deno.env.get("CLASSIFIEDS_SYNC_DRY_RUN")?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function dryRunListingUrl(dryRunId: string): string {
  return `https://www.webmotors.com.br/carros/detalhe/${encodeURIComponent(dryRunId)}`;
}

function resolveAnuncioCollectionUrl(): string {
  const base = resolveWebMotorsEstoqueBaseUrl();
  const suffix =
    Deno.env.get("WEBMOTORS_LISTINGS_ANUNCIO_PATH")?.trim() || "/anuncio";
  return `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

function resolveAnuncioItemUrl(externalListingId: string): string {
  return `${resolveAnuncioCollectionUrl()}/${encodeURIComponent(externalListingId)}`;
}

function buildExternalListingReference(
  vehicleId: string,
  existingExternalId: string | null,
): string {
  if (existingExternalId?.trim()) {
    return existingExternalId.trim().slice(0, 64);
  }
  const compact = vehicleId.replace(/-/g, "");
  return `ap${compact}`.slice(0, 64);
}

function buildDescription(description: string | null, brand: string, model: string): string {
  const trimmed = description?.trim();
  if (trimmed && trimmed.length >= 2) {
    return trimmed.slice(0, 6000);
  }
  return `${brand} ${model} disponível para venda.`.slice(0, 6000);
}

function mapFuelTypeLabel(fuelType: string | null): string | null {
  if (!fuelType) {
    return null;
  }
  const normalized = fuelType.toLowerCase();
  if (normalized.includes("flex")) {
    return "Flex";
  }
  if (normalized.includes("gasolina")) {
    return "Gasolina";
  }
  if (normalized.includes("etanol") || normalized.includes("alcool")) {
    return "Álcool";
  }
  if (normalized.includes("diesel")) {
    return "Diesel";
  }
  if (normalized.includes("eletr")) {
    return "Elétrico";
  }
  if (normalized.includes("hibrid")) {
    return "Híbrido";
  }
  if (normalized.includes("gnv")) {
    return "GNV";
  }
  return fuelType.trim();
}

function mapTransmissionLabel(transmission: string | null): string | null {
  if (!transmission) {
    return null;
  }
  const normalized = transmission.toLowerCase();
  if (normalized.includes("manual")) {
    return "Manual";
  }
  if (normalized.includes("automat")) {
    return "Automático";
  }
  return transmission.trim();
}

function extractListingIdFromResponse(
  body: Record<string, unknown>,
  fallback: string,
): string {
  const candidates = [
    body.id,
    body.idAnuncio,
    body.codigoAnuncio,
    body.codigoAnuncioExterno,
    body.anuncioId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return fallback;
}

function extractListingUrlFromResponse(
  body: Record<string, unknown>,
  externalListingId: string,
): string | null {
  const urlCandidates = [body.url, body.link, body.listingUrl, body.urlAnuncio];
  for (const candidate of urlCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return dryRunListingUrl(externalListingId);
}

async function buildWebMotorsPublishPayload(
  accessToken: string,
  vehicle: VehicleListingPayload,
  externalReference: string,
): Promise<Record<string, unknown>> {
  const catalogIds = await resolveWebMotorsVehicleCatalogIds({
    accessToken,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    modelYear: vehicle.modelYear,
  });

  const payload: Record<string, unknown> = {
    idMarca: catalogIds.brandId,
    idModelo: catalogIds.modelId,
    idVersao: catalogIds.versionId,
    anoFabricacao: vehicle.manufacturingYear,
    anoModelo: vehicle.modelYear,
    quilometragem: vehicle.mileage,
    preco: Math.round(vehicle.price),
    descricao: buildDescription(vehicle.description, vehicle.brand, vehicle.model),
    codigoAnuncioExterno: externalReference,
    fotos: vehicle.images.slice(0, 20).map((url) => ({ url })),
  };

  const fuel = mapFuelTypeLabel(vehicle.fuelType);
  if (fuel) {
    payload.combustivel = fuel;
  }

  const transmission = mapTransmissionLabel(vehicle.transmission);
  if (transmission) {
    payload.cambio = transmission;
  }

  if (vehicle.color?.trim()) {
    payload.cor = vehicle.color.trim();
  }

  return payload;
}

export function createWebMotorsProviderAdapter(): ClassifiedsProviderAdapter {
  return {
    provider: "webmotors",
    async publish(
      accessToken: string,
      vehicle: VehicleListingPayload,
      existingExternalId: string | null,
    ): Promise<ProviderSyncResult> {
      const externalReference = buildExternalListingReference(
        vehicle.vehicleId,
        existingExternalId,
      );

      if (isDryRunEnabled()) {
        const dryRunId = existingExternalId ?? `dry_run_webmotors_${externalReference}`;
        return {
          externalListingId: dryRunId,
          externalListingUrl: dryRunListingUrl(dryRunId),
          mode: "dry_run",
        };
      }

      const payload = await buildWebMotorsPublishPayload(
        accessToken,
        vehicle,
        externalReference,
      );

      const isUpdate = Boolean(existingExternalId?.trim());
      const { body } = await webMotorsApiRequest({
        accessToken,
        method: isUpdate ? "PUT" : "POST",
        url: isUpdate
          ? resolveAnuncioItemUrl(existingExternalId!.trim())
          : resolveAnuncioCollectionUrl(),
        body: payload,
      });

      const externalListingId = extractListingIdFromResponse(body, externalReference);

      return {
        externalListingId,
        externalListingUrl: extractListingUrlFromResponse(body, externalListingId),
        mode: "live",
        raw: body,
      };
    },

    async delist(accessToken: string, externalListingId: string) {
      if (isDryRunEnabled()) {
        return { mode: "dry_run" as const };
      }

      try {
        await webMotorsApiRequest({
          accessToken,
          method: "DELETE",
          url: resolveAnuncioItemUrl(externalListingId),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("(404)")) {
          return { mode: "live" as const };
        }
        throw error;
      }

      return { mode: "live" as const };
    },
  };
}
