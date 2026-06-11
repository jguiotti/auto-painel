import "server-only";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

const SLIDE_SIZE = 1080;
const MAX_VEHICLE_PHOTOS = 7;
const WATERMARK_WIDTH_RATIO = 0.12;
const WATERMARK_MARGIN = 24;
const WATERMARK_OPACITY = 0.75;

type ArtifactTemplate = "classic" | "performance" | "tech";

export interface RenderSocialCarouselInput {
  jobId: string;
  dealershipId: string;
  artifactTemplate: ArtifactTemplate;
  payloadSnapshot: Record<string, unknown>;
  previewOnly?: boolean;
  watermarkEnabled?: boolean;
}

export interface RenderSocialCarouselResult {
  imageUrls: string[];
  slideCount: number;
  includesCtaSlide: boolean;
}

interface TemplatePalette {
  accent: string;
  label: string;
}

function templatePalette(template: ArtifactTemplate): TemplatePalette {
  if (template === "performance") {
    return { accent: "#7F1D1D", label: "Performance" };
  }
  if (template === "tech") {
    return { accent: "#2563EB", label: "Tech" };
  }
  return { accent: "#18181b", label: "Classic" };
}

function readVehicleImages(payload: Record<string, unknown>): string[] {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const images = vehicle?.images;
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .slice(0, MAX_VEHICLE_PHOTOS);
}

function readVehicleTitle(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const brand = typeof vehicle?.brand === "string" ? vehicle.brand : "";
  const model = typeof vehicle?.model === "string" ? vehicle.model : "";
  return `${brand} ${model}`.trim() || "Veículo em destaque";
}

function readStoreName(payload: Record<string, unknown>): string {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  return typeof dealership?.name === "string" ? dealership.name : "AutoPainel";
}

function readStorePhone(payload: Record<string, unknown>): string {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  return typeof dealership?.phone === "string" ? dealership.phone : "";
}

function readLogoUrl(payload: Record<string, unknown>): string | null {
  const dealership = payload.dealership as Record<string, unknown> | undefined;
  const logoUrl = dealership?.logo_url;
  return typeof logoUrl === "string" && logoUrl.length > 0 ? logoUrl : null;
}

