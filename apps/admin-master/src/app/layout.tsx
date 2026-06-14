import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";

import { FAVICON_SRC } from "@/lib/brand";

import "./globals.css";

import { Toaster } from "@autopainel/shared/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoPainel — Admin",
  description: "Painel mestre da plataforma.",
  icons: {
    icon: FAVICON_SRC,
    shortcut: FAVICON_SRC,
    apple: FAVICON_SRC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <AutopainelGoogleTagManagerHead appSurface="admin" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <AutopainelGoogleTagManagerBody appSurface="admin" />
        {children}
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
