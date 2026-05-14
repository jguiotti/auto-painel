import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

const TENANT_ERROR_HEADING = "Não encontramos uma loja neste endereço";

function getOptionalInstitutionalSiteUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_AUTOPAINEL_SITE_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

function DevResolutionHintsStorefront() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">Checklist (desenvolvimento)</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          O endereço <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">http://localhost:PORT</code> sem
          subdomínio não identifica a loja — use{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">http://SEU_SLUG.localhost:PORT</code> ou a variável
          de desenvolvimento equivalente; o Edge pode não enxergar variáveis só no servidor.
        </li>
        <li>
          No arquivo <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code> da raiz:{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost
          </code>
          ; depois rode <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npm run sync:env</code>.
        </li>
        <li>
          O <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">slug</code> no banco deve coincidir com o primeiro
          segmento do host (ex.: <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">minha-loja</code>
          .localhost).
        </li>
        <li>
          Reinicie o <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">next dev</code> após mudar variáveis. No
          Supabase, confirme que as funções de resolução de host estão aplicadas. O código trata{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">*.localhost</code> quando a variável pública de
          domínio raiz não chega ao Edge.
        </li>
        <li>
          Nesta vitrine, só entram lojas com situação publicável no produto — confira o cadastro no Admin Master (sem
          mencionar isso ao visitante final).
        </li>
      </ul>
    </div>
  );
}

export default function DealershipNotFoundPage() {
  const institutionalUrl = getOptionalInstitutionalSiteUrl();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <p
            aria-hidden="true"
            className="text-5xl font-semibold text-zinc-400 dark:text-zinc-600"
          >
            —
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {TENANT_ERROR_HEADING}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            O endereço que você abriu não corresponde a uma loja que possamos mostrar aqui, ou o link já não é válido.
            Confira com a pessoa ou a loja que enviou o link. Se você já falou com eles e o problema continua, procure o
            suporte da sua loja.
          </p>
          <Button
            className="mt-8 h-11 min-h-[44px] rounded-full px-6 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-500"
            asChild
          >
            <Link href="/" aria-label="Ir para a página inicial da vitrine">
              Ir para o início
            </Link>
          </Button>
          {process.env.NODE_ENV === "development" ? (
            <details className="mt-8 w-full rounded-lg border border-zinc-200 bg-zinc-50/80 p-1 text-left dark:border-zinc-800 dark:bg-zinc-900/40">
              <summary className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:text-zinc-200 dark:focus-visible:ring-zinc-500">
                Detalhes para a equipe técnica
              </summary>
              <div className="px-3 pb-3 pt-1">
                <DevResolutionHintsStorefront />
              </div>
            </details>
          ) : null}
          {institutionalUrl ? (
            <footer className="mt-10 w-full border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <a
                href={institutionalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Sobre a AutoPainel
              </a>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
