import { redirect } from "next/navigation";

import { RepPortalShell } from "@/components/rep-portal-shell";
import { requirePlatformPainelAccess } from "@/lib/auth/require-platform-painel-access";
import { fetchPlatformSalesRepById } from "@/lib/data/platform-sales-squad";

export const dynamic = "force-dynamic";

export default async function CommercialPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await requirePlatformPainelAccess();

  if (actor.isAdmin && !actor.salesRepId) {
    redirect("/painel/dashboard");
  }

  if (!actor.salesRepId) {
    redirect("/login?error=forbidden");
  }

  const rep = await fetchPlatformSalesRepById(actor.salesRepId);

  return <RepPortalShell repName={rep?.full_name}>{children}</RepPortalShell>;
}
