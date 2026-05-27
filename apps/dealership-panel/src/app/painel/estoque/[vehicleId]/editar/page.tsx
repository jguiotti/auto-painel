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
        "brand, model, vehicle_type, vehicle_type_custom, public_slug, manufacturing_year, model_year, mileage, fipe_price, sale_price, price, description, status, is_featured, is_active, images, dealership_unit_id, version, fuel_type, transmission, color, body_style, accepts_trade, single_owner, all_revisions_done, factory_warranty, ipva_paid, is_licensed, features, gear_count, displacement_cc, engine_type, cooling_type, motorcycle_style, starter_type, brake_front, brake_rear, fuel_system, traction, axle_count, gross_weight_kg, passenger_capacity, cab_type, body_truck_type",
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
          version: vehicle.version ?? null,
          fuel_type: vehicle.fuel_type ?? null,
          transmission: vehicle.transmission ?? null,
          color: vehicle.color ?? null,
          body_style: vehicle.body_style ?? null,
          accepts_trade: Boolean(vehicle.accepts_trade),
          single_owner: Boolean(vehicle.single_owner),
          all_revisions_done: Boolean(vehicle.all_revisions_done),
          factory_warranty: Boolean(vehicle.factory_warranty),
          ipva_paid: Boolean(vehicle.ipva_paid),
          is_licensed: Boolean(vehicle.is_licensed),
          features: (vehicle.features as string[] | null) ?? [],
          gear_count: vehicle.gear_count ?? null,
          displacement_cc: vehicle.displacement_cc ?? null,
          engine_type: vehicle.engine_type ?? null,
          cooling_type: vehicle.cooling_type ?? null,
          motorcycle_style: vehicle.motorcycle_style ?? null,
          starter_type: vehicle.starter_type ?? null,
          brake_front: vehicle.brake_front ?? null,
          brake_rear: vehicle.brake_rear ?? null,
          fuel_system: vehicle.fuel_system ?? null,
          traction: vehicle.traction ?? null,
          axle_count: vehicle.axle_count ?? null,
          gross_weight_kg: vehicle.gross_weight_kg ?? null,
          passenger_capacity: vehicle.passenger_capacity ?? null,
          cab_type: vehicle.cab_type ?? null,
          body_truck_type: vehicle.body_truck_type ?? null,
        }}
      />
    </div>
  );
}
