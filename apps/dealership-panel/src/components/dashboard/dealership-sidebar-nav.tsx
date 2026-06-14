"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Store,
  Users,
} from "lucide-react";

import { cn } from "@autopainel/shared/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface DealershipSidebarNavProps {
  primaryNav: Array<{ href: string; label: string; description: string }>;
  optionalNav: Array<{ href: string; label: string; description: string }>;
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
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/painel") {
    return pathname === "/painel";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function toNavGroups(
  primaryNav: DealershipSidebarNavProps["primaryNav"],
  optionalNav: DealershipSidebarNavProps["optionalNav"],
): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: "Operação",
      items: primaryNav.map((item) => ({
        href: item.href,
        label: item.label,
        icon: PRIMARY_ICONS[item.href] ?? LayoutDashboard,
      })),
    },
  ];

  if (optionalNav.length > 0) {
    groups.push({
      title: "Divulgação",
      items: optionalNav.map((item) => ({
        href: item.href,
        label: item.label,
        icon: OPTIONAL_ICONS[item.href] ?? Plug,
      })),
    });
  }

  return groups;
}

export function DealershipSidebarNav({
  primaryNav,
  optionalNav,
}: DealershipSidebarNavProps) {
  const pathname = usePathname() ?? "";
  const groups = toNavGroups(primaryNav, optionalNav);

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Menu principal">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      linkBase,
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
