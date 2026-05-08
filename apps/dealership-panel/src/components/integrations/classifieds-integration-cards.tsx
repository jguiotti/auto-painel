"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required";

type ProviderKey = "olx" | "webmotors";

export interface ClassifiedsConnectionRow {
  provider: ProviderKey;
  status: ConnectionStatus;
  token_expires_at: string | null;
  connected_at: string | null;
  last_error: string | null;
}

interface OAuthMessagePayload {
  source: "autopainel_classifieds_oauth";
  provider: ProviderKey;
  success: boolean;
  error?: string;
}

interface ClassifiedsIntegrationCardsProps {
  isEnabled: boolean;
  connections: ClassifiedsConnectionRow[];
}

const PROVIDERS: Array<{
  key: ProviderKey;
  label: string;
  subtitle: string;
}> = [
  {
    key: "olx",
    label: "OLX",
    subtitle: "Sincronização com o ecossistema OLX Brasil",
  },
  {
    key: "webmotors",
    label: "WebMotors",
    subtitle: "Sincronização via ambiente de integração do Cockpit",
  },
];

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  connected: "Conectado",
  error: "Erro",
  reauth_required: "Reconexão necessária",
};

function resolveStatusVariant(status: ConnectionStatus): "default" | "secondary" | "outline" {
  if (status === "connected") {
    return "default";
  }
  if (status === "error" || status === "reauth_required") {
    return "outline";
  }
  if (status === "connecting") {
    return "secondary";
  }
  return "outline";
}

function resolveActionLabel(status: ConnectionStatus): string {
  if (status === "connected") {
    return "Conectado";
  }
  if (status === "connecting") {
    return "Conectando...";
  }
  if (status === "error" || status === "reauth_required") {
    return "Reconectar";
  }
  return "Conectar";
}

export function ClassifiedsIntegrationCards({
  isEnabled,
  connections,
}: ClassifiedsIntegrationCardsProps) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<ProviderKey | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupWatchRef = useRef<number | null>(null);

  const connectionMap = useMemo(() => {
    const map = new Map<ProviderKey, ClassifiedsConnectionRow>();
    for (const row of connections) {
      map.set(row.provider, row);
    }
    return map;
  }, [connections]);

  useEffect(() => {
    const allowedOrigins = new Set<string>([window.location.origin]);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        allowedOrigins.add(new URL(supabaseUrl).origin);
      } catch {
        // ignore invalid runtime env value
      }
    }

    function stopPopupWatch() {
      if (popupWatchRef.current !== null) {
        window.clearInterval(popupWatchRef.current);
        popupWatchRef.current = null;
      }
    }

    function onMessage(event: MessageEvent<OAuthMessagePayload>) {
      if (!allowedOrigins.has(event.origin)) {
        return;
      }
      const payload = event.data;
      if (!payload || payload.source !== "autopainel_classifieds_oauth") {
        return;
      }
      stopPopupWatch();
      popupRef.current = null;
      setPendingProvider(null);
      if (payload.success) {
        setInlineFeedback(`Conexão com ${payload.provider.toUpperCase()} concluída.`);
      } else {
        setInlineFeedback(
          payload.error ??
            `Não foi possível concluir a conexão com ${payload.provider.toUpperCase()}.`,
        );
      }
      router.refresh();
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPopupWatch();
    };
  }, [router]);

  async function connectProvider(provider: ProviderKey) {
    setInlineFeedback(null);
    setPendingProvider(provider);

    try {
      const res = await fetch(
        `/api/painel/integracoes/oauth/start?provider=${provider}`,
        {
          method: "POST",
        },
      );
      const payload = (await res.json()) as
        | { authorizationUrl: string }
        | { error: string };

      if (!res.ok || !("authorizationUrl" in payload)) {
        setPendingProvider(null);
        setInlineFeedback(
          "error" in payload
            ? payload.error
            : "Não foi possível iniciar a autenticação.",
        );
        return;
      }

      const popup = window.open(
        payload.authorizationUrl,
        `autopainel-oauth-${provider}`,
        "popup=yes,width=560,height=760,noopener,noreferrer",
      );
      if (!popup) {
        setPendingProvider(null);
        setInlineFeedback(
          "O navegador bloqueou a popup. Permita popups para continuar.",
        );
        return;
      }

      popupRef.current = popup;
      popupWatchRef.current = window.setInterval(() => {
        if (!popupRef.current || popupRef.current.closed) {
          if (popupWatchRef.current !== null) {
            window.clearInterval(popupWatchRef.current);
            popupWatchRef.current = null;
          }
          popupRef.current = null;
          setPendingProvider(null);
          router.refresh();
        }
      }, 600);
    } catch (error) {
      setPendingProvider(null);
      setInlineFeedback(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar conexão OAuth2.",
      );
    }
  }

  return (
    <div className="space-y-4">
      {inlineFeedback ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
          {inlineFeedback}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const row = connectionMap.get(provider.key);
          const status = row?.status ?? "disconnected";
          const isBusy = pendingProvider === provider.key || status === "connecting";
          const actionLabel = resolveActionLabel(status);

          return (
            <Card key={provider.key}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{provider.label}</CardTitle>
                    <CardDescription>{provider.subtitle}</CardDescription>
                  </div>
                  <Badge
                    variant={resolveStatusVariant(status)}
                    className={
                      status === "error" || status === "reauth_required"
                        ? "border-destructive/60 text-destructive"
                        : undefined
                    }
                  >
                    {STATUS_LABEL[status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {row?.last_error ? (
                  <p className="text-xs text-destructive">{row.last_error}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Fluxo de conexão por popup OAuth2 com fechamento automático.
                  </p>
                )}

                <Button
                  type="button"
                  disabled={!isEnabled || isBusy || status === "connected"}
                  onClick={() => {
                    void connectProvider(provider.key);
                  }}
                >
                  {actionLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
