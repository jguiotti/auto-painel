import type { SupabaseClient, User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export interface DashboardSession {
  supabase: SupabaseClient;
  user: User;
  profile: {
    dealership_id: string;
    role: string;
  };
  dealershipId: string;
}

/**
 * Ensures an authenticated user and that their profile `dealership_id` matches the
 * tenant cookie resolved from the host — so dashboard queries only ever see that tenant (RLS).
 *
 * @param loginRedirectPathFallback Used when x-dashboard-path is missing (e.g. Server Actions).
 */
export async function requireDashboardSession(
  loginRedirectPathFallback = "/painel",
): Promise<DashboardSession> {
  const headerList = await headers();
  const pathFromMiddleware = headerList.get("x-dashboard-path");
  const loginRedirectPath =
    pathFromMiddleware &&
    pathFromMiddleware.startsWith("/") &&
    !pathFromMiddleware.startsWith("//")
      ? pathFromMiddleware
      : loginRedirectPathFallback;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const q = encodeURIComponent(loginRedirectPath);
    redirect(`/login?redirectTo=${q}`);
  }

  const cookieDealershipId = await getDealershipIdFromCookies();
  if (!cookieDealershipId) {
    redirect("/erro/concessionaria");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("dealership_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.dealership_id !== cookieDealershipId) {
    redirect("/erro/concessionaria");
  }

  return {
    supabase,
    user,
    profile,
    dealershipId: profile.dealership_id,
  };
}
