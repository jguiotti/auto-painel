import type { Metadata } from "next";

import {
  resolveDealershipFaviconUrl,
  resolveDealershipHeaderLogoUrl,
} from "@autopainel/shared/lib/theme/branding";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export const dynamic = "force-dynamic";

async function readDealershipVisualContext() {
  const { supabase, dealershipId, profile } = await requireDashboardSession();
  const { data: dealership } = await supabase
    .from("dealerships")
    .select("name, logo_url, theme_config")
    .eq("id", dealershipId)
    .single();
  const dealershipName = dealership?.name ?? "Painel";
  const dealershipLogoUrl = resolveDealershipHeaderLogoUrl(
    dealership?.theme_config ?? null,
    dealership?.logo_url ?? null,
  );
  const dealershipFaviconUrl = resolveDealershipFaviconUrl(
    dealership?.theme_config ?? null,
  );

  return {
    profile,
    dealershipId,
    dealershipName,
    dealershipLogoUrl,
    dealershipFaviconUrl,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { dealershipName, dealershipFaviconUrl } = await readDealershipVisualContext();

  return {
    title: `${dealershipName} | Painel`,
    icons: dealershipFaviconUrl
      ? {
          icon: dealershipFaviconUrl,
          shortcut: dealershipFaviconUrl,
        }
      : undefined,
  };
}

export default async function PainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, dealershipId, dealershipName, dealershipLogoUrl } =
    await readDealershipVisualContext();

  return (
    <DashboardShell
      dealershipName={dealershipName}
      dealershipLogoUrl={dealershipLogoUrl}
      dealershipId={dealershipId}
      viewerRole={profile.role}
    >
      {children}
    </DashboardShell>
  );
}
