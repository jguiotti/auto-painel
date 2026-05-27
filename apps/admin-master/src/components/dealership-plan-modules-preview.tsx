"use client";

import type { SaasModuleListRow } from "@autopainel/shared/types";
import { Badge } from "@autopainel/shared/ui";
import Link from "next/link";
import { useMemo } from "react";

interface DealershipPlanModulesPreviewProps {
  pricingPlanId: string;
  planModulesByPlanId: Record<string, SaasModuleListRow[]>;
  planNameById: Record<string, string>;
}

export function DealershipPlanModulesPreview({
  pricingPlanId,
  planModulesByPlanId,
  planNameById,
}: DealershipPlanModulesPreviewProps) {
  const modules = useMemo(() => {
    if (!pricingPlanId) {
      return [];
    }
    return planModulesByPlanId[pricingPlanId] ?? [];
  }, [planModulesByPlanId, pricingPlanId]);

  if (!pricingPlanId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione um plano acima para ver quais funcionalidades a loja terá no painel e na
        vitrine.
      </p>
    );
  }

  const planName = planNameById[pricingPlanId] ?? "Plano selecionado";

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          Funcionalidades incluídas em «{planName}»
        </p>
        <Link
          href={`/painel/planos/${pricingPlanId}/editar`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Editar composição do plano
        </Link>
      </div>
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este plano ainda não inclui módulos. Ajuste a composição em Planos comerciais.
        </p>
      ) : (
        <ul className="space-y-2">
          {modules.map((mod) => (
            <li
              key={mod.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{mod.display_name}</p>
                {mod.description ? (
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                ) : null}
              </div>
              <Badge variant={mod.is_active ? "default" : "secondary"}>
                {mod.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Os módulos são definidos no plano comercial, não individualmente por loja. Para
        alterar o que esta concessionária pode usar, escolha outro plano ou edite o plano
        atual.
      </p>
    </div>
  );
}
