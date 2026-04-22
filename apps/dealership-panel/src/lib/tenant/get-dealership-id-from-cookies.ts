import { cookies } from "next/headers";

import { COOKIE_DEALERSHIP_ID } from "@/lib/tenant/constants";

export async function getDealershipIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_DEALERSHIP_ID)?.value ?? null;
}
