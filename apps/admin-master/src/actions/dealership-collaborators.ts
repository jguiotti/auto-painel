"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface CollaboratorActionResult {
  error?: string;
  success?: boolean;
  temporary_password?: string;
}

const REVALIDATE = [
  "/painel/concessionarias",
];

function isAllowedRole(
  r: string,
): r is "owner" | "manager" | "seller" {
  return r === "owner" || r === "manager" || r === "seller";
}

export async function inviteDealershipCollaboratorAction(
  dealershipId: string,
  formData: FormData,
): Promise<CollaboratorActionResult> {
  await requireAdminSession();

  const email = String(formData.get("invite_email") ?? "")
    .trim()
    .toLowerCase();
  const full_name = String(formData.get("invite_full_name") ?? "").trim();
  const roleRaw = String(formData.get("invite_role") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { error: "Indique um e-mail válido para a pessoa colaboradora." };
  }
  if (full_name.length < 2) {
    return { error: "Indique o nome completo (pelo menos 2 caracteres)." };
  }
  if (!isAllowedRole(roleRaw)) {
    return { error: "Papel inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select("id")
    .eq("id", dealershipId)
    .maybeSingle();

  if (dealershipError || !dealership) {
    return { error: "Concessionária não encontrada." };
  }

  const tempPassword =
    crypto.randomUUID().replaceAll("-", "").slice(0, 16) + "Aa1!";

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createErr || !created?.user?.id) {
    return {
      error:
        createErr?.message ??
        "Não foi possível criar a conta de acesso. Verifique se o e-mail já existe.",
    };
  }

  const userId = created.user.id;

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    dealership_id: dealershipId,
    role: roleRaw,
  });

  if (profileErr) {
    await supabase.auth.admin.deleteUser(userId);
    return {
      error:
        profileErr.message ??
        "Falha ao associar o perfil à concessionária.",
    };
  }

  REVALIDATE.forEach((p) => revalidatePath(p));
  revalidatePath(`/painel/concessionarias/${dealershipId}/editar`);
  revalidatePath(`/painel/concessionarias/${dealershipId}`);
  return {
    success: true,
    temporary_password: tempPassword,
  };
}

export async function updateDealershipCollaboratorRoleAction(
  dealershipId: string,
  profileUserId: string,
  formData: FormData,
): Promise<CollaboratorActionResult> {
  await requireAdminSession();

  const roleRaw = String(formData.get("profile_role") ?? "").trim();
  if (!isAllowedRole(roleRaw)) {
    return { error: "Papel inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, dealership_id")
    .eq("id", profileUserId)
    .maybeSingle();

  if (targetError || !target || target.dealership_id !== dealershipId) {
    return { error: "Perfil não encontrado nesta concessionária." };
  }

  const { count: ownerCountRaw, error: ownersError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("dealership_id", dealershipId)
    .eq("role", "owner");

  const ownerCount = typeof ownerCountRaw === "number" ? ownerCountRaw : 0;

  if (
    !ownersError &&
    target.role === "owner" &&
    roleRaw !== "owner" &&
    ownerCount <= 1
  ) {
    return {
      error:
        "Tem de existir pelo menos uma pessoa com papel titular nesta conta.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: roleRaw })
    .eq("id", profileUserId)
    .eq("dealership_id", dealershipId);

  if (error) {
    return { error: error.message };
  }

  REVALIDATE.forEach((p) => revalidatePath(p));
  revalidatePath(`/painel/concessionarias/${dealershipId}/editar`);

  return { success: true };
}

export async function removeDealershipCollaboratorAction(
  dealershipId: string,
  profileUserId: string,
): Promise<CollaboratorActionResult> {
  await requireAdminSession();

  const supabase = createSupabaseServiceRoleClient();

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, dealership_id")
    .eq("id", profileUserId)
    .maybeSingle();

  if (targetError || !target || target.dealership_id !== dealershipId) {
    return { error: "Perfil não encontrado nesta concessionária." };
  }

  const { data: owners, error: ownersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("dealership_id", dealershipId)
    .eq("role", "owner");

  if (
    !ownersError &&
    Array.isArray(owners) &&
    target.role === "owner" &&
    owners.length <= 1
  ) {
    return {
      error:
        "Não é possível remover a única pessoa titular. Atribua outro titular antes.",
    };
  }

  const { error: deleteAuthError } =
    await supabase.auth.admin.deleteUser(profileUserId);

  if (deleteAuthError) {
    return { error: deleteAuthError.message ?? "Falha ao remover a conta." };
  }

  REVALIDATE.forEach((p) => revalidatePath(p));
  revalidatePath(`/painel/concessionarias/${dealershipId}/editar`);

  return { success: true };
}
