import Image from "next/image";
import Link from "next/link";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";

import { formatBrl } from "@/lib/format/format-brl";

export interface PublicVehicleCardModel {
  id: string;
  brand: string;
  model: string;
  model_year: number;
  manufacturing_year: number;
  mileage: number;
  price: number;
  images: string[] | null;
  public_slug: string;
  is_featured?: boolean;
  vehicle_type?: string;
  vehicle_type_custom?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  color?: string | null;
  gear_count?: number | null;
  displacement_cc?: number | null;
}

interface VehicleListingGridProps {
  vehicles: PublicVehicleCardModel[];
  layoutId?: StorefrontLayoutTemplateId;
}

function listingGridClass(layoutId: StorefrontLayoutTemplateId): string {
  switch (layoutId) {
    case 2:
      return "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
    case 3:
      return "grid gap-6 sm:grid-cols-2 xl:grid-cols-4";
    default:
      return "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
  }
}

function VehicleCard({
  vehicle,
  layoutId,
}: {
  vehicle: PublicVehicleCardModel;
  layoutId: StorefrontLayoutTemplateId;
}) {
  const thumb = vehicle.images?.[0] ?? null;
  const typeLabel = vehicle.vehicle_type
    ? resolveVehicleTypeLabel(vehicle.vehicle_type, vehicle.vehicle_type_custom)
    : null;

  if (layoutId === 2) {
    return (
      <li>
        <article className="group relative overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_25%,transparent)]">
          <Link href={`/veiculo/${vehicle.public_slug}`} className="block">
            <div className="relative aspect-[4/5] overflow-hidden">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-sm text-[var(--dealer-fg)]/45">
                  Sem foto
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {vehicle.is_featured ? (
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--secondary-color,var(--dealer-accent))]">
                    Destaque
                  </span>
                ) : null}
                <h3
                  className="mt-1 text-xl font-semibold text-white"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/70">
                  {vehicle.manufacturing_year}/{vehicle.model_year} ·{" "}
                  {vehicle.mileage.toLocaleString("pt-BR")} km
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--secondary-color,var(--dealer-accent))]">
                  {formatBrl(Number(vehicle.price))}
                </p>
              </div>
            </div>
          </Link>
        </article>
      </li>
    );
  }

  if (layoutId === 3) {
    return (
      <li>
        <article className="group flex h-full flex-col border border-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--dealer-surface)_88%,black)] transition hover:border-[var(--dealer-primary)]">
          <div className="relative aspect-[4/3] overflow-hidden">
            {thumb ? (
              <Image
                src={thumb}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover transition duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-[var(--dealer-fg)]/45">
                Sem foto
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3
                  className="text-lg font-semibold text-[var(--dealer-fg)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-sm text-[var(--dealer-fg)]/60">
                  {vehicle.manufacturing_year}/{vehicle.model_year}
                  {typeLabel ? ` · ${typeLabel}` : ""}
                </p>
              </div>
              {vehicle.is_featured ? (
                <span className="rounded bg-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--dealer-primary)]">
                  Destaque
                </span>
              ) : null}
            </div>
            <p className="mt-auto text-xl font-semibold text-[var(--dealer-primary)]">
              {formatBrl(Number(vehicle.price))}
            </p>
            <Link
              href={`/veiculo/${vehicle.public_slug}`}
              className="mt-4 border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] py-2.5 text-center text-xs font-bold uppercase tracking-widest text-[var(--storefront-fg,var(--dealer-fg))]/80 transition group-hover:bg-[var(--secondary-color,var(--dealer-accent))] group-hover:text-[var(--dealer-accent-fg,#ffffff)]"
            >
              Quero este veículo
            </Link>
          </div>
        </article>
      </li>
    );
  }

  return (
    <li>
      <article className="group overflow-hidden border border-[color-mix(in_srgb,var(--dealer-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--dealer-surface)_90%,black)] transition hover:border-[var(--dealer-primary)]">
        <Link href={`/veiculo/${vehicle.public_slug}`} className="block">
          <div className="relative aspect-[16/10] overflow-hidden">
            {thumb ? (
              <Image
                src={thumb}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover transition duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-[var(--dealer-fg)]/45">
                Sem foto
              </span>
            )}
            {vehicle.is_featured ? (
              <span className="absolute left-4 top-4 rounded bg-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--dealer-primary)] backdrop-blur">
                Exclusivo
              </span>
            ) : null}
          </div>
          <div className="border-t border-[color-mix(in_srgb,var(--dealer-primary)_12%,transparent)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  className="text-xl font-semibold text-[var(--dealer-fg)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-[var(--storefront-fg,var(--dealer-fg))]/55">
                  {vehicle.manufacturing_year}/{vehicle.model_year} ·{" "}
                  {vehicle.mileage.toLocaleString("pt-BR")} km
                  {typeLabel ? ` · ${typeLabel}` : ""}
                </p>
              </div>
              <p className="text-lg font-semibold text-[var(--dealer-primary)]">
                {formatBrl(Number(vehicle.price))}
              </p>
            </div>
          </div>
        </Link>
      </article>
    </li>
  );
}

export function VehicleListingGrid({
  vehicles,
  layoutId = 1,
}: VehicleListingGridProps) {
  return (
    <ul className={listingGridClass(layoutId)}>
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} layoutId={layoutId} />
      ))}
    </ul>
  );
}
