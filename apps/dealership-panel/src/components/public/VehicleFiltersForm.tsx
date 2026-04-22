import Link from "next/link";

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
        <div>
          <label
            htmlFor="filter-brand"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Marca
          </label>
          <input
            id="filter-brand"
            name="brand"
            defaultValue={defaults.brand}
            placeholder="Ex: Honda"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="filter-model"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Modelo
          </label>
          <input
            id="filter-model"
            name="model"
            defaultValue={defaults.model}
            placeholder="Ex: Civic"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="filter-min-year"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Ano mín.
          </label>
          <input
            id="filter-min-year"
            name="minYear"
            type="number"
            inputMode="numeric"
            defaultValue={defaults.minYear}
            placeholder="2015"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="filter-max-year"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Ano máx.
          </label>
          <input
            id="filter-max-year"
            name="maxYear"
            type="number"
            inputMode="numeric"
            defaultValue={defaults.maxYear}
            placeholder="2024"
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="filter-min-price"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Preço mín. (R$)
          </label>
          <input
            id="filter-min-price"
            name="minPrice"
            type="number"
            inputMode="decimal"
            defaultValue={defaults.minPrice}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="filter-max-price"
            className="block text-xs font-medium text-[var(--dealer-fg)]/70"
          >
            Preço máx. (R$)
          </label>
          <input
            id="filter-max-price"
            name="maxPrice"
            type="number"
            inputMode="decimal"
            defaultValue={defaults.maxPrice}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--dealer-accent)] px-5 text-sm font-semibold text-white hover:opacity-95"
        >
          Aplicar filtros
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-black/10 px-5 text-sm font-medium dark:border-white/15"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
