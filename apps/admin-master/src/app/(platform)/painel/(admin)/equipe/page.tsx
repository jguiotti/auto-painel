import Link from "next/link";

import { EquipeHubTabs } from "@/components/equipe-hub-tabs";
import { PlatformOperatorsTable } from "@/components/platform-operators-table";
import { Button } from "@autopainel/shared/ui";
import {
  fetchPlatformUsers,
  splitPlatformUsersByAudience,
} from "@/lib/data/platform-users";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const allUsers = await fetchPlatformUsers();
  const { platformOperators } = splitPlatformUsersByAudience(allUsers);

  return (
    <div className="space-y-6">
      <EquipeHubTabs />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe AutoPainel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operadores com acesso ao painel administrativo. Representantes comerciais em{" "}
            <Link href="/painel/equipe/comercial" className="font-medium text-primary hover:underline">
              Equipe comercial
            </Link>
            . Usuários das lojas em{" "}
            <Link href="/painel/usuarios" className="font-medium text-primary hover:underline">
              Usuários das lojas
            </Link>
            .
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/painel/equipe/comercial">Ir para equipe comercial</Link>
        </Button>
      </div>

      <PlatformOperatorsTable operators={platformOperators} />
    </div>
  );
}
