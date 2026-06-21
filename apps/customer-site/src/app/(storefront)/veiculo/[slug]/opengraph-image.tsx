import { ImageResponse } from "next/og";

import { formatBrl } from "@/lib/format/format-brl";
import { fetchPublicVehicleForSeo } from "@/lib/seo/fetch-public-vehicle-for-seo";

export const runtime = "edge";
export const alt = "Veículo disponível na loja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface VehicleOpenGraphImageProps {
  params: Promise<{ slug: string }>;
}

function buildVehicleLabel(vehicle: {
  brand: string;
  model: string;
  version?: string | null;
  model_year: number;
}): string {
  const base = `${vehicle.brand} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""}`;
  return `${base} (${vehicle.model_year})`;
}

export default async function VehicleOpenGraphImage({ params }: VehicleOpenGraphImageProps) {
  const { slug } = await params;
  const vehicle = await fetchPublicVehicleForSeo(slug);
  const title = vehicle ? buildVehicleLabel(vehicle) : "Veículo disponível";
  const priceLabel = vehicle ? formatBrl(Number(vehicle.price)) : "";
  const heroImage = vehicle?.images?.find(Boolean) ?? null;

  if (heroImage) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#0f172a",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            width={1200}
            height={630}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "48px",
              background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.88) 100%)",
              color: "#ffffff",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
              {title}
            </div>
            {priceLabel ? (
              <div style={{ marginTop: 16, fontSize: 36, fontWeight: 600 }}>{priceLabel}</div>
            ) : null}
          </div>
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        {priceLabel ? (
          <div style={{ marginTop: 24, fontSize: 36, color: "#38bdf8" }}>{priceLabel}</div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
