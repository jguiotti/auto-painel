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
  Input,
  Label,
  PasswordInput,
} from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";
import type { ClassifiedsOAuthProvider } from "@/lib/classifieds/oauth-provider";
import {
  classifiedsConnectFailureMessage,
  classifiedsConnectSuccessMessage,
  classifiedsConnectDialogDescription,
  classifiedsConnectDialogTitle,
  classifiedsDisconnectSuccessMessage,
  classifiedsPopupBlockedMessage,
  classifiedsProviderConnectHint,
  classifiedsProviderLabel,
  classifiedsProviderOAuthPendingMessage,
  mapClassifiedsOAuthCallbackError,
} from "@/lib/integrations/integration-user-messages";
import {
  resolveClassifiedsOAuthErrorDetails,
} from "@/lib/integrations/classifieds-oauth-error-hints";
import { classifiedsUsesIntegratorCredentials } from "@/lib/classifieds/classifieds-connect-mode";

const OAUTH_LOG_PREFIX = "[AutoPainel OAuth]";

function logOAuthEvent(event: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(OAUTH_LOG_PREFIX, event, details);
    return;
  }
  console.info(OAUTH_LOG_PREFIX, event);
}

function formatOAuthFeedback(
  provider: ClassifiedsProvider,
  rawError?: string | null,
): string {
  const details = resolveClassifiedsOAuthErrorDetails(provider, rawError);
  if (details) {
    return `${details.title} (código: ${details.supportCode})`;
  }
  if (rawError) {
    return (
      mapClassifiedsOAuthCallbackError(rawError) ??
      classifiedsConnectFailureMessage(provider)
    );
  }
  return classifiedsConnectFailureMessage(provider);
}

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
  provider: ClassifiedsOAuthProvider;
  success: boolean;
  error?: string | null;
}

export type ClassifiedsProviderOAuthReady = Record<ClassifiedsProvider, boolean>;

interface ClassifiedsIntegrationCardsProps {
  enabledProviders: ClassifiedsProvider[];
  connections: ClassifiedsConnectionRow[];
  providerOAuthReady: ClassifiedsProviderOAuthReady;
}

