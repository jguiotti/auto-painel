import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  return <AdminShell>{children}</AdminShell>;
}
