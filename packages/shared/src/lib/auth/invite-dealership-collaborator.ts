import type { SupabaseClient } from "@supabase/supabase-js";

import { sendDealershipWelcomeEmail } from "./send-password-setup-email";

export interface InviteDealershipCollaboratorInput {
  email: string;
  fullName: string;
  role: "owner" | "manager" | "seller";
  dealershipId: string;
  dealershipSlug: string;
}

export interface InviteDealershipCollaboratorResult {
  error?: string;
  success?: boolean;
  linkedExistingUser?: boolean;
  passwordResetEmailSent?: boolean;
}

function isAllowedRole(r: string): r is InviteDealershipCollaboratorInput["role"] {
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
    const hit = data.users.find((user) => user.email?.trim().toLowerCase() === normalized);
    if (hit?.id) {
      return hit.id;
    }
    if (data.users.length < perPage) {
      return null;
    }
    page += 1;
  }
}

export async function inviteDealershipCollaborator(
  supabase: SupabaseClient,
  input: InviteDealershipCollaboratorInput,
): Promise<InviteDealershipCollaboratorResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role;

  if (!email || !email.includes("@")) {
    return { error: "Indique um e-mail válido para a pessoa colaboradora." };
  }
  if (fullName.length < 2) {
    return { error: "Indique o nome completo (pelo menos 2 caracteres)." };
  }
  if (!isAllowedRole(role)) {
    return { error: "Papel inválido." };
  }

  const tempPassword =
    crypto.randomUUID().replaceAll("-", "").slice(0, 16) + "Aa1!";

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId: string | undefined;
  let linkedExistingUser = false;

  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else if (createErr && isDuplicateAuthEmailError(createErr)) {
    const existingId = await findAuthUserIdByEmail(supabase, email);
    if (!existingId) {
      return {
        error:
          "Este e-mail já está cadastrado, mas não foi possível localizar o usuário. Tente novamente.",
      };
    }
    userId = existingId;
    linkedExistingUser = true;
    await supabase.auth.admin.updateUserById(existingId, {
      user_metadata: { full_name: fullName },
    });
  } else {
    return {
      error: createErr?.message ?? "Não foi possível criar a conta de acesso.",
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
        existingProfileError.message ?? "Não foi possível verificar o perfil existente.",
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
    if (existingProfile.dealership_id === input.dealershipId) {
      return { error: "Esta pessoa já tem acesso a esta concessionária." };
    }
    return {
      error:
        "Este e-mail já está associado a outra concessionária. Use outro endereço ou remova o acesso na outra loja.",
    };
  }

  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    dealership_id: input.dealershipId,
    role,
  });

  if (profileErr) {
    if (!linkedExistingUser) {
      await supabase.auth.admin.deleteUser(userId);
    }
    return {
      error: profileErr.message ?? "Falha ao associar o perfil à concessionária.",
    };
  }

  const welcomeResult = await sendDealershipWelcomeEmail(supabase, {
    email,
    recipientName: fullName,
    role,
    dealershipId: input.dealershipId,
    dealershipSlug: input.dealershipSlug,
  });

  return {
    success: true,
    linkedExistingUser,
    passwordResetEmailSent: welcomeResult.ok,
  };
}
