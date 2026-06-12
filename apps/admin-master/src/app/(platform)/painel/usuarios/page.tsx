import { Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";

import { ProvisionManagerForm } from "@/components/provision-manager-form";
import { fetchDealerships } from "@/lib/data/dealerships";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const dealerships = await fetchDealerships();

  return (
    <div>
      <div className="mb-8 flex items-start gap-3">
        <Users className="mt-1 size-8 text-muted-foreground" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários da concessionária</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre o primeiro gestor (dono) da loja. A conta é criada no Supabase Auth com
            senha temporária exibida uma vez nesta tela.
          </p>
        </div>
      </div>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Novo gestor (owner)</CardTitle>
          <CardDescription>
            Preencha e-mail, nome completo e a loja. A senha temporária será exibida uma vez —
            repasse por canal seguro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProvisionManagerForm dealerships={dealerships} />
        </CardContent>
      </Card>
    </div>
  );
}
