import Link from "next/link";

export default function DealershipNotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <p className="text-6xl font-semibold text-zinc-300 dark:text-zinc-700">
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Concessionária não encontrada
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Não encontramos uma loja cadastrada para este domínio ou subdomínio.
          Verifique o endereço ou entre em contato com o suporte.
        </p>
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
