import { EquipeHubTabs } from "@/components/equipe-hub-tabs";
import { PlatformSalesRepForm } from "@/components/platform-sales-rep-form";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function NovoRepresentanteComercialPage() {
  await requireAdminSession();

  return (
    <div className="space-y-6">
      <EquipeHubTabs />
      <PlatformSalesRepForm mode="create" />
    </div>
  );
}
