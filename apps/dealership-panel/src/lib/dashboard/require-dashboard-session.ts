import type { SupabaseClient, User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDealershipIdFromCookies } from "@/lib/tenant/get-dealership-id-from-cookies";

export interface DashboardSession {
  supabase: SupabaseClient;
  user: User;
  profile: {
    dealership_id: string | null;
    role: string;
  };
  dealershipId: string;
}

/**
 * Ensures an authenticated user and a valid dealership resolved from host cookie.
 * Tenant users must match `profiles.dealership_id`; `super_admin` may operate any host dealership.
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

  const isSuperAdmin = profile?.role === "super_admin";
  const isDealershipBoundProfile = profile?.dealership_id === cookieDealershipId;

  if (error || !profile || (!isSuperAdmin && !isDealershipBoundProfile)) {
    redirect("/erro/concessionaria");
  }

  const { data: dealershipRow, error: dealershipError } = await supabase
    .from("dealerships")
    .select("status")
    .eq("id", cookieDealershipId)
    .single();

  if (
    dealershipError ||
    !dealershipRow ||
    dealershipRow.status !== "active"
  ) {
    redirect("/conta-inativa");
  }

  if (profile.role !== "super_admin") {
    const { data: isActive, error: activeError } = await supabase.rpc(
      "is_dealership_panel_user_active",
      { p_user_id: user.id },
    );
    if (!activeError && isActive === false) {
      redirect("/conta-desativada");
    }
  }

  return {
    supabase,
    user,
    profile,
    dealershipId: cookieDealershipId,
  };
}
