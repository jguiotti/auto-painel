import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { CreateContractForm } from "@/components/platform-contracts-ui";
import { fetchPlatformCommercialLeadById } from "@/lib/data/platform-commercial-leads";
import { fetchPlatformContractTemplates } from "@/lib/data/platform-contracts";

export const dynamic = "force-dynamic";

export default async function NovoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const params = await searchParams;
  const leadId = params.lead?.trim() ?? "";
  const lead =
    leadId.length > 0 ? await fetchPlatformCommercialLeadById(leadId) : null;
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

      {lead ? (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-4 text-sm">
          <p className="font-medium text-foreground">Lead vinculado ao contrato</p>
          <p className="mt-1 text-muted-foreground">
            {lead.full_name} · {lead.email}
            {lead.company_name ? ` · ${lead.company_name}` : null}
          </p>
        </div>
      ) : null}

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum modelo disponível. Aplique a migração de contratos no Supabase.
        </p>
      ) : (
        <CreateContractForm
          templates={templates}
          defaultProspect={
            lead
              ? {
                  id: lead.id,
                  full_name: lead.full_name,
                  email: lead.email,
                  company_name: lead.company_name,
                }
              : null
          }
        />
      )}
    </div>
  );
}
