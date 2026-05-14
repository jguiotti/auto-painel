import { notFound } from "next/navigation";

import { VehicleForm } from "@/components/inventory/VehicleForm";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

interface EditVehiclePageProps {
  params: Promise<{ vehicleId: string }>;
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { vehicleId } = await params;
  const { supabase, dealershipId } = await requireDashboardSession();

  const [vehicleResult, unitsResult] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        "brand, model, vehicle_type, vehicle_type_custom, public_slug, manufacturing_year, model_year, mileage, fipe_price, sale_price, price, description, status, is_featured, is_active, images, dealership_unit_id",
      )
      .eq("id", vehicleId)
      .single(),
    supabase
      .from("dealership_units")
      .select("id, name")
      .eq("dealership_id", dealershipId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const { data: vehicle, error } = vehicleResult;
  const { data: units, error: unitsError } = unitsResult;

  if (error || !vehicle) {
    notFound();
  }

  if (unitsError || !units?.length) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          Não foi possível carregar as unidades da loja.
        </p>
      </div>
    );
  }

  const dealershipUnitId =
    typeof vehicle.dealership_unit_id === "string"
      ? vehicle.dealership_unit_id
      : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Editar veículo
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Atualize dados de venda, FIPE, tipo, destaque, ativação e imagens.
        </p>
      </div>
      <VehicleForm
        mode="edit"
        vehicleId={vehicleId}
        units={units}
        defaultValues={{
          brand: vehicle.brand,
          model: vehicle.model,
          vehicle_type: vehicle.vehicle_type,
          vehicle_type_custom: vehicle.vehicle_type_custom ?? "",
          public_slug: vehicle.public_slug,
          manufacturing_year: vehicle.manufacturing_year,
          model_year: vehicle.model_year,
          mileage: vehicle.mileage,
          fipe_price: vehicle.fipe_price ? Number(vehicle.fipe_price) : null,
          sale_price: Number(vehicle.sale_price ?? vehicle.price),
          price: Number(vehicle.price),
          description: vehicle.description ?? "",
          status: vehicle.status as "available" | "sold",
          is_featured: Boolean(vehicle.is_featured),
          is_active: vehicle.is_active !== false,
          images: (vehicle.images as string[] | null) ?? [],
          dealership_unit_id: dealershipUnitId,
        }}
      />
    </div>
  );
}
