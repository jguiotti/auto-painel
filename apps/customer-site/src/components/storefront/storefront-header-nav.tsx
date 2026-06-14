"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";

interface StorefrontHeaderNavProps {
  showFinanceSimulator: boolean;
  panelBase: string | null;
  headerLogoSrc: string | null;
  dealershipName: string;
}

export function StorefrontHeaderNav({
  showFinanceSimulator,
  panelBase,
  headerLogoSrc,
  dealershipName,
}: StorefrontHeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        href="/estoque"
        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[color-mix(in_srgb,var(--dealer-primary)_8%,transparent)]"
        onClick={() => setMobileOpen(false)}
      >
        Estoque
      </Link>
      {showFinanceSimulator ? (
        <Link
          href="/simular-financiamento"
          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[color-mix(in_srgb,var(--dealer-primary)_8%,transparent)]"
          onClick={() => setMobileOpen(false)}
        >
          Simular financiamento
        </Link>
      ) : null}
    </>
  );

  return (
    <>
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 sm:flex-none">
        {headerLogoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- external branding URLs
          <img
            src={headerLogoSrc}
            alt={dealershipName}
            className="h-9 w-auto max-w-[140px] object-contain sm:h-10 sm:max-w-[180px]"
          />
        ) : (
          <span
            className="truncate text-base font-bold text-[var(--dealer-primary)] sm:text-lg"
            style={{ fontFamily: "var(--dealer-font-heading)" }}
          >
            {dealershipName}
          </span>
        )}
      </Link>

      <nav className="hidden items-center gap-1 md:flex" aria-label="Menu principal">
        {navLinks}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="hidden bg-[var(--dealer-accent)] px-4 text-white hover:opacity-95 sm:inline-flex"
          asChild
        >
          <Link href="/contato">Contato</Link>
        </Button>

        {panelBase ? (
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <a href={`${panelBase}/painel`}>Área da loja</a>
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="storefront-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? "Fechar" : "Menu"}
        </Button>
      </div>

      <div
        id="storefront-mobile-menu"
        className={cn(
          "absolute inset-x-0 top-full border-b bg-[color-mix(in_srgb,var(--dealer-bg)_96%,black)]/98 backdrop-blur md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-8">
          {navLinks}
          <Link
            href="/contato"
            className="mt-2 rounded-md bg-[var(--dealer-accent)] px-3 py-2 text-center text-sm font-medium text-white"
            onClick={() => setMobileOpen(false)}
          >
            Fale conosco
          </Link>
          {panelBase ? (
            <a
              href={`${panelBase}/painel`}
              className="rounded-md border px-3 py-2 text-center text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Área da loja
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
