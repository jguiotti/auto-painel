import Link from "next/link";

import { VehicleInventoryTable } from "@/components/inventory/VehicleInventoryTable";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function InventoryPage() {
  const { supabase } = await requireDashboardSession();

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select(
      "id, brand, model, manufacturing_year, model_year, mileage, price, status, public_slug, images, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar o estoque: {error.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Estoque
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Cadastre e edite veículos; imagens ficam no Storage por concessionária.
          </p>
        </div>
        <Link
          href="/painel/estoque/novo"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Novo veículo
        </Link>
      </div>

      <VehicleInventoryTable vehicles={vehicles ?? []} />
    </div>
  );
}
