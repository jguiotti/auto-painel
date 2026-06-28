"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/auth/require-admin";

const REVALIDATE_PATHS = ["/painel/solicitacoes-upgrade", "/painel/notificacoes", "/painel/financeiro"];

interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function deleteDealershipSupportRequestAction(
  requestId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!requestId.trim()) {
    return { error: "Solicitação inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_dealership_support_request", {
    p_request_id: requestId.trim(),
  });

  if (error) {
    return { error: "Não foi possível excluir a solicitação." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}

export async function resolveDealershipSupportRequestAction(
  requestId: string,
  status: "in_progress" | "done" = "done",
): Promise<ActionResult> {
  await requireAdminSession();

  if (!requestId.trim()) {
    return { error: "Solicitação inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("resolve_dealership_support_request", {
    p_request_id: requestId.trim(),
    p_status: status,
  });

  if (error) {
    return { error: "Não foi possível atualizar a solicitação." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}
