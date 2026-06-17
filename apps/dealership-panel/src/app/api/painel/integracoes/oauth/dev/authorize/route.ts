import { NextResponse, type NextRequest } from "next/server";

import {
  buildClassifiedsOAuthDevStubCode,
  isClassifiedsOAuthDevStubEnabled,
  isClassifiedsOAuthDevStubProvider,
} from "@autopainel/shared/lib/classifieds-oauth-dev-stub";

import { parseClassifiedsProvider } from "@/lib/classifieds/oauth-provider";

const PROVIDER_LABEL: Record<string, string> = {
  olx: "OLX",
  webmotors: "WebMotors",
  icarros: "iCarros",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildAuthorizeHtml(params: {
  providerLabel: string;
  approveUrl: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Login ${escapeHtml(params.providerLabel)} (demo)</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f4f5; color: #18181b; }
      main { background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; max-width: 420px; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
      h1 { font-size: 1.25rem; margin: 0 0 8px; }
      p { margin: 0 0 16px; color: #52525b; line-height: 1.5; font-size: 0.95rem; }
      a.button { display: inline-block; background: #18181b; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
      .badge { display: inline-block; font-size: 0.75rem; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <main>
      <div class="badge">Ambiente de desenvolvimento</div>
      <h1>Conectar ${escapeHtml(params.providerLabel)}</h1>
      <p>Simulação local do login OAuth. Ao continuar, sua loja ficará com status <strong>Conectado</strong> para testes de publicação (dry-run).</p>
      <a class="button" href="${escapeHtml(params.approveUrl)}">Autorizar conexão demo</a>
    </main>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  if (!isClassifiedsOAuthDevStubEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const provider = parseClassifiedsProvider(request.nextUrl.searchParams.get("provider"));
  if (!provider || !isClassifiedsOAuthDevStubProvider(provider)) {
    return NextResponse.json({ error: "Fornecedor inválido." }, { status: 400 });
  }

  const incoming = request.nextUrl.searchParams;
  const state = incoming.get("state")?.trim();
  const redirectUri = incoming.get("redirect_uri")?.trim();
  const clientId = incoming.get("client_id")?.trim();

  if (!state || !redirectUri || !clientId) {
    return NextResponse.json(
      { error: "Parâmetros OAuth incompletos (state, redirect_uri, client_id)." },
      { status: 400 },
    );
  }

  const stubCode = buildClassifiedsOAuthDevStubCode(provider, state);
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("state", state);
  callbackUrl.searchParams.set("code", stubCode);
  if (provider !== "olx") {
    callbackUrl.searchParams.set("provider", provider);
  }

  return new NextResponse(
    buildAuthorizeHtml({
      providerLabel: PROVIDER_LABEL[provider] ?? provider,
      approveUrl: callbackUrl.toString(),
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
