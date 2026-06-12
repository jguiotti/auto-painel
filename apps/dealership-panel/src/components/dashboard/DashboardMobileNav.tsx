"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

interface DashboardMobileNavProps {
  primaryNav: Array<{ href: string; label: string; description: string }>;
  optionalNav: Array<{ href: string; label: string; description: string }>;
  storefrontUrl: string;
}

export function DashboardMobileNav({
  primaryNav,
  optionalNav,
  storefrontUrl,
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
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "block rounded-lg px-3 py-2.5 transition-colors",
          active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        )}
        onClick={() => setOpen(false)}
      >
        <span className="block text-sm font-medium">{item.label}</span>
        <span
          className={cn(
            "block text-xs",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {item.description}
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
