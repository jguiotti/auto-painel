"use client";

import { Building2, LayoutDashboard, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@autopainel/shared/ui";

import { logoutAction } from "@/actions/auth";

const linkBase =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const nav = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/concessionarias", label: "Concessionárias", icon: Building2 },
    { href: "/financeiro", label: "Financeiro", icon: Wallet },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <span className="text-sm font-bold tracking-tight">AutoPainel</span>
          <span className="ml-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Administração">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`${linkBase} ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <span className="text-sm font-semibold">AutoPainel Admin</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {nav.map(({ href, label }) => (
            <Button
              key={href}
              variant={pathname.startsWith(href) ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              asChild
            >
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </div>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
