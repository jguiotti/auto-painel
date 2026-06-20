import "server-only";

import { fetchCurrentPlatformSalesRepId } from "@/lib/auth/fetch-current-sales-rep-id";
import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";

export async function resolvePostLoginRedirectPath(
  userId: string,
): Promise<string | null> {
  const { profile } = await fetchProfileRowForUserId(userId);

  if (isPlatformOperatorProfile(profile)) {
    return "/painel/dashboard";
  }

  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (salesRepId) {
    return "/painel/comercial/extrato";
  }

  return null;
}
