import Link from "next/link";

import { signOutAction } from "@/app/painel/actions";

import { LeadRealtimeNotifier } from "@/components/dashboard/LeadRealtimeNotifier";

interface DashboardShellProps {
  dealershipName: string;
  dealershipId: string;
  children: React.ReactNode;
}

export function DashboardShell({
  dealershipName,
  dealershipId,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/painel"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {dealershipName}
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-teal-700 underline dark:text-teal-400"
            >
              Ver vitrine
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Link
              href="/painel"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Painel
            </Link>
            <Link
              href="/painel/estoque"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Estoque
            </Link>
            <Link
              href="/painel/contatos"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Contatos
            </Link>
            <form action={signOutAction} className="inline">
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
      <LeadRealtimeNotifier dealershipId={dealershipId} />
    </div>
  );
}
