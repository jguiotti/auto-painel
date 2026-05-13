"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@autopainel/shared/lib/supabase";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface CollaboratorActionResult {
  error?: string;
  success?: boolean;
  temporary_password?: string;
  /** Auth user already existed (e.g. vitrine signup); profile row was attached to this dealership. */
  linked_existing_user?: boolean;
  /** Supabase sent a password recovery email so the user can set a password at the dealership panel. */
  password_reset_email_sent?: boolean;
}

const REVALIDATE = [
  "/painel/concessionarias",
];

function isAllowedRole(
  r: string,
): r is "owner" | "manager" | "seller" {
  return r === "owner" || r === "manager" || r === "seller";
}

function isDuplicateAuthEmailError(err: { message?: string } | null): boolean {
  if (!err?.message) {
    return false;
  }
  const msg = err.message.toLowerCase();
  return (
    msg.includes("already been registered") ||
    msg.includes("already registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already registered") ||
    msg.includes("duplicate")
  );
}

/**
 * Looks up auth.users by email via Admin listUsers (paginated). Email is unique in Auth.
 */
async function findAuthUserIdByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) {
      return null;
    }
    const hit = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalized,
    );
    if (hit?.id) {
      return hit.id;
    }
    if (data.users.length < perPage) {
      return null;
    }
    page += 1;
  }
}

/**
 * Triggers Supabase's built-in recovery email (anon client). Requires redirect URL allow-list in Dashboard.
 */
async function trySendDealershipPasswordSetupEmail(email: string): Promise<boolean> {
  const baseRaw =
    process.env.NEXT_PUBLIC_DEALERSHIP_AUTH_REDIRECT_ORIGIN?.trim() ??
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_URL?.trim();
  if (!baseRaw) {
    return false;
  }
  const base = baseRaw.replace(/\/$/, "");
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  const pub = createClient(supabaseUrl, supabaseAnonKey);
  const nextPath = encodeURIComponent("/definir-senha");
  const { error } = await pub.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/confirm?next=${nextPath}`,
  });
  return !error;
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

  let userId: string | undefined;
  let temporaryPasswordOut: string | undefined;
  let linkedExistingUser = false;

  if (!createErr && created?.user?.id) {
    userId = created.user.id;
    temporaryPasswordOut = tempPassword;
  } else if (createErr && isDuplicateAuthEmailError(createErr)) {
    const existingId = await findAuthUserIdByEmail(supabase, email);
    if (!existingId) {
      return {
        error:
          "Este e-mail já está registado no Supabase, mas não foi possível localizar o utilizador. Tente novamente ou contacte o suporte.",
      };
    }
    userId = existingId;
    linkedExistingUser = true;
    await supabase.auth.admin.updateUserById(existingId, {
      user_metadata: { full_name },
    });
  } else {
    return {
      error:
        createErr?.message ??
        "Não foi possível criar a conta de acesso.",
    };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("dealership_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    if (!linkedExistingUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    return {
      error:
        existingProfileError.message ??
        "Não foi possível verificar o perfil existente.",
    };
  }

  if (existingProfile) {
    if (!linkedExistingUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    if (existingProfile.role === "super_admin") {
      return {
        error:
          "Este e-mail pertence a um operador da plataforma. Não pode ser adicionado como colaborador de concessionária.",
      };
    }
    if (existingProfile.dealership_id === dealershipId) {
      return {
        error: "Esta pessoa já tem acesso a esta concessionária.",
      };
    }
    return {
      error:
        "Este e-mail já está associado a outra concessionária. Use outro endereço ou remova o acesso na outra loja.",
    };
  }

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    dealership_id: dealershipId,
    role: roleRaw,
  });

  if (profileErr) {
    if (!linkedExistingUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    return {
      error:
        profileErr.message ??
        "Falha ao associar o perfil à concessionária.",
    };
  }

  let password_reset_email_sent = false;
  if (linkedExistingUser) {
    password_reset_email_sent = await trySendDealershipPasswordSetupEmail(email);
  }

  REVALIDATE.forEach((p) => revalidatePath(p));
  revalidatePath(`/painel/concessionarias/${dealershipId}/editar`);
  revalidatePath(`/painel/concessionarias/${dealershipId}`);
  return {
    success: true,
    temporary_password: temporaryPasswordOut,
    linked_existing_user: linkedExistingUser,
    password_reset_email_sent,
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
