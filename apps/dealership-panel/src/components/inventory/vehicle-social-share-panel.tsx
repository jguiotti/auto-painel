"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

import {
  enqueueVehicleSocialShareAction,
  previewVehicleCarouselAction,
} from "@/app/painel/estoque/social-actions";

export interface SocialPublicationJobSummary {
  id: string;
  status: string;
  channels: string[];
  errorDetail: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface VehicleSocialSharePanelProps {
  vehicleId: string;
  enabled: boolean;
  metaConnected: boolean;
  hasInstagramBusiness: boolean;
  artifactTemplateLabel: string;
  imageCount: number;
  recentJobs: SocialPublicationJobSummary[];
}

function jobStatusLabel(status: string): string {
  if (status === "queued") {
    return "Aguardando publicação…";
  }
  if (status === "rendering") {
    return "Gerando carrossel…";
  }
  if (status === "uploading_meta") {
    return "Publicando nas redes…";
  }
  if (status === "published") {
    return "Publicado";
  }
  if (status === "failed" || status === "failed_partial") {
    return "Erro";
  }
  return status;
}

export function VehicleSocialSharePanel({
  vehicleId,
  enabled,
  metaConnected,
  hasInstagramBusiness,
  artifactTemplateLabel,
  imageCount,
  recentJobs,
}: VehicleSocialSharePanelProps) {
  const [instagram, setInstagram] = useState(true);
  const [facebook, setFacebook] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        A publicação automática nas redes sociais não está incluída no plano da sua loja.
      </div>
    );
  }

  const instagramDisabled = !hasInstagramBusiness;
  const instagramMinSlidesWarning =
    instagram && !instagramDisabled && imageCount < 1
      ? null
      : null;

  function handleShare() {
    setMessage(null);
    const channels: Array<"instagram_feed" | "facebook_page"> = [];
    if (instagram && !instagramDisabled) {
      channels.push("instagram_feed");
    }
    if (facebook) {
      channels.push("facebook_page");
    }

    startTransition(async () => {
      const result = await enqueueVehicleSocialShareAction(vehicleId, channels);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        "mock" in result && result.mock
          ? "Publicação simulada concluída — Facebook e Instagram (modo gravação)."
          : "Publicação iniciada. Acompanhe o status abaixo.",
      );
    });
  }

  function handlePreview() {
    setPreviewError(null);
    startPreviewTransition(async () => {
      const result = await previewVehicleCarouselAction(vehicleId);
      if ("error" in result && result.error) {
        setPreviewError(result.error);
        setPreviewOpen(true);
        return;
      }
      if (!("success" in result) || !result.success || !result.imageUrls?.length) {
        setPreviewError("Não foi possível gerar o preview do carrossel.");
        setPreviewOpen(true);
        return;
      }
      setPreviewUrls(result.imageUrls);
      setPreviewOpen(true);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Compartilhar nas redes sociais</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Estilo visual: {artifactTemplateLabel}. Carrossel com logo da loja e slide de encerramento.
      </p>

      {!metaConnected ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          <Link href="/painel/integracoes#redes-sociais" className="underline">
            Conecte Instagram e Facebook em Integrações
          </Link>{" "}
          para habilitar o compartilhamento.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={instagram}
              disabled={instagramDisabled}
              onChange={(event) => setInstagram(event.target.checked)}
              className="size-4 rounded border-input"
            />
            {instagramDisabled
              ? "Postar no Instagram Feed — disponível com conta Instagram Business vinculada"
              : "Postar no Instagram Feed"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={facebook}
              onChange={(event) => setFacebook(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Postar na Página do Facebook
          </label>

          {instagramMinSlidesWarning ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {instagramMinSlidesWarning}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPreviewPending || imageCount === 0}
              onClick={handlePreview}
            >
              {isPreviewPending ? "Gerando preview…" : "Ver preview do carrossel"}
            </Button>
            <Button
              type="button"
              disabled={isPending || (!instagram && !facebook) || imageCount === 0}
              onClick={handleShare}
            >
              {isPending ? "Enfileirando…" : "Compartilhar agora"}
            </Button>
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}

      {recentJobs.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-medium text-foreground">Publicações recentes</p>
          {recentJobs.map((job) => (
            <div key={job.id} className="text-xs text-muted-foreground">
              <p>
                {jobStatusLabel(job.status)}
                {job.publishedAt
                  ? ` · ${new Date(job.publishedAt).toLocaleString("pt-BR")}`
                  : ` · ${new Date(job.createdAt).toLocaleString("pt-BR")}`}
              </p>
              {job.errorDetail ? (
                <p className="text-destructive">{job.errorDetail}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview do carrossel</DialogTitle>
            <DialogDescription>
              Assim seu veículo aparecerá no Instagram e Facebook.
            </DialogDescription>
          </DialogHeader>

          {previewError ? (
            <p className="text-sm text-destructive" role="alert">
              {previewError}
            </p>
          ) : null}

          {previewUrls.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {previewUrls.map((url, index) => (
                <div key={url} className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg border">
                  <Image src={url} alt={`Slide ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          {!previewError && previewUrls.length === 0 && isPreviewPending ? (
            <p className="text-sm text-muted-foreground">Gerando preview…</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
