import Link from "next/link";

import { Button, Input, Label } from "@autopainel/shared/ui";

export interface VehicleFilterValues {
  brand: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
}

interface VehicleFiltersFormProps {
  defaults: VehicleFilterValues;
}

export function VehicleFiltersForm({ defaults }: VehicleFiltersFormProps) {
  return (
    <form
      method="get"
      action="/"
      className="rounded-xl border border-black/5 bg-[var(--dealer-surface)] p-4 shadow-sm dark:border-white/10 sm:p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--dealer-primary)]">
        Filtrar estoque
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-brand">Marca</Label>
          <Input
            id="filter-brand"
            name="brand"
            defaultValue={defaults.brand}
            placeholder="Ex: Honda"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-model">Modelo</Label>
          <Input
            id="filter-model"
            name="model"
            defaultValue={defaults.model}
            placeholder="Ex: Civic"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-min-year">Ano mín.</Label>
          <Input
            id="filter-min-year"
            name="minYear"
            type="number"
            inputMode="numeric"
            defaultValue={defaults.minYear}
            placeholder="2015"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-max-year">Ano máx.</Label>
          <Input
            id="filter-max-year"
            name="maxYear"
            type="number"
            inputMode="numeric"
            defaultValue={defaults.maxYear}
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-min-price">Preço mín. (R$)</Label>
          <Input
            id="filter-min-price"
            name="minPrice"
            type="number"
            inputMode="decimal"
            defaultValue={defaults.minPrice}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-max-price">Preço máx. (R$)</Label>
          <Input
            id="filter-max-price"
            name="maxPrice"
            type="number"
            inputMode="decimal"
            defaultValue={defaults.maxPrice}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="submit"
          className="bg-[var(--dealer-accent)] text-white hover:opacity-95"
        >
          Aplicar filtros
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
