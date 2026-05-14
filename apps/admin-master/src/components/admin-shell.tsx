"use client";

import {
  Bell,
  BookOpen,
  Building2,
  Command as CommandIcon,
  Layers,
  LayoutDashboard,
  Menu,
  LogOut,
  Package,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PageContainer,
} from "@autopainel/shared/ui";

import { logoutAction } from "@/actions/auth";

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

function pageTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/painel/concessionarias")) {
    return "Concessionárias";
  }
  if (pathname.startsWith("/painel/planos")) {
    return "Planos comerciais";
  }
  if (pathname.startsWith("/painel/modulos")) {
    return "Módulos";
  }
  if (pathname.startsWith("/painel/usuarios")) {
    return "Usuários";
  }
  if (pathname.startsWith("/painel/financeiro")) {
    return "Financeiro";
  }
  if (pathname.startsWith("/painel/documentacao")) {
    return "Documentação interna";
  }
  return "Painel global";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
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
  const pageTitle = pageTitleFromPath(pathname);
  const activeNav = useMemo(
    () => nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    [nav, pathname],
  );

  return (
    <div className="bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen flex-col overflow-y-auto border-r border-zinc-200 bg-white md:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 bg-white px-4">
          <Image
            src="/autopainel-logo.png"
            alt="AutoPainel"
            width={260}
            height={58}
            className="h-8 w-auto bg-transparent"
            priority
          />
          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
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
                title={collapsed ? label : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {collapsed ? null : label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            className="mb-2 w-full justify-start gap-2"
            size="sm"
            onClick={() => setCollapsed((value) => !value)}
          >
            <Menu className="size-4" aria-hidden />
            {collapsed ? null : "Colapsar menu"}
          </Button>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <LogOut className="size-4" aria-hidden />
              {collapsed ? null : "Sair"}
            </Button>
          </form>
        </div>
      </aside>
      <div className={`flex min-h-screen flex-1 flex-col ${collapsed ? "md:pl-20" : "md:pl-72"}`}>
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
          <Image
            src="/autopainel-logo.png"
            alt="AutoPainel"
            width={220}
            height={49}
            className="h-7 w-auto bg-transparent"
            priority
          />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sair
            </Button>
          </form>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 md:hidden">
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
        <div className="hidden border-b border-zinc-200 bg-white py-3 md:block">
          <PageContainer size="xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Painel administrativo
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight">{pageTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-72 justify-start text-muted-foreground"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search className="size-4" aria-hidden />
                  Buscar concessionária, plano ou página...
                  <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
                </Button>
                <Button type="button" variant="ghost" size="icon">
                  <Bell className="size-4" aria-hidden />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Operador
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Conta da plataforma</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/painel/documentacao">Documentação interna</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={activeNav?.href ?? "/painel/dashboard"}>Página atual</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </PageContainer>
        </div>
        <main className="flex-1 py-4 md:py-8">
          <PageContainer size="xl">{children}</PageContainer>
        </main>
      </div>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Buscar no admin..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {nav.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setCommandOpen(false);
                }}
              >
                <CommandIcon className="size-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
