import { Check } from "lucide-react";
import Link from "next/link";

import { Badge, Button } from "@autopainel/shared/ui";

import { CORE_OPERATION_HIGHLIGHTS } from "@/lib/marketing-content";

export function MarketingCoreOperations() {
  return (
    <section
      className="border-y border-marketing-accent/20 bg-gradient-to-b from-cyan-500/[0.07] via-zinc-950 to-zinc-950 py-20"
      aria-labelledby="core-operations-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <Badge
            variant="secondary"
            className="mb-4 border-marketing-accent/30 bg-marketing-accent/10 text-marketing-accent"
          >
            Núcleo da plataforma
          </Badge>
          <h2
            id="core-operations-heading"
            className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Do pátio ao fechamento — no mesmo painel
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Estoque e gestão de contatos não são «módulo opcional»: entram em{" "}
            <strong className="font-medium text-zinc-200">todos os planos</strong>. É o
            que substitui planilha, WhatsApp solto e fila de agência no dia a dia da
            revenda.
          </p>
        </div>

        <ul className="mt-14 grid gap-8 lg:grid-cols-2">
          {CORE_OPERATION_HIGHLIGHTS.map(
            ({ icon: Icon, badge, title, description, bullets }) => (
              <li
                key={title}
                className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900/60 p-6 md:p-8"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Icon className="size-10 text-marketing-accent" aria-hidden />
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-200"
                  >
                    {badge}
                  </Badge>
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
                <ul className="mt-6 space-y-2">
                  {bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-marketing-accent"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
            asChild
          >
            <Link href="/funcionalidades#operacao-comercial">Ver detalhes das funcionalidades</Link>
          </Button>
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/contato">Agendar demo do painel</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
