"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plug,
  Store,
  Users,
} from "lucide-react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";

import { NavAttentionBadge } from "@/components/dashboard/nav-attention-badge";

interface DashboardMobileNavProps {
  primaryNav: Array<{ href: string; label: string; description: string }>;
  optionalNav: Array<{ href: string; label: string; description: string }>;
  storefrontUrl: string;
  navAttentionCounts?: Partial<Record<string, number>>;
}

const PRIMARY_ICONS: Record<string, LucideIcon> = {
  "/painel": LayoutDashboard,
  "/painel/estoque": Car,
  "/painel/contatos": MessageSquare,
  "/painel/loja": Store,
  "/painel/equipe": Users,
};

const OPTIONAL_ICONS: Record<string, LucideIcon> = {
  "/painel/integracoes": Plug,
};

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export function DashboardMobileNav({
  primaryNav,
  optionalNav,
  storefrontUrl,
  navAttentionCounts = {},
}: DashboardMobileNavProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  function isNavItemActive(href: string): boolean {
    if (href === "/painel") {
      return pathname === "/painel";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderLink(item: { href: string; label: string; description: string }) {
    const active = isNavItemActive(item.href);
    const Icon = PRIMARY_ICONS[item.href] ?? OPTIONAL_ICONS[item.href] ?? LayoutDashboard;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          linkBase,
          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="block">{item.label}</span>
            <NavAttentionBadge count={navAttentionCounts[item.href] ?? 0} />
          </span>
          <span
            className={cn(
              "block text-xs font-normal",
              active ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {item.description}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 lg:hidden">
          <Menu className="size-4" aria-hidden />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-[100dvh] w-full max-w-xs flex-col gap-0 p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Navegação</SheetTitle>
          <SheetDescription>Acesso rápido às áreas do painel da loja.</SheetDescription>
        </SheetHeader>
        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Menu mobile">
          <div>
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Operação
            </p>
            <div className="mt-2 space-y-1">{primaryNav.map(renderLink)}</div>
          </div>
          {optionalNav.length > 0 ? (
            <div>
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Divulgação
              </p>
              <div className="mt-2 space-y-1">{optionalNav.map(renderLink)}</div>
            </div>
          ) : null}
        </nav>
        <div className="border-t p-4 space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/painel/conta/senha" onClick={() => setOpen(false)}>
              Alterar senha
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
              Ver vitrine pública
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
