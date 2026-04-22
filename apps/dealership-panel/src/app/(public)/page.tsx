import { redirect } from "next/navigation";

import { PublicHomeHero } from "@/components/public/PublicHomeHero";
import type { VehicleFilterValues } from "@/components/public/VehicleFiltersForm";
import { VehicleFiltersForm } from "@/components/public/VehicleFiltersForm";
import type { PublicVehicleCardModel } from "@/components/public/VehicleListingGrid";
import { VehicleListingGrid } from "@/components/public/VehicleListingGrid";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

interface PublicHomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n;
}

function parseOptionalInt(value: string | undefined): number | null {
  const n = parseOptionalNumber(value);
  if (n === null) {
    return null;
  }
  return Math.trunc(n);
}

export default async function PublicHomePage({ searchParams }: PublicHomePageProps) {
  const sp = await searchParams;
  const str = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const dealershipId = await getDealershipIdFromCookies();
  if (!dealershipId) {
    redirect("/erro/concessionaria");
  }

  const supabase = await createSupabaseServerClient();

  const brand = str("brand")?.trim() || null;
  const model = str("model")?.trim() || null;
  const minPrice = parseOptionalNumber(str("minPrice"));
  const maxPrice = parseOptionalNumber(str("maxPrice"));
  const minYear = parseOptionalInt(str("minYear"));
  const maxYear = parseOptionalInt(str("maxYear"));

  const { data, error } = await supabase.rpc("list_public_vehicles_filtered", {
    p_dealership_id: dealershipId,
    p_brand: brand,
    p_model: model,
    p_min_price: minPrice,
    p_max_price: maxPrice,
    p_min_year: minYear,
    p_max_year: maxYear,
  });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-red-600 dark:text-red-400">
          Não foi possível carregar o estoque: {error.message}
        </p>
      </div>
    );
  }

  const vehicles = (data ?? []) as PublicVehicleCardModel[];

  const filterDefaults: VehicleFilterValues = {
    brand: str("brand") ?? "",
    model: str("model") ?? "",
    minPrice: str("minPrice") ?? "",
    maxPrice: str("maxPrice") ?? "",
    minYear: str("minYear") ?? "",
    maxYear: str("maxYear") ?? "",
  };

  return (
    <>
      <PublicHomeHero />
      <div id="estoque" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:py-12">
        <VehicleFiltersForm defaults={filterDefaults} />
        <div className="mt-8">
          <VehicleListingGrid vehicles={vehicles} />
        </div>
      </div>
    </>
  );
}
