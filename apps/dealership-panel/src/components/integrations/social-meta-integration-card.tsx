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

import { connectMetaMockAction } from "@/app/painel/integracoes/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { MetaPagePickerDialog } from "./meta-page-picker-dialog";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required"
  | "page_selection_required";

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
  requiresPageSelection?: boolean;
  pageCount?: number;
}

interface SocialMetaIntegrationCardProps {
  isEnabled: boolean;
  connection: MetaConnectionRow | null;
  canStartOAuth?: boolean;
  mockMode?: boolean;
}

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  connected: "Conectado",
  error: "Erro na conexão",
  reauth_required: "Reconexão necessária",
  page_selection_required: "Escolha a página",
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
  if (status === "connecting" || status === "page_selection_required") {
    return "secondary";
  }
  return "outline";
}

function resolveActionLabel(status: ConnectionStatus, pendingOAuth: boolean): string {
  if (status === "connected") {
    return "Conectado";
  }
  if (pendingOAuth) {
    return "Conectando…";
  }
  if (status === "connecting") {
    return "Tentar novamente";
  }
  if (status === "page_selection_required") {
    return "Escolher página";
  }
  if (status === "error" || status === "reauth_required") {
    return "Reconectar conta";
  }
  return "Conectar com Facebook";
}

function resolveWizardStep(status: ConnectionStatus): number {
  if (status === "connected") {
    return 3;
  }
  if (status === "page_selection_required" || status === "connecting") {
    return 2;
  }
  return 1;
}

