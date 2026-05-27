"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";

import type { InventorySortKey } from "@/lib/inventory/inventory-search-params";
import type { VehicleFilterOptionSet } from "@/lib/inventory/build-vehicle-filter-options";
import {
  buildDisplacementRangeValue,
  parseDisplacementRangeValue,
} from "@/lib/inventory/build-vehicle-filter-options";

export interface VehicleFilterValues {
  brand: string;
  model: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  vehicleType: string;
  minMileage: string;
  maxMileage: string;
  fuelType: string;
  transmission: string;
  color: string;
  minDisplacementCc: string;
  maxDisplacementCc: string;
  gearCount: string;
  sort: InventorySortKey;
}

interface VehicleFiltersPanelProps {
  defaults: VehicleFilterValues;
  options: VehicleFilterOptionSet;
  variant?: "sidebar" | "stacked" | "inline";
  mode?: "basic" | "advanced";
  targetPath?: string;
  panelId: string;
  className?: string;
}

const SORT_OPTIONS: Array<{ value: InventorySortKey; label: string }> = [
  { value: "newest", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "year_desc", label: "Ano mais novo" },
  { value: "mileage_asc", label: "Menor quilometragem" },
];

const MILEAGE_RANGES = [
  { label: "Qualquer km", minMileage: "", maxMileage: "" },
  { label: "Até 20 mil km", minMileage: "", maxMileage: "20000" },
  { label: "20 mil a 50 mil km", minMileage: "20000", maxMileage: "50000" },
  { label: "50 mil a 100 mil km", minMileage: "50000", maxMileage: "100000" },
  { label: "Acima de 100 mil km", minMileage: "100000", maxMileage: "" },
];

function buildPriceRangeValue(minPrice: string, maxPrice: string): string {
  return `${minPrice}|${maxPrice}`;
}

function parsePriceRangeValue(value: string): { minPrice: string; maxPrice: string } {
  const [minPrice = "", maxPrice = ""] = value.split("|");
  return { minPrice, maxPrice };
}

function buildMileageRangeValue(minMileage: string, maxMileage: string): string {
  return `${minMileage}|${maxMileage}`;
}

function parseMileageRangeValue(value: string): { minMileage: string; maxMileage: string } {
  const [minMileage = "", maxMileage = ""] = value.split("|");
  return { minMileage, maxMileage };
}

