import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import { decryptSecretValue } from "./classifieds-crypto.ts";
import { getClassifiedsProviderAdapter } from "./classifieds-providers/index.ts";
import type { ClassifiedsProviderKey } from "./classifieds-providers/types.ts";
import type { VehicleListingPayload } from "./classifieds-providers/types.ts";

export interface ClassifiedsSyncJobRow {
  id: string;
  dealership_id: string;
  vehicle_id: string;
  provider: ClassifiedsProviderKey;
  action: "publish" | "delist";
  status: string;
  attempt_count: number;
  payload: Record<string, unknown>;
}

const MAX_ATTEMPTS = 5;

function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function computeNextRetry(attemptCount: number): string {
  const delaySeconds = Math.min(3600, Math.pow(2, Math.max(attemptCount, 1)) * 60);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function claimClassifiedsSyncJobs(
  admin: SupabaseClient,
  limit: number,
): Promise<ClassifiedsSyncJobRow[]> {
  const { data: candidates, error } = await admin
    .from("classifieds_sync_jobs")
    .select("id")
    .eq("status", "queued")
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !candidates?.length) {
    return [];
  }

  const claimed: ClassifiedsSyncJobRow[] = [];

  for (const row of candidates) {
    const { data: job, error: updateError } = await admin
      .from("classifieds_sync_jobs")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "queued")
      .select(
        "id, dealership_id, vehicle_id, provider, action, status, attempt_count, payload",
      )
      .maybeSingle();

    if (updateError || !job) {
      continue;
    }

    if (job.provider !== "olx" && job.provider !== "webmotors") {
      continue;
    }

    claimed.push(job as ClassifiedsSyncJobRow);
  }

  return claimed;
}

async function loadAccessToken(
  admin: SupabaseClient,
  dealershipId: string,
  provider: ClassifiedsProviderKey,
): Promise<string> {
  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");

  const { data: connection, error: connectionError } = await admin
    .from("dealership_classifieds_connections")
    .select("id, status")
    .eq("dealership_id", dealershipId)
    .eq("provider", provider)
    .maybeSingle();

  if (connectionError || !connection) {
    throw new Error("Conexão com o portal não encontrada.");
  }
  if (connection.status !== "connected") {
    throw new Error("Reconecte o portal em Integrações antes de sincronizar.");
  }

  const { data: credential, error: credentialError } = await admin
    .from("dealership_classifieds_credentials")
    .select("access_token_encrypted")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (credentialError || !credential?.access_token_encrypted) {
    throw new Error("Credenciais OAuth ausentes para este portal.");
  }

  return decryptSecretValue(credential.access_token_encrypted, cryptoSecret);
}

async function loadVehiclePayload(
  admin: SupabaseClient,
  vehicleId: string,
  dealershipId: string,
): Promise<VehicleListingPayload> {
  const { data: vehicle, error } = await admin
    .from("vehicles")
    .select(
      "id, dealership_id, brand, model, version, public_slug, manufacturing_year, model_year, mileage, price, sale_price, description, images, fuel_type, transmission, color, status, is_active",
    )
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !vehicle) {
    throw new Error("Veículo não encontrado para sincronização.");
  }

  const images = Array.isArray(vehicle.images)
    ? vehicle.images.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];

  if (vehicle.status !== "available" || vehicle.is_active === false) {
    throw new Error("Veículo indisponível para publicação nos classificados.");
  }
  if (images.length === 0) {
    throw new Error("Cadastre ao menos uma foto antes de publicar nos classificados.");
  }

  const price = Number(vehicle.sale_price ?? vehicle.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Preço inválido para publicação nos classificados.");
  }

  return {
    vehicleId: vehicle.id,
    dealershipId: vehicle.dealership_id,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? null,
    publicSlug: vehicle.public_slug,
    manufacturingYear: vehicle.manufacturing_year,
    modelYear: vehicle.model_year,
    mileage: vehicle.mileage,
    price,
    description: vehicle.description ?? null,
    images,
    fuelType: vehicle.fuel_type ?? null,
    transmission: vehicle.transmission ?? null,
    color: vehicle.color ?? null,
  };
}

