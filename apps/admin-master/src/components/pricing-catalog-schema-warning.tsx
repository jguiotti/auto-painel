import type { PricingCatalogSchemaState } from "@/lib/data/pricing-catalog";

export type PricingCatalogSchemaProblemState = Exclude<
  PricingCatalogSchemaState,
  { kind: "ok" }
>;

export function PricingCatalogSchemaWarning({
  state,
}: {
  state: PricingCatalogSchemaProblemState;
}) {
  const title =
    state.kind === "unconfigured"
      ? "Supabase não configurado para o catálogo"
      : state.kind === "tables_missing"
        ? "Catálogo de planos ainda não existe neste projeto"
        : "Não foi possível ler o catálogo de planos";

  const detail =
    state.kind === "unconfigured"
      ? "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente local (.env.local) e reinicie o servidor."
      : state.kind === "tables_missing"
        ? "As tabelas public.saas_modules e public.pricing_plans não foram criadas no projeto Supabase ligado a esta app. Aplique as migrações do repositório (por exemplo o ficheiro supabase/migrations/20260506103000_saas_modules_pricing_plans.sql no SQL Editor do dashboard, ou supabase db push no seu fluxo habitual)."
        : `Detalhe técnico: ${state.message}`;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-muted-foreground">{detail}</p>
    </div>
  );
}
