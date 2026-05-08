import "server-only";

import { redirect } from "next/navigation";

import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ensures Supabase Auth session and platform operator profile (super_admin, no dealership).
 */
export async function requireAdminSession(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { profile, error } = await fetchProfileRowForUserId(user.id);

  if (error || !isPlatformOperatorProfile(profile)) {
    redirect("/login?error=forbidden");
  }
}
