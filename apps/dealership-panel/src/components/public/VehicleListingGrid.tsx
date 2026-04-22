import Image from "next/image";
import Link from "next/link";

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
}

interface VehicleListingGridProps {
  vehicles: PublicVehicleCardModel[];
}

export function VehicleListingGrid({ vehicles }: VehicleListingGridProps) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-black/10 bg-[var(--dealer-surface)] py-16 text-center text-[var(--dealer-fg)]/70 dark:border-white/15">
        Nenhum veículo encontrado com estes filtros. Tente ajustar marca, ano ou
        faixa de preço.
      </p>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => {
        const thumb = v.images?.[0] ?? null;
        return (
          <li key={v.id}>
            <Link
              href={`/veiculo/${v.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-[var(--dealer-surface)] shadow-sm transition hover:shadow-md dark:border-white/10"
            >
              <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={`${v.brand} ${v.model}`}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-zinc-400">
                    Sem foto
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--dealer-fg)]/50">
                  {v.manufacturing_year}/{v.model_year} ·{" "}
                  {v.mileage.toLocaleString("pt-BR")} km
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--dealer-primary)] group-hover:underline">
                  {v.brand} {v.model}
                </h3>
                <p className="mt-2 text-xl font-bold text-[var(--dealer-accent)]">
                  {formatBrl(Number(v.price))}
                </p>
                <span className="mt-3 text-sm font-medium text-[var(--dealer-accent)]">
                  Ver detalhes →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
