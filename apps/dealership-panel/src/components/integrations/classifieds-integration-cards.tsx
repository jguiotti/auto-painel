"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import {
  classifiedsConnectDialogDescription,
  classifiedsConnectDialogTitle,
  classifiedsConnectFailureMessage,
  classifiedsConnectSuccessMessage,
  classifiedsDisconnectSuccessMessage,
  classifiedsPopupBlockedMessage,
  classifiedsProviderLabel,
  classifiedsProviderUnavailableMessage,
  mapClassifiedsOAuthCallbackError,
} from "@/lib/integrations/integration-user-messages";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required";

export interface ClassifiedsConnectionRow {
  provider: ClassifiedsProvider;
  status: ConnectionStatus;
  token_expires_at: string | null;
  connected_at: string | null;
  last_error: string | null;
}

interface OAuthMessagePayload {
  source: "autopainel_classifieds_oauth";
  provider: ClassifiedsProvider;
  success: boolean;
  error?: string;
}

export type ClassifiedsProviderAvailability = Record<ClassifiedsProvider, boolean>;

interface ClassifiedsIntegrationCardsProps {
  isEnabled: boolean;
  connections: ClassifiedsConnectionRow[];
  providerAvailability: ClassifiedsProviderAvailability;
}

const PROVIDERS: Array<{
  key: ClassifiedsProvider;
  subtitle: string;
}> = [
  {
    key: "olx",
    subtitle: "Publique e atualize anúncios na OLX a partir do seu estoque.",
  },
  {
    key: "webmotors",
    subtitle: "Envie veículos para a WebMotors com login seguro no portal.",
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
  if (status === "connecting") {
    return "Conectando...";
  }
  if (status === "error" || status === "reauth_required") {
    return "Conectar novamente";
  }
  return "Conectar";
}

function formatConnectedAt(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ClassifiedsIntegrationCards({
  isEnabled,
  connections,
  providerAvailability,
}: ClassifiedsIntegrationCardsProps) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<ClassifiedsProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ClassifiedsProvider | null>(null);
  const [dialogProvider, setDialogProvider] = useState<ClassifiedsProvider | null>(null);
  const [unavailableProvider, setUnavailableProvider] = useState<ClassifiedsProvider | null>(
    null,
  );
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupWatchRef = useRef<number | null>(null);

  const connectionMap = useMemo(() => {
    const map = new Map<ClassifiedsProvider, ClassifiedsConnectionRow>();
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
      setDialogProvider(null);
      if (payload.success) {
        setInlineFeedback(classifiedsConnectSuccessMessage(payload.provider));
      } else {
        const friendly =
          mapClassifiedsOAuthCallbackError(payload.error) ??
          classifiedsConnectFailureMessage(payload.provider);
        setInlineFeedback(friendly);
      }
      router.refresh();
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPopupWatch();
    };
  }, [router]);

  function openConnectDialog(provider: ClassifiedsProvider) {
    setInlineFeedback(null);
    if (!providerAvailability[provider]) {
      setUnavailableProvider(provider);
      return;
    }
    setDialogProvider(provider);
  }

  async function startOAuthFromDialog() {
    const provider = dialogProvider;
    if (!provider) {
      return;
    }

    setPendingProvider(provider);

    try {
      const res = await fetch(
        `/api/painel/integracoes/oauth/start?provider=${provider}`,
        { method: "POST" },
      );
      const payload = (await res.json()) as
        | { authorizationUrl: string }
        | { error: string; code?: string; provider?: ClassifiedsProvider };

      if (!res.ok || !("authorizationUrl" in payload)) {
        setPendingProvider(null);
        setDialogProvider(null);
        if ("code" in payload && payload.code === "oauth_not_configured") {
          setUnavailableProvider(provider);
          return;
        }
        setInlineFeedback(
          "error" in payload
            ? payload.error
            : classifiedsConnectFailureMessage(provider),
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
        setInlineFeedback(classifiedsPopupBlockedMessage());
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
          setDialogProvider(null);
          router.refresh();
        }
      }, 600);
    } catch {
      setPendingProvider(null);
      setInlineFeedback(classifiedsConnectFailureMessage(provider));
    }
  }

  async function disconnectProvider(provider: ClassifiedsProvider) {
    setInlineFeedback(null);
    setDisconnectingProvider(provider);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("disconnect_dealership_classifieds_connection", {
        p_provider: provider,
      });
      setDisconnectingProvider(null);
      if (error) {
        setInlineFeedback("Não foi possível desconectar. Tente novamente.");
        return;
      }
      setInlineFeedback(classifiedsDisconnectSuccessMessage(provider));
      router.refresh();
    } catch {
      setDisconnectingProvider(null);
      setInlineFeedback("Não foi possível desconectar. Tente novamente.");
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
          const isBusy =
            pendingProvider === provider.key ||
            disconnectingProvider === provider.key ||
            status === "connecting";
          const actionLabel = resolveActionLabel(status);
          const connectedAtLabel = formatConnectedAt(row?.connected_at ?? null);
          const canConnect = providerAvailability[provider.key];

          return (
            <Card key={provider.key}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{classifiedsProviderLabel(provider.key)}</CardTitle>
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
                {status === "connected" && connectedAtLabel ? (
                  <p className="text-xs text-muted-foreground">
                    Conectado em {connectedAtLabel}.
                  </p>
                ) : null}

                {row?.last_error ? (
                  <p className="text-xs text-destructive">
                    {mapClassifiedsOAuthCallbackError(row.last_error) ?? row.last_error}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {canConnect
                      ? "Clique em Conectar e faça login na janela que abrir. A conexão é concluída automaticamente."
                      : "Este canal será liberado pela equipe de suporte quando estiver disponível para sua loja."}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!isEnabled || isBusy || status === "connected"}
                    onClick={() => {
                      openConnectDialog(provider.key);
                    }}
                  >
                    {actionLabel}
                  </Button>
                  {status === "connected" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isEnabled || isBusy}
                      onClick={() => {
                        void disconnectProvider(provider.key);
                      }}
                    >
                      Desconectar
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={dialogProvider !== null}
        onOpenChange={(open) => {
          if (!open && pendingProvider === null) {
            setDialogProvider(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogProvider ? classifiedsConnectDialogTitle(dialogProvider) : "Conectar"}
            </DialogTitle>
            <DialogDescription>
              {dialogProvider
                ? classifiedsConnectDialogDescription(dialogProvider)
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={pendingProvider !== null}
              onClick={() => {
                setDialogProvider(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pendingProvider !== null}
              onClick={() => {
                void startOAuthFromDialog();
              }}
            >
              {pendingProvider ? "Abrindo login..." : "Continuar para login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={unavailableProvider !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUnavailableProvider(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Canal indisponível</AlertDialogTitle>
            <AlertDialogDescription>
              {unavailableProvider
                ? classifiedsProviderUnavailableMessage(unavailableProvider)
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
