import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyAdminSessionToken } from "./admin-session";
import { COOKIE_NAME } from "./cookie-name";

export async function requireAdminSession(): Promise<void> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect("/login");
  }
}
