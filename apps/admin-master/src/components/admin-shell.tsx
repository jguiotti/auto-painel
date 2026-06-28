"use client";

import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSignature,
  Handshake,
  KeyRound,
  Layers,
  LayoutDashboard,
  Menu,
  MessageCircle,
  LogOut,
  Package,
  Search,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";

import { logoutAction } from "@/actions/auth";
import {
  AdminNotificationProvider,
  AdminNotificationTrigger,
} from "@/components/admin-notification-provider";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import type { CommandPaletteEntity } from "@/lib/data/command-palette-entities";

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
    return "Usuários das lojas";
  }
  if (pathname.startsWith("/painel/equipe/comercial")) {
    return "Equipe comercial";
  }
  if (pathname.startsWith("/painel/equipe")) {
    return "Equipe AutoPainel";
  }
  if (pathname.startsWith("/painel/comercial")) {
    return "Portal comercial";
  }
  if (pathname.startsWith("/painel/financeiro")) {
    return "Financeiro";
  }
  if (pathname.startsWith("/painel/leads-comerciais")) {
    return "Leads comerciais";
  }
  if (pathname.startsWith("/painel/adesoes-trial")) {
    return "Adesões trial";
  }
  if (pathname.startsWith("/painel/solicitacoes-upgrade")) {
    return "Solicitações upgrade";
  }
  if (pathname.startsWith("/painel/notificacoes")) {
    return "Notificações";
  }
  if (pathname.startsWith("/painel/contratos")) {
    return "Contratos";
  }
  if (pathname.startsWith("/painel/calendario-conteudo")) {
    return "Calendário de conteúdo";
  }
  if (pathname.startsWith("/painel/documentacao")) {
    return "Documentação interna";
  }
  return "Painel global";
}

interface AdminShellProps {
  children: React.ReactNode;
  commandPaletteEntities?: CommandPaletteEntity[];
}

export function AdminShell({
  children,
  commandPaletteEntities = [],
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const nav = [
    { href: "/painel/dashboard", label: "Painel", icon: LayoutDashboard },
    { href: "/painel/concessionarias", label: "Concessionárias", icon: Building2 },
    { href: "/painel/leads-comerciais", label: "Leads comerciais", icon: Handshake },
    { href: "/painel/adesoes-trial", label: "Adesões trial", icon: ClipboardList },
    { href: "/painel/solicitacoes-upgrade", label: "Solicitações upgrade", icon: MessageCircle },
    { href: "/painel/notificacoes", label: "Notificações", icon: Bell },
    { href: "/painel/contratos", label: "Contratos", icon: FileSignature },
    { href: "/painel/calendario-conteudo", label: "Calendário", icon: CalendarDays },
    { href: "/painel/planos", label: "Planos", icon: Layers },
    { href: "/painel/modulos", label: "Módulos", icon: Package },
    { href: "/painel/usuarios", label: "Usuários das lojas", icon: Users },
    { href: "/painel/equipe", label: "Equipe AutoPainel", icon: BriefcaseBusiness },
    { href: "/painel/equipe/comercial", label: "Equipe comercial", icon: UserRound },
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

  const dealershipEntities = useMemo(
    () => commandPaletteEntities.filter((entity) => entity.kind === "dealership"),
    [commandPaletteEntities],
  );
  const planEntities = useMemo(
    () => commandPaletteEntities.filter((entity) => entity.kind === "plan"),
    [commandPaletteEntities],
  );
  const moduleEntities = useMemo(
    () => commandPaletteEntities.filter((entity) => entity.kind === "module"),
    [commandPaletteEntities],
  );
  const navEntities = useMemo(
    () => commandPaletteEntities.filter((entity) => entity.kind === "nav"),
    [commandPaletteEntities],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigateFromPalette(href: string) {
    router.push(href);
    setCommandOpen(false);
  }

  return (
    <AdminNotificationProvider>
    <div className="bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen flex-col overflow-y-auto border-r border-zinc-200 bg-white md:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 bg-white px-4">
          <img
            src={LOGO_HORIZONTAL_SRC}
            alt="AutoPainel"
            className="h-8 w-auto max-w-[170px] object-contain"
          />
          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Plataforma
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
          <Button
            variant="ghost"
            className="mb-2 w-full justify-start gap-2"
            size="sm"
            asChild
          >
            <Link href="/painel/conta/senha" title={collapsed ? "Alterar senha" : undefined}>
              <KeyRound className="size-4 shrink-0" aria-hidden />
              {collapsed ? null : "Alterar senha"}
            </Link>
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
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <AdminMobileNav items={nav} />
            <img
              src={LOGO_HORIZONTAL_SRC}
              alt="AutoPainel"
              className="h-7 w-auto max-w-[150px] object-contain"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setCommandOpen(true)}
              aria-label="Buscar"
            >
              <Search className="size-4" aria-hidden />
            </Button>
            <AdminNotificationTrigger />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </header>
        <div className="hidden h-16 shrink-0 border-b border-zinc-200 bg-white md:block">
          <PageContainer size="xl" className="flex h-full items-center">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Painel administrativo
                </p>
                <p className="truncate text-lg font-semibold leading-tight tracking-tight">
                  {pageTitle}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden min-w-72 justify-start text-muted-foreground lg:flex"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search className="size-4" aria-hidden />
                  Buscar concessionária, plano ou página...
                  <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setCommandOpen(true)}
                  aria-label="Buscar"
                >
                  <Search className="size-4" aria-hidden />
                </Button>
                <AdminNotificationTrigger />
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
        <main className="min-w-0 flex-1 py-6 md:py-8">
          <PageContainer size="xl">{children}</PageContainer>
        </main>
      </div>
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Buscar concessionária, plano ou página..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          {navEntities.length > 0 ? (
            <CommandGroup heading="Navegação">
              {navEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.searchValue}
                  onSelect={() => navigateFromPalette(entity.href)}
                >
                  <LayoutDashboard className="size-4" />
                  <span>{entity.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {dealershipEntities.length > 0 ? (
            <CommandGroup heading="Concessionárias">
              {dealershipEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.searchValue}
                  onSelect={() => navigateFromPalette(entity.href)}
                >
                  <Building2 className="size-4" />
                  <span>{entity.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {planEntities.length > 0 ? (
            <CommandGroup heading="Planos comerciais">
              {planEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.searchValue}
                  onSelect={() => navigateFromPalette(entity.href)}
                >
                  <Layers className="size-4" />
                  <span>{entity.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {moduleEntities.length > 0 ? (
            <CommandGroup heading="Módulos">
              {moduleEntities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.searchValue}
                  onSelect={() => navigateFromPalette(entity.href)}
                >
                  <Package className="size-4" />
                  <span>{entity.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </div>
    </AdminNotificationProvider>
  );
}
