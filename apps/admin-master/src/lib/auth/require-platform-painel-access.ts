import "server-only";

import { redirect } from "next/navigation";

import { fetchCurrentPlatformSalesRepId } from "@/lib/auth/fetch-current-sales-rep-id";
import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PlatformPainelActor {
  userId: string;
  isAdmin: boolean;
  salesRepId: string | null;
}

/**
 * Allows super_admin on all /painel routes and active sales reps only on /painel/comercial/*.
 */
export async function requirePlatformPainelAccess(): Promise<PlatformPainelActor> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { profile } = await fetchProfileRowForUserId(user.id);
  const isAdmin = isPlatformOperatorProfile(profile);
  const salesRepId = await fetchCurrentPlatformSalesRepId();

  if (!isAdmin && !salesRepId) {
    redirect("/login?error=forbidden");
  }

  return { userId: user.id, isAdmin, salesRepId };
}
