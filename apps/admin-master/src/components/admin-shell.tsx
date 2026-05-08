"use client";

import {
  BookOpen,
  Building2,
  Layers,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@autopainel/shared/ui";

import { logoutAction } from "@/actions/auth";

const linkBase =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const nav = [
    { href: "/painel/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/painel/concessionarias", label: "Concessionárias", icon: Building2 },
    { href: "/painel/planos", label: "Planos", icon: Layers },
    { href: "/painel/modulos", label: "Módulos", icon: Package },
    { href: "/painel/usuarios", label: "Usuários", icon: Users },
    { href: "/painel/financeiro", label: "Financeiro", icon: Wallet },
    {
      href: "/painel/documentacao",
      label: "Documentação interna",
      icon: BookOpen,
    },
  ];

  return (
    <div className="bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-56 flex-col overflow-y-auto border-r border-border bg-card md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
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
        <div className="shrink-0 border-t border-border p-3">
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
      <div className="flex min-h-screen flex-1 flex-col md:pl-56">
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
