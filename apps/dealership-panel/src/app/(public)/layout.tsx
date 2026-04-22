import { PublicSiteShell } from "@/components/public/PublicSiteShell";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export default async function PublicSiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dealershipId = await getDealershipIdFromCookies();
  const supabase = await createSupabaseServerClient();

  let dealership = null;
  if (dealershipId) {
    const { data } = await supabase.rpc("get_dealership_public_by_id", {
      p_id: dealershipId,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (row) {
      dealership = {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        logo_url: (row.logo_url as string | null) ?? null,
        theme_settings: row.theme_settings,
        whatsapp_number: (row.whatsapp_number as string | null) ?? null,
        contact_email: (row.contact_email as string | null) ?? null,
      };
    }
  }

  return <PublicSiteShell dealership={dealership}>{children}</PublicSiteShell>;
}
