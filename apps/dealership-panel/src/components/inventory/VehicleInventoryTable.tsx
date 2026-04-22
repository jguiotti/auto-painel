import Image from "next/image";
import Link from "next/link";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";

import { DeleteVehicleButton } from "@/components/inventory/DeleteVehicleButton";

export interface VehicleInventoryRow {
  id: string;
  brand: string;
  model: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  price: number;
  status: string;
  public_slug: string;
  images: string[] | null;
}

interface VehicleInventoryTableProps {
  vehicles: VehicleInventoryRow[];
}

const statusLabel: Record<string, string> = {
  available: "Disponível",
  sold: "Vendido",
};

export function VehicleInventoryTable({ vehicles }: VehicleInventoryTableProps) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        Nenhum veículo cadastrado. Adicione o primeiro para aparecer na vitrine.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Anos</TableHead>
              <TableHead>Km</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => {
              const thumb = v.images?.[0] ?? null;
              return (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="relative h-12 w-16 overflow-hidden rounded-md bg-muted">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {v.brand} {v.model}
                    <div className="mt-0.5 font-mono text-xs font-normal text-muted-foreground">
                      {v.public_slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    {v.manufacturing_year} / {v.model_year}
                  </TableCell>
                  <TableCell>{v.mileage.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{formatBrl(Number(v.price))}</TableCell>
                  <TableCell>{statusLabel[v.status] ?? v.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link
                          href={`/veiculo/${v.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver vitrine
                        </Link>
                      </Button>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link href={`/painel/estoque/${v.id}/editar`}>Editar</Link>
                      </Button>
                      <DeleteVehicleButton vehicleId={v.id} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {vehicles.map((v) => {
          const thumb = v.images?.[0] ?? null;
          return (
            <li
              key={v.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatBrl(Number(v.price))} · {statusLabel[v.status] ?? v.status}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {v.public_slug}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" asChild>
                  <Link href={`/painel/estoque/${v.id}/editar`}>Editar</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/veiculo/${v.id}`} target="_blank" rel="noopener noreferrer">
                    Vitrine
                  </Link>
                </Button>
                <DeleteVehicleButton vehicleId={v.id} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
