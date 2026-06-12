import { NextResponse, type NextRequest } from "next/server";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";

type PopupErrorCode =
  | "invalid_callback"
  | "session_expired"
  | "session_invalid"
  | "cancelled"
  | "missing_code"
  | "token_exchange_failed"
  | "configuration"
  | "unknown";

const POPUP_ERROR_CODES = new Set<PopupErrorCode>([
  "invalid_callback",
  "session_expired",
  "session_invalid",
  "cancelled",
  "missing_code",
  "token_exchange_failed",
  "configuration",
  "unknown",
]);

function parsePopupErrorCode(raw: string | null): PopupErrorCode {
  if (raw && POPUP_ERROR_CODES.has(raw as PopupErrorCode)) {
    return raw as PopupErrorCode;
  }
  return "unknown";
}

function jsonForPopup(payload: Record<string, unknown>): string {
  return JSON.stringify(payload).replaceAll("</", "<\\/");
}

function popupHtml(params: {
  provider: string;
  success: boolean;
  errorCode?: PopupErrorCode;
}): string {
  const payload = {
    source: "autopainel_classifieds_oauth",
    provider: params.provider,
    success: params.success,
    error: params.success ? null : (params.errorCode ?? "unknown"),
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
  const errorCode = parsePopupErrorCode(rawErrorCode);

  if (!provider) {
    return new NextResponse(
      popupHtml({
        provider: "olx",
        success: false,
        errorCode: "invalid_callback",
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

  return new NextResponse(
    popupHtml({
      provider,
      success,
      errorCode: success ? undefined : errorCode,
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
