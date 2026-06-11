"use client";

import Link from "next/link";
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
  externalListingUrl: string | null;
}

interface VehicleClassifiedsPanelProps {
  vehicleId: string;
  enabled: boolean;
  connectedProviders: Array<"olx" | "webmotors">;
  listings: VehicleClassifiedListingStatus[];
  recentJobs: Array<{
    provider: "olx" | "webmotors";
    action: "publish" | "delist";
    status: string;
    lastError: string | null;
  }>;
  showAutoDelistHint?: boolean;
}

const PROVIDER_LABEL: Record<"olx" | "webmotors", string> = {
  olx: "OLX",
  webmotors: "WebMotors",
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
  connectedProviders,
  listings,
  recentJobs,
  showAutoDelistHint = false,
}: VehicleClassifiedsPanelProps) {
  const [publishOlx, setPublishOlx] = useState(connectedProviders.includes("olx"));
  const [publishWebmotors, setPublishWebmotors] = useState(
    connectedProviders.includes("webmotors"),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        A publicação em portais classificados não está incluída no plano da sua loja.
      </div>
    );
  }

  const hasConnectedProvider = connectedProviders.length > 0;

  function handlePublish() {
    setMessage(null);
    const providers: Array<"olx" | "webmotors"> = [];
    if (publishOlx && connectedProviders.includes("olx")) {
      providers.push("olx");
    }
    if (publishWebmotors && connectedProviders.includes("webmotors")) {
      providers.push("webmotors");
    }

    if (providers.length === 0) {
      setMessage("Selecione ao menos um portal conectado para publicar.");
      return;
    }

    startTransition(async () => {
      const result = await publishVehicleToClassifiedsAction(vehicleId, providers);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Publicação iniciada. Acompanhe o status abaixo.");
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
      setMessage("Remoção iniciada nos portais onde o veículo estava publicado.");
    });
  }

  const hasPublishedListing = listings.some((entry) => entry.syncStatus === "published");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Portais classificados</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Publique ou remova este veículo na OLX e WebMotors sem sair do painel.
      </p>

      {showAutoDelistHint ? (
        <p className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Quando você marcar este veículo como vendido ou inativo, o anúncio será removido
          automaticamente dos portais conectados.
        </p>
      ) : null}

      {!hasConnectedProvider ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          <Link href="/painel/integracoes" className="underline">
            Conecte os portais em Integrações
          </Link>{" "}
          antes de publicar.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {connectedProviders.includes("olx") ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishOlx}
                onChange={(event) => setPublishOlx(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Publicar na OLX
            </label>
          ) : null}
          {connectedProviders.includes("webmotors") ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publishWebmotors}
                onChange={(event) => setPublishWebmotors(event.target.checked)}
                className="size-4 rounded border-input"
              />
              Publicar na WebMotors
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={handlePublish}>
              {isPending ? "Publicando…" : "Publicar nos portais selecionados"}
            </Button>
            {hasPublishedListing ? (
              <Button type="button" variant="outline" disabled={isPending} onClick={handleDelist}>
                Remover dos portais
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {listings.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
          {listings.map((listing) => (
            <li key={listing.provider} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{PROVIDER_LABEL[listing.provider]}</span>
              <Badge variant="outline">{listingStatusLabel(listing.syncStatus)}</Badge>
              {listing.externalListingUrl && listing.syncStatus === "published" ? (
                <a
                  href={listing.externalListingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ver anúncio na {PROVIDER_LABEL[listing.provider]}
                </a>
              ) : null}
              {listing.lastError ? (
                <span className="text-destructive">{listing.lastError}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          Este veículo ainda não foi publicado em nenhum portal.
        </p>
      )}

      {recentJobs.length > 0 ? (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Últimas sincronizações</p>
          {recentJobs.map((job, index) => (
            <p key={`${job.provider}-${job.action}-${index}`}>
              {PROVIDER_LABEL[job.provider]} · {job.action === "publish" ? "Publicar" : "Remover"}{" "}
              · {jobStatusLabel(job.status)}
              {job.lastError ? ` · ${job.lastError}` : ""}
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
