import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { requirePlatformPainelAccess } from "@/lib/auth/require-platform-painel-access";
import { fetchCommandPaletteEntities } from "@/lib/data/command-palette-entities";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const actor = await requirePlatformPainelAccess();

  if (actor.salesRepId && !actor.isAdmin) {
    return <>{children}</>;
  }

  const commandPaletteEntities = await fetchCommandPaletteEntities();
  return (
    <AdminShell commandPaletteEntities={commandPaletteEntities}>{children}</AdminShell>
  );
}
