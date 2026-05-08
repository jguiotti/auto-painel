import Link from "next/link";

import type { CSSProperties } from "react";

import { Button } from "@autopainel/shared/ui";

import {
  resolveDealershipBranding,
  resolveDealershipFontStacks,
  resolveDealershipFooterLogoUrl,
  resolveGoogleFontsHrefFromTheme,
  resolveDealershipHeaderLogoUrl,
} from "@autopainel/shared/lib/theme/branding";

import { DealershipFontsLink } from "@/components/storefront/dealership-fonts-link";
import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { buildWhatsAppUrl } from "@/lib/phone/build-whatsapp-url";
import type { DealershipPublicRecord } from "@/types/dealership-public";

import { PublicDealershipProvider } from "@/components/storefront/public-dealership-provider";

interface StorefrontShellProps {
  dealership: DealershipPublicRecord;
  children: React.ReactNode;
}

export function StorefrontShell({
  dealership,
  children,
}: StorefrontShellProps) {
  const theme = resolveDealershipBranding({
    theme_settings: dealership.theme_settings,
    theme_config: dealership.theme_config,
  });
  const fonts = resolveDealershipFontStacks(dealership.theme_config);
  const headerLogoSrc = resolveDealershipHeaderLogoUrl(
    dealership.theme_config,
    dealership.logo_url ?? null,
  );
  const footerLogoSrc = resolveDealershipFooterLogoUrl(
    dealership.theme_config,
    dealership.logo_url ?? null,
  );
  const googleFontsHref = resolveGoogleFontsHrefFromTheme(dealership.theme_config);
  const showFinanceSimulator = isDealershipFeatureEnabled(
    dealership.enabled_features,
    "finance_simulator",
  );
  const whatsappHref = dealership.whatsapp_number
    ? buildWhatsAppUrl(dealership.whatsapp_number)
    : null;

  const panelBase = process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_ORIGIN?.replace(
    /\/$/,
    "",
  );

  const layoutId = dealership.layout_id;

  const cssVars = {
    "--dealer-primary": theme.primary,
    "--dealer-accent": theme.accent,
    "--dealer-bg": theme.background,
    "--dealer-fg": theme.foreground,
    "--dealer-surface": theme.surface,
    "--dealer-font-heading": fonts.heading,
    "--dealer-font-body": fonts.body,
  } as CSSProperties;

  const headerTone =
    layoutId === 1
      ? "border-black/10 shadow-[0_1px_0_color-mix(in_srgb,var(--dealer-primary)_22%,transparent)]"
      : layoutId === 2
        ? "border-black/10 shadow-[0_8px_30px_-16px_color-mix(in_srgb,var(--dealer-primary)_35%,transparent)]"
        : "border-black/10 shadow-[0_10px_36px_-18px_color-mix(in_srgb,var(--dealer-primary)_40%,transparent)]";

  return (
    <PublicDealershipProvider value={dealership}>
      <DealershipFontsLink href={googleFontsHref} />
      <div
        className="flex min-h-screen flex-col bg-[var(--dealer-bg)] text-[var(--dealer-fg)] antialiased"
        style={{
          ...cssVars,
          fontFamily: "var(--dealer-font-body)",
        }}
        data-storefront-layout={layoutId}
      >
        <header
          className={`sticky top-0 z-30 border-b bg-[var(--dealer-surface)]/95 backdrop-blur dark:border-white/10 ${headerTone}`}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              {headerLogoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- URLs externas do painel master
                <img
                  src={headerLogoSrc}
                  alt={dealership.name}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <span
                  className="text-lg font-bold text-[var(--dealer-primary)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {dealership.name}
                </span>
              )}
            </Link>
            <nav className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#estoque">Estoque</Link>
              </Button>
              {showFinanceSimulator ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/simular-financiamento">Simular financiamento</Link>
                </Button>
              ) : null}
              {whatsappHref ? (
                <Button
                  size="sm"
                  className="bg-[var(--dealer-accent)] text-white hover:opacity-95"
                  asChild
                >
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
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center text-sm text-[var(--dealer-fg)]/70">
            {footerLogoSrc ? (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas do painel */}
                <img
                  src={footerLogoSrc}
                  alt=""
                  className="max-h-32 w-auto max-w-[260px] object-contain md:max-h-40 md:max-w-[300px]"
                />
              </div>
            ) : null}
            <div>
              {!footerLogoSrc ? (
                <p
                  className="font-medium text-[var(--dealer-primary)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {dealership.name}
                </p>
              ) : (
                <p
                  className="text-base font-semibold text-[var(--dealer-primary)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {dealership.name}
                </p>
              )}
            {dealership.contact_email ? (
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
          </div>
        </footer>
      </div>
    </PublicDealershipProvider>
  );
}
