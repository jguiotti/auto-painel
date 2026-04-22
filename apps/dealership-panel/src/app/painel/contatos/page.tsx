import { LeadList, type LeadListItem } from "@/components/leads/LeadList";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function LeadsPage() {
  const { supabase } = await requireDashboardSession();

  const { data: rows, error } = await supabase
    .from("leads")
    .select(
      "id, client_name, phone, type, created_at, vehicles(id, brand, model, public_slug)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar os contatos: {error.message}
      </p>
    );
  }

  const leads: LeadListItem[] = (rows ?? []).map((row) => {
    const v = row.vehicles as
      | { id: string; brand: string; model: string; public_slug: string }
      | { id: string; brand: string; model: string; public_slug: string }[]
      | null;
    const vehicleData = Array.isArray(v) ? v[0] : v;
    return {
      id: row.id,
      client_name: row.client_name,
      phone: row.phone,
      type: row.type,
      created_at: row.created_at,
      vehicles: vehicleData
        ? {
            id: vehicleData.id,
            brand: vehicleData.brand,
            model: vehicleData.model,
            public_slug: vehicleData.public_slug,
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Contatos
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Interessados vindos da vitrine. Abra o WhatsApp com um clique.
        </p>
      </div>
      <LeadList leads={leads} />
    </div>
  );
}
