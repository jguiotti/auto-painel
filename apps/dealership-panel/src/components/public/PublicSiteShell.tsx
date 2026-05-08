import Link from "next/link";

import {
  resolveDealershipBranding,
  resolveDealershipLogoUrl,
} from "@autopainel/shared/lib/theme/branding";

import { PublicDealershipProvider } from "@/components/public/PublicDealershipProvider";
import { buildWhatsAppUrl } from "@/lib/phone/build-whatsapp-url";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

export interface DealershipPublicRecord {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme_settings: unknown;
  theme_config: unknown;
  content_config: unknown;
  enabled_features: string[] | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  layout_id: StorefrontLayoutTemplateId;
}

interface PublicSiteShellProps {
  dealership: DealershipPublicRecord | null;
  children: React.ReactNode;
}

export function PublicSiteShell({
  dealership,
  children,
}: PublicSiteShellProps) {
  const theme = resolveDealershipBranding({
    theme_settings: dealership?.theme_settings,
    theme_config: dealership?.theme_config,
  });
  const logoSrc = resolveDealershipLogoUrl(
    dealership?.theme_config,
    dealership?.logo_url ?? null,
  );
  const whatsappHref = dealership?.whatsapp_number
    ? buildWhatsAppUrl(dealership.whatsapp_number)
    : null;

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
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- whitelabel URLs may be any origin
                <img
                  src={logoSrc}
                  alt={dealership?.name ?? "Loja"}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-[var(--dealer-primary)]">
                  {dealership?.name ?? "Loja"}
                </span>
              )}
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/#estoque"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--dealer-fg)] hover:bg-black/5 dark:hover:bg-white/10"
              >
                Estoque
              </Link>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[var(--dealer-accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  WhatsApp
                </a>
              ) : null}
              <Link
                href="/painel"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--dealer-fg)]/70 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Área da loja
              </Link>
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
