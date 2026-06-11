import "server-only";

import sharp from "sharp";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

const SLIDE_SIZE = 1080;
const MAX_SLIDES = 8;

type ArtifactTemplate = "classic" | "performance" | "tech";

interface RenderSocialCarouselInput {
  jobId: string;
  dealershipId: string;
  artifactTemplate: ArtifactTemplate;
  payloadSnapshot: Record<string, unknown>;
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
    .slice(0, MAX_SLIDES);
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

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status}): ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function renderSlide(params: {
  sourceUrl: string;
  accent: string;
  primaryLine: string;
  secondaryLine: string;
}): Promise<Buffer> {
  const source = await downloadImage(params.sourceUrl);
  const footer = buildFooterSvg({
    accent: params.accent,
    primaryLine: params.primaryLine,
    secondaryLine: params.secondaryLine,
  });

  return sharp(source)
    .resize(SLIDE_SIZE, SLIDE_SIZE, { fit: "cover", position: "centre" })
    .composite([{ input: footer, top: SLIDE_SIZE - 140, left: 0 }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

function publicObjectUrl(supabaseUrl: string, storagePath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/social-carousel-artifacts/${storagePath}`;
}

export async function renderSocialCarouselSlides(
  input: RenderSocialCarouselInput,
): Promise<string[]> {
  const imageUrls = readVehicleImages(input.payloadSnapshot);
  if (imageUrls.length === 0) {
    throw new Error("Snapshot do veículo sem imagens para renderizar.");
  }

  const palette = templatePalette(input.artifactTemplate);
  const storeName = readStoreName(input.payloadSnapshot);
  const vehicleTitle = readVehicleTitle(input.payloadSnapshot);
  const priceLabel = readPriceLabel(input.payloadSnapshot);

  const supabase = createSupabaseServiceRoleClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for carousel upload.");
  }

  const renderedUrls: string[] = [];

  for (let index = 0; index < imageUrls.length; index += 1) {
    const isCover = index === 0;
    const jpeg = await renderSlide({
      sourceUrl: imageUrls[index],
      accent: palette.accent,
      primaryLine: isCover ? vehicleTitle : storeName,
      secondaryLine: isCover
        ? [priceLabel, palette.label].filter(Boolean).join(" · ")
        : `Slide ${index + 1} · ${storeName}`,
    });

    const storagePath = `${input.dealershipId}/${input.jobId}/${index}.jpg`;
    const { error } = await supabase.storage
      .from("social-carousel-artifacts")
      .upload(storagePath, jpeg, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload do slide ${index + 1} falhou: ${error.message}`);
    }

    renderedUrls.push(publicObjectUrl(supabaseUrl, storagePath));
  }

  return renderedUrls;
}
