import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { VehicleEngagementSection } from "@/components/public/VehicleEngagementSection";

import { getPlatformFinanceMonthlyRatePercent } from "@/lib/finance/get-platform-finance-rate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    redirect("/erro/concessionaria");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_vehicle_by_id", {
    p_vehicle_id: id,
    p_dealership_id: dealershipId,
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
  const monthlyRatePercent = await getPlatformFinanceMonthlyRatePercent();

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
        <VehicleEngagementSection
          vehicleId={vehicle.id}
          vehiclePrice={priceNum}
          monthlyRatePercent={monthlyRatePercent}
        />
      </div>
    </article>
  );
}
