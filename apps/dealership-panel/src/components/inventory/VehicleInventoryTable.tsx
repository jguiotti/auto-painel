import Image from "next/image";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

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
  vehicle_type: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  price: number;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  public_slug: string;
  images: string[] | null;
  unit_name?: string | null;
}

interface VehicleInventoryTableProps {
  vehicles: VehicleInventoryRow[];
}

const statusLabel: Record<string, string> = {
  available: "Disponível",
  sold: "Vendido",
};

function vehicleTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    automovel: "Automóvel",
    motocicleta: "Motocicleta",
    caminhonete: "Caminhonete",
    van: "Van",
    suv: "SUV",
    utilitario: "Utilitário",
    caminhao: "Caminhão",
    onibus: "Ônibus",
    outro: "Outro",
  };
  return labels[value] ?? value;
}

function InventoryIconActions({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/painel/estoque/${vehicleId}`} aria-label="Visualizar veículo">
          <Eye className="size-4" aria-hidden />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <Link href={`/painel/estoque/${vehicleId}/editar`} aria-label="Editar veículo">
          <Pencil className="size-4" aria-hidden />
        </Link>
      </Button>
      <DeleteVehicleButton vehicleId={vehicleId} />
    </div>
  );
}

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
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
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
                    <Link
                      href={`/painel/estoque/${v.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {v.brand} {v.model}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs font-normal text-muted-foreground">
                      {v.public_slug}
                    </div>
                  </TableCell>
                  <TableCell>{vehicleTypeLabel(v.vehicle_type)}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                    {v.unit_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {v.manufacturing_year} / {v.model_year}
                  </TableCell>
                  <TableCell>{v.mileage.toLocaleString("pt-BR")}</TableCell>
                  <TableCell>{formatBrl(Number(v.price))}</TableCell>
                  <TableCell>
                    {v.is_active
                      ? statusLabel[v.status] ?? v.status
                      : "Inativo"}
                    {v.is_featured ? (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                        Destaque
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <InventoryIconActions vehicleId={v.id} />
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
                    {formatBrl(Number(v.price))} ·{" "}
                    {v.is_active ? statusLabel[v.status] ?? v.status : "Inativo"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Tipo: {vehicleTypeLabel(v.vehicle_type)}
                    {v.is_featured ? " · Destaque" : ""}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {v.public_slug}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Unidade: {v.unit_name ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-border pt-3">
                <InventoryIconActions vehicleId={v.id} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
