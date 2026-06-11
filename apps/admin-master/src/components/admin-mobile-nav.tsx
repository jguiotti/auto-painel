"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@autopainel/shared/lib/utils";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@autopainel/shared/ui";

interface AdminMobileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AdminMobileNavProps {
  items: AdminMobileNavItem[];
}

export function AdminMobileNav({ items }: AdminMobileNavProps) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 md:hidden">
          <Menu className="size-4" aria-hidden />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-[100dvh] w-full max-w-xs flex-col gap-0 p-0 sm:max-w-xs"
      >
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Plataforma AutoPainel</SheetTitle>
          <SheetDescription>Navegação do painel administrativo.</SheetDescription>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Menu mobile admin">
          <div className="space-y-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
