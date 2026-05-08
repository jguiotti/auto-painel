"use server";

import { revalidatePath } from "next/cache";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export interface AssignLeadResult {
  error?: string;
  success?: boolean;
}

export async function updateLeadAssigneeAction(
  leadId: string,
  assignedUserId: string | null,
): Promise<AssignLeadResult> {
  const { supabase, profile } = await requireDashboardSession();

  if (profile.role !== "owner") {
    return { error: "Apenas o gestor da loja pode atribuir contatos." };
  }

  if (assignedUserId) {
    const { data: peer, error: peerErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", assignedUserId)
      .eq("dealership_id", profile.dealership_id)
      .in("role", ["owner", "seller"])
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
