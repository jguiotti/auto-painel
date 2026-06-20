import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { requirePlatformPainelAccess } from "@/lib/auth/require-platform-painel-access";

export const dynamic = "force-dynamic";

export default async function AdminPainelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await requirePlatformPainelAccess();

  if (actor.salesRepId && !actor.isAdmin) {
    redirect("/painel/comercial/extrato");
  }

  await requireAdminSession();

  return <>{children}</>;
}
