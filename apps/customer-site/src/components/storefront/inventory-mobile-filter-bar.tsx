"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@autopainel/shared/ui";

import type { VehicleFilterOptionSet } from "@/lib/inventory/build-vehicle-filter-options";

import {
  VehicleFiltersPanel,
  type VehicleFilterValues,
} from "./vehicle-filters-panel";
import { useStorefrontThemeCssVars } from "./use-storefront-theme-css-vars";

interface InventoryMobileFilterBarProps {
  defaults: VehicleFilterValues;
  options: VehicleFilterOptionSet;
  targetPath?: string;
  activeFilterCount: number;
}

export function InventoryMobileFilterBar({
  defaults,
  options,
  targetPath = "/estoque",
  activeFilterCount,
}: InventoryMobileFilterBarProps) {
  const [open, setOpen] = useState(false);
  const themeCssVars = useStorefrontThemeCssVars();

  return (
    <div className="flex items-center justify-between gap-3 lg:hidden">
      <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
        Refine a busca com filtros avançados
      </p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 gap-2 border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] text-[var(--storefront-fg,var(--dealer-fg))]"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-[var(--primary-color,var(--dealer-primary))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--dealer-primary-fg,#ffffff)]">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          style={themeCssVars}
          className="max-h-[88dvh] overflow-y-auto rounded-t-2xl border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_20%,transparent)] !bg-[var(--dealer-surface)] !text-[var(--dealer-fg)] [&>button]:text-[var(--dealer-fg)]/70 [&>button]:hover:text-[var(--dealer-fg)]"
        >
          <SheetHeader className="text-left">
            <SheetTitle
              className="text-[var(--storefront-fg,var(--dealer-fg))]"
              style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
            >
              Filtrar estoque
            </SheetTitle>
            <SheetDescription className="text-[var(--storefront-fg,var(--dealer-fg))]/70">
              Ajuste marca, preço, ano e demais critérios. Toque em Aplicar filtros para atualizar a lista.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6">
            <VehicleFiltersPanel
              panelId="mobile-sheet"
              defaults={defaults}
              options={options}
              variant="stacked"
              mode="advanced"
              targetPath={targetPath}
              onApplied={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
