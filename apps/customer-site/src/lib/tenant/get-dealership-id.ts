import { cookies, headers } from "next/headers";

import { COOKIE_DEALERSHIP_ID, HEADER_DEALERSHIP_ID } from "@/lib/tenant/constants";

export async function getResolvedDealershipId(): Promise<string | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(HEADER_DEALERSHIP_ID)?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_DEALERSHIP_ID)?.value ?? null;
}
