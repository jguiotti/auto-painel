"use client";

import { useState, useTransition } from "react";

import { Button } from "@autopainel/shared/ui";

import { enqueueVehicleSocialShareAction } from "@/app/painel/estoque/social-actions";

interface VehicleSocialSharePanelProps {
  vehicleId: string;
  enabled: boolean;
  metaConnected: boolean;
  artifactTemplateLabel: string;
}

export function VehicleSocialSharePanel({
  vehicleId,
  enabled,
  metaConnected,
  artifactTemplateLabel,
}: VehicleSocialSharePanelProps) {
  const [instagram, setInstagram] = useState(true);
  const [facebook, setFacebook] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        A publicação automática nas redes sociais não está incluída no plano da sua loja.
      </div>
    );
  }

  function handleShare() {
    setMessage(null);
    const channels: Array<"instagram_feed" | "facebook_page"> = [];
    if (instagram) {
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
        "Publicação enfileirada. As imagens serão geradas com a máscara da loja e enviadas à Meta.",
      );
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium">Compartilhar nas redes sociais</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Estilo visual: {artifactTemplateLabel}. Imagens em formato quadrado com a logo da sua loja.
      </p>

      {!metaConnected ? (
        <p className="mt-3 text-sm text-amber-700">
          Conecte Facebook/Instagram em Integrações para habilitar o compartilhamento.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={instagram}
              onChange={(event) => setInstagram(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Postar no Instagram Feed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={facebook}
              onChange={(event) => setFacebook(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Postar na Facebook Page
          </label>
          <Button type="button" disabled={isPending || (!instagram && !facebook)} onClick={handleShare}>
            {isPending ? "Enfileirando…" : "Compartilhar agora"}
          </Button>
        </div>
      )}

      {message ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
