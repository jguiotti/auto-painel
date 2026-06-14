import { redirect } from "next/navigation";

import type { BrazilianAddressFields, DealershipContentConfig } from "@autopainel/shared/types";

import { DealershipStoreSettingsForm } from "@/components/settings/dealership-store-settings-form";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

function readHqAddress(content: unknown): BrazilianAddressFields {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }
  const cfg = content as DealershipContentConfig;
  return cfg.hq_address ?? {};
}

export default async function DealershipStoreSettingsPage() {
  const { supabase, profile, dealershipId } = await requireDashboardSession(
    "/painel/loja",
  );

  const canManage =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";

  if (!canManage) {
    redirect("/painel");
  }

  const { data: dealership, error } = await supabase
    .from("dealerships")
    .select("name, contact_email, whatsapp_number, content_config")
    .eq("id", dealershipId)
    .single();

  if (error || !dealership) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar os dados da loja.
      </p>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dados da loja
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize contato e endereço exibidos na vitrine de{" "}
          <span className="font-medium text-foreground">{dealership.name}</span>.
        </p>
      </div>

      <DealershipStoreSettingsForm
        defaults={{
          contactEmail: dealership.contact_email ?? "",
          whatsappNumber: dealership.whatsapp_number ?? "",
          hqAddress: readHqAddress(dealership.content_config),
        }}
      />
    </div>
  );
}
