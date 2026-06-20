import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { PlatformOperatorsTable } from "@/components/platform-operators-table";
import {
  fetchPlatformUsers,
  splitPlatformUsersByAudience,
} from "@/lib/data/platform-users";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const allUsers = await fetchPlatformUsers();
  const { platformOperators } = splitPlatformUsersByAudience(allUsers);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <BriefcaseBusiness className="mt-1 size-8 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe AutoPainel</h1>
          <p className="text-sm text-muted-foreground">
            Operadores com acesso ao painel administrativo. Usuários das concessionárias (titular,
            gestor, vendedor) estão em{" "}
            <Link href="/painel/usuarios" className="font-medium text-primary hover:underline">
              Usuários das lojas
            </Link>
            .
          </p>
        </div>
      </div>

      <PlatformOperatorsTable operators={platformOperators} />

      <Card className="border-dashed border-primary/30 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Representantes comerciais (Fase 3 UX)</CardTitle>
          <CardDescription>
            Comissões recorrentes, repasse de carteira, campanhas e pagamentos — copy aprovado (Fase 2).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            PRD:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              packages/shared/docs/PRD_PLATFORM_SALES_SQUAD.md
            </code>
            {" · "}
            Microcopy:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              packages/shared/docs/UX_COPY_PLATFORM_SALES_SQUAD.md
            </code>
          </p>
          <p>
            Decisões PM: comissão recorrente, estorno total em churn 30 dias, repasse de carteira ao
            sair, rep vê extrato próprio na v1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
