"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signAdminSession, verifyAdminPassword } from "@/lib/auth/admin-session";
import { COOKIE_NAME } from "@/lib/auth/cookie-name";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData,
): Promise<LoginState | null> {
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    return { error: "Senha inválida." };
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
