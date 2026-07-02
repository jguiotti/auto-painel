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
  step_payload: Record<string, unknown> | null;
  status: string;
  attempt_count: number;
  result_payload: Record<string, unknown> | null;
}

const MAX_ATTEMPTS = 5;
const ACTIVE_JOB_STATUSES = ["queued", "failed_partial"] as const;

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

function readChannelPostId(
  results: Record<string, unknown> | null | undefined,
  channel: string,
): string | undefined {
  const entry = results?.[channel];
  if (!entry || typeof entry !== "object") {
    return undefined;
  }
  const postId = (entry as { postId?: unknown }).postId;
  return typeof postId === "string" && postId.length > 0 ? postId : undefined;
}

function readWatermarkEnabled(payload: Record<string, unknown>): boolean {
  return payload.branding_mask !== false;
}

export async function claimSocialPublicationJobs(
  admin: SupabaseClient,
  limit: number,
): Promise<SocialPublicationJobRow[]> {
  const { data: candidates, error } = await admin
    .from("social_publication_jobs")
    .select("id, status")
    .in("status", [...ACTIVE_JOB_STATUSES])
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
      .eq("status", row.status)
      .select(
        "id, dealership_id, vehicle_id, channels, artifact_template, payload_snapshot, step_payload, status, attempt_count, result_payload",
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

function readRenderedImageUrls(job: SocialPublicationJobRow): string[] | null {
  const stepPayload = job.step_payload;
  if (!stepPayload || typeof stepPayload !== "object") {
    return null;
  }
  const raw = stepPayload.rendered_image_urls;
  if (!Array.isArray(raw)) {
    return null;
  }
  const urls = raw.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
  return urls.length > 0 ? urls : null;
}

function isLocalhostRenderUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  } catch {
    return false;
  }
}

