import Link from "next/link";

import { VehicleInventoryTable } from "@/components/inventory/VehicleInventoryTable";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

interface VehicleDbRow {
  id: string;
  brand: string;
  model: string;
  vehicle_type: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  price: number;
  sale_price: number | null;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  public_slug: string;
  images: string[] | null;
  /** Supabase may infer FK embed as object or single-element array depending on typings */
  dealership_units: { name: string } | { name: string }[] | null;
}

function embeddedDealershipUnitName(
  embedded: VehicleDbRow["dealership_units"],
): string | null {
  if (embedded == null) {
    return null;
  }
  const row = Array.isArray(embedded) ? embedded[0] : embedded;
  return row?.name ?? null;
}

export default async function InventoryPage() {
  const { supabase, dealershipId } = await requireDashboardSession();

  const [{ data: vehiclesRaw, error }] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        `
        id,
        brand,
        model,
        vehicle_type,
        manufacturing_year,
        model_year,
        mileage,
        price,
        sale_price,
        status,
        is_featured,
        is_active,
        public_slug,
        images,
        dealership_units (
          name
        )
      `,
      )
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar o estoque: {error.message}
      </p>
    );
  }

  const vehicles = ((vehiclesRaw ?? []) as VehicleDbRow[]).map((row) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    vehicle_type: row.vehicle_type,
    manufacturing_year: row.manufacturing_year,
    model_year: row.model_year,
    mileage: row.mileage,
    price: row.sale_price ?? row.price,
    status: row.status,
    is_featured: row.is_featured,
    is_active: row.is_active,
    public_slug: row.public_slug,
    images: row.images,
    unit_name: embeddedDealershipUnitName(row.dealership_units),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Estoque
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Cadastre e edite veículos por unidade. As fotos ficam salvas na sua loja.
          </p>
        </div>
        <Link
          href="/painel/estoque/novo"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Novo veículo
        </Link>
      </div>

      <VehicleInventoryTable vehicles={vehicles} />
    </div>
  );
}
