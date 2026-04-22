import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { buildWhatsAppUrl } from "@/lib/phone/build-whatsapp-url";
import { parseDealershipTheme } from "@/lib/theme/parse-dealership-theme";
import type { DealershipPublicRecord } from "@/types/dealership-public";

import { PublicDealershipProvider } from "@/components/storefront/public-dealership-provider";

interface StorefrontShellProps {
  dealership: DealershipPublicRecord | null;
  children: React.ReactNode;
}

export function StorefrontShell({
  dealership,
  children,
}: StorefrontShellProps) {
  const theme = parseDealershipTheme(dealership?.theme_settings);
  const whatsappHref = dealership?.whatsapp_number
    ? buildWhatsAppUrl(dealership.whatsapp_number)
    : null;

  const panelBase = process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_ORIGIN?.replace(
    /\/$/,
    "",
  );

  const cssVars = {
    "--dealer-primary": theme.primary,
    "--dealer-accent": theme.accent,
    "--dealer-bg": theme.background,
    "--dealer-fg": theme.foreground,
    "--dealer-surface": theme.surface,
  } as React.CSSProperties;

  return (
    <PublicDealershipProvider value={dealership}>
      <div
        className="flex min-h-screen flex-col bg-[var(--dealer-bg)] text-[var(--dealer-fg)]"
        style={cssVars}
      >
        <header className="sticky top-0 z-30 border-b border-black/5 bg-[var(--dealer-surface)]/95 shadow-sm backdrop-blur dark:border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              {dealership?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URLs externas do painel master
                <img
                  src={dealership.logo_url}
                  alt={dealership.name}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-[var(--dealer-primary)]">
                  {dealership?.name ?? "Loja"}
                </span>
              )}
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#estoque">Estoque</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/simular-financiamento">Simular financiamento</Link>
              </Button>
              {whatsappHref ? (
                <Button size="sm" className="bg-[var(--dealer-accent)] text-white hover:opacity-95" asChild>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              {panelBase ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={`${panelBase}/painel`}>Área da loja</a>
                </Button>
              ) : null}
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-auto border-t border-black/5 bg-[var(--dealer-surface)] py-8 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-[var(--dealer-fg)]/70">
            <p className="font-medium text-[var(--dealer-primary)]">
              {dealership?.name}
            </p>
            {dealership?.contact_email ? (
              <p className="mt-1">
                <a
                  href={`mailto:${dealership.contact_email}`}
                  className="underline hover:text-[var(--dealer-accent)]"
                >
                  {dealership.contact_email}
                </a>
              </p>
            ) : null}
          </div>
        </footer>
      </div>
    </PublicDealershipProvider>
  );
}