async function resolveCarouselImageUrls(
  job: SocialPublicationJobRow,
): Promise<string[]> {
  const preRendered = readRenderedImageUrls(job);
  if (preRendered) {
    return preRendered;
  }

  const renderUrl = Deno.env.get("SOCIAL_CAROUSEL_RENDER_URL")?.trim();
  if (!renderUrl) {
    throw new Error(
      "Slides do carrossel não foram pré-renderizados e SOCIAL_CAROUSEL_RENDER_URL não está configurada na Edge.",
    );
  }

  if (isLocalhostRenderUrl(renderUrl)) {
    throw new Error(
      "SOCIAL_CAROUSEL_RENDER_URL aponta para localhost na Edge. Execute npm run integration:secrets:configure com DEALERSHIP_PANEL_PUBLIC_URL de produção.",
    );
  }

  const renderSecret = Deno.env.get("SOCIAL_CAROUSEL_RENDER_SECRET")?.trim();
  if (!renderSecret) {
    throw new Error(
      "SOCIAL_CAROUSEL_RENDER_SECRET ausente na Edge. Execute npm run integration:secrets:configure.",
    );
  }

  const response = await fetch(renderUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-social-carousel-render-secret": renderSecret,
    },
    body: JSON.stringify({
      jobId: job.id,
      dealershipId: job.dealership_id,
      vehicleId: job.vehicle_id,
      artifactTemplate: job.artifact_template,
      payloadSnapshot: job.payload_snapshot,
      watermarkEnabled: readWatermarkEnabled(job.payload_snapshot),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Render do carrossel falhou (${response.status}): ${text.slice(0, 400)}`,
    );
  }

  const payload = (await response.json()) as { imageUrls?: unknown; error?: unknown };
  if (!Array.isArray(payload.imageUrls)) {
    throw new Error("Render do carrossel não retornou imageUrls.");
  }

  const urls = payload.imageUrls.filter(
    (entry): entry is string => typeof entry === "string" && entry.length > 0,
  );
  if (urls.length === 0) {
    throw new Error("Render do carrossel retornou lista vazia de imagens.");
  }

  return urls;
}

async function uploadFacebookUnpublishedPhoto(params: {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  graphVersion: string;
}): Promise<string> {
  const url =
    `https://graph.facebook.com/v${params.graphVersion}/${params.pageId}/photos?` +
    new URLSearchParams({
      url: params.imageUrl,
      published: "false",
      access_token: params.pageAccessToken,
    }).toString();

  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta photo upload failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as { id?: string };
  if (!payload.id) {
    throw new Error("Meta photo upload returned no id.");
  }
  return payload.id;
}

async function publishToFacebookPage(params: {
  pageId: string;
  pageAccessToken: string;
  imageUrl: string;
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string; format: string; slideCount: number }> {
  if (isDryRunEnabled()) {
    return {
      mode: "dry_run",
      postId: `dry_run_fb_${crypto.randomUUID()}`,
      format: "single_image",
      slideCount: 1,
    };
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
    format: "single_image",
    slideCount: 1,
  };
}

async function publishToFacebookCarousel(params: {
  pageId: string;
  pageAccessToken: string;
  imageUrls: string[];
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string; format: string; slideCount: number }> {
  if (params.imageUrls.length === 1) {
    const single = await publishToFacebookPage({
      pageId: params.pageId,
      pageAccessToken: params.pageAccessToken,
      imageUrl: params.imageUrls[0],
      caption: params.caption,
      graphVersion: params.graphVersion,
    });
    return single;
  }

  if (isDryRunEnabled()) {
    return {
      mode: "dry_run",
      postId: `dry_run_fb_${crypto.randomUUID()}`,
      format: "carousel",
      slideCount: params.imageUrls.length,
    };
  }

  const mediaFbids: string[] = [];
  for (const imageUrl of params.imageUrls) {
    const mediaFbid = await uploadFacebookUnpublishedPhoto({
      pageId: params.pageId,
      pageAccessToken: params.pageAccessToken,
      imageUrl,
      graphVersion: params.graphVersion,
    });
    mediaFbids.push(mediaFbid);
  }

  const body = new URLSearchParams({
    message: params.caption,
    access_token: params.pageAccessToken,
  });
  mediaFbids.forEach((mediaFbid, index) => {
    body.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: mediaFbid }));
  });

  const response = await fetch(
    `https://graph.facebook.com/v${params.graphVersion}/${params.pageId}/feed`,
    { method: "POST", body },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta carousel publish failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as { id?: string };
  return {
    mode: "live",
    postId: payload.id,
    format: "carousel",
    slideCount: params.imageUrls.length,
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
}): Promise<{ mode: "live" | "dry_run"; postId?: string; format: string; slideCount: number }> {
  if (isDryRunEnabled()) {
    return {
      mode: "dry_run",
      postId: `dry_run_ig_${crypto.randomUUID()}`,
      format: "single_image",
      slideCount: 1,
    };
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
    format: "single_image",
    slideCount: 1,
  };
}

async function publishToInstagramCarousel(params: {
  igUserId: string;
  pageAccessToken: string;
  imageUrls: string[];
  caption: string;
  graphVersion: string;
}): Promise<{ mode: "live" | "dry_run"; postId?: string; slideCount: number; format: string }> {
  if (isDryRunEnabled()) {
    return {
      mode: "dry_run",
      postId: `dry_run_ig_${crypto.randomUUID()}`,
      slideCount: params.imageUrls.length,
      format: "carousel",
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
    format: "carousel",
  };
}

async function persistJobProgress(
  admin: SupabaseClient,
  jobId: string,
  result: Record<string, unknown>,
  status: "uploading_meta" | "failed_partial" | "published",
) {
  await admin
    .from("social_publication_jobs")
    .update({
      status,
      result_payload: result,
      updated_at: new Date().toISOString(),
      ...(status === "published"
        ? {
            published_at: new Date().toISOString(),
            error_detail: null,
            error_channel: null,
            next_retry_at: null,
          }
        : {}),
    })
    .eq("id", jobId);
}

async function markJobPublished(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
  result: Record<string, unknown>,
) {
  await persistJobProgress(admin, job.id, result, "published");
}

async function markJobFailed(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
  errorMessage: string,
  channel?: string,
  partialResults?: Record<string, unknown>,
) {
  const nextAttempt = job.attempt_count + 1;
  const isTerminal = nextAttempt >= MAX_ATTEMPTS;
  const hasPartialSuccess =
    partialResults != null &&
    (readChannelPostId(partialResults, "facebook_page") != null ||
      readChannelPostId(partialResults, "instagram_feed") != null ||
      partialResults.facebook_page != null ||
      partialResults.instagram_feed != null);

  await admin
    .from("social_publication_jobs")
    .update({
      status: isTerminal ? "failed" : hasPartialSuccess ? "failed_partial" : "queued",
      attempt_count: nextAttempt,
      error_channel: channel ?? null,
      error_detail: errorMessage.slice(0, 2000),
      result_payload: partialResults ?? job.result_payload,
      next_retry_at: isTerminal ? null : computeNextRetry(nextAttempt),
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);
}

function mergeExistingResults(
  job: SocialPublicationJobRow,
): Record<string, unknown> {
  if (job.result_payload && typeof job.result_payload === "object") {
    return { ...job.result_payload };
  }
  return {};
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
      rendered_slide_count: 3,
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
  const results = mergeExistingResults(job);
  results.rendered_slide_count = carouselImageUrls.length;

  if (job.channels.includes("facebook_page")) {
    const existingPostId = readChannelPostId(results, "facebook_page");
    if (existingPostId) {
      results.facebook_page = {
        ...(results.facebook_page as Record<string, unknown> | undefined),
        postId: existingPostId,
        skipped: true,
        reason: "already_published",
      };
    } else {
      await persistJobProgress(admin, job.id, results, "uploading_meta");
      const fbResult = await publishToFacebookCarousel({
        pageId: connection.page_id,
        pageAccessToken,
        imageUrls: carouselImageUrls,
        caption,
        graphVersion,
      });
      results.facebook_page = fbResult;
      await persistJobProgress(admin, job.id, results, "uploading_meta");
    }
  }

  if (job.channels.includes("instagram_feed")) {
    const existingPostId = readChannelPostId(results, "instagram_feed");
    if (existingPostId) {
      results.instagram_feed = {
        ...(results.instagram_feed as Record<string, unknown> | undefined),
        postId: existingPostId,
        skipped: true,
        reason: "already_published",
      };
    } else if (!connection.instagram_business_account_id) {
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
      };
      await persistJobProgress(admin, job.id, results, "uploading_meta");
    } else {
      await persistJobProgress(admin, job.id, results, "uploading_meta");
      const igResult = await publishToInstagramCarousel({
        igUserId: connection.instagram_business_account_id,
        pageAccessToken,
        imageUrls: carouselImageUrls,
        caption,
        graphVersion,
      });
      results.instagram_feed = igResult;
      await persistJobProgress(admin, job.id, results, "uploading_meta");
    }
  }

  await markJobPublished(admin, job, results);
}

export async function processSocialPublicationJobSafe(
  admin: SupabaseClient,
  job: SocialPublicationJobRow,
): Promise<{ jobId: string; ok: boolean; error?: string }> {
  let partialResults: Record<string, unknown> | undefined;
  try {
    await processSocialPublicationJob(admin, job);
    return { jobId: job.id, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no worker Meta.";
    partialResults = mergeExistingResults(job);
    const { data: latestJob } = await admin
      .from("social_publication_jobs")
      .select("result_payload")
      .eq("id", job.id)
      .maybeSingle();
    if (latestJob?.result_payload && typeof latestJob.result_payload === "object") {
      partialResults = latestJob.result_payload as Record<string, unknown>;
    }
    await markJobFailed(admin, job, message, undefined, partialResults);
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
