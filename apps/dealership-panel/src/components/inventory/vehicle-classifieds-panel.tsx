"use client";

import { useState, useTransition } from "react";

import { Badge, Button } from "@autopainel/shared/ui";

import {
  delistVehicleFromClassifiedsAction,
  publishVehicleToClassifiedsAction,
} from "@/app/painel/estoque/classified-actions";

export interface VehicleClassifiedListingStatus {
  provider: "olx" | "webmotors";
  syncStatus: "pending" | "published" | "delisted" | "error";
  lastSyncedAt: string | null;
  lastError: string | null;
}

interface VehicleClassifiedsPanelProps {
  vehicleId: string;
  enabled: boolean;
  hasConnectedProvider: boolean;
  listings: VehicleClassifiedListingStatus[];
  recentJobs: Array<{
    provider: "olx" | "webmotors";
    action: "publish" | "delist";
    status: string;
    lastError: string | null;
  }>;
}

const PROVIDER_LABEL: Record<"olx" | "webmotors", string> = {
  olx: "OLX",
  webmotors: "Webmotors",
};

function listingStatusLabel(status: VehicleClassifiedListingStatus["syncStatus"]): string {
  if (status === "published") {
    return "Publicado";
  }
  if (status === "delisted") {
    return "Removido";
  }
  if (status === "error") {
    return "Erro";
  }
  return "Pendente";
}

function jobStatusLabel(status: string): string {
  if (status === "queued") {
    return "Na fila";
  }
  if (status === "processing") {
    return "Processando";
  }
  if (status === "succeeded") {
    return "Concluído";
  }
  if (status === "failed") {
    return "Falhou";
  }
  return status;
}

export function VehicleClassifiedsPanel({
  vehicleId,
  enabled,
  hasConnectedProvider,
  listings,
  recentJobs,
}: VehicleClassifiedsPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        A publicação em portais classificados não está incluída no plano da sua loja.
      </div>
    );
  }

  function handlePublish() {
    setMessage(null);
    startTransition(async () => {
      const result = await publishVehicleToClassifiedsAction(vehicleId);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        "Publicação enfileirada. Em instantes o anúncio aparecerá nos portais conectados.",
      );
    });
  }

  function handleDelist() {
    setMessage(null);
    startTransition(async () => {
      const result = await delistVehicleFromClassifiedsAction(vehicleId);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Remoção enfileirada nos portais onde o veículo estava publicado.");
    });
  }

  const hasPublishedListing = listings.some((entry) => entry.syncStatus === "published");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Portais classificados</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Publique ou remova este veículo na OLX e Webmotors sem sair do painel.
      </p>

      {!hasConnectedProvider ? (
        <p className="mt-3 text-sm text-amber-700">
          Conecte OLX ou Webmotors em Integrações para publicar anúncios.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={isPending} onClick={handlePublish}>
            {isPending ? "Enfileirando…" : "Publicar nos portais"}
          </Button>
          {hasPublishedListing ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleDelist}
            >
              Remover dos portais
            </Button>
          ) : null}
        </div>
      )}

      {listings.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {listings.map((listing) => (
            <li
              key={listing.provider}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              <span>{PROVIDER_LABEL[listing.provider]}</span>
              <Badge variant={listing.syncStatus === "published" ? "default" : "secondary"}>
                {listingStatusLabel(listing.syncStatus)}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      {recentJobs.length > 0 ? (
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Últimas sincronizações</p>
          {recentJobs.slice(0, 4).map((job, index) => (
            <p key={`${job.provider}-${job.action}-${index}`}>
              {PROVIDER_LABEL[job.provider]} —{" "}
              {job.action === "publish" ? "Publicar" : "Remover"}: {jobStatusLabel(job.status)}
              {job.lastError ? ` (${job.lastError})` : ""}
            </p>
          ))}
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
