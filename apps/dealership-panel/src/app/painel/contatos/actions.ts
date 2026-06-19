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
    const { error } = await supabase.rpc("reassign_dealership_lead", {
      p_lead_id: leadId,
      p_assignee_user_id: assignedUserId,
    });

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("leads")
      .update({ assigned_user_id: null })
      .eq("id", leadId)
      .eq("dealership_id", dealershipId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/painel/contatos");
  revalidatePath("/painel");
  return { success: true };
}

export async function claimLeadAction(leadId: string): Promise<LeadActionResult> {
  const { supabase, profile } = await requireDashboardSession();

  if (profile.role !== "seller") {
    return { error: "Somente vendedores podem assumir leads da fila." };
  }

  const { error } = await supabase.rpc("claim_dealership_lead", {
    p_lead_id: leadId,
  });

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
    lossReasonCode?: string | null;
    lossReasonNote?: string | null;
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
    if (input.status !== "lost") {
      patch.loss_reason_code = null;
      patch.loss_reason_note = null;
    }
  }

  if (input.lossReasonCode !== undefined) {
    patch.loss_reason_code = input.lossReasonCode;
  }

  if (input.lossReasonNote !== undefined) {
    patch.loss_reason_note = input.lossReasonNote?.trim() || null;
  }

  if (input.status === "lost" || patch.status === "lost") {
    const code =
      (input.lossReasonCode ?? patch.loss_reason_code) as string | null | undefined;
    const note =
      input.lossReasonNote !== undefined
        ? input.lossReasonNote?.trim() || null
        : (patch.loss_reason_note as string | null | undefined);
    if (!code) {
      return { error: "Informe o motivo da perda para marcar como venda perdida." };
    }
    if (code === "other" && !note) {
      return { error: "Descreva o motivo quando selecionar «Outro»." };
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

export async function deleteLeadAction(leadId: string): Promise<LeadActionResult> {
  const { supabase, profile, dealershipId } = await requireDashboardSession();

  if (!canAssignLeads(profile.role)) {
    return { error: "Apenas perfis de gestão podem excluir contatos." };
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", leadId)
    .eq("dealership_id", dealershipId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/contatos");
  revalidatePath("/painel");
  return { success: true };
}
