"use client";

import { ChangePasswordForm } from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminChangePasswordForm() {
  async function onChangePassword({
    currentPassword,
    password,
  }: {
    currentPassword: string;
    password: string;
  }): Promise<string | null> {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return "Sessão inválida. Entre novamente.";
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return "Senha atual incorreta.";
    }

    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  }

  return (
    <ChangePasswordForm
      onChangePassword={onChangePassword}
      redirectTo="/painel/dashboard"
    />
  );
}
