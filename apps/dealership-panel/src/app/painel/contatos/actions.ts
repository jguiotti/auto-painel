"use server";

import { revalidatePath } from "next/cache";

import type { LeadPipelineStatus } from "@autopainel/shared/types/lead-crm";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export interface LeadActionResult {
  error?: string;
  success?: boolean;
}

function canManageLeadCrm(role: string): boolean {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "super_admin" ||
    role === "seller"
  );
}

function canAssignLeads(role: string): boolean {
  return role === "owner" || role === "manager" || role === "super_admin";
}

export async function updateLeadAssigneeAction(
  leadId: string,
  assignedUserId: string | null,
): Promise<LeadActionResult> {
  const { supabase, profile, dealershipId } = await requireDashboardSession();

  if (!canAssignLeads(profile.role)) {
    return { error: "Apenas perfis de gestão podem atribuir contatos." };
  }

  if (assignedUserId) {
    const { data: peer, error: peerErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedUserId)
      .eq("dealership_id", dealershipId)
      .in("role", ["owner", "manager", "seller"])
      .maybeSingle();

    if (peerErr || !peer) {
      return { error: "Responsável inválido para esta loja." };
    }
  }

  const { error } = await supabase
    .from("leads")
    .update({ assigned_user_id: assignedUserId })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/contatos");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateLeadPipelineAction(
  leadId: string,
  input: {
    status?: LeadPipelineStatus;
    nextFollowUpAt?: string | null;
    convertedVehicleId?: string | null;
  },
): Promise<LeadActionResult> {
  const { supabase, profile } = await requireDashboardSession();

  if (!canManageLeadCrm(profile.role)) {
    return { error: "Sem permissão para atualizar este contato." };
  }

  const patch: Record<string, unknown> = {};

  if (input.status) {
    patch.status = input.status;
    if (input.status !== "won") {
      patch.converted_vehicle_id = null;
    }
  }

  if (input.nextFollowUpAt !== undefined) {
    patch.next_follow_up_at = input.nextFollowUpAt;
  }

  if (input.convertedVehicleId !== undefined) {
    patch.converted_vehicle_id = input.convertedVehicleId;
    if (input.convertedVehicleId) {
      patch.status = "won";
    }
  }

  if (Object.keys(patch).length === 0) {
    return { error: "Nada para atualizar." };
  }

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/contatos");
  return { success: true };
}

export async function addLeadNoteAction(
  leadId: string,
  body: string,
): Promise<LeadActionResult> {
  const { supabase, profile, dealershipId, user } =
    await requireDashboardSession();

  if (!canManageLeadCrm(profile.role)) {
    return { error: "Sem permissão para comentar." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Escreva um comentário." };
  }

  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    dealership_id: dealershipId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/contatos");
  return { success: true };
}

export async function createManualLeadAction(input: {
  clientName: string;
  phone: string;
  clientEmail?: string;
  message?: string;
  vehicleId?: string | null;
}): Promise<LeadActionResult & { leadId?: string }> {
  const { supabase, profile } = await requireDashboardSession();

  if (!canManageLeadCrm(profile.role)) {
    return { error: "Sem permissão para cadastrar contatos." };
  }

  const { data, error } = await supabase.rpc("create_dealership_manual_lead", {
    p_client_name: input.clientName.trim(),
    p_phone: input.phone.trim(),
    p_client_email: input.clientEmail?.trim() || null,
    p_message: input.message?.trim() || null,
    p_vehicle_id: input.vehicleId || null,
    p_assign_to_self: profile.role === "seller",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/contatos");
  revalidatePath("/painel");
  return { success: true, leadId: data as string };
}
