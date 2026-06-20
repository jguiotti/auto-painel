import { Users } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { PlatformStoreUsersTable } from "@/components/platform-store-users-table";
import { ProvisionManagerForm } from "@/components/provision-manager-form";
import { fetchDealerships } from "@/lib/data/dealerships";
import {
  fetchPlatformUsers,
  splitPlatformUsersByAudience,
} from "@/lib/data/platform-users";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const [dealerships, allUsers] = await Promise.all([
    fetchDealerships(),
    fetchPlatformUsers(),
  ]);
  const { storeUsers } = splitPlatformUsersByAudience(allUsers);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Users className="mt-1 size-8 text-muted-foreground" aria-hidden />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Usuários das lojas</h1>
            <p className="text-sm text-muted-foreground">
              Liste, filtre e remova titulares, gestores e vendedores vinculados às
              concessionárias. Operadores do painel administrativo ficam em{" "}
              <Link href="/painel/equipe" className="font-medium text-primary hover:underline">
                Equipe AutoPainel
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <PlatformStoreUsersTable users={storeUsers} />

      <Card className="max-w-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>Novo gestor (titular)</CardTitle>
          <CardDescription>
            Cadastre o primeiro gestor de uma loja. A senha temporária é exibida uma vez nesta
            tela — repasse por canal seguro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProvisionManagerForm dealerships={dealerships} />
        </CardContent>
      </Card>
    </div>
  );
}
