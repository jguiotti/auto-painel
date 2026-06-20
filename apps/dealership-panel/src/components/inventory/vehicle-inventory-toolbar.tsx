"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";

import {
  buildPanelInventoryQueryString,
  PANEL_INVENTORY_PAGE_SIZE,
  type PanelInventorySearchParams,
} from "@/lib/inventory/panel-inventory-search-params";

interface VehicleInventoryToolbarProps {
  defaults: PanelInventorySearchParams;
  totalCount: number;
  filteredCount: number;
}

export function VehicleInventoryToolbar({
  defaults,
  totalCount,
  filteredCount,
}: VehicleInventoryToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(defaults.q);
  const [status, setStatus] = useState(defaults.status);
  const [featured, setFeatured] = useState(defaults.featured);

  function applyFilters(next: Partial<PanelInventorySearchParams>) {
    const merged: PanelInventorySearchParams = {
      q: next.q ?? q,
      status: next.status ?? status,
      featured: next.featured ?? featured,
      page: 1,
    };
    startTransition(() => {
      router.push(`/painel/estoque${buildPanelInventoryQueryString(merged)}`);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilters({});
  }

  function clearFilters() {
    setQ("");
    setStatus("all");
    setFeatured("all");
    startTransition(() => {
      router.push("/painel/estoque");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_160px_160px_auto]">
        <div className="space-y-2">
          <Label htmlFor="inventory-search">Buscar veículo</Label>
          <Input
            id="inventory-search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Marca, modelo ou slug"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inventory-status-filter">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as PanelInventorySearchParams["status"]);
              applyFilters({ status: value as PanelInventorySearchParams["status"] });
            }}
            disabled={pending}
          >
            <SelectTrigger id="inventory-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="sold">Vendidos</SelectItem>
              <SelectItem value="inactive">Inativos na vitrine</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inventory-featured-filter">Destaque</Label>
          <Select
            value={featured}
            onValueChange={(value) => {
              setFeatured(value as PanelInventorySearchParams["featured"]);
              applyFilters({ featured: value as PanelInventorySearchParams["featured"] });
            }}
            disabled={pending}
          >
            <SelectTrigger id="inventory-featured-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Em destaque</SelectItem>
              <SelectItem value="no">Sem destaque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={pending}>
            Filtrar
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={clearFilters}>
            Limpar
          </Button>
        </div>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">
        {filteredCount} veículo{filteredCount === 1 ? "" : "s"} no filtro · {totalCount} no
        estoque total
        {filteredCount > PANEL_INVENTORY_PAGE_SIZE
          ? ` · ${PANEL_INVENTORY_PAGE_SIZE} por página`
          : ""}
      </p>
    </div>
  );
}
