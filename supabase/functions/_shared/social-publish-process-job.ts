import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.104.0";

import { decryptSecretValue } from "./classifieds-crypto.ts";
import {
  buildMockPublishResultPayload,
  isIntegrationsMockModeEnabled,
} from "./integrations-mock-mode.ts";

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

async function resolveCarouselImageUrls(
  job: SocialPublicationJobRow,
): Promise<string[]> {
  const renderUrl = Deno.env.get("SOCIAL_CAROUSEL_RENDER_URL")?.trim();
  if (renderUrl) {
    const renderSecret = Deno.env.get("SOCIAL_CAROUSEL_RENDER_SECRET")?.trim();
    try {
      const response = await fetch(renderUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(renderSecret ? { "x-social-carousel-render-secret": renderSecret } : {}),
        },
        body: JSON.stringify({
          jobId: job.id,
          dealershipId: job.dealership_id,
          vehicleId: job.vehicle_id,
          artifactTemplate: job.artifact_template,
          payloadSnapshot: job.payload_snapshot,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as { imageUrls?: unknown };
        if (Array.isArray(payload.imageUrls)) {
          const urls = payload.imageUrls.filter(
            (entry): entry is string => typeof entry === "string" && entry.length > 0,
          );
          if (urls.length > 0) {
            return urls;
          }
        }
      }
    } catch {
      // Fall back to raw vehicle image when render service is unavailable.
    }
  }

  const fallback = firstImageUrl(job.payload_snapshot);
  return fallback ? [fallback] : [];
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

async function createInstagramMediaContainer(params: {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string;
  graphVersion: string;
  isCarouselItem: boolean;
  caption?: string;
}): Promise<string> {
  const body = new URLSearchParams({
    image_url: params.imageUrl,
    access_token: params.pageAccessToken,
  });
  if (params.isCarouselItem) {
    body.set("is_carousel_item", "true");
  } else if (params.caption?.trim()) {
    body.set("caption", params.caption.trim());
  }

  const response = await fetch(
    `https://graph.facebook.com/v${params.graphVersion}/${params.igUserId}/media`,
    { method: "POST", body },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Instagram media container failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as { id?: string };
  if (!payload.id) {
    throw new Error("Instagram media container returned no id.");
  }
  return payload.id;
}

async function publishToInstagramSingleImage(params: {
  igUserId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string }> {
  if (isDryRunEnabled()) {
    return { mode: "dry_run", postId: `dry_run_ig_${crypto.randomUUID()}` };
  }

  const containerId = await createInstagramMediaContainer({
    igUserId: params.igUserId,
    pageAccessToken: params.pageAccessToken,
    imageUrl: params.imageUrl,
    graphVersion: params.graphVersion,
    isCarouselItem: false,
    caption: params.caption,
  });

  const publishResponse = await fetch(
    `https://graph.facebook.com/v${params.graphVersion}/${params.igUserId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: params.pageAccessToken,
      }),
    },
  );

  if (!publishResponse.ok) {
    const text = await publishResponse.text();
    throw new Error(`Instagram publish failed (${publishResponse.status}): ${text.slice(0, 500)}`);
  }

  const publishPayload = (await publishResponse.json()) as { id?: string };
  return {
    mode: "live",
    postId: publishPayload.id,
  };
}

async function publishToInstagramCarousel(params: {
  igUserId: string;
  pageAccessToken: string;
  imageUrls: string[];
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string; slideCount: number }> {
  if (isDryRunEnabled()) {
    return {
      mode: "dry_run",
      postId: `dry_run_ig_${crypto.randomUUID()}`,
      slideCount: params.imageUrls.length,
    };
  }

  if (params.imageUrls.length < 2) {
    throw new Error("Instagram carrossel exige ao menos 2 imagens renderizadas.");
  }

  const childIds: string[] = [];
  for (const imageUrl of params.imageUrls) {
    const childId = await createInstagramMediaContainer({
      igUserId: params.igUserId,
      pageAccessToken: params.pageAccessToken,
      imageUrl,
      graphVersion: params.graphVersion,
      isCarouselItem: true,
    });
    childIds.push(childId);
  }

  const carouselResponse = await fetch(
    `https://graph.facebook.com/v${params.graphVersion}/${params.igUserId}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption: params.caption,
        access_token: params.pageAccessToken,
      }),
    },
  );

  if (!carouselResponse.ok) {
    const text = await carouselResponse.text();
    throw new Error(`Instagram carousel failed (${carouselResponse.status}): ${text.slice(0, 500)}`);
  }

  const carouselPayload = (await carouselResponse.json()) as { id?: string };
  if (!carouselPayload.id) {
    throw new Error("Instagram carousel container returned no id.");
  }

  const publishResponse = await fetch(
    `https://graph.facebook.com/v${params.graphVersion}/${params.igUserId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: carouselPayload.id,
        access_token: params.pageAccessToken,
      }),
    },
  );

  if (!publishResponse.ok) {
    const text = await publishResponse.text();
    throw new Error(`Instagram publish failed (${publishResponse.status}): ${text.slice(0, 500)}`);
  }

  const publishPayload = (await publishResponse.json()) as { id?: string };
  return {
    mode: "live",
    postId: publishPayload.id,
    slideCount: params.imageUrls.length,
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
      published_at: new Date().toISOString(),
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
  if (isIntegrationsMockModeEnabled()) {
    await admin
      .from("social_publication_jobs")
      .update({ status: "uploading_meta", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    await markJobPublished(admin, job, {
      ...buildMockPublishResultPayload(job.channels),
      rendered_slide_count: Math.max(1, (await resolveCarouselImageUrls(job)).length || 3),
    });
    return;
  }

  const cryptoSecret = requireEnvVar("META_TOKENS_CRYPTO_SECRET");
  const graphVersion = Deno.env.get("META_GRAPH_API_VERSION")?.trim() || "21.0";

  const { data: connection, error: connectionError } = await admin
    .from("dealership_meta_connections")
    .select("id, status, page_id, instagram_business_account_id")
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

  const carouselImageUrls = await resolveCarouselImageUrls(job);
  if (carouselImageUrls.length === 0) {
    throw new Error("Snapshot do veículo sem imagens para publicação.");
  }

  const caption = buildCaption(job.payload_snapshot);
  const results: Record<string, unknown> = {
    rendered_slide_count: carouselImageUrls.length,
  };

  if (job.channels.includes("facebook_page")) {
    const fbResult = await publishToFacebookPage({
      pageId: connection.page_id,
      pageAccessToken,
      imageUrl: carouselImageUrls[0],
      caption,
      graphVersion,
    });
    results.facebook_page = fbResult;
  }

  if (job.channels.includes("instagram_feed")) {
    if (!connection.instagram_business_account_id) {
      results.instagram_feed = {
        mode: "skipped",
        reason: "instagram_business_account_missing",
      };
    } else if (carouselImageUrls.length < 2) {
      const igResult = await publishToInstagramSingleImage({
        igUserId: connection.instagram_business_account_id,
        pageAccessToken,
        imageUrl: carouselImageUrls[0],
        caption,
        graphVersion,
      });
      results.instagram_feed = {
        ...igResult,
        slideCount: carouselImageUrls.length,
        format: "single_image",
      };
    } else {
      const igResult = await publishToInstagramCarousel({
        igUserId: connection.instagram_business_account_id,
        pageAccessToken,
        imageUrls: carouselImageUrls,
        caption,
        graphVersion,
      });
      results.instagram_feed = igResult;
    }
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
