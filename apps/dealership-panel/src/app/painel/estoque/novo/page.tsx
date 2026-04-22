import { VehicleForm } from "@/components/inventory/VehicleForm";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function NewVehiclePage() {
  await requireDashboardSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Novo veículo
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Preencha os dados e envie imagens (até o limite do bucket). O slug define a
          URL pública em /veiculo/seu-slug.
        </p>
      </div>
      <VehicleForm mode="create" />
    </div>
  );
}
