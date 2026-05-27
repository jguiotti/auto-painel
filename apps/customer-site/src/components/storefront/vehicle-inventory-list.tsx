"use client";

import Image from "next/image";
import Link from "next/link";

import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";
import { Badge } from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";

import type { PublicVehicleCardModel } from "./vehicle-listing-grid";

interface VehicleInventoryListProps {
  vehicles: PublicVehicleCardModel[];
}

export function VehicleInventoryList({ vehicles }: VehicleInventoryListProps) {
  if (vehicles.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))]">
      {vehicles.map((vehicle) => {
        const thumb = vehicle.images?.[0] ?? null;
        const typeLabel = vehicle.vehicle_type
          ? resolveVehicleTypeLabel(vehicle.vehicle_type, vehicle.vehicle_type_custom)
          : null;

        return (
          <li key={vehicle.id}>
            <Link
              href={`/veiculo/${vehicle.public_slug}`}
              className="group flex flex-col gap-4 p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_4%,transparent)] sm:flex-row sm:items-stretch sm:p-5"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--dealer-bg)_90%,black)] sm:aspect-[4/3] sm:w-72 lg:w-80">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 320px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-[var(--dealer-fg)]/45">
                    Sem foto
                  </span>
                )}
                {vehicle.is_featured ? (
                  <Badge className="absolute left-3 top-3 bg-[var(--secondary-color,var(--dealer-accent))] text-white hover:bg-[var(--secondary-color,var(--dealer-accent))]">
                    Destaque
                  </Badge>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className="text-xl font-semibold text-[var(--storefront-fg,var(--dealer-fg))]"
                      style={{
                        fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))",
                      }}
                    >
                      {vehicle.brand} {vehicle.model}
                    </h2>
                    {typeLabel ? (
                      <Badge variant="outline" className="font-normal">
                        {typeLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
                    {vehicle.manufacturing_year}/{vehicle.model_year} ·{" "}
                    {vehicle.mileage.toLocaleString("pt-BR")} km
                  </p>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="text-2xl font-bold text-[var(--primary-color,var(--dealer-primary))]">
                    {formatBrl(Number(vehicle.price))}
                  </p>
                  <span className="text-sm font-medium text-[var(--secondary-color,var(--dealer-accent))] group-hover:underline">
                    Ver detalhes →
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
