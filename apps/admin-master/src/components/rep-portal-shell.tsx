"use client";

import { FileText, KeyRound, LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, PageContainer } from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";

import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";
import { logoutAction } from "@/actions/auth";

const NAV = [
  { href: "/painel/comercial/extrato", label: "Meu extrato", icon: FileText },
  { href: "/painel/comercial/carteira", label: "Minha carteira", icon: LayoutGrid },
  {
    href: "/painel/comercial/dados-pagamento",
    label: "Dados de pagamento",
    icon: KeyRound,
  },
] as const;

interface RepPortalShellProps {
  children: React.ReactNode;
  repName?: string;
}

export function RepPortalShell({ children, repName }: RepPortalShellProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <PageContainer size="lg" className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_HORIZONTAL_SRC}
              alt="AutoPainel"
              className="h-8 w-auto max-w-[160px] object-contain"
            />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Portal comercial
            </span>
          </div>
          {repName ? (
            <p className="text-sm text-muted-foreground">
              Olá, <span className="font-medium text-foreground">{repName}</span>
            </p>
          ) : null}
        </PageContainer>
        <PageContainer size="lg" className="pb-3">
          <nav className="flex flex-wrap gap-2" aria-label="Portal comercial">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </PageContainer>
      </header>
      <main className="py-6 md:py-8">
        <PageContainer size="lg">{children}</PageContainer>
      </main>
      <footer className="border-t py-4">
        <PageContainer size="lg">
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" className="gap-2">
              <LogOut className="size-4" aria-hidden />
              Sair
            </Button>
          </form>
        </PageContainer>
      </footer>
    </div>
  );
}
