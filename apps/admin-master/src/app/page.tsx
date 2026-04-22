import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { COOKIE_NAME } from "@/lib/auth/cookie-name";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (verifyAdminSessionToken(token)) {
    redirect("/dashboard");
  }
  redirect("/login");
}
