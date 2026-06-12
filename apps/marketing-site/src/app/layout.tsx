import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

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
    default: "AutoPainel — Plataforma para concessionárias",
    template: "%s | AutoPainel",
  },
  description:
    "Estoque, leads e vitrine digital com isolamento multitenant e segurança para sua concessionária.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <AutopainelGoogleTagManagerHead appSurface="marketing" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <AutopainelGoogleTagManagerBody appSurface="marketing" />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