async function markJobSucceeded(
  admin: SupabaseClient,
  job: ClassifiedsSyncJobRow,
  resultPayload: Record<string, unknown>,
) {
  await admin
    .from("classifieds_sync_jobs")
    .update({
      status: "succeeded",
      result_payload: resultPayload,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  await admin
    .from("dealership_classifieds_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("dealership_id", job.dealership_id)
    .eq("provider", job.provider);
}

async function markJobFailed(
  admin: SupabaseClient,
  job: ClassifiedsSyncJobRow,
  errorMessage: string,
) {
  const nextAttempt = job.attempt_count + 1;
  const isTerminal = nextAttempt >= MAX_ATTEMPTS;

  await admin
    .from("classifieds_sync_jobs")
    .update({
      status: isTerminal ? "failed" : "queued",
      attempt_count: nextAttempt,
      last_error: errorMessage.slice(0, 2000),
      next_retry_at: isTerminal ? null : computeNextRetry(nextAttempt),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (isTerminal) {
    await admin
      .from("dealership_classifieds_connections")
      .update({ last_error: errorMessage.slice(0, 500) })
      .eq("dealership_id", job.dealership_id)
      .eq("provider", job.provider);
  }
}

async function upsertListingPublished(
  admin: SupabaseClient,
  job: ClassifiedsSyncJobRow,
  externalListingId: string,
  mode: "live" | "dry_run",
) {
  await admin.from("vehicle_classifieds_listings").upsert(
    {
      dealership_id: job.dealership_id,
      vehicle_id: job.vehicle_id,
      provider: job.provider,
      external_listing_id: externalListingId,
      sync_status: "published",
      last_error: null,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "vehicle_id,provider" },
  );

  await markJobSucceeded(admin, job, {
    external_listing_id: externalListingId,
    mode,
  });
}

async function upsertListingDelisted(admin: SupabaseClient, job: ClassifiedsSyncJobRow, mode: string) {
  await admin.from("vehicle_classifieds_listings").upsert(
    {
      dealership_id: job.dealership_id,
      vehicle_id: job.vehicle_id,
      provider: job.provider,
      sync_status: "delisted",
      last_error: null,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "vehicle_id,provider" },
  );

  await markJobSucceeded(admin, job, { mode, action: "delist" });
}

export async function processClassifiedsSyncJob(
  admin: SupabaseClient,
  job: ClassifiedsSyncJobRow,
): Promise<void> {
  const adapter = getClassifiedsProviderAdapter(job.provider);
  const accessToken = await loadAccessToken(admin, job.dealership_id, job.provider);

  if (job.action === "publish") {
    const vehicle = await loadVehiclePayload(admin, job.vehicle_id, job.dealership_id);

    const { data: listing } = await admin
      .from("vehicle_classifieds_listings")
      .select("external_listing_id")
      .eq("vehicle_id", job.vehicle_id)
      .eq("provider", job.provider)
      .maybeSingle();

    const result = await adapter.publish(
      accessToken,
      vehicle,
      listing?.external_listing_id ?? null,
    );

    await upsertListingPublished(admin, job, result.externalListingId, result.mode);
    return;
  }

  const { data: listing, error: listingError } = await admin
    .from("vehicle_classifieds_listings")
    .select("external_listing_id, sync_status")
    .eq("vehicle_id", job.vehicle_id)
    .eq("provider", job.provider)
    .maybeSingle();

  if (listingError) {
    throw new Error(listingError.message);
  }

  if (!listing?.external_listing_id || listing.sync_status !== "published") {
    await markJobSucceeded(admin, job, { skipped: true, reason: "not_published" });
    return;
  }

  const delistResult = await adapter.delist(accessToken, listing.external_listing_id);
  await upsertListingDelisted(admin, job, delistResult.mode);
}

export async function processClassifiedsSyncJobSafe(
  admin: SupabaseClient,
  job: ClassifiedsSyncJobRow,
): Promise<{ jobId: string; ok: boolean; error?: string }> {
  try {
    await processClassifiedsSyncJob(admin, job);
    return { jobId: job.id, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no worker.";
    await markJobFailed(admin, job, message);
    return { jobId: job.id, ok: false, error: message };
  }
}

export function createClassifiedsWorkerAdminClient(): SupabaseClient {
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const serviceRoleKey = requireEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function authorizeWorkerRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const workerSecret = Deno.env.get("CLASSIFIEDS_SYNC_WORKER_SECRET")?.trim();
  const authHeader = req.headers.get("Authorization")?.trim() ?? "";

  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
    return true;
  }

  const headerSecret = req.headers.get("x-classifieds-worker-key")?.trim();
  if (workerSecret && headerSecret === workerSecret) {
    return true;
  }

  return false;
}
