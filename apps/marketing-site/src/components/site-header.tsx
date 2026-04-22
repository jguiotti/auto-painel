import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

const navLinkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold tracking-tight text-primary-foreground">
            AP
          </span>
          <span className="text-lg font-semibold tracking-tight">AutoPainel</span>
        </Link>
        <nav
          className="flex flex-1 items-center justify-center gap-6 md:gap-8"
          aria-label="Principal"
        >
          <Link className={navLinkClass} href="/funcionalidades">
            Funcionalidades
          </Link>
          <Link className={navLinkClass} href="/contato">
            Contato
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            className="bg-marketing-accent px-3 text-white hover:bg-marketing-accent/90 sm:px-4"
            asChild
          >
            <Link href="/contato">
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Agendar demonstração</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
