import { NextResponse, type NextRequest } from "next/server";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";
import { mapClassifiedsOAuthCallbackError } from "@/lib/integrations/integration-user-messages";

const POPUP_ERROR_CODES = new Set([
  "invalid_callback",
  "session_expired",
  "session_invalid",
  "cancelled",
  "missing_code",
  "token_exchange_failed",
  "configuration",
  "unknown",
]);

function jsonForPopup(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replaceAll("</", "<\\/");
}

function resolvePopupErrorMessage(code: string | null, providerLabel: string): string {
  const mapped = mapClassifiedsOAuthCallbackError(code ?? undefined);
  if (mapped) {
    return mapped;
  }
  switch (code) {
    case "invalid_callback":
      return "Não foi possível concluir o login. Clique em Conectar novamente.";
    case "session_expired":
    case "session_invalid":
      return "O login expirou. Clique em Conectar novamente.";
    case "cancelled":
      return "Login cancelado. Você pode tentar conectar novamente quando quiser.";
    case "missing_code":
      return `Não recebemos confirmação da ${providerLabel}. Tente conectar novamente.`;
    case "token_exchange_failed":
      return `Não foi possível validar o login com a ${providerLabel}. Tente novamente em alguns minutos.`;
    case "configuration":
      return "Este canal ainda não está disponível para sua loja. Fale com nosso suporte.";
    default:
      return `Não foi possível concluir a conexão com a ${providerLabel}. Tente novamente.`;
  }
}

function popupHtml(params: {
  provider: string;
  success: boolean;
  errorMessage?: string;
}): string {
  const payload = {
    source: "autopainel_classifieds_oauth",
    provider: params.provider,
    success: params.success,
    error: params.errorMessage ?? null,
  };

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Conexão concluída</title>
  </head>
  <body>
    <script>
      (function () {
        const payload = ${jsonForPopup(payload)};
        const targetOrigin = window.location.origin;
        try {
          if (window.opener && !window.opener.closed && typeof window.opener.postMessage === "function") {
            window.opener.postMessage(payload, targetOrigin);
          }
        } catch (_) {}
        setTimeout(function () {
          window.close();
        }, 150);
      })();
    </script>
    <p>Login processado. Esta janela pode ser fechada.</p>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const provider = parseClassifiedsProvider(request.nextUrl.searchParams.get("provider"));
  const success = request.nextUrl.searchParams.get("success") === "1";
  const rawErrorCode = request.nextUrl.searchParams.get("error")?.trim() ?? null;
  const errorCode =
    rawErrorCode && POPUP_ERROR_CODES.has(rawErrorCode) ? rawErrorCode : "unknown";

  if (!provider) {
    return new NextResponse(
      popupHtml({
        provider: "olx",
        success: false,
        errorMessage: "Não foi possível concluir o login. Clique em Conectar novamente.",
      }),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
        status: 400,
      },
    );
  }

  const providerLabel =
    provider === "olx" ? "OLX" : provider === "icarros" ? "iCarros" : "WebMotors";

  return new NextResponse(
    popupHtml({
      provider,
      success,
      errorMessage: success
        ? undefined
        : resolvePopupErrorMessage(errorCode, providerLabel),
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
      status: 200,
    },
  );
}
