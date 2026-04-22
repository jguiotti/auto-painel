import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VehicleEngagementSection } from "@/components/storefront/vehicle-engagement-section";
import { formatBrl } from "@/lib/format/format-brl";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";

const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!PUBLIC_SLUG_RE.test(slug)) {
    return { title: "Veículo" };
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    return { title: "Veículo" };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_vehicle_by_slug", {
    p_dealership_id: dealershipId,
    p_public_slug: slug,
  });

  const vehicle = Array.isArray(data) ? data[0] : null;
  if (!vehicle) {
    return { title: "Veículo" };
  }

  const title = `${vehicle.brand} ${vehicle.model}`;
  return {
    title,
    description:
      typeof vehicle.description === "string" && vehicle.description
        ? vehicle.description.slice(0, 160)
        : `${title} — seminovos`,
  };
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params;
  if (!PUBLIC_SLUG_RE.test(slug)) {
    notFound();
  }

  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_vehicle_by_slug", {
    p_dealership_id: dealershipId,
    p_public_slug: slug,
  });

  if (error || !data?.length) {
    notFound();
  }

  const vehicle = data[0] as {
    id: string;
    brand: string;
    model: string;
    manufacturing_year: number;
    model_year: number;
    mileage: number;
    price: number;
    description: string | null;
    images: string[] | null;
    public_slug: string;
  };

  const images = vehicle.images?.filter(Boolean) ?? [];
  const priceNum = Number(vehicle.price);

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                Sem foto
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {images.slice(1, 7).map((src) => (
                <li key={src} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <p className="text-sm text-[var(--dealer-fg)]/60">
            {vehicle.manufacturing_year}/{vehicle.model_year} ·{" "}
            {vehicle.mileage.toLocaleString("pt-BR")} km
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--dealer-primary)]">
            {vehicle.brand} {vehicle.model}
          </h1>
          <p className="mt-4 text-3xl font-bold text-[var(--dealer-accent)]">
            {formatBrl(priceNum)}
          </p>
          {vehicle.description ? (
            <div className="mt-6 max-h-48 overflow-y-auto rounded-xl border border-black/5 bg-[var(--dealer-surface)] p-4 text-sm leading-relaxed dark:border-white/10">
              {vehicle.description}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-12">
        <VehicleEngagementSection vehicleId={vehicle.id} vehiclePrice={priceNum} />
      </div>
    </article>
  );
}
