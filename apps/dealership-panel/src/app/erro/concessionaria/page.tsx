import Link from "next/link";

function DevResolutionHints() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-medium">Checklist (desenvolvimento)</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-4">
        <li>
          Abre o painel pelo host certo (ex.:{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            http://SEU_SUBDOMINIO.localhost:3002
          </code>
          ) ou usa os botões no Admin Master («Acesso à loja») — não divulgues URLs abertos para provar slugs.
        </li>
        <li>
          No <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code> da raiz:{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost
          </code>
          ; depois <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npm run sync:env</code>.
        </li>
        <li>
          Confirme que clonou as migrações mais recentes do repositório e que as aplicou ao projeto Supabase
          ligado a esta cópia local.
        </li>
        <li>
          IP LAN (ex.: <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">192.168.x.x</code>): opcional{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
            NEXT_PUBLIC_ALLOW_LAN_HOST_TENANT_COOKIE=true
          </code>{" "}
          só depois de já teres cookie válido por um host canónico — não substitui DNS/subdomínio em produção.
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
          Este endereço não corresponde a uma loja configurada neste sistema ou o link que utilizou já não é válido.
          Utilize o endereço enviado pela sua equipa ou pela organização. Se precisar de ajuda, contacte o suporte.
        </p>
        <DevResolutionHints />
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
