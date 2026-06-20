import type { Metadata } from "next";

import { formatBrl } from "@/lib/format/format-brl";

interface VehicleOgInput {
  brand: string;
  model: string;
  version?: string | null;
  model_year: number;
  price: number;
  description?: string | null;
  images?: string[] | null;
  public_slug: string;
}

function buildVehicleTitle(vehicle: VehicleOgInput): string {
  const base = `${vehicle.brand} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""}`;
  return `${base} (${vehicle.model_year})`;
}

function resolveAbsoluteImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return imageUrl;
  }

  return imageUrl.startsWith("/")
    ? `${supabaseUrl}${imageUrl}`
    : `${supabaseUrl}/${imageUrl}`;
}

export function buildVehiclePageMetadata(
  vehicle: VehicleOgInput,
  pageUrl: string,
): Metadata {
  const title = buildVehicleTitle(vehicle);
  const priceLabel = formatBrl(Number(vehicle.price));
  const description =
    typeof vehicle.description === "string" && vehicle.description.trim()
      ? vehicle.description.trim().slice(0, 155)
      : `${title} por ${priceLabel}. Veículo seminovo disponível na loja.`;

  const ogDescription = `${title} — ${priceLabel}`;
  const firstImage = vehicle.images?.find(Boolean) ?? null;
  const ogImages = firstImage
    ? [
        {
          url: resolveAbsoluteImageUrl(firstImage),
          width: 1200,
          height: 630,
          alt: title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      title,
      description: ogDescription,
      images: ogImages,
    },
    twitter: {
      card: firstImage ? "summary_large_image" : "summary",
      title,
      description: ogDescription,
      images: ogImages?.map((image) => image.url),
    },
  };
}
