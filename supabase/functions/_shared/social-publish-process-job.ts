import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import { decryptSecretValue } from "./classifieds-crypto.ts";

export interface SocialPublicationJobRow {
  id: string;
  dealership_id: string;
  vehicle_id: string;
  channels: string[];
  artifact_template: string;
  payload_snapshot: Record<string, unknown>;
  status: string;
  attempt_count: number;
}

const MAX_ATTEMPTS = 5;

function requireEnvVar(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function isDryRunEnabled(): boolean {
  const raw = Deno.env.get("SOCIAL_PUBLISH_DRY_RUN");
  if (raw === undefined || raw.trim() === "") {
    return true;
  }
  const flag = raw.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

function computeNextRetry(attemptCount: number): string {
  const delaySeconds = Math.min(3600, Math.pow(2, Math.max(attemptCount, 1)) * 60);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function claimSocialPublicationJobs(
  admin: SupabaseClient,
  limit: number,
): Promise<SocialPublicationJobRow[]> {
  const { data: candidates, error } = await admin
    .from("social_publication_jobs")
    .select("id")
    .eq("status", "queued")
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !candidates?.length) {
    return [];
  }

  const claimed: SocialPublicationJobRow[] = [];

  for (const row of candidates) {
    const { data: job, error: updateError } = await admin
      .from("social_publication_jobs")
      .update({
        status: "rendering",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "queued")
      .select(
        "id, dealership_id, vehicle_id, channels, artifact_template, payload_snapshot, status, attempt_count",
      )
      .maybeSingle();

    if (updateError || !job) {
      continue;
    }

    claimed.push(job as SocialPublicationJobRow);
  }

  return claimed;
}

function buildCaption(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  const brand = typeof vehicle?.brand === "string" ? vehicle.brand : "";
  const model = typeof vehicle?.model === "string" ? vehicle.model : "";
  const price = vehicle?.price;
  const storeName = typeof dealership?.name === "string" ? dealership.name : "Nossa loja";
  const priceText =
    typeof price === "number" ? `R$ ${price.toLocaleString("pt-BR")}` : "";

  return [storeName, `${brand} ${model}`.trim(), priceText].filter(Boolean).join(" — ");
}

function firstImageUrl(payload: Record<string, unknown>): string | null {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const images = vehicle?.images;
  if (!Array.isArray(images)) {
    return null;
  }
  const first = images.find((entry) => typeof entry === "string" && entry.length > 0);
  return typeof first === "string" ? first : null;
}

async function publishToFacebookPage(params: {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string }> {
  if (isDryRunEnabled()) {
    return { mode: "dry_run", postId: `dry_run_fb_${crypto.randomUUID()}` };
  }

  const url =
    `https://graph.facebook.com/v${params.graphVersion}/${params.pageId}/photos?` +
    new URLSearchParams({
      url: params.imageUrl,
      caption: params.caption,
      access_token: params.pageAccessToken,
    }).toString();

  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta publish failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as { id?: string; post_id?: string };
  return {
    mode: "live",
    postId: payload.id ?? payload.post_id,
  };
}

async function markJobPublished(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
  result: Record<string, unknown>,
) {
  await admin
    .from("social_publication_jobs")
    .update({
      status: "published",
      result_payload: result,
      error_detail: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

async function markJobFailed(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
  errorMessage: string,
  channel?: string,
) {
  const nextAttempt = job.attempt_count + 1;
  const isTerminal = nextAttempt >= MAX_ATTEMPTS;

  await admin
    .from("social_publication_jobs")
    .update({
      status: isTerminal ? "failed" : "queued",
      attempt_count: nextAttempt,
      error_channel: channel ?? null,
      error_detail: errorMessage.slice(0, 2000),
      next_retry_at: isTerminal ? null : computeNextRetry(nextAttempt),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

export async function processSocialPublicationJob(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
): Promise<void> {
  const cryptoSecret = requireEnvVar("META_TOKENS_CRYPTO_SECRET");
  const graphVersion = Deno.env.get("META_GRAPH_API_VERSION")?.trim() || "21.0";

  const { data: connection, error: connectionError } = await admin
    .from("dealership_meta_connections")
    .select("id, status, page_id")
    .eq("dealership_id", job.dealership_id)
    .maybeSingle();

  if (connectionError || !connection?.page_id) {
    throw new Error("Conexão Meta não encontrada. Reconecte em Integrações.");
  }
  if (connection.status !== "connected") {
    throw new Error("Conta Meta desconectada. Reconecte em Integrações.");
  }

  const { data: credential, error: credentialError } = await admin
    .from("dealership_meta_credentials")
    .select("page_access_token_encrypted")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (credentialError || !credential?.page_access_token_encrypted) {
    throw new Error("Token Meta ausente. Reconecte a conta.");
  }

  const pageAccessToken = await decryptSecretValue(
    credential.page_access_token_encrypted,
    cryptoSecret,
  );

  const imageUrl = firstImageUrl(job.payload_snapshot);
  if (!imageUrl) {
    throw new Error("Snapshot do veículo sem imagens para publicação.");
  }

  const caption = buildCaption(job.payload_snapshot);
  const results: Record<string, unknown> = {};

  if (job.channels.includes("facebook_page")) {
    const fbResult = await publishToFacebookPage({
      pageId: connection.page_id,
      pageAccessToken,
      imageUrl,
      caption,
      graphVersion,
    });
    results.facebook_page = fbResult;
  }

  if (job.channels.includes("instagram_feed")) {
    results.instagram_feed = {
      mode: isDryRunEnabled() ? "dry_run" : "skipped",
      reason: "instagram_carousel_worker_pending",
    };
  }

  await markJobPublished(admin, job, results);
}

export async function processSocialPublicationJobSafe(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
): Promise<{ jobId: string; ok: boolean; error?: string }> {
  try {
    await processSocialPublicationJob(admin, job);
    return { jobId: job.id, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no worker Meta.";
    await markJobFailed(admin, job, message);
    return { jobId: job.id, ok: false, error: message };
  }
}

export function createSocialWorkerAdminClient(): SupabaseClient {
  const supabaseUrl = requireEnvVar("SUPABASE_URL");
  const serviceRoleKey = requireEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function authorizeSocialWorkerRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const workerSecret = Deno.env.get("SOCIAL_PUBLISH_WORKER_SECRET")?.trim();
  const authHeader = req.headers.get("Authorization")?.trim() ?? "";

  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
    return true;
  }

  const headerSecret = req.headers.get("x-social-worker-key")?.trim();
  if (workerSecret && headerSecret === workerSecret) {
    return true;
  }

  return false;
}
