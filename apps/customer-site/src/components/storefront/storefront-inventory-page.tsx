import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import type { VehicleFilterOptionSet } from "@/lib/inventory/build-vehicle-filter-options";

import { StorefrontPageContainer } from "./storefront-page-container";
import type { PublicVehicleCardModel } from "./vehicle-listing-grid";
import {
  VehicleFiltersPanel,
  type VehicleFilterValues,
} from "./vehicle-filters-panel";
import { VehicleInventoryList } from "./vehicle-inventory-list";
import { InventoryMobileFilterBar } from "./inventory-mobile-filter-bar";

function countActiveStorefrontFilters(defaults: VehicleFilterValues): number {
  let count = 0;
  if (defaults.brand) count += 1;
  if (defaults.model) count += 1;
  if (defaults.minPrice || defaults.maxPrice) count += 1;
  if (defaults.minYear || defaults.maxYear) count += 1;
  if (defaults.vehicleType) count += 1;
  if (defaults.minMileage || defaults.maxMileage) count += 1;
  if (defaults.fuelType) count += 1;
  if (defaults.transmission) count += 1;
  if (defaults.color) count += 1;
  if (defaults.minDisplacementCc || defaults.maxDisplacementCc) count += 1;
  if (defaults.gearCount) count += 1;
  if (defaults.sort !== "newest") count += 1;
  return count;
}

interface StorefrontInventoryPageProps {
  vehicles: PublicVehicleCardModel[];
  totalCount: number;
  filterDefaults: VehicleFilterValues;
  filterOptions: VehicleFilterOptionSet;
}

export function StorefrontInventoryPage({
  vehicles,
  totalCount,
  filterDefaults,
  filterOptions,
}: StorefrontInventoryPageProps) {
  return (
    <div className="py-8 sm:py-10 lg:py-12">
      <StorefrontPageContainer>
        <header className="mb-8 border-l-4 border-[var(--primary-color,var(--dealer-primary))] pl-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary-color,var(--dealer-primary))]">
            Estoque completo
          </p>
          <h1
            className="mt-2 text-3xl font-semibold text-[var(--storefront-fg,var(--dealer-fg))] sm:text-4xl"
            style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
          >
            Encontre o veículo ideal
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70 sm:text-base">
            Filtros avançados para cruzar marca, modelo, tipo, ano, preço e quilometragem.
          </p>
        </header>

        <div className="mb-6 lg:hidden">
          <InventoryMobileFilterBar
            defaults={filterDefaults}
            options={filterOptions}
            activeFilterCount={countActiveStorefrontFilters(filterDefaults)}
          />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full shrink-0 lg:block lg:w-80 xl:w-96">
            <div className="sticky top-28">
              <VehicleFiltersPanel
                panelId="sidebar"
                defaults={filterDefaults}
                options={filterOptions}
                variant="sidebar"
                mode="advanced"
                targetPath="/estoque"
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <p className="mb-4 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
              {totalCount} veículo{totalCount === 1 ? "" : "s"} encontrado
              {totalCount === 1 ? "" : "s"}
            </p>

            {vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_20%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] p-10 text-center">
                <p className="text-lg font-medium text-[var(--storefront-fg,var(--dealer-fg))]">
                  Nenhum veículo encontrado com esses filtros.
                </p>
                <p className="mt-2 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
                  Ajuste os filtros ou fale com nossa equipe — temos novidades chegando toda semana.
                </p>
                <Button className="mt-6" variant="outline" asChild>
                  <Link href="/estoque">Limpar filtros</Link>
                </Button>
              </div>
            ) : (
              <VehicleInventoryList vehicles={vehicles} />
            )}
          </div>
        </div>
      </StorefrontPageContainer>
    </div>
  );
}
