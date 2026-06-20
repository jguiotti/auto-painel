"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@autopainel/shared/lib/utils";

const TABS = [
  { href: "/painel/equipe", label: "Operadores da plataforma", match: (path: string) =>
      path === "/painel/equipe" || path === "/painel/equipe/",
  },
  { href: "/painel/equipe/comercial", label: "Representantes comerciais", match: (path: string) =>
      path.startsWith("/painel/equipe/comercial"),
  },
] as const;

export function EquipeHubTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
      aria-label="Equipe AutoPainel"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
