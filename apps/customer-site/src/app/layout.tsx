import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";

import { hasAnalyticsConsent, COOKIE_CONSENT_COOKIE } from "@/lib/cookie-consent";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vitrine",
    template: "%s · Vitrine",
  },
  description: "Vitrine de veículos da concessionária.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const analyticsAllowed = hasAnalyticsConsent(
    cookieStore.get(COOKIE_CONSENT_COOKIE)?.value ?? null,
  );

  return (
    <html lang="pt-BR">
      <head>
        <AutopainelGoogleTagManagerHead
          appSurface="customer_storefront"
          platformRootDomain={process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}
          analyticsConsentGranted={analyticsAllowed}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <AutopainelGoogleTagManagerBody
          appSurface="customer_storefront"
          platformRootDomain={process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN}
          analyticsConsentGranted={analyticsAllowed}
        />
        {children}
      </body>
    </html>
  );
}
