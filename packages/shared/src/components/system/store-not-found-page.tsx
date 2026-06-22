import { resolveAutopainelSiteUrl } from "../../lib/autopainel-site-url";
import { Button } from "../../ui/button";

export function StoreNotFoundPage() {
  const autopainelHomeUrl = resolveAutopainelSiteUrl();

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
            Loja não encontrada
          </h1>
          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            O endereço que você abriu não corresponde a uma loja disponível. Para conhecer a
            plataforma ou obter ajuda, acesse o site da AutoPainel.
          </p>
          <Button
            className="mt-8 h-11 min-h-[44px] rounded-full px-6 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-500"
            asChild
          >
            <a href={autopainelHomeUrl} aria-label="Ir para o site da AutoPainel">
              Ir para a AutoPainel
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
