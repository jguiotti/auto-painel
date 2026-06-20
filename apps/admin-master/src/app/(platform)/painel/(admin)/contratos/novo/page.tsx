import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { CreateContractForm } from "@/components/platform-contracts-ui";
import { fetchPlatformContractTemplates } from "@/lib/data/platform-contracts";

export const dynamic = "force-dynamic";

export default async function NovoContratoPage() {
  const templates = await fetchPlatformContractTemplates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo contrato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gera rascunho com Anexo I preenchido para revisão jurídica.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/painel/contratos">Voltar</Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum modelo disponível. Aplique a migração de contratos no Supabase.
        </p>
      ) : (
        <CreateContractForm templates={templates} />
      )}
    </div>
  );
}
