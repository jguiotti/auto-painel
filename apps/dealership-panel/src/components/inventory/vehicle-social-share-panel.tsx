"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  slideUrls: string[];
  slideCount: number | null;
  facebookPostId: string | null;
  instagramPostId: string | null;
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
    return "Na fila";
  }
  if (status === "rendering") {
    return "Preparando carrossel";
  }
  if (status === "uploading_meta") {
    return "Publicando";
  }
  if (status === "published") {
    return "Publicado";
  }
  if (status === "failed" || status === "failed_partial") {
    return "Falhou";
  }
  return status;
}

function jobStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "published") {
    return "default";
  }
  if (status === "failed" || status === "failed_partial") {
    return "outline";
  }
  if (status === "queued" || status === "rendering" || status === "uploading_meta") {
    return "secondary";
  }
  return "outline";
}

function channelLabel(channel: string): string {
  if (channel === "facebook_page") {
    return "Facebook";
  }
  if (channel === "instagram_feed") {
    return "Instagram";
  }
  return channel;
}

function facebookPostUrl(postId: string): string {
  return `https://www.facebook.com/${postId}`;
}

function CarouselStrip({ urls, altPrefix }: { urls: string[]; altPrefix: string }) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
        >
          <Image
            src={url}
            alt={`${altPrefix} slide ${index + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {index + 1}/{urls.length}
          </span>
        </div>
      ))}
    </div>
  );
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
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [instagram, setInstagram] = useState(true);
  const [facebook, setFacebook] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [publishSlideUrls, setPublishSlideUrls] = useState<string[]>([]);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  const instagramDisabled = !hasInstagramBusiness;

  useEffect(() => {
    if (!dialogOpen || imageCount === 0) {
      return;
    }

    setErrorMessage(null);
    setPublishSuccess(false);
    setPublishSlideUrls([]);
    startPreviewTransition(async () => {
      const result = await previewVehicleCarouselAction(vehicleId);
      if ("error" in result && result.error) {
        setErrorMessage(result.error);
        setPreviewUrls([]);
        return;
      }
      if (!("success" in result) || !result.success || !result.imageUrls?.length) {
        setErrorMessage("Não foi possível gerar o preview do carrossel.");
        setPreviewUrls([]);
        return;
      }
      setPreviewUrls(result.imageUrls);
    });
  }, [dialogOpen, imageCount, vehicleId]);

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        A publicação automática nas redes sociais não está incluída no plano da sua loja.
      </div>
    );
  }

  function handlePublish() {
    setMessage(null);
    setErrorMessage(null);
    const channels: Array<"instagram_feed" | "facebook_page"> = [];
    if (instagram && !instagramDisabled) {
      channels.push("instagram_feed");
    }
    if (facebook) {
      channels.push("facebook_page");
    }

    if (channels.length === 0) {
      setErrorMessage("Selecione ao menos um canal para publicar.");
      return;
    }

    startTransition(async () => {
      const result = await enqueueVehicleSocialShareAction(vehicleId, channels);
      if ("error" in result && result.error) {
        setErrorMessage(result.error);
        return;
      }

      if ("mock" in result && result.mock) {
        setPublishSuccess(true);
        setMessage("Publicação simulada concluída (modo gravação).");
        router.refresh();
        return;
      }

      if ("slideUrls" in result && result.slideUrls?.length) {
        setPublishSlideUrls(result.slideUrls);
      } else if (previewUrls.length > 0) {
        setPublishSlideUrls(previewUrls);
      }

      setPublishSuccess(true);
      setMessage(
        "message" in result && result.message
          ? result.message
          : `Carrossel com ${result.slideCount ?? previewUrls.length} slides enviado para publicação.`,
      );
      router.refresh();
    });
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setPublishSuccess(false);
      setPublishSlideUrls([]);
      setErrorMessage(null);
    }
  }

  const displaySlides = publishSlideUrls.length > 0 ? publishSlideUrls : previewUrls;
  const latestPublishedJob = recentJobs.find((job) => job.status === "published");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Compartilhar nas redes sociais</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Estilo {artifactTemplateLabel} · carrossel com logo da loja e slide de encerramento.
      </p>

      {!metaConnected ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
          <Link href="/painel/integracoes#redes-sociais" className="underline">
            Conecte Instagram e Facebook em Integrações
          </Link>{" "}
          para habilitar o compartilhamento.
        </p>
      ) : (
        <div className="mt-4">
          <Button
            type="button"
            disabled={imageCount === 0}
            onClick={() => setDialogOpen(true)}
          >
            Compartilhar carrossel nas redes
          </Button>
          {imageCount === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Adicione fotos ao veículo para publicar.
            </p>
          ) : null}
        </div>
      )}

      {latestPublishedJob ? (
        <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Última publicação</Badge>
            <span className="text-xs text-muted-foreground">
              {latestPublishedJob.publishedAt
                ? new Date(latestPublishedJob.publishedAt).toLocaleString("pt-BR")
                : new Date(latestPublishedJob.createdAt).toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {latestPublishedJob.slideCount ?? latestPublishedJob.slideUrls.length} slides publicados
            em{" "}
            {latestPublishedJob.channels.map((channel) => channelLabel(channel)).join(" e ")}
          </p>
          <div className="mt-3">
            <CarouselStrip urls={latestPublishedJob.slideUrls} altPrefix="Publicado" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {latestPublishedJob.facebookPostId ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={facebookPostUrl(latestPublishedJob.facebookPostId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver no Facebook
                </a>
              </Button>
            ) : null}
            {latestPublishedJob.instagramPostId ? (
              <Badge variant="outline">Instagram · publicado</Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      {recentJobs.length > 0 ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-xs font-medium text-foreground">Histórico de publicações</p>
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-md border border-border/80 bg-background p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
                <span className="text-xs text-muted-foreground">
                  {job.publishedAt
                    ? new Date(job.publishedAt).toLocaleString("pt-BR")
                    : new Date(job.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Canais: {job.channels.map((channel) => channelLabel(channel)).join(", ")}
                {job.slideCount ? ` · ${job.slideCount} slides` : ""}
              </p>
              {job.slideUrls.length > 0 ? (
                <CarouselStrip urls={job.slideUrls} altPrefix="Job" />
              ) : null}
              {job.errorDetail ? (
                <p className="text-xs text-destructive">{job.errorDetail}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {job.facebookPostId ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={facebookPostUrl(job.facebookPostId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  </Button>
                ) : null}
                {job.instagramPostId ? (
                  <Badge variant="outline">Instagram publicado</Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Publicar carrossel nas redes</DialogTitle>
            <DialogDescription>
              Revise exatamente o que será publicado no Facebook e Instagram.
            </DialogDescription>
          </DialogHeader>

          {isPreviewPending ? (
            <p className="text-sm text-muted-foreground">Gerando preview do carrossel…</p>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {displaySlides.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                {publishSuccess ? "Carrossel enviado" : "Preview do carrossel"} (
                {displaySlides.length} slides)
              </p>
              <CarouselStrip urls={displaySlides} altPrefix="Preview" />
            </div>
          ) : null}

          {!publishSuccess ? (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs font-medium">Onde publicar</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={instagram}
                  disabled={instagramDisabled}
                  onChange={(event) => setInstagram(event.target.checked)}
                  className="size-4 rounded border-input"
                />
                {instagramDisabled
                  ? "Instagram — requer conta Business vinculada"
                  : "Instagram Feed (carrossel)"}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={facebook}
                  onChange={(event) => setFacebook(event.target.checked)}
                  className="size-4 rounded border-input"
                />
                Facebook Page (carrossel)
              </label>
            </div>
          ) : null}

          {message ? (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
              Fechar
            </Button>
            {!publishSuccess ? (
              <Button
                type="button"
                disabled={
                  isPending ||
                  isPreviewPending ||
                  displaySlides.length === 0 ||
                  (!instagram && !facebook) ||
                  (instagram && instagramDisabled && !facebook)
                }
                onClick={handlePublish}
              >
                {isPending ? "Publicando…" : "Publicar carrossel"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
