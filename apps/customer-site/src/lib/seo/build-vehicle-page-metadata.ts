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

function buildVehicleOpenGraphImagePath(publicSlug: string): string {
  return `/veiculo/${publicSlug}/opengraph-image`;
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
  const ogImagePath = buildVehicleOpenGraphImagePath(vehicle.public_slug);
  const ogImages = [
    {
      url: ogImagePath,
      width: 1200,
      height: 630,
      alt: title,
      type: "image/png",
    },
  ];

  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(new URL(pageUrl).origin);
  } catch {
    metadataBase = undefined;
  }

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      locale: "pt_BR",
      title,
      description: ogDescription,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: ogImages.map((image) => image.url),
    },
  };
}
