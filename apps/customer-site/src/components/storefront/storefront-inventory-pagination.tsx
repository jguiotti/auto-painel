"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import {
  buildStorefrontInventoryQueryString,
  type ParsedInventorySearchParams,
} from "@/lib/inventory/inventory-search-params";

interface StorefrontInventoryPaginationProps {
  filters: ParsedInventorySearchParams;
  pageCount: number;
  totalCount: number;
  pageSize: number;
}

export function StorefrontInventoryPagination({
  filters,
  pageCount,
  totalCount,
  pageSize,
}: StorefrontInventoryPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const from = (filters.page - 1) * pageSize + 1;
  const to = Math.min(filters.page * pageSize, totalCount);

  const prevFilters: ParsedInventorySearchParams = {
    ...filters,
    page: Math.max(1, filters.page - 1),
  };
  const nextFilters: ParsedInventorySearchParams = {
    ...filters,
    page: Math.min(pageCount, filters.page + 1),
  };

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
        Mostrando {from}–{to} de {totalCount} · Página {filters.page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={filters.page <= 1}
          asChild={filters.page > 1}
          className="border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)]"
        >
          {filters.page > 1 ? (
            <Link href={`/estoque${buildStorefrontInventoryQueryString(prevFilters)}`}>
              Anterior
            </Link>
          ) : (
            <span>Anterior</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={filters.page >= pageCount}
          asChild={filters.page < pageCount}
          className="border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)]"
        >
          {filters.page < pageCount ? (
            <Link href={`/estoque${buildStorefrontInventoryQueryString(nextFilters)}`}>
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
