import type { Metadata } from "next";

import { AuthBrandingProvider } from "@/components/auth/auth-branding-provider";
import { resolveAuthDealershipBranding } from "@/lib/auth/resolve-auth-dealership-branding";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await resolveAuthDealershipBranding();

  if (!branding) {
    return {
      title: "Entrar | Painel",
    };
  }

  return {
    title: `${branding.dealershipName} | Entrar`,
    icons: branding.faviconUrl
      ? {
          icon: branding.faviconUrl,
          shortcut: branding.faviconUrl,
          apple: branding.faviconUrl,
        }
      : undefined,
  };
}

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await resolveAuthDealershipBranding();

  return (
    <AuthBrandingProvider branding={branding}>{children}</AuthBrandingProvider>
  );
}
