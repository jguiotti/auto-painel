"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";
import { Badge, Button } from "@autopainel/shared/ui";

import {
  delistVehicleFromClassifiedsAction,
  publishVehicleToClassifiedsAction,
} from "@/app/painel/estoque/classified-actions";

export interface VehicleClassifiedListingStatus {
  provider: ClassifiedsProvider;
  syncStatus: "pending" | "published" | "delisted" | "error";
  lastSyncedAt: string | null;
  lastError: string | null;
  externalListingUrl: string | null;
}

interface VehicleClassifiedsPanelProps {
  vehicleId: string;
  enabled: boolean;
  enabledProviders: ClassifiedsProvider[];
  connectedProviders: ClassifiedsProvider[];
  listings: VehicleClassifiedListingStatus[];
  recentJobs: Array<{
    provider: ClassifiedsProvider;
    action: "publish" | "delist";
    status: string;
    lastError: string | null;
  }>;
  showAutoDelistHint?: boolean;
}

const PROVIDER_LABEL: Record<ClassifiedsProvider, string> = {
  olx: "OLX",
  webmotors: "WebMotors",
  icarros: "iCarros",
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
  enabledProviders,
  connectedProviders,
  listings,
  recentJobs,
  showAutoDelistHint = false,
}: VehicleClassifiedsPanelProps) {
  const publishableProviders = useMemo(
    () => enabledProviders.filter((provider) => connectedProviders.includes(provider)),
    [connectedProviders, enabledProviders],
  );

  const [selectedProviders, setSelectedProviders] = useState<Record<ClassifiedsProvider, boolean>>(
    () => ({
      olx: publishableProviders.includes("olx"),
      webmotors: publishableProviders.includes("webmotors"),
      icarros: publishableProviders.includes("icarros"),
    }),
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
    const providers = publishableProviders.filter((provider) => selectedProviders[provider]);

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

  function handleDelist(providers?: ClassifiedsProvider[]) {
    setMessage(null);
    startTransition(async () => {
      const result = await delistVehicleFromClassifiedsAction(vehicleId, providers);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        providers?.length === 1
          ? `Remoção iniciada em ${PROVIDER_LABEL[providers[0]]}.`
          : "Remoção iniciada nos portais selecionados.",
      );
    });
  }

  const hasPublishedListing = listings.some((entry) => entry.syncStatus === "published");
  const publishedProviders = listings
    .filter((entry) => entry.syncStatus === "published")
    .map((entry) => entry.provider);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Portais classificados</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Publique ou remova este veículo nos portais conectados sem sair do painel.
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
          {publishableProviders.map((provider) => (
            <label key={provider} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedProviders[provider]}
                onChange={(event) => {
                  setSelectedProviders((current) => ({
                    ...current,
                    [provider]: event.target.checked,
                  }));
                }}
                className="size-4 rounded border-input"
              />
              Publicar na {PROVIDER_LABEL[provider]}
            </label>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={handlePublish}>
              {isPending ? "Publicando…" : "Publicar nos portais selecionados"}
            </Button>
            {hasPublishedListing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleDelist()}
                >
                  Remover de todos publicados
                </Button>
                {publishedProviders.map((provider) => (
                  <Button
                    key={`delist-${provider}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelist([provider])}
                  >
                    Remover só {PROVIDER_LABEL[provider]}
                  </Button>
                ))}
              </>
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
