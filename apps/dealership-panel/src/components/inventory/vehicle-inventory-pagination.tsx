"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import {
  buildPanelInventoryQueryString,
  type PanelInventorySearchParams,
} from "@/lib/inventory/panel-inventory-search-params";

interface VehicleInventoryPaginationProps {
  params: PanelInventorySearchParams;
  pageCount: number;
}

export function VehicleInventoryPagination({
  params,
  pageCount,
}: VehicleInventoryPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const prevParams: PanelInventorySearchParams = {
    ...params,
    page: Math.max(1, params.page - 1),
  };
  const nextParams: PanelInventorySearchParams = {
    ...params,
    page: Math.min(pageCount, params.page + 1),
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Página {params.page} de {pageCount}
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
