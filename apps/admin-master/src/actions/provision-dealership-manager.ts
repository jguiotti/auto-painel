"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface ProvisionResult {
  error?: string;
  success?: boolean;
  temporary_password?: string;
  user_id?: string;
  email?: string;
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

export async function provisionDealershipManagerAction(
  formData: FormData,
): Promise<ProvisionResult> {
  await requireAdminSession();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const dealershipId = String(formData.get("dealership_id") ?? "").trim();

  if (!email || !fullName || !dealershipId) {
    return { error: "Preencha e-mail, nome e concessionária." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return {
      error:
        "Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do admin (Vercel ou .env.local).",
    };
  }

  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select("id")
    .eq("id", dealershipId)
    .maybeSingle();

  if (dealershipError || !dealership) {
    return { error: "Concessionária não encontrada." };
  }

  const tempPassword =
    crypto.randomUUID().replaceAll("-", "").slice(0, 20) + "Aa1!";

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created?.user?.id) {
    if (isDuplicateAuthEmailError(createErr)) {
      return {
        error:
          "Este e-mail já está cadastrado. Use a edição da concessionária para convidar colaboradores ou escolha outro e-mail.",
      };
    }
    return {
      error: createErr?.message ?? "Não foi possível criar a conta de acesso.",
    };
  }

  const userId = created.user.id;

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("dealership_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    await supabase.auth.admin.deleteUser(userId);
    return {
      error:
        existingProfileError.message ??
        "Não foi possível verificar o perfil existente.",
    };
  }

  if (existingProfile) {
    await supabase.auth.admin.deleteUser(userId);
    if (existingProfile.role === "super_admin") {
      return {
        error:
          "Este e-mail pertence a um operador da plataforma e não pode ser gestor de concessionária.",
      };
    }
    return {
      error:
        "Este e-mail já está associado a outra concessionária. Use outro endereço.",
    };
  }

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    dealership_id: dealershipId,
    role: "owner",
  });

  if (profileErr) {
    await supabase.auth.admin.deleteUser(userId);
    return {
      error: profileErr.message ?? "Falha ao associar o perfil à concessionária.",
    };
  }

  revalidatePath("/painel/usuarios");
  revalidatePath("/painel/concessionarias");

  return {
    success: true,
    user_id: userId,
    email,
    temporary_password: tempPassword,
  };
}
