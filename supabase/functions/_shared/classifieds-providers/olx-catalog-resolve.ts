interface OlxCatalogEntry {
  id: string;
  name: string;
}

function normalizeCatalogLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractCatalogEntries(payload: unknown): OlxCatalogEntry[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.brands,
    record.models,
    record.versions,
    record.data,
    record.items,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const entries = candidate
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const row = item as Record<string, unknown>;
        const id =
          (typeof row.id === "string" && row.id) ||
          (typeof row.id === "number" && String(row.id)) ||
          (typeof row.brand_id === "string" && row.brand_id) ||
          (typeof row.model_id === "string" && row.model_id) ||
          (typeof row.version_id === "string" && row.version_id) ||
          null;
        const name =
          (typeof row.name === "string" && row.name) ||
          (typeof row.label === "string" && row.label) ||
          (typeof row.brand === "string" && row.brand) ||
          (typeof row.model === "string" && row.model) ||
          (typeof row.version === "string" && row.version) ||
          null;

        if (!id || !name) {
          return null;
        }

        return { id, name };
      })
      .filter((entry): entry is OlxCatalogEntry => entry !== null);

    if (entries.length > 0) {
      return entries;
    }
  }

  return [];
}

function pickBestCatalogMatch(
  entries: OlxCatalogEntry[],
  target: string,
): OlxCatalogEntry | null {
  const normalizedTarget = normalizeCatalogLabel(target);
  if (!normalizedTarget) {
    return null;
  }

  const exact = entries.find(
    (entry) => normalizeCatalogLabel(entry.name) === normalizedTarget,
  );
  if (exact) {
    return exact;
  }

  const contains = entries.find((entry) => {
    const normalizedName = normalizeCatalogLabel(entry.name);
    return (
      normalizedName.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedName)
    );
  });
  if (contains) {
    return contains;
  }

  return entries[0] ?? null;
}

async function postOlxCatalog(
  url: string,
  accessToken: string,
): Promise<OlxCatalogEntry[]> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "AutoPainel/1.0",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OLX catálogo indisponível (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = await response.json();
  return extractCatalogEntries(payload);
}

export interface OlxVehicleCatalogIds {
  vehicleBrandId: string;
  vehicleModelId: string;
  vehicleVersionId: string;
}

export async function resolveOlxVehicleCatalogIds(params: {
  accessToken: string;
  brand: string;
  model: string;
  version: string | null;
  isMotorcycle: boolean;
}): Promise<OlxVehicleCatalogIds> {
  const baseUrl = params.isMotorcycle
    ? "https://apps.olx.com.br/autoupload/moto_info"
    : "https://apps.olx.com.br/autoupload/car_info";

  const brands = await postOlxCatalog(baseUrl, params.accessToken);
  const brandMatch = pickBestCatalogMatch(brands, params.brand);
  if (!brandMatch) {
    throw new Error(
      `Marca "${params.brand}" não encontrada no catálogo OLX. Ajuste a marca do veículo ou publique manualmente.`,
    );
  }

  const models = await postOlxCatalog(`${baseUrl}/${encodeURIComponent(brandMatch.id)}`, params.accessToken);
  const modelMatch = pickBestCatalogMatch(models, params.model);
  if (!modelMatch) {
    throw new Error(
      `Modelo "${params.model}" não encontrado no catálogo OLX para a marca selecionada.`,
    );
  }

  const versions = await postOlxCatalog(
    `${baseUrl}/${encodeURIComponent(brandMatch.id)}/${encodeURIComponent(modelMatch.id)}`,
    params.accessToken,
  );

  const versionTarget = params.version?.trim() || params.model;
  const versionMatch = pickBestCatalogMatch(versions, versionTarget);
  if (!versionMatch) {
    throw new Error(
      `Versão "${versionTarget}" não encontrada no catálogo OLX. Preencha a versão FIPE no cadastro.`,
    );
  }

  return {
    vehicleBrandId: brandMatch.id,
    vehicleModelId: modelMatch.id,
    vehicleVersionId: versionMatch.id,
  };
}
