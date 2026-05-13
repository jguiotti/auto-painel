import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

function DevResolutionHints() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">Checklist em desenvolvimento local</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          O link «Local» do Next (<code className="rounded bg-amber-100 px-1 dark:bg-amber-900">http://localhost:PORT</code>)
          não tem subdomínio — use{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">http://SEU_SLUG.localhost:PORT</code> ou{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">NEXT_PUBLIC_DEVELOPMENT_TENANT_SLUG</code>; o Edge pode
          não ver <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">DEVELOPMENT_TENANT_SLUG</code>.
        </li>
        <li>
          No ficheiro <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code> da raiz:{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost
          </code>
          ; depois <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npm run sync:env</code>.
        </li>
        <li>
          O <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">slug</code> na base deve coincidir com o primeiro
          segmento (ex.: <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">minha-loja</code>.localhost).
        </li>
        <li>
          Reinicie o <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">next dev</code> após mudar variáveis; no
          Supabase, confirme migrações com{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">resolve_dealership_id_by_host</code>. O código
          deduz <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">localhost</code> como raiz quando o{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">Host</code> é{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">*.localhost</code> e a variável pública falta no Edge.
        </li>
        <li>
          Na vitrine, só lojas com <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">status = active</code> são
          resolvidas; confirme no Admin Master.
        </li>
      </ul>
    </div>
  );
}

export default function DealershipNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <p className="text-5xl font-semibold text-zinc-400 dark:text-zinc-600">—</p>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Concessionária não encontrada neste domínio
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Não encontrámos uma loja activa para este subdomínio ou falta configurar o domínio raiz da plataforma. Esta página
          não é o erro HTTP 404 do Next — é a mensagem de «tenant não resolvido».
        </p>
        <DevResolutionHints />
        <Button className="mt-8 rounded-full" asChild>
          <Link href="/">Ir para o início</Link>
        </Button>
      </div>
    </div>
  );
}
