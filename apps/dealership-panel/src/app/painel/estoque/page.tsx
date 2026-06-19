import Link from "next/link";

import { VehicleInventoryTable } from "@/components/inventory/VehicleInventoryTable";
import { VehicleInventoryPagination } from "@/components/inventory/vehicle-inventory-pagination";
import { VehicleInventoryToolbar } from "@/components/inventory/vehicle-inventory-toolbar";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import {
  PANEL_INVENTORY_PAGE_SIZE,
  parsePanelInventorySearchParams,
} from "@/lib/inventory/panel-inventory-search-params";

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
  featured_sort_order: number | null;
  images: string[] | null;
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

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, dealershipId, profile } = await requireDashboardSession();
  const filters = parsePanelInventorySearchParams(await searchParams);
  const canManageFeaturedOrder =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";

  let query = supabase
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
        featured_sort_order,
        images,
        dealership_units (
          name
        )
      `,
      { count: "exact" },
    )
    .eq("dealership_id", dealershipId);

  if (filters.status === "available" || filters.status === "sold") {
    query = query.eq("status", filters.status);
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters.featured === "yes") {
    query = query.eq("is_featured", true);
  } else if (filters.featured === "no") {
    query = query.eq("is_featured", false);
  }

  if (filters.q) {
    const pattern = `%${filters.q.replace(/[%]/g, "")}%`;
    query = query.or(
      `brand.ilike.${pattern},model.ilike.${pattern},public_slug.ilike.${pattern}`,
    );
  }

  const offset = (filters.page - 1) * PANEL_INVENTORY_PAGE_SIZE;
  const { data: vehiclesRaw, error, count: filteredCount } = await query
    .order("is_featured", { ascending: false })
    .order("featured_sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PANEL_INVENTORY_PAGE_SIZE - 1);

  const { count: totalCount, error: totalCountError } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("dealership_id", dealershipId);

  if (error || totalCountError) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar o estoque: {error?.message ?? totalCountError?.message}
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
    featured_sort_order: row.featured_sort_order,
    images: row.images,
    unit_name: embeddedDealershipUnitName(row.dealership_units),
  }));

  const safeFilteredCount = filteredCount ?? vehicles.length;
  const safeTotalCount = totalCount ?? safeFilteredCount;
  const pageCount = Math.max(1, Math.ceil(safeFilteredCount / PANEL_INVENTORY_PAGE_SIZE));

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

      <VehicleInventoryToolbar
        defaults={filters}
        totalCount={safeTotalCount}
        filteredCount={safeFilteredCount}
      />

      <VehicleInventoryTable
        vehicles={vehicles}
        canManageFeaturedOrder={canManageFeaturedOrder}
      />

      <VehicleInventoryPagination params={filters} pageCount={pageCount} />
    </div>
  );
}
