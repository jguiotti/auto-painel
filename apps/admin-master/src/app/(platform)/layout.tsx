import { AdminShell } from "@/components/admin-shell";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { fetchCommandPaletteEntities } from "@/lib/data/command-palette-entities";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();
  const commandPaletteEntities = await fetchCommandPaletteEntities();
  return (
    <AdminShell commandPaletteEntities={commandPaletteEntities}>{children}</AdminShell>
  );
}
