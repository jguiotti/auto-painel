"use server";

import { redirect } from "next/navigation";

import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.user) {
    return {
      error: signInError?.message ?? "Não foi possível entrar. Verifique os dados.",
    };
  }

  const { profile, error: profileError } = await fetchProfileRowForUserId(
    signInData.user.id,
  );

  if (profileError) {
    await supabase.auth.signOut();
    return {
      error: `Não foi possível validar seu cadastro no servidor. ${profileError}`,
    };
  }

  if (isPlatformOperatorProfile(profile)) {
    redirect("/painel/dashboard");
  }

  const { data: salesRepId, error: repError } = await supabase.rpc(
    "current_platform_sales_rep_id",
  );

  if (!repError && typeof salesRepId === "string" && salesRepId.length > 0) {
    redirect("/painel/comercial/extrato");
  }

  await supabase.auth.signOut();
  return {
    error:
      "Esta conta não tem permissão para o painel central. Entram operadores da plataforma (super_admin) ou representantes comerciais com login vinculado.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
