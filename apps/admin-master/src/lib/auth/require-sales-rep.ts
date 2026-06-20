import "server-only";

import { redirect } from "next/navigation";

import { fetchCurrentPlatformSalesRepId } from "@/lib/auth/fetch-current-sales-rep-id";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SalesRepSession {
  userId: string;
  salesRepId: string;
}

export async function requireSalesRepSession(): Promise<SalesRepSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (!salesRepId) {
    redirect("/login?error=forbidden");
  }

  return { userId: user.id, salesRepId };
}

export async function requireAdminOrOwnSalesRep(
  targetSalesRepId: string,
): Promise<{ isAdmin: boolean; salesRepId: string | null; userId: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (salesRepId === targetSalesRepId) {
    return { isAdmin: false, salesRepId, userId: user.id };
  }

  await requireAdminSession();
  return { isAdmin: true, salesRepId: null, userId: user.id };
}
