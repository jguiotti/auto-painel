import Link from "next/link";

import { Button, PageContainer } from "@autopainel/shared/ui";

import { signOutAction } from "@/app/painel/actions";

import { LeadRealtimeNotifier } from "@/components/dashboard/LeadRealtimeNotifier";

interface DashboardShellProps {
  dealershipName: string;
  dealershipLogoUrl: string | null;
  dealershipId: string;
  /** `profiles.role` for the signed-in user (owner | manager | seller | super_admin). */
  viewerRole: string;
  children: React.ReactNode;
}

export function DashboardShell({
  dealershipName,
  dealershipLogoUrl,
  dealershipId,
  viewerRole,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <PageContainer size="xl" className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/painel" className="flex items-center gap-3 text-zinc-900">
              {dealershipLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL externa configurada por concessionária
                <img
                  src={dealershipLogoUrl}
                  alt={dealershipName}
                  className="h-9 w-auto max-w-32 object-contain"
                />
              ) : null}
              <span className="text-lg font-semibold">{dealershipName}</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-teal-700 underline"
            >
              Ver vitrine
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel">Painel</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel/estoque">Estoque</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel/contatos">Contatos</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel/integracoes">Integrações</Link>
            </Button>
            <form action={signOutAction} className="inline">
              <Button type="submit" variant="outline" size="sm" className="text-red-700">
                Sair
              </Button>
            </form>
          </nav>
        </PageContainer>
      </header>
      <PageContainer size="xl" className="py-6 sm:py-8">
        {children}
      </PageContainer>
      <LeadRealtimeNotifier
        dealershipId={dealershipId}
        alertOnVitrineLeads={
          viewerRole === "owner" || viewerRole === "super_admin"
        }
      />
    </div>
  );
}
