import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AutopainelGoogleTagManagerBody,
  AutopainelGoogleTagManagerHead,
} from "@autopainel/shared/components/analytics/autopainel-google-tag-manager";
import { resolveDealershipFaviconUrl } from "@autopainel/shared/lib/theme/branding";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { COOKIE_CONSENT_COOKIE, hasAnalyticsConsent } from "@/lib/cookie-consent";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  if (!dealership?.name) {
    return { title: "Vitrine" };
  }
  const faviconUrl = resolveDealershipFaviconUrl(
    dealership.theme_config,
    dealership.logo_url,
  );

  return {
    title: dealership.name,
    description: `Veículos e condições — ${dealership.name}`,
    icons: faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
        }
      : undefined,
  };
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dealership = await getDealershipPublicRecord();
  if (!dealership?.id) {
    redirect("/erro/concessionaria");
  }

  const cookieStore = await cookies();
  const consentValue = cookieStore.get(COOKIE_CONSENT_COOKIE)?.value ?? null;
  const analyticsAllowed = hasAnalyticsConsent(consentValue);

  return (
    <>
      {analyticsAllowed ? (
        <AutopainelGoogleTagManagerHead appSurface="customer_storefront" />
      ) : null}
      {analyticsAllowed ? (
        <AutopainelGoogleTagManagerBody appSurface="customer_storefront" />
      ) : null}
      <StorefrontShell dealership={dealership}>{children}</StorefrontShell>
    </>
  );
}
