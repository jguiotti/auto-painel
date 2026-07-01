import { NextResponse, type NextRequest } from "next/server";

import {
  buildMetaOAuthDevStubCode,
  isMetaOAuthDevStubEnabled,
} from "@autopainel/shared/lib/meta-oauth-dev-stub";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildAuthorizeHtml(params: {
  approveUrl: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Facebook — login demo (AutoPainel)</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f0f2f5; color: #1c1e21; }
      main { background: #fff; border: 1px solid #dddfe2; border-radius: 8px; padding: 24px; max-width: 440px; box-shadow: 0 12px 28px rgba(0,0,0,.08); }
      .badge { display: inline-block; font-size: 0.75rem; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; margin-bottom: 12px; }
      h1 { font-size: 1.15rem; margin: 0 0 8px; }
      p { margin: 0 0 12px; color: #65676b; line-height: 1.5; font-size: 0.92rem; }
      ul { margin: 0 0 16px 18px; padding: 0; color: #65676b; font-size: 0.85rem; line-height: 1.45; }
      a.button { display: inline-block; background: #1877f2; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; }
      a.secondary { display: inline-block; margin-left: 8px; color: #65676b; font-size: 0.85rem; }
    </style>
  </head>
  <body>
    <main>
      <div class="badge">Simulação Meta — só desenvolvimento</div>
      <h1>Continuar como AutoPainel Demo?</h1>
      <p>Esta janela substitui o login Facebook quando <code>META_OAUTH_DEV_STUB=true</code>. Ao autorizar, a loja ficará <strong>Conectada</strong> com página e Instagram fictícios para testar publicação (dry-run).</p>
      <ul>
        <li>pages_show_list, pages_manage_posts</li>
        <li>instagram_basic, instagram_content_publish</li>
        <li>business_management, pages_read_engagement</li>
      </ul>
      <a class="button" href="${escapeHtml(params.approveUrl)}">Continuar / Autorizar</a>
    </main>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  if (!isMetaOAuthDevStubEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const state = request.nextUrl.searchParams.get("state")?.trim();
  if (!state) {
    return NextResponse.json({ error: "Parâmetro state ausente." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL não configurado." },
      { status: 500 },
    );
  }

  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI?.trim() ||
    `${supabaseUrl.replace(/\/$/, "")}/functions/v1/meta-oauth-callback`;

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("state", state);
  callbackUrl.searchParams.set("code", buildMetaOAuthDevStubCode(state));

  return new NextResponse(
    buildAuthorizeHtml({
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
