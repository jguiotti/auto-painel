import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getResolvedDealershipId } from "@/lib/tenant/get-dealership-id";
import type { DealershipPublicRecord } from "@/types/dealership-public";

export async function generateMetadata(): Promise<Metadata> {
  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    return { title: "Vitrine" };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_dealership_public_by_id", {
    p_id: dealershipId,
  });
  const row = Array.isArray(data) ? data[0] : null;
  const name = row?.name ? String(row.name) : "Vitrine";

  return {
    title: name,
    description: `Veículos e condições — ${name}`,
  };
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dealershipId = await getResolvedDealershipId();
  if (!dealershipId) {
    redirect("/erro/concessionaria");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_dealership_public_by_id", {
    p_id: dealershipId,
  });
  const row = Array.isArray(data) ? data[0] : null;

  const dealership: DealershipPublicRecord | null = row
    ? {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        logo_url: (row.logo_url as string | null) ?? null,
        theme_settings: row.theme_settings,
        whatsapp_number: (row.whatsapp_number as string | null) ?? null,
        contact_email: (row.contact_email as string | null) ?? null,
      }
    : null;

  return <StorefrontShell dealership={dealership}>{children}</StorefrontShell>;
}
