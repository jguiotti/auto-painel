import Image from "next/image";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

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
            <Card className="group h-full overflow-hidden pt-0 transition hover:shadow-md">
              <Link href={`/veiculo/${v.public_slug}`} className="block">
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
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">
                    {v.manufacturing_year}/{v.model_year} ·{" "}
                    {v.mileage.toLocaleString("pt-BR")} km
                  </CardDescription>
                  <CardTitle className="text-lg text-[var(--dealer-primary)] group-hover:underline">
                    {v.brand} {v.model}
                  </CardTitle>
                  <p className="text-xl font-bold text-[var(--dealer-accent)]">
                    {formatBrl(Number(v.price))}
                  </p>
                  <p className="text-sm font-medium text-[var(--dealer-accent)]">
                    Ver detalhes →
                  </p>
                </CardHeader>
              </Link>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
