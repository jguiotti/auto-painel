"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import {
  buildPanelInventoryQueryString,
  PANEL_INVENTORY_PAGE_SIZE,
  type PanelInventorySearchParams,
} from "@/lib/inventory/panel-inventory-search-params";

interface VehicleInventoryPaginationProps {
  params: PanelInventorySearchParams;
  pageCount: number;
  filteredCount: number;
}

export function VehicleInventoryPagination({
  params,
  pageCount,
  filteredCount,
}: VehicleInventoryPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const from = (params.page - 1) * PANEL_INVENTORY_PAGE_SIZE + 1;
  const to = Math.min(params.page * PANEL_INVENTORY_PAGE_SIZE, filteredCount);

  const prevParams: PanelInventorySearchParams = {
    ...params,
    page: Math.max(1, params.page - 1),
  };
  const nextParams: PanelInventorySearchParams = {
    ...params,
    page: Math.min(pageCount, params.page + 1),
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando {from}–{to} de {filteredCount} · Página {params.page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={params.page <= 1} asChild={params.page > 1}>
          {params.page > 1 ? (
            <Link href={`/painel/estoque${buildPanelInventoryQueryString(prevParams)}`}>
              Anterior
            </Link>
          ) : (
            <span>Anterior</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={params.page >= pageCount}
          asChild={params.page < pageCount}
        >
          {params.page < pageCount ? (
            <Link href={`/painel/estoque${buildPanelInventoryQueryString(nextParams)}`}>
              Próxima
            </Link>
          ) : (
            <span>Próxima</span>
          )}
        </Button>
      </div>
    </div>
  );
}
