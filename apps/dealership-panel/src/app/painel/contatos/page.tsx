import { LeadList, type LeadListItem } from "@/components/leads/LeadList";
import type { LeadAssigneeOption } from "@/components/leads/lead-assignee-select";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function LeadsPage() {
  const { supabase, profile, dealershipId } = await requireDashboardSession();
  const canManageAssignments =
    profile.role === "owner" || profile.role === "super_admin";

  const [{ data: rows, error }, { data: assigneeRows }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, client_name, phone, type, created_at, assigned_user_id, vehicles(id, brand, model, public_slug)",
      )
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, role")
      .eq("dealership_id", dealershipId)
      .in("role", ["owner", "seller"])
      .order("role", { ascending: true }),
  ]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar os contatos: {error.message}
      </p>
    );
  }

  const assignees: LeadAssigneeOption[] = (assigneeRows ?? []).map((r) => ({
    id: r.id as string,
    role: r.role as string,
  }));

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
      assigned_user_id: (row.assigned_user_id as string | null) ?? null,
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
        {canManageAssignments ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 dark:text-zinc-400">
            Atribua cada contato a um vendedor para que ele apareça no painel
            dessa pessoa. Contatos sem responsável ficam visíveis apenas para o
            gestor da loja.
          </p>
        ) : null}
      </div>
      <LeadList
        leads={leads}
        viewerRole={profile.role}
        canManageAssignments={canManageAssignments}
        assignees={assignees}
      />
    </div>
  );
}
