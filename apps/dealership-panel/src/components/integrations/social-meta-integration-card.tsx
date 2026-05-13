"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required";

export interface MetaConnectionRow {
  status: ConnectionStatus;
  page_name: string | null;
  instagram_username: string | null;
  token_expires_at: string | null;
  connected_at: string | null;
  last_error: string | null;
}

interface OAuthMessagePayload {
  source: "autopainel_meta_oauth";
  success: boolean;
  error?: string;
}

interface SocialMetaIntegrationCardProps {
  isEnabled: boolean;
  connection: MetaConnectionRow | null;
  /** False until the dealership saved Meta App ID (or env fallback exists for dev). */
  canStartOAuth?: boolean;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  connected: "Conectado",
  error: "Erro",
  reauth_required: "Reconexão necessária",
};

function resolveStatusVariant(
  status: ConnectionStatus,
): "default" | "secondary" | "outline" {
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
  return "Conectar Facebook / Instagram";
}

export function SocialMetaIntegrationCard({
  isEnabled,
  connection,
  canStartOAuth = true,
}: SocialMetaIntegrationCardProps) {
  const router = useRouter();
  const status = connection?.status ?? "disconnected";
  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const popupWatchRef = useRef<number | null>(null);

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
      if (!payload || payload.source !== "autopainel_meta_oauth") {
        return;
      }
      stopPopupWatch();
      popupRef.current = null;
      setPendingOAuth(false);
      if (payload.success) {
        setInlineFeedback("Conexão com Meta concluída.");
      } else {
        setInlineFeedback(
          payload.error ??
            "Não foi possível concluir a autorização Meta (Facebook / Instagram).",
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

  async function startMetaOAuth() {
    setInlineFeedback(null);
    setPendingOAuth(true);

    try {
      const response = await fetch("/api/painel/integracoes/meta/oauth/start", {
        method: "POST",
      });
      const payload = (await response.json()) as
        | { authorizationUrl: string }
        | { error: string };

      if (!response.ok || !("authorizationUrl" in payload)) {
        setPendingOAuth(false);
        setInlineFeedback(
          "error" in payload
            ? payload.error
            : "Não foi possível iniciar a autenticação Meta.",
        );
        return;
      }

      const popup = window.open(
        payload.authorizationUrl,
        "autopainel-meta-oauth",
        "popup=yes,width=560,height=760,noopener,noreferrer",
      );
      if (!popup) {
        setPendingOAuth(false);
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
          setPendingOAuth(false);
          router.refresh();
        }
      }, 600);
    } catch (error) {
      setPendingOAuth(false);
      setInlineFeedback(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar OAuth Meta.",
      );
    }
  }

  async function disconnectMeta() {
    setInlineFeedback(null);
    setDisconnecting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("disconnect_dealership_meta_connection");
      setDisconnecting(false);
      if (error) {
        setInlineFeedback(
          error.message ?? "Não foi possível desconectar a conta Meta.",
        );
        return;
      }
      setInlineFeedback("Conta Meta desconectada.");
      router.refresh();
    } catch (error) {
      setDisconnecting(false);
      setInlineFeedback(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao desconectar Meta.",
      );
    }
  }

  const isBusy =
    pendingOAuth || disconnecting || status === "connecting";
  const actionLabel = resolveActionLabel(status);

  return (
    <div className="space-y-4">
      {inlineFeedback ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
          {inlineFeedback}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Facebook Page e Instagram</CardTitle>
              <CardDescription>
                A sua aplicação Meta (developers.facebook.com) liga a página e o
                Instagram Business. Fluxo iniciado no painel; futuras chamadas à Graph
                API na AutoPainel usam apenas tokens desta loja.
              </CardDescription>
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
          {connection?.page_name ||
          connection?.instagram_username ? (
            <div className="text-xs text-muted-foreground">
              {connection.page_name ? (
                <p>
                  <span className="font-medium text-foreground">Página:</span>{" "}
                  {connection.page_name}
                </p>
              ) : null}
              {connection.instagram_username ? (
                <p>
                  <span className="font-medium text-foreground">Instagram:</span>{" "}
                  @{connection.instagram_username}
                </p>
              ) : (
                <p>
                  Instagram Business não detectado para a página escolhida (ainda pode
                  publicar na página Facebook).
                </p>
              )}
            </div>
          ) : null}

          {connection?.last_error ? (
            <p className="text-xs text-destructive">{connection.last_error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Conceda as permissões de página e Instagram Business pedidas no diálogo
              Meta.
            </p>
          )}

          {!canStartOAuth ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Guarde primeiro o App ID (e o App Secret) da sua aplicação Meta na secção
              acima, ou configure META_APP_CLIENT_ID no servidor apenas para
              desenvolvimento.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                !isEnabled || isBusy || status === "connected" || !canStartOAuth
              }
              onClick={() => {
                void startMetaOAuth();
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
                  void disconnectMeta();
                }}
              >
                Desconectar
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