function readPriceLabel(payload: Record<string, unknown>): string {
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;
  const price = vehicle?.price;
  if (typeof price !== "number") {
    return "";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
}

function readWatermarkEnabled(
  payload: Record<string, unknown>,
  explicit?: boolean,
): boolean {
  if (typeof explicit === "boolean") {
    return explicit;
  }
  return payload.branding_mask !== false;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildFooterSvg(params: {
  accent: string;
  primaryLine: string;
  secondaryLine: string;
}): Buffer {
  const svg = `
<svg width="${SLIDE_SIZE}" height="140" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SLIDE_SIZE}" height="140" fill="${params.accent}" opacity="0.92"/>
  <text x="48" y="58" fill="#ffffff" font-size="40" font-family="Arial, Helvetica, sans-serif" font-weight="700">
    ${escapeXml(params.primaryLine)}
  </text>
  <text x="48" y="104" fill="#f4f4f5" font-size="28" font-family="Arial, Helvetica, sans-serif">
    ${escapeXml(params.secondaryLine)}
  </text>
</svg>`;
  return Buffer.from(svg);
}

function buildCtaSlideSvg(params: {
  accent: string;
  storeName: string;
  phone: string;
  vehicleTitle: string;
}): Buffer {
  const phoneLine = params.phone ? escapeXml(params.phone) : "Fale com a loja";
  const svg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" fill="${params.accent}"/>
  <text x="540" y="420" fill="#ffffff" font-size="52" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle">
    ${escapeXml(params.storeName)}
  </text>
  <text x="540" y="500" fill="#f4f4f5" font-size="36" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    ${escapeXml(params.vehicleTitle)}
  </text>
  <text x="540" y="620" fill="#ffffff" font-size="40" font-family="Arial, Helvetica, sans-serif" font-weight="600" text-anchor="middle">
    Saiba mais
  </text>
  <text x="540" y="690" fill="#e4e4e7" font-size="30" font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    ${phoneLine}
  </text>
</svg>`;
  return Buffer.from(svg);
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}): ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function buildWatermarkOverlay(logoUrl: string): Promise<Buffer | null> {
  try {
    const logo = await downloadImage(logoUrl);
    const watermarkWidth = Math.round(SLIDE_SIZE * WATERMARK_WIDTH_RATIO);
    const resized = await sharp(logo)
      .resize(watermarkWidth, watermarkWidth, { fit: "inside" })
      .png()
      .toBuffer();
    const meta = await sharp(resized).metadata();
    const width = meta.width ?? watermarkWidth;
    const height = meta.height ?? watermarkWidth;
    const left = SLIDE_SIZE - width - WATERMARK_MARGIN;
    const top = SLIDE_SIZE - height - WATERMARK_MARGIN - 140;

    const overlaySvg = `
<svg width="${SLIDE_SIZE}" height="${SLIDE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <image href="data:image/png;base64,${resized.toString("base64")}" x="${left}" y="${top}" width="${width}" height="${height}" opacity="${WATERMARK_OPACITY}"/>
</svg>`;
    return Buffer.from(overlaySvg);
  } catch {
    return null;
  }
}

async function renderPhotoSlide(params: {
  sourceUrl: string;
  accent: string;
  primaryLine: string;
  secondaryLine: string;
  watermarkEnabled: boolean;
  logoUrl: string | null;
}): Promise<Buffer> {
  const source = await downloadImage(params.sourceUrl);
  const footer = buildFooterSvg({
    accent: params.accent,
    primaryLine: params.primaryLine,
    secondaryLine: params.secondaryLine,
  });

  const composites: sharp.OverlayOptions[] = [{ input: footer, top: SLIDE_SIZE - 140, left: 0 }];

  if (params.watermarkEnabled && params.logoUrl) {
    const watermark = await buildWatermarkOverlay(params.logoUrl);
    if (watermark) {
      composites.push({ input: watermark, top: 0, left: 0 });
    }
  }

  return sharp(source)
    .resize(SLIDE_SIZE, SLIDE_SIZE, { fit: "cover", position: "centre" })
    .composite(composites)
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

function publicObjectUrl(supabaseUrl: string, storagePath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/social-carousel-artifacts/${storagePath}`;
}

export async function renderSocialCarouselSlides(
  input: RenderSocialCarouselInput,
): Promise<RenderSocialCarouselResult> {
  const imageUrls = readVehicleImages(input.payloadSnapshot);
  if (imageUrls.length === 0) {
    throw new Error("Snapshot do veículo sem imagens para renderizar.");
  }

  const palette = templatePalette(input.artifactTemplate);
  const storeName = readStoreName(input.payloadSnapshot);
  const vehicleTitle = readVehicleTitle(input.payloadSnapshot);
  const priceLabel = readPriceLabel(input.payloadSnapshot);
  const phone = readStorePhone(input.payloadSnapshot);
  const logoUrl = readLogoUrl(input.payloadSnapshot);
  const watermarkEnabled = readWatermarkEnabled(
    input.payloadSnapshot,
    input.watermarkEnabled,
  );

  const supabase = createSupabaseServiceRoleClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for carousel upload.");
  }

  const storagePrefix = input.previewOnly
    ? `preview/${input.dealershipId}/${randomUUID()}`
    : `${input.dealershipId}/${input.jobId}`;

  const renderedUrls: string[] = [];
  let slideIndex = 0;

  const coverJpeg = await renderPhotoSlide({
    sourceUrl: imageUrls[0],
    accent: palette.accent,
    primaryLine: vehicleTitle,
    secondaryLine: [priceLabel, palette.label].filter(Boolean).join(" · "),
    watermarkEnabled,
    logoUrl,
  });
  const coverPath = `${storagePrefix}/${slideIndex}.jpg`;
  const coverUpload = await supabase.storage
    .from("social-carousel-artifacts")
    .upload(coverPath, coverJpeg, { contentType: "image/jpeg", upsert: true });
  if (coverUpload.error) {
    throw new Error(`Upload do slide capa falhou: ${coverUpload.error.message}`);
  }
  renderedUrls.push(publicObjectUrl(supabaseUrl, coverPath));
  slideIndex += 1;

  for (let photoIndex = 1; photoIndex < imageUrls.length; photoIndex += 1) {
    const jpeg = await renderPhotoSlide({
      sourceUrl: imageUrls[photoIndex],
      accent: palette.accent,
      primaryLine: storeName,
      secondaryLine: `Foto ${photoIndex + 1} · ${storeName}`,
      watermarkEnabled,
      logoUrl,
    });
    const storagePath = `${storagePrefix}/${slideIndex}.jpg`;
    const { error } = await supabase.storage
      .from("social-carousel-artifacts")
      .upload(storagePath, jpeg, { contentType: "image/jpeg", upsert: true });
    if (error) {
      throw new Error(`Upload do slide ${slideIndex + 1} falhou: ${error.message}`);
    }
    renderedUrls.push(publicObjectUrl(supabaseUrl, storagePath));
    slideIndex += 1;
  }

  const ctaSvg = buildCtaSlideSvg({
    accent: palette.accent,
    storeName,
    phone,
    vehicleTitle,
  });
  const ctaJpeg = await sharp(ctaSvg).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const ctaPath = `${storagePrefix}/${slideIndex}.jpg`;
  const ctaUpload = await supabase.storage
    .from("social-carousel-artifacts")
    .upload(ctaPath, ctaJpeg, { contentType: "image/jpeg", upsert: true });
  if (ctaUpload.error) {
    throw new Error(`Upload do slide CTA falhou: ${ctaUpload.error.message}`);
  }
  renderedUrls.push(publicObjectUrl(supabaseUrl, ctaPath));

  return {
    imageUrls: renderedUrls,
    slideCount: renderedUrls.length,
    includesCtaSlide: true,
  };
}