export function VehicleFiltersPanel({
  defaults,
  options,
  variant = "stacked",
  mode = "basic",
  targetPath = "/estoque",
  panelId,
  className,
}: VehicleFiltersPanelProps) {
  const router = useRouter();
  const [brand, setBrand] = useState(defaults.brand);
  const [model, setModel] = useState(defaults.model);
  const [minYear, setMinYear] = useState(defaults.minYear);
  const [maxYear, setMaxYear] = useState(defaults.maxYear);
  const [vehicleType, setVehicleType] = useState(defaults.vehicleType);
  const [sort, setSort] = useState<InventorySortKey>(defaults.sort);
  const [priceRange, setPriceRange] = useState(
    buildPriceRangeValue(defaults.minPrice, defaults.maxPrice),
  );
  const [mileageRange, setMileageRange] = useState(
    buildMileageRangeValue(defaults.minMileage, defaults.maxMileage),
  );
  const [fuelType, setFuelType] = useState(defaults.fuelType);
  const [transmission, setTransmission] = useState(defaults.transmission);
  const [color, setColor] = useState(defaults.color);
  const [gearCount, setGearCount] = useState(defaults.gearCount);
  const [displacementRange, setDisplacementRange] = useState(
    buildDisplacementRangeValue(defaults.minDisplacementCc, defaults.maxDisplacementCc),
  );

  const idPrefix = `filter-${panelId}`;

  const modelOptions = useMemo(() => {
    if (!brand) {
      return Array.from(
        new Set(Object.values(options.modelsByBrand).flatMap((models) => models)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    return options.modelsByBrand[brand] ?? [];
  }, [brand, options.modelsByBrand]);

  function handleBrandChange(nextBrand: string) {
    const normalized = nextBrand === "__all__" ? "" : nextBrand;
    setBrand(normalized);
    setModel("");
  }

  function applyFilters() {
    const { minPrice, maxPrice } = parsePriceRangeValue(priceRange);
    const { minMileage, maxMileage } = parseMileageRangeValue(mileageRange);
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minYear) params.set("minYear", minYear);
    if (maxYear) params.set("maxYear", maxYear);
    if (vehicleType) params.set("vehicleType", vehicleType);
    if (mode === "advanced") {
      if (minMileage) params.set("minMileage", minMileage);
      if (maxMileage) params.set("maxMileage", maxMileage);
      if (sort !== "newest") params.set("sort", sort);
    }
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (color) params.set("color", color);
    if (gearCount) params.set("gearCount", gearCount);
    const { minDisplacementCc, maxDisplacementCc } =
      parseDisplacementRangeValue(displacementRange);
    if (minDisplacementCc) params.set("minDisplacementCc", minDisplacementCc);
    if (maxDisplacementCc) params.set("maxDisplacementCc", maxDisplacementCc);
    const query = params.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath);
  }

  const isSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {!isSidebar ? (
        <h2
          className="text-lg font-semibold text-[var(--primary-color,var(--dealer-primary))]"
          style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
        >
          {mode === "advanced" ? "Filtro avançado" : "Encontre o veículo ideal"}
        </h2>
      ) : (
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary-color,var(--dealer-primary))]">
          Filtrar estoque
        </h3>
      )}
      <p className={cn("text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65", isSidebar ? "mb-4" : "mt-1 mb-4")}>
        Selecione as opções disponíveis no estoque da loja.
      </p>

      <div className={cn("grid gap-3", isSidebar ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3")}>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-brand`}>Marca</Label>
          <Select value={brand || "__all__"} onValueChange={handleBrandChange}>
            <SelectTrigger id={`${idPrefix}-brand`}>
              <SelectValue placeholder="Todas as marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as marcas</SelectItem>
              {options.brands.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-model`}>Modelo</Label>
          <Select
            value={model || "__all__"}
            onValueChange={(value) => setModel(value === "__all__" ? "" : value)}
            disabled={modelOptions.length === 0}
          >
            <SelectTrigger id={`${idPrefix}-model`}>
              <SelectValue placeholder="Todos os modelos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os modelos</SelectItem>
              {modelOptions.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-vehicle-type`}>Tipo de veículo</Label>
          <Select
            value={vehicleType || "__all__"}
            onValueChange={(value) => setVehicleType(value === "__all__" ? "" : value)}
            disabled={options.vehicleTypes.length === 0}
          >
            <SelectTrigger id={`${idPrefix}-vehicle-type`}>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os tipos</SelectItem>
              {options.vehicleTypes.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-price`}>Faixa de preço</Label>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger id={`${idPrefix}-price`}>
              <SelectValue placeholder="Qualquer faixa" />
            </SelectTrigger>
            <SelectContent>
              {options.priceRanges.map((range) => (
                <SelectItem
                  key={range.label}
                  value={buildPriceRangeValue(range.minPrice, range.maxPrice)}
                >
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-min-year`}>Ano mínimo</Label>
          <Select
            value={minYear || "__all__"}
            onValueChange={(value) => setMinYear(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id={`${idPrefix}-min-year`}>
              <SelectValue placeholder="Sem mínimo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Sem mínimo</SelectItem>
              {options.years.map((year) => (
                <SelectItem key={`min-${year}`} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-max-year`}>Ano máximo</Label>
          <Select
            value={maxYear || "__all__"}
            onValueChange={(value) => setMaxYear(value === "__all__" ? "" : value)}
          >
            <SelectTrigger id={`${idPrefix}-max-year`}>
              <SelectValue placeholder="Sem máximo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Sem máximo</SelectItem>
              {options.years.map((year) => (
                <SelectItem key={`max-${year}`} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {options.fuelTypes.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-fuel`}>Combustível</Label>
            <Select
              value={fuelType || "__all__"}
              onValueChange={(value) => setFuelType(value === "__all__" ? "" : value)}
            >
              <SelectTrigger id={`${idPrefix}-fuel`}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {options.fuelTypes.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {options.transmissions.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-transmission`}>Câmbio</Label>
            <Select
              value={transmission || "__all__"}
              onValueChange={(value) => setTransmission(value === "__all__" ? "" : value)}
            >
              <SelectTrigger id={`${idPrefix}-transmission`}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {options.transmissions.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {options.colors.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-color`}>Cor</Label>
            <Select
              value={color || "__all__"}
              onValueChange={(value) => setColor(value === "__all__" ? "" : value)}
            >
              <SelectTrigger id={`${idPrefix}-color`}>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {options.colors.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {options.displacementRanges.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-displacement`}>Cilindrada</Label>
            <Select value={displacementRange} onValueChange={setDisplacementRange}>
              <SelectTrigger id={`${idPrefix}-displacement`}>
                <SelectValue placeholder="Qualquer cilindrada" />
              </SelectTrigger>
              <SelectContent>
                {options.displacementRanges.map((range) => (
                  <SelectItem
                    key={range.label}
                    value={buildDisplacementRangeValue(
                      range.minDisplacementCc,
                      range.maxDisplacementCc,
                    )}
                  >
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {options.gearCounts.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-gears`}>Marchas</Label>
            <Select
              value={gearCount || "__all__"}
              onValueChange={(value) => setGearCount(value === "__all__" ? "" : value)}
            >
              <SelectTrigger id={`${idPrefix}-gears`}>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Qualquer</SelectItem>
                {options.gearCounts.map((entry) => (
                  <SelectItem key={entry} value={String(entry)}>
                    {entry} marchas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {mode === "advanced" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-mileage`}>Quilometragem</Label>
              <Select value={mileageRange} onValueChange={setMileageRange}>
                <SelectTrigger id={`${idPrefix}-mileage`}>
                  <SelectValue placeholder="Qualquer km" />
                </SelectTrigger>
                <SelectContent>
                  {MILEAGE_RANGES.map((range) => (
                    <SelectItem
                      key={range.label}
                      value={buildMileageRangeValue(range.minMileage, range.maxMileage)}
                    >
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-sort`}>Ordenar por</Label>
              <Select value={sort} onValueChange={(value) => setSort(value as InventorySortKey)}>
                <SelectTrigger id={`${idPrefix}-sort`}>
                  <SelectValue placeholder="Ordenação" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={applyFilters}
          className="bg-[var(--secondary-color,var(--dealer-accent))] text-white hover:opacity-95"
        >
          Ver veículos
        </Button>
        <Button variant="outline" asChild>
          <Link href={targetPath}>Limpar filtros</Link>
        </Button>
      </div>
    </div>
  );
}
