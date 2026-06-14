import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";
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
  title: "Painel da loja",
  description:
    "Gestão e vitrines digitais para concessionárias de veículos seminovos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <AutopainelGoogleTagManagerHead appSurface="dealership_panel" />
      </head>
      <body className="min-h-full flex flex-col">
        <AutopainelGoogleTagManagerBody appSurface="dealership_panel" />
        {children}
      </body>
    </html>
  );
}
