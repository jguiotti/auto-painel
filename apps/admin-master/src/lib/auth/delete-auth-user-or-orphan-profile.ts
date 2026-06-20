import type { SupabaseClient } from "@supabase/supabase-js";

function isAuthUserMissingError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("user not found") ||
    lower.includes("not found") ||
    lower.includes("user_id not found")
  );
}

/**
 * Deletes auth.users (cascades profiles) or removes orphan profile rows when Auth has no user.
 */
export async function deleteAuthUserOrOrphanProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error?: string }> {
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

  if (!deleteAuthError) {
    return {};
  }

  const message = deleteAuthError.message?.trim() ?? "";
  if (isAuthUserMissingError(message)) {
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
    if (profileError) {
      return {
        error:
          profileError.message?.trim().length > 0
            ? profileError.message
            : "Não foi possível remover o perfil órfão.",
      };
    }
    return {};
  }

  return {
    error: message.length > 0 ? message : "Falha ao remover a conta.",
  };
}
