import type { Metadata } from "next";
import { cookies } from "next/headers";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { MarketingJsonLd } from "@/components/marketing-json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloatButton } from "@/components/whatsapp-float-button";
import { fontMardoto, fontOswald, FAVICON_SRC } from "@/lib/brand";
import { COOKIE_CONSENT_COOKIE, hasAnalyticsConsent } from "@/lib/cookie-consent";
import { LEGAL_SITE_URL } from "@/lib/legal/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AutoPainel — Plataforma digital para concessionárias",
    template: "%s | AutoPainel",
  },
  description:
    "Site exclusivo e painel de gestão para concessionárias: estoque isolado, equipe com papéis, 3 layouts de vitrine e SEO de qualidade. Demonstração gratuita.",
  metadataBase: new URL(LEGAL_SITE_URL),
  icons: {
    icon: FAVICON_SRC,
    shortcut: FAVICON_SRC,
    apple: FAVICON_SRC,
  },
  openGraph: {
    siteName: "AutoPainel",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AutoPainel" }],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const consentValue = cookieStore.get(COOKIE_CONSENT_COOKIE)?.value ?? null;
  const analyticsAllowed = hasAnalyticsConsent(consentValue);

  return (
    <html lang="pt-BR" className="dark">
      <head>
        {analyticsAllowed ? (
          <AutopainelGoogleTagManagerHead appSurface="marketing" />
        ) : null}
      </head>
      <body
        className={`${fontOswald.variable} ${fontMardoto.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <MarketingJsonLd />
        {analyticsAllowed ? (
          <AutopainelGoogleTagManagerBody appSurface="marketing" />
        ) : null}
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
        <WhatsAppFloatButton />
      </body>
    </html>
  );
}
