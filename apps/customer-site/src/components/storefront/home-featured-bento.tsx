import Image from "next/image";
import Link from "next/link";

import type { PublicVehicleCardModel } from "@/components/storefront/vehicle-listing-grid";
import { formatBrl } from "@/lib/format/format-brl";

interface HomeFeaturedBentoProps {
  vehicles: PublicVehicleCardModel[];
}

export function HomeFeaturedBento({ vehicles }: HomeFeaturedBentoProps) {
  const [primary, secondary, tertiary] = vehicles;

  return (
    <section
      aria-labelledby="featured-bento-heading"
      className="border-y border-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)] bg-[var(--dealer-surface)] px-4 py-14 sm:px-8 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 border-l-4 border-[var(--dealer-primary)] pl-4">
          <h2
            id="featured-bento-heading"
            className="text-2xl font-semibold tracking-tight text-[var(--dealer-fg)]"
            style={{ fontFamily: "var(--dealer-font-heading)" }}
          >
            Destaques
          </h2>
          <p className="mt-1 text-sm text-[var(--dealer-fg)]/65">
            Veículos em evidência no estoque da loja.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-12 md:grid-rows-2 md:min-h-[320px]">
          {primary ? (
            <FeaturedTile vehicle={primary} className="md:col-span-7 md:row-span-2" large />
          ) : null}
          {secondary ? (
            <FeaturedTile vehicle={secondary} className="md:col-span-5" />
          ) : null}
          {tertiary ? (
            <FeaturedTile vehicle={tertiary} className="md:col-span-5" />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FeaturedTile({
  vehicle,
  className,
  large = false,
}: {
  vehicle: PublicVehicleCardModel;
  className?: string;
  large?: boolean;
}) {
  const thumb = vehicle.images?.[0] ?? null;

  return (
    <Link
      href={`/veiculo/${vehicle.public_slug}`}
      className={`group relative block min-h-[220px] overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] bg-[var(--dealer-bg)] ${className ?? ""}`}
    >
      {thumb ? (
        <Image
          src={thumb}
          alt={`${vehicle.brand} ${vehicle.model}`}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes={large ? "50vw" : "25vw"}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--dealer-primary)]">
          Destaque
        </p>
        <p
          className={`mt-1 font-semibold text-white ${large ? "text-2xl" : "text-lg"}`}
          style={{ fontFamily: "var(--dealer-font-heading)" }}
        >
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="mt-1 text-sm text-white/75">{formatBrl(Number(vehicle.price))}</p>
      </div>
    </Link>
  );
}
