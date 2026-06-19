"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  PLATFORM_LEAD_PIPELINE_STATUSES,
  type PlatformLeadPipelineStatus,
} from "@/lib/data/platform-commercial-leads-shared";

const REVALIDATE_PATHS = ["/painel/leads-comerciais", "/painel/dashboard"];

interface ActionResult {
  error?: string;
  success?: boolean;
}

function isPipelineStatus(value: string): value is PlatformLeadPipelineStatus {
  return (PLATFORM_LEAD_PIPELINE_STATUSES as readonly string[]).includes(value);
}

export async function updatePlatformCommercialLeadPipelineAction(
  leadId: string,
  pipelineStatus: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!leadId) {
    return { error: "Lead inválido." };
  }

  if (!isPipelineStatus(pipelineStatus)) {
    return { error: "Estágio do pipeline inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("saas_prospects")
    .update({
      pipeline_status: pipelineStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    return { error: "Não foi possível atualizar o lead. Tente novamente." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}
