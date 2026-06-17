import {
  resolveDealershipFooterLogoUrl,
  resolveGoogleFontsHrefFromTheme,
  resolveDealershipHeaderLogoUrl,
} from "@autopainel/shared/lib/theme/branding";
import { buildStorefrontCssVariables } from "@autopainel/shared/lib/theme/storefront-css-vars";

import Link from "next/link";

import { DealershipFontsLink } from "@/components/storefront/dealership-fonts-link";
import { StorefrontCookieConsentBanner } from "@/components/storefront/storefront-cookie-consent-banner";
import { StorefrontFooterSocialLinks } from "@/components/storefront/storefront-footer-social-links";
import { StorefrontHeaderNav } from "@/components/storefront/storefront-header-nav";
import { StorefrontWhatsAppFloat } from "@/components/storefront/storefront-whatsapp-float";
import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { PublicDealershipProvider } from "@/components/storefront/public-dealership-provider";
import type { DealershipPublicRecord } from "@/types/dealership-public";

interface StorefrontShellProps {
  dealership: DealershipPublicRecord;
  children: React.ReactNode;
}

export function StorefrontShell({
  dealership,
  children,
}: StorefrontShellProps) {
  const theme = buildStorefrontCssVariables({
    theme_settings: dealership.theme_settings,
    theme_config: dealership.theme_config,
  });
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

  const panelBase = process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_ORIGIN?.replace(
    /\/$/,
    "",
  );

  const layoutId = dealership.layout_id;

  const cssVars = theme;

  const headerTone =
    layoutId === 1
      ? "border-[color-mix(in_srgb,var(--dealer-primary)_25%,transparent)] shadow-[0_10px_30px_-15px_color-mix(in_srgb,var(--dealer-primary)_35%,transparent)]"
      : layoutId === 2
        ? "border-[color-mix(in_srgb,var(--dealer-primary)_30%,transparent)] shadow-[0_12px_34px_-16px_color-mix(in_srgb,var(--dealer-primary)_40%,transparent)]"
        : "border-[color-mix(in_srgb,var(--dealer-primary)_35%,transparent)] shadow-[0_14px_36px_-18px_color-mix(in_srgb,var(--dealer-primary)_45%,transparent)]";

  const headerClass =
    layoutId === 1
      ? "h-20 bg-[color-mix(in_srgb,var(--dealer-bg)_92%,black)]/95"
      : "h-20 bg-[color-mix(in_srgb,var(--dealer-bg)_90%,black)]/95";

  return (
    <PublicDealershipProvider value={dealership}>
      <DealershipFontsLink href={googleFontsHref} />
      <div
        className="flex min-h-screen flex-col bg-[var(--dealer-bg)] text-[var(--dealer-fg)] antialiased"
        style={{
          ...cssVars,
          fontFamily: "var(--storefront-font-body, var(--dealer-font-body))",
        }}
        data-storefront-layout={layoutId}
      >
        <header
          className={`relative sticky top-0 z-30 border-b backdrop-blur ${headerClass} ${headerTone}`}
        >
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <StorefrontHeaderNav
              showFinanceSimulator={showFinanceSimulator}
              panelBase={panelBase ?? null}
              headerLogoSrc={headerLogoSrc}
              dealershipName={dealership.name}
            />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-auto border-t border-black/5 bg-[var(--dealer-surface)] py-8 dark:border-white/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 text-center text-sm text-[var(--dealer-fg)]/70 sm:px-6 lg:px-8">
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
            <StorefrontFooterSocialLinks contentConfig={dealership.content_config} />
            <nav
              className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs"
              aria-label="Links legais"
            >
              <Link href="/politica-de-privacidade" className="hover:text-[var(--dealer-primary)]">
                Política de Privacidade
              </Link>
              <Link href="/termos-de-uso" className="hover:text-[var(--dealer-primary)]">
                Termos de Uso
              </Link>
              <Link href="/politica-de-cookies" className="hover:text-[var(--dealer-primary)]">
                Política de Cookies
              </Link>
            </nav>
            </div>
          </div>
        </footer>
        <StorefrontCookieConsentBanner />
        <StorefrontWhatsAppFloat />
      </div>
    </PublicDealershipProvider>
  );
}
