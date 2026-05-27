import {
  Button,
} from "@autopainel/shared/ui";

import {
  resolveDealershipFooterLogoUrl,
  resolveGoogleFontsHrefFromTheme,
  resolveDealershipHeaderLogoUrl,
} from "@autopainel/shared/lib/theme/branding";
import { buildStorefrontCssVariables } from "@autopainel/shared/lib/theme/storefront-css-vars";

import { DealershipFontsLink } from "@/components/storefront/dealership-fonts-link";
import { StorefrontHeaderNav } from "@/components/storefront/storefront-header-nav";
import { isDealershipFeatureEnabled } from "@autopainel/shared/lib/dealership-features";

import { buildStorefrontWhatsAppUrl } from "@/lib/phone/build-storefront-whatsapp-url";
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
  const whatsappHref = dealership.whatsapp_number
    ? buildStorefrontWhatsAppUrl({
        phone: dealership.whatsapp_number,
        message: `Olá! Vim pelo site da ${dealership.name} e gostaria de mais informações.`,
        dealershipSlug: dealership.slug,
        campaign: "header_cta",
      })
    : null;

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
              whatsappHref={whatsappHref}
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
            </div>
          </div>
        </footer>
      </div>
    </PublicDealershipProvider>
  );
}
