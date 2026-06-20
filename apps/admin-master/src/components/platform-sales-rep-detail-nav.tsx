"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";

interface PlatformSalesRepDetailNavProps {
  repId: string;
  repName: string;
}

export function PlatformSalesRepDetailNav({
  repId,
  repName,
}: PlatformSalesRepDetailNavProps) {
  const pathname = usePathname() ?? "";
  const base = `/painel/equipe/comercial/${repId}`;

  const tabs = [
    { href: base, label: "Dados", match: (path: string) => path === base },
    {
      href: `${base}/extrato`,
      label: "Extrato",
      match: (path: string) => path.startsWith(`${base}/extrato`),
    },
    {
      href: `${base}/repasse`,
      label: "Repasse",
      match: (path: string) => path.startsWith(`${base}/repasse`),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Representante comercial</p>
          <h1 className="text-2xl font-bold tracking-tight">{repName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/painel/equipe/comercial">Voltar à lista</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${base}/repasse`}>Repassar carteira</Link>
          </Button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 border-b pb-2" aria-label="Ficha do representante">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab.match(pathname)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
