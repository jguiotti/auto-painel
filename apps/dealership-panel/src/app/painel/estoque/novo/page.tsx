import { VehicleForm } from "@/components/inventory/VehicleForm";

import { getVehicleFormPromotionConfig } from "@/lib/data/vehicle-form-promotion-config";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function NewVehiclePage() {
  const { supabase, dealershipId } = await requireDashboardSession();
  const promotionConfig = await getVehicleFormPromotionConfig({ supabase, dealershipId });

  const { data: units, error } = await supabase
    .from("dealership_units")
    .select("id, name")
    .eq("dealership_id", dealershipId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !units?.length) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Novo veículo
          </h1>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            Não foi possível carregar as unidades da loja. Cadastre filiais no painel administrativo ou fale com nosso suporte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Novo veículo
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Preencha os dados comerciais e operacionais (tipo, FIPE, venda, destaque e
          ativação) e envie imagens. O slug define a URL pública em
          /veiculo/seu-slug.
        </p>
      </div>
      <VehicleForm mode="create" units={units} promotionConfig={promotionConfig} />
    </div>
  );
}