const PROVIDER_CATALOG: Array<{
  key: ClassifiedsProvider;
  subtitle: string;
}> = [
  {
    key: "olx",
    subtitle: "Publique e atualize anúncios na OLX a partir do seu estoque.",
  },
  {
    key: "webmotors",
    subtitle:
      "Envie veículos para a WebMotors. A conexão usa o usuário integrador do CRM Cockpit (em homologação).",
  },
  {
    key: "icarros",
    subtitle:
      "Publique anúncios no iCarros com login seguro em janela — igual à OLX, após homologação.",
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

function resolveActionLabel(status: ConnectionStatus, isPending: boolean): string {
  if (isPending) {
    return "Abrindo login...";
  }
  if (status === "connecting" || status === "error" || status === "reauth_required") {
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
  enabledProviders,
  connections,
  providerOAuthReady,
}: ClassifiedsIntegrationCardsProps) {
  const router = useRouter();
  const [pendingProvider, setPendingProvider] = useState<ClassifiedsProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<ClassifiedsProvider | null>(null);
  const [dialogProvider, setDialogProvider] = useState<ClassifiedsOAuthProvider | null>(null);
  const [unavailableProvider, setUnavailableProvider] = useState<ClassifiedsProvider | null>(
    null,
  );
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const [integratorUsername, setIntegratorUsername] = useState("");
  const [integratorPassword, setIntegratorPassword] = useState("");
  const popupRef = useRef<Window | null>(null);
  const popupWatchRef = useRef<number | null>(null);
  const oauthMessageReceivedRef = useRef(false);
  const activeOAuthProviderRef = useRef<ClassifiedsProvider | null>(null);

  const connectionMap = useMemo(() => {
    const map = new Map<ClassifiedsProvider, ClassifiedsConnectionRow>();
    for (const row of connections) {
      map.set(row.provider, row);
    }
    return map;
  }, [connections]);

  const visibleProviders = useMemo(
    () => PROVIDER_CATALOG.filter((provider) => enabledProviders.includes(provider.key)),
    [enabledProviders],
  );

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
        logOAuthEvent("postMessage_ignored_origin", { origin: event.origin });
        return;
      }
      const payload = event.data;
      if (!payload || payload.source !== "autopainel_classifieds_oauth") {
        return;
      }
      logOAuthEvent("postMessage_received", {
        provider: payload.provider,
        success: payload.success,
        error: payload.error ?? null,
      });
      oauthMessageReceivedRef.current = true;
      stopPopupWatch();
      popupRef.current = null;
      setPendingProvider(null);
      setDialogProvider(null);
      if (payload.success) {
        setInlineFeedback(classifiedsConnectSuccessMessage(payload.provider));
      } else {
        setInlineFeedback(formatOAuthFeedback(payload.provider, payload.error));
      }
      router.refresh();
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPopupWatch();
    };
  }, [router]);

  async function cleanupStaleOAuthAttempt(provider: ClassifiedsProvider) {
    try {
      await fetch(`/api/painel/integracoes/oauth/cleanup?provider=${provider}`, {
        method: "POST",
      });
    } catch {
      // refresh below still runs
    }
  }

  async function prepareConnectDialog(provider: ClassifiedsProvider) {
    setInlineFeedback(null);
    setIntegratorUsername("");
    setIntegratorPassword("");
    const row = connectionMap.get(provider);
    if (row?.status === "connecting") {
      await cleanupStaleOAuthAttempt(provider);
    }
    setDialogProvider(provider);
  }

  async function cancelStaleConnection(provider: ClassifiedsOAuthProvider) {
    setInlineFeedback(null);
    setDisconnectingProvider(provider);
    try {
      await cleanupStaleOAuthAttempt(provider);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("disconnect_dealership_classifieds_connection", {
        p_provider: provider,
      });
      if (error) {
        setInlineFeedback("Não foi possível cancelar a conexão. Tente novamente.");
        return;
      }
      setInlineFeedback("Conexão cancelada. Você pode tentar conectar novamente.");
      router.refresh();
    } catch {
      setInlineFeedback("Não foi possível cancelar a conexão. Tente novamente.");
    } finally {
      setDisconnectingProvider(null);
    }
  }

  async function resolveConnectionAfterPopup(provider: ClassifiedsProvider) {
    try {
      const res = await fetch(
        `/api/painel/integracoes/oauth/connection-status?provider=${provider}`,
      );
      const payload = (await res.json()) as {
        status?: string;
        lastError?: string | null;
      };
      logOAuthEvent("connection_status", {
        provider,
        status: payload.status ?? "unknown",
        lastError: payload.lastError ?? null,
      });
      if (payload.status === "connected") {
        setInlineFeedback(classifiedsConnectSuccessMessage(provider));
        return;
      }
      if (payload.status === "error" && payload.lastError) {
        setInlineFeedback(formatOAuthFeedback(provider, payload.lastError));
        return;
      }
      if (payload.status === "connecting") {
        setInlineFeedback(
          "Conexão não concluída. Feche a janela de login e clique em Conectar novamente.",
        );
      }
    } catch {
      // refresh below still runs
    }
  }

  async function startWebMotorsConnectFromDialog() {
    const provider = dialogProvider;
    if (provider !== "webmotors") {
      return;
    }

    const username = integratorUsername.trim();
    if (!username || !integratorPassword) {
      setInlineFeedback("Informe o usuário e a senha do integrador CRM WebMotors.");
      return;
    }

    setPendingProvider(provider);
    logOAuthEvent("webmotors_connect_start");

    try {
      const res = await fetch("/api/painel/integracoes/webmotors/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: integratorPassword }),
      });
      const payload = (await res.json()) as
        | { status?: string }
        | { error: string; code?: string };

      setPendingProvider(null);
      setDialogProvider(null);
      setIntegratorPassword("");

      if (!res.ok || !("status" in payload) || payload.status !== "connected") {
        logOAuthEvent("webmotors_connect_failed", { status: res.status, payload });
        setInlineFeedback(
          "error" in payload
            ? payload.error
            : classifiedsConnectFailureMessage(provider),
        );
        router.refresh();
        return;
      }

      logOAuthEvent("webmotors_connect_ok");
      setInlineFeedback(classifiedsConnectSuccessMessage(provider));
      router.refresh();
    } catch {
      setPendingProvider(null);
      setInlineFeedback(classifiedsConnectFailureMessage(provider));
    }
  }

  async function startOAuthFromDialog() {
    const provider = dialogProvider;
    if (!provider) {
      return;
    }

    setPendingProvider(provider);
    oauthMessageReceivedRef.current = false;
    activeOAuthProviderRef.current = provider;

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
        logOAuthEvent("oauth_start_failed", {
          provider,
          status: res.status,
          body: payload,
        });
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

      logOAuthEvent("oauth_start_ok", { provider });

      const popup = window.open(
        payload.authorizationUrl,
        `autopainel-oauth-${provider}`,
        "popup=yes,width=560,height=760",
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
          const closedProvider = activeOAuthProviderRef.current;
          popupRef.current = null;
          setPendingProvider(null);
          setDialogProvider(null);
          activeOAuthProviderRef.current = null;

          if (closedProvider && !oauthMessageReceivedRef.current) {
            logOAuthEvent("popup_closed_without_message", { provider: closedProvider });
            void cleanupStaleOAuthAttempt(closedProvider)
              .then(() => resolveConnectionAfterPopup(closedProvider))
              .finally(() => {
                router.refresh();
              });
            return;
          }

          if (closedProvider) {
            void resolveConnectionAfterPopup(closedProvider).finally(() => {
              router.refresh();
            });
          }
        }
      }, 600);
    } catch {
      setPendingProvider(null);
      setInlineFeedback(classifiedsConnectFailureMessage(provider));
    }
  }

  async function disconnectProvider(provider: ClassifiedsOAuthProvider) {
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
        {visibleProviders.map((provider) => {
          const row = connectionMap.get(provider.key);
          const status = row?.status ?? "disconnected";
          const isOAuthInFlight = pendingProvider === provider.key;
          const isBusy =
            isOAuthInFlight ||
            disconnectingProvider === provider.key;
          const actionLabel = resolveActionLabel(status, isOAuthInFlight);
          const connectedAtLabel = formatConnectedAt(row?.connected_at ?? null);
          const oauthReady = providerOAuthReady[provider.key];
          const connectHint = classifiedsProviderConnectHint(provider.key, oauthReady);

          return (
            <Card key={provider.key} data-provider={provider.key}>
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
                  (() => {
                    const errorDetails = resolveClassifiedsOAuthErrorDetails(
                      provider.key,
                      row.last_error,
                    );
                    if (errorDetails) {
                      return (
                        <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                          <p className="text-sm font-medium text-destructive">
                            {errorDetails.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{errorDetails.hint}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            Código para suporte: {errorDetails.supportCode}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-destructive">
                        {mapClassifiedsOAuthCallbackError(row.last_error) ?? row.last_error}
                      </p>
                    );
                  })()
                ) : (
                  <p className="text-xs text-muted-foreground">{connectHint}</p>
                )}

                {status === "connecting" && !isOAuthInFlight ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    A conexão anterior não foi concluída. Clique em Conectar novamente ou
                    cancele abaixo.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isBusy || status === "connected" || !oauthReady}
                    onClick={() => {
                      if (!oauthReady) {
                        setUnavailableProvider(provider.key);
                        return;
                      }
                      void prepareConnectDialog(provider.key);
                    }}
                  >
                    {actionLabel}
                  </Button>
                  {status === "connecting" && !isOAuthInFlight ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => {
                        void cancelStaleConnection(provider.key);
                      }}
                    >
                      Cancelar conexão
                    </Button>
                  ) : null}
                  {status === "connected" ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isBusy}
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

          {dialogProvider && classifiedsUsesIntegratorCredentials(dialogProvider) ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="webmotors-integrator-username">Usuário integrador CRM</Label>
                <Input
                  id="webmotors-integrator-username"
                  type="email"
                  autoComplete="username"
                  placeholder="ex.: integrador@sualoja.com.br"
                  value={integratorUsername}
                  disabled={pendingProvider !== null}
                  onChange={(event) => {
                    setIntegratorUsername(event.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webmotors-integrator-password">Senha do integrador</Label>
                <PasswordInput
                  id="webmotors-integrator-password"
                  autoComplete="current-password"
                  placeholder="Senha criada no Cockpit WebMotors"
                  value={integratorPassword}
                  disabled={pendingProvider !== null}
                  onChange={(event) => {
                    setIntegratorPassword(event.target.value);
                  }}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={pendingProvider !== null}
              onClick={() => {
                setDialogProvider(null);
                setIntegratorPassword("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={pendingProvider !== null}
              onClick={() => {
                if (dialogProvider && classifiedsUsesIntegratorCredentials(dialogProvider)) {
                  void startWebMotorsConnectFromDialog();
                  return;
                }
                void startOAuthFromDialog();
              }}
            >
              {pendingProvider
                ? "Conectando..."
                : dialogProvider && classifiedsUsesIntegratorCredentials(dialogProvider)
                  ? "Conectar WebMotors"
                  : "Continuar para login"}
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
            <AlertDialogTitle>Conexão em configuração</AlertDialogTitle>
            <AlertDialogDescription>
              {unavailableProvider
                ? classifiedsProviderOAuthPendingMessage(unavailableProvider)
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