export function SocialMetaIntegrationCard({
  isEnabled,
  connection,
  canStartOAuth = true,
  mockMode = false,
}: SocialMetaIntegrationCardProps) {
  const router = useRouter();
  const status = connection?.status ?? "disconnected";
  const wizardStep = resolveWizardStep(status);
  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [pagePickerDismissedScope, setPagePickerDismissedScope] = useState<string | null>(
    null,
  );
  const pagePickerScope =
    status === "page_selection_required" ? "page_selection_required" : "idle";
  const pagePickerDismissed = pagePickerDismissedScope === pagePickerScope;
  const popupRef = useRef<Window | null>(null);
  const popupWatchRef = useRef<number | null>(null);
  const oauthMessageReceivedRef = useRef(false);

  const shouldAutoOpenPagePicker =
    status === "page_selection_required" && !pagePickerDismissed;

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
      oauthMessageReceivedRef.current = true;
      if (payload.success) {
        if (payload.requiresPageSelection) {
          setInlineFeedback("Login concluído. Escolha qual página da sua loja usar.");
        } else {
          setInlineFeedback("Conta conectada com sucesso.");
        }
      } else {
        setInlineFeedback(
          payload.error ??
            "Não foi possível concluir a conexão com Facebook e Instagram.",
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

  async function cleanupStaleMetaOAuthAttempt(): Promise<void> {
    try {
      await fetch("/api/painel/integracoes/meta/oauth/cleanup", { method: "POST" });
    } catch {
      // Non-blocking cleanup.
    }
  }

  useEffect(() => {
    if (status !== "connecting") {
      return;
    }
    void cleanupStaleMetaOAuthAttempt().then(() => {
      router.refresh();
    });
  }, [router, status]);

  async function resolveMetaConnectionAfterPopup(): Promise<boolean> {
    try {
      const response = await fetch("/api/painel/integracoes/meta/oauth/connection-status");
      const payload = (await response.json()) as {
        status?: string;
        lastError?: string | null;
      };

      if (payload.status === "connected") {
        setInlineFeedback("Conta conectada com sucesso.");
        return true;
      }
      if (payload.status === "page_selection_required") {
        setInlineFeedback("Login concluído. Escolha qual página da sua loja usar.");
        setPagePickerOpen(true);
        return true;
      }
      if (payload.status === "error" && payload.lastError) {
        setInlineFeedback(payload.lastError);
        return true;
      }
      if (payload.status === "connecting") {
        setInlineFeedback(
          "Conexão não concluída. Feche a janela de login e clique em Conectar novamente.",
        );
        return true;
      }
    } catch {
      // refresh below still runs
    }
    return false;
  }

  async function startMetaOAuth() {
    setInlineFeedback(null);
    setPendingOAuth(true);
    oauthMessageReceivedRef.current = false;

    if (mockMode) {
      try {
        const result = await connectMetaMockAction();
        setPendingOAuth(false);
        if ("error" in result && result.error) {
          setInlineFeedback(result.error);
          return;
        }
        setInlineFeedback("Conta conectada (simulação para gravação).");
        router.refresh();
      } catch (error) {
        setPendingOAuth(false);
        setInlineFeedback(
          error instanceof Error
            ? error.message
            : "Não foi possível simular a conexão Meta.",
        );
      }
      return;
    }

    if (status === "connecting") {
      await cleanupStaleMetaOAuthAttempt();
    }

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
        "popup=yes,width=560,height=760",
      );
      if (!popup) {
        setPendingOAuth(false);
        await cleanupStaleMetaOAuthAttempt();
        router.refresh();
        setInlineFeedback(
          "Seu navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.",
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

          if (!oauthMessageReceivedRef.current) {
            window.setTimeout(() => {
              if (oauthMessageReceivedRef.current) {
                return;
              }
              void resolveMetaConnectionAfterPopup()
                .then((resolved) => {
                  if (!resolved && !oauthMessageReceivedRef.current) {
                    return cleanupStaleMetaOAuthAttempt();
                  }
                  return undefined;
                })
                .finally(() => {
                  router.refresh();
                });
            }, 2500);
          } else {
            router.refresh();
          }
        }
      }, 600);
    } catch (error) {
      setPendingOAuth(false);
      setInlineFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a conexão com Facebook e Instagram.",
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

  const isBusy = pendingOAuth || disconnecting;
  const actionLabel = resolveActionLabel(status, pendingOAuth);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={wizardStep >= 1 ? "default" : "outline"}>1. Conectar conta</Badge>
        <Badge variant={wizardStep >= 2 ? "default" : "outline"}>2. Escolher página</Badge>
        <Badge variant={wizardStep >= 3 ? "default" : "outline"}>3. Pronto</Badge>
      </div>

      {inlineFeedback ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
          {inlineFeedback}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Facebook e Instagram</CardTitle>
              <CardDescription>
                Faça login com a conta Facebook da sua loja e autorize o acesso à Página e ao
                Instagram.
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
          {connection?.page_name || connection?.instagram_username ? (
            <div className="text-xs text-muted-foreground">
              {connection.page_name ? (
                <p>
                  <span className="font-medium text-foreground">Página:</span>{" "}
                  {connection.page_name}
                </p>
              ) : null}
              {connection.instagram_username ? (
                <p>
                  <span className="font-medium text-foreground">Instagram:</span> @
                  {connection.instagram_username}
                </p>
              ) : (
                <p>
                  Instagram Business não encontrado. Você ainda pode publicar na Página do
                  Facebook.
                </p>
              )}
            </div>
          ) : null}

          {connection?.last_error ? (
            <p className="text-xs text-destructive">{connection.last_error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {mockMode
                ? "Modo gravação: um clique simula login Facebook + Instagram Business."
                : "O login abre em uma janela segura — você não precisa configurar nada técnico."}
            </p>
          )}

          {!canStartOAuth && !mockMode ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              A conexão Meta da plataforma ainda não está configurada no servidor.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={
                !isEnabled ||
                isBusy ||
                status === "connected" ||
                (!canStartOAuth && !mockMode)
              }
              onClick={() => {
                if (status === "page_selection_required") {
                  setPagePickerOpen(true);
                  return;
                }
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

      <MetaPagePickerDialog
        open={
          status === "page_selection_required" &&
          (pagePickerOpen || shouldAutoOpenPagePicker)
        }
        onOpenChange={(next) => {
          setPagePickerOpen(next);
          if (!next) {
            setPagePickerDismissedScope(pagePickerScope);
          }
        }}
        onCompleted={() => {
          setPagePickerOpen(false);
          setPagePickerDismissedScope(null);
          setInlineFeedback("Conta conectada com sucesso.");
          router.refresh();
        }}
      />
    </div>
  );
}
