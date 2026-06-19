import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "@autopainel/shared/ui";

import { BASE_INCLUDED_FEATURES } from "@/lib/plans-catalog";
import type { PublicPricingCatalog } from "@/lib/public-pricing-catalog";

function CellIcon({ included }: { included: boolean }) {
  if (included) {
    return <Check className="mx-auto size-5 text-marketing-accent" aria-hidden />;
  }
  return <Minus className="mx-auto size-4 text-zinc-600" aria-hidden />;
}

interface PlansModuleTableProps {
  catalog: PublicPricingCatalog;
}

export function PlansModuleTable({ catalog }: PlansModuleTableProps) {
  const { plans, modules, setupFeeLabel } = catalog;

  return (
    <div className="space-y-10">
      {catalog.source === "database" ? (
        <p className="text-xs text-zinc-500">
          Comparativo atualizado conforme catálogo comercial da plataforma.
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
          Como escolhemos o plano ideal
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          O tier recomendado considera principalmente o{" "}
          <strong className="font-medium text-zinc-300">
            volume de veículos ativos no estoque
          </strong>{" "}
          da sua concessionária. Lojas menores começam no Essencial; operações com mais
          pátio e integrações digitais evoluem para Profissional ou Completo. Na proposta
          comercial confirmamos a faixa exata com base no seu estoque atual e metas de
          crescimento.
        </p>
        <p className="mt-4 text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">Setup único (opcional):</span>{" "}
          {setupFeeLabel} — onboarding assistido, configuração da vitrine e importação
          inicial do estoque. Cobrado uma vez na contratação; não entra na mensalidade.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 p-6 md:p-8">
        <h2 className="font-display text-xl font-semibold text-white md:text-2xl">
          Sempre incluído em todos os planos
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {BASE_INCLUDED_FEATURES.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
              <Check className="mt-0.5 size-4 shrink-0 text-marketing-accent" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Comparativo de módulos por plano AutoPainel
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/80">
              <th scope="col" className="px-4 py-4 font-display font-semibold text-white md:px-6">
                Módulo
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.slug}
                  scope="col"
                  className="px-3 py-4 text-center font-display font-semibold text-white md:px-4"
                >
                  <span className="block">{plan.name}</span>
                  <span className="mt-1 block text-xs font-normal text-marketing-accent">
                    {plan.stockBandLabel}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((row) => (
              <tr key={row.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                <th scope="row" className="px-4 py-4 font-normal md:px-6">
                  <p className="font-medium text-zinc-200">{row.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.description}</p>
                </th>
                {plans.map((plan) => {
                  const included = row.planSlugs.includes(plan.slug);

                  return (
                    <td key={plan.slug} className="px-3 py-4 text-center md:px-4">
                      <CellIcon included={included} />
                      <span className="sr-only">{included ? "Incluído" : "Não incluído"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.slug}
            className={`rounded-2xl border p-6 ${
              plan.slug === "business"
                ? "border-marketing-accent/40 bg-marketing-accent/5 shadow-lg shadow-cyan-500/10"
                : "border-white/10 bg-card/40"
            }`}
          >
            <p className="font-display text-lg font-semibold text-white">{plan.name}</p>
            <p className="mt-1 text-sm text-zinc-400">{plan.tagline}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-marketing-accent">
              {plan.stockBandLabel} em estoque
            </p>
            <p className="mt-4 font-display text-2xl font-bold text-marketing-accent">
              {plan.priceLabel}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Setup:{" "}
              <span className="font-medium text-zinc-300">{plan.setupLabel}</span>
              <span className="text-zinc-500"> (único, opcional)</span>
            </p>
            <Button
              className="mt-6 w-full bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
              asChild
            >
              <Link href="/contato">Falar com vendas</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
