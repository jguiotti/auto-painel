"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAuthUserOrOrphanProfile } from "@/lib/auth/delete-auth-user-or-orphan-profile";
import { requireAdminSession } from "@/lib/auth/require-admin";

export interface PlatformUserActionResult {
  error?: string;
  success?: boolean;
}

const REVALIDATE_PATHS = [
  "/painel/usuarios",
  "/painel/equipe",
  "/painel/concessionarias",
];

export async function removePlatformStoreUserAction(
  profileUserId: string,
): Promise<PlatformUserActionResult> {
  await requireAdminSession();
  const authClient = await createSupabaseServerClient();
  const {
    data: { user: sessionUser },
  } = await authClient.auth.getUser();

  if (sessionUser?.id === profileUserId) {
    return { error: "Você não pode remover a própria conta por aqui." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, dealership_id")
    .eq("id", profileUserId)
    .maybeSingle();

  if (targetError || !target) {
    return { error: "Perfil não encontrado." };
  }

  if (target.role === "super_admin" || target.dealership_id === null) {
    return { error: "Use a página Equipe para remover operadores da plataforma." };
  }

  if (target.role === "owner" && target.dealership_id) {
    const { data: owners, error: ownersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("dealership_id", target.dealership_id)
      .eq("role", "owner");

    if (
      !ownersError &&
      Array.isArray(owners) &&
      owners.length <= 1
    ) {
      return {
        error:
          "Não é possível remover a única pessoa titular. Convide outro titular antes ou exclua a concessionária.",
      };
    }
  }

  const removed = await deleteAuthUserOrOrphanProfile(supabase, profileUserId);
  if (removed.error) {
    return { error: removed.error };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  if (typeof target.dealership_id === "string") {
    revalidatePath(`/painel/concessionarias/${target.dealership_id}/editar`);
  }

  return { success: true };
}

export async function removePlatformOperatorAction(
  profileUserId: string,
): Promise<PlatformUserActionResult> {
  await requireAdminSession();
  const authClient = await createSupabaseServerClient();
  const {
    data: { user: sessionUser },
  } = await authClient.auth.getUser();

  if (sessionUser?.id === profileUserId) {
    return { error: "Você não pode remover a própria conta por aqui." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, dealership_id")
    .eq("id", profileUserId)
    .maybeSingle();

  if (targetError || !target) {
    return { error: "Perfil não encontrado." };
  }

  if (target.role !== "super_admin" || target.dealership_id !== null) {
    return { error: "Este usuário não é operador da plataforma (super_admin)." };
  }

  const { data: operators, error: operatorsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .is("dealership_id", null);

  if (
    !operatorsError &&
    Array.isArray(operators) &&
    operators.length <= 1
  ) {
    return {
      error: "Não é possível remover o único operador da plataforma.",
    };
  }

  const removed = await deleteAuthUserOrOrphanProfile(supabase, profileUserId);
  if (removed.error) {
    return { error: removed.error };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}
