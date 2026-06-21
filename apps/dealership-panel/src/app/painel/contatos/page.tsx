import { LeadInbox } from "@/components/leads/LeadInbox";
import type { LeadListItem } from "@/components/leads/LeadList";
import type { LeadAssigneeOption } from "@/components/leads/lead-assignee-select";
import type {
  InventoryVehicleOption,
  LeadNoteItem,
  SoldVehicleOption,
} from "@autopainel/shared/types/lead-crm";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export default async function LeadsPage() {
  const { supabase, profile, dealershipId } = await requireDashboardSession();
  const canManageAssignments =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";
  const canCreateManual =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "seller" ||
    profile.role === "super_admin";

  const [
    { data: rows, error },
    { data: notesRows, error: notesError },
    { data: assigneeRows },
    { data: inventoryRows },
    { data: soldRows },
    { data: interestRows },
  ] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, client_name, phone, client_email, message, type, source, status, created_at, next_follow_up_at, vehicle_id, converted_vehicle_id, assigned_user_id, loss_reason_code, loss_reason_note, customer_id, customers(id, document_cpf, document_cnpj, billing_address), vehicles!leads_vehicle_id_fkey(id, brand, model, public_slug)",
        )
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_notes")
        .select("id, lead_id, body, created_at, author_id")
        .eq("dealership_id", dealershipId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, role")
        .eq("dealership_id", dealershipId)
        .in("role", ["owner", "manager", "seller"])
        .order("role", { ascending: true }),
      supabase
        .from("vehicles")
        .select("id, brand, model, model_year, status")
        .eq("dealership_id", dealershipId)
        .eq("status", "available")
        .order("brand", { ascending: true })
        .order("model", { ascending: true })
        .limit(200),
      supabase
        .from("vehicles")
        .select("id, brand, model")
        .eq("dealership_id", dealershipId)
        .eq("status", "sold")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("lead_vehicle_interests")
        .select("lead_id, vehicles(id, brand, model, model_year, status)")
        .eq("dealership_id", dealershipId),
    ]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Não foi possível carregar os contatos: {error.message}
      </p>
    );
  }

  const notesByLeadId = new Map<string, LeadNoteItem[]>();
  if (!notesError) {
    for (const note of notesRows ?? []) {
      const leadId = note.lead_id as string;
      const bucket = notesByLeadId.get(leadId) ?? [];
      bucket.push({
        id: note.id as string,
        body: note.body as string,
        created_at: note.created_at as string,
        author_id: note.author_id as string,
      });
      notesByLeadId.set(leadId, bucket);
    }
  }

  const assignees: LeadAssigneeOption[] = (assigneeRows ?? []).map((r) => ({
    id: r.id as string,
    role: r.role as string,
  }));

  const inventoryVehicles: InventoryVehicleOption[] = (inventoryRows ?? []).map(
    (row) => ({
      id: row.id as string,
      brand: row.brand as string,
      model: row.model as string,
      status: row.status as string,
      model_year: (row.model_year as number | null) ?? null,
    }),
  );

  const soldVehicles: SoldVehicleOption[] = (soldRows ?? []).map((row) => ({
    id: row.id as string,
    brand: row.brand as string,
    model: row.model as string,
  }));

  const interestsByLeadId = new Map<
    string,
    LeadListItem["interest_vehicles"]
  >();
  for (const row of interestRows ?? []) {
    const leadId = row.lead_id as string;
    const vehicle = row.vehicles as
      | {
          id: string;
          brand: string;
          model: string;
          model_year: number | null;
          status: string;
        }
      | Array<{
          id: string;
          brand: string;
          model: string;
          model_year: number | null;
          status: string;
        }>
      | null;
    const vehicleData = Array.isArray(vehicle) ? vehicle[0] : vehicle;
    if (!vehicleData) {
      continue;
    }
    const bucket = interestsByLeadId.get(leadId) ?? [];
    bucket.push({
      id: vehicleData.id,
      brand: vehicleData.brand,
      model: vehicleData.model,
      model_year: vehicleData.model_year,
      status: vehicleData.status,
    });
    interestsByLeadId.set(leadId, bucket);
  }

  const leads: LeadListItem[] = (rows ?? []).map((row) => {
    const v = row.vehicles as
      | { id: string; brand: string; model: string; public_slug: string }
      | { id: string; brand: string; model: string; public_slug: string }[]
      | null;
    const vehicleData = Array.isArray(v) ? v[0] : v;
    const notes = notesByLeadId.get(row.id) ?? [];
    const customerRow = row.customers as
      | {
          id: string;
          document_cpf: string | null;
          document_cnpj: string | null;
          billing_address: Record<string, unknown>;
        }
      | Array<{
          id: string;
          document_cpf: string | null;
          document_cnpj: string | null;
          billing_address: Record<string, unknown>;
        }>
      | null;
    const customer = Array.isArray(customerRow) ? customerRow[0] : customerRow;

    return {
      id: row.id,
      client_name: row.client_name,
      phone: row.phone,
      client_email: (row.client_email as string | null) ?? null,
      message: (row.message as string | null) ?? null,
      type: row.type,
      source: (row.source as string | null) ?? null,
      status: (row.status as string | null) ?? "new",
      created_at: row.created_at,
      next_follow_up_at: (row.next_follow_up_at as string | null) ?? null,
      vehicle_id: (row.vehicle_id as string | null) ?? null,
      converted_vehicle_id: (row.converted_vehicle_id as string | null) ?? null,
      assigned_user_id: (row.assigned_user_id as string | null) ?? null,
      loss_reason_code: (row.loss_reason_code as string | null) ?? null,
      loss_reason_note: (row.loss_reason_note as string | null) ?? null,
      customer: customer
        ? {
            customer_id: customer.id,
            document_cpf: customer.document_cpf,
            document_cnpj: customer.document_cnpj,
            billing_address: customer.billing_address ?? {},
          }
        : row.customer_id
          ? {
              customer_id: row.customer_id as string,
              document_cpf: null,
              document_cnpj: null,
              billing_address: {},
            }
          : null,
      notes: notes.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
      interest_vehicles: interestsByLeadId.get(row.id) ?? [],
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Contatos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interessados vindos da vitrine ou cadastrados pela equipe. Enriqueça o
          cadastro, vincule ao estoque e acompanhe até a venda e o recibo.
        </p>
        {canManageAssignments ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Atribua cada contato a um vendedor e registre follow-ups no detalhe
            do lead.
          </p>
        ) : null}
      </div>
      <LeadInbox
        leads={leads}
        viewerRole={profile.role}
        canManageAssignments={canManageAssignments}
        canCreateManual={canCreateManual}
        assignees={assignees}
        inventoryVehicles={inventoryVehicles}
        soldVehicles={soldVehicles}
      />
    </div>
  );
}
