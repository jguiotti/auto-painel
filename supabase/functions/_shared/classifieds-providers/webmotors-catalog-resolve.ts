import {
  resolveWebMotorsCatalogBaseUrl,
  webMotorsApiRequest,
} from "./webmotors-api-client.ts";

interface CatalogEntry {
  id: number;
  name: string;
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readName(record: Record<string, unknown>): string | null {
  const name =
    (typeof record.nome === "string" && record.nome) ||
    (typeof record.name === "string" && record.name) ||
    (typeof record.label === "string" && record.label) ||
    null;
  return name?.trim() || null;
}

function collectCatalogEntries(node: unknown, bucket: CatalogEntry[]): void {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectCatalogEntries(item, bucket);
    }
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;
  const id = readId(record.id);
  const name = readName(record);
  if (id !== null && name) {
    bucket.push({ id, name });
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) || (value && typeof value === "object")) {
      collectCatalogEntries(value, bucket);
    }
  }
}

function pickBestMatch(entries: CatalogEntry[], target: string): CatalogEntry | null {
  const normalizedTarget = normalizeLabel(target);
  if (!normalizedTarget) {
    return null;
  }

  const exact = entries.find((entry) => normalizeLabel(entry.name) === normalizedTarget);
  if (exact) {
    return exact;
  }

  const contains = entries.find((entry) => {
    const normalizedName = normalizeLabel(entry.name);
    return (
      normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName)
    );
  });
  return contains ?? null;
}

function findNestedModels(marcasNode: unknown, brandId: number): CatalogEntry[] {
  if (!Array.isArray(marcasNode)) {
    return [];
  }

  for (const marca of marcasNode) {
    if (!marca || typeof marca !== "object") {
      continue;
    }
    const record = marca as Record<string, unknown>;
    if (readId(record.id) !== brandId) {
      continue;
    }
    const models: CatalogEntry[] = [];
    collectCatalogEntries(record.modelos ?? record.models, models);
    if (models.length > 0) {
      return models;
    }
  }

  const flat: CatalogEntry[] = [];
  collectCatalogEntries(marcasNode, flat);
  return flat;
}

function findNestedVersions(
  marcasNode: unknown,
  brandId: number,
  modelId: number,
): CatalogEntry[] {
  if (!Array.isArray(marcasNode)) {
    return [];
  }

  for (const marca of marcasNode) {
    if (!marca || typeof marca !== "object") {
      continue;
    }
    const marcaRecord = marca as Record<string, unknown>;
    if (readId(marcaRecord.id) !== brandId) {
      continue;
    }
    const modelos = marcaRecord.modelos ?? marcaRecord.models;
    if (!Array.isArray(modelos)) {
      continue;
    }
    for (const modelo of modelos) {
      if (!modelo || typeof modelo !== "object") {
        continue;
      }
      const modeloRecord = modelo as Record<string, unknown>;
      if (readId(modeloRecord.id) !== modelId) {
        continue;
      }
      const versions: CatalogEntry[] = [];
      collectCatalogEntries(modeloRecord.versoes ?? modeloRecord.versions, versions);
      if (versions.length > 0) {
        return versions;
      }
    }
  }

  const flat: CatalogEntry[] = [];
  collectCatalogEntries(marcasNode, flat);
  return flat;
}

export interface WebMotorsVehicleCatalogIds {
  brandId: number;
  modelId: number;
  versionId: number;
}

export async function resolveWebMotorsVehicleCatalogIds(params: {
  accessToken: string;
  brand: string;
  model: string;
  version: string | null;
  modelYear: number;
}): Promise<WebMotorsVehicleCatalogIds> {
  const catalogBase = resolveWebMotorsCatalogBaseUrl();
  const catalogPath =
    Deno.env.get("WEBMOTORS_CATALOG_USED_PATH")?.trim() || "/salesforce/used";

  const { body } = await webMotorsApiRequest({
    accessToken: params.accessToken,
    method: "GET",
    url: `${catalogBase}${catalogPath.startsWith("/") ? catalogPath : `/${catalogPath}`}`,
  });

  const marcasNode =
    body.marcas ??
    body.brands ??
    body.data ??
    body;

  const brandEntries: CatalogEntry[] = [];
  collectCatalogEntries(marcasNode, brandEntries);
  const brandMatch = pickBestMatch(brandEntries, params.brand);
  if (!brandMatch) {
    throw new Error(
      `Marca "${params.brand}" não encontrada no catálogo WebMotors. Ajuste o cadastro ou aguarde homologação.`,
    );
  }

  const modelEntries = findNestedModels(marcasNode, brandMatch.id);
  const modelMatch = pickBestMatch(modelEntries, params.model);
  if (!modelMatch) {
    throw new Error(
      `Modelo "${params.model}" não encontrado no catálogo WebMotors para a marca selecionada.`,
    );
  }

  const versionEntries = findNestedVersions(marcasNode, brandMatch.id, modelMatch.id);
  const versionTarget = params.version?.trim() || params.model;
  let versionMatch = pickBestMatch(versionEntries, versionTarget);

  if (!versionMatch && versionEntries.length > 0) {
    versionMatch =
      versionEntries.find((entry) =>
        normalizeLabel(entry.name).includes(String(params.modelYear)),
      ) ?? versionEntries[0];
  }

  if (!versionMatch) {
    throw new Error(
      `Versão "${versionTarget}" não encontrada no catálogo WebMotors. Preencha a versão FIPE no cadastro.`,
    );
  }

  return {
    brandId: brandMatch.id,
    modelId: modelMatch.id,
    versionId: versionMatch.id,
  };
}
