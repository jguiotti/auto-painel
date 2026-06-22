import { ExternalLink, LayoutTemplate, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { DEMO_SHOWCASE_STORES } from "@/lib/marketing-content";

export function MarketingShowcase() {
  return (
    <section className="border-y border-white/10 bg-zinc-950/80 py-20" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-slogan text-sm font-medium uppercase tracking-wider text-marketing-accent">
            Vitrines demo ao vivo
          </p>
          <h2
            id="showcase-heading"
            className="font-display mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Três layouts reais — escolha o visual da sua loja
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada link abre uma vitrine de demonstração com layout diferente (Premium,
            Clássico e Moderno). Navegue como se fosse cliente final: estoque, simulador
            e contato — tudo com marca whitelabel.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {DEMO_SHOWCASE_STORES.map((store) => (
            <li key={store.slug}>
              <a
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 transition hover:border-marketing-accent/40 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-red-500/80" aria-hidden />
                  <span className="size-2.5 rounded-full bg-amber-400/80" aria-hidden />
                  <span className="size-2.5 rounded-full bg-emerald-400/80" aria-hidden />
                  <span className="ml-2 truncate font-mono text-xs text-zinc-500">
                    {store.slug}.autopainel.com.br
                  </span>
                  <ExternalLink
                    className="ml-auto size-4 shrink-0 text-zinc-500 transition group-hover:text-marketing-accent"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="size-5 text-marketing-accent" aria-hidden />
                    <p className="font-display font-semibold text-white">{store.name}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Layout {store.layoutId} · {store.themeLabel}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                    {store.tagline}
                  </p>
                  <div className="mt-4 flex gap-2" aria-hidden>
                    {store.swatches.map((color) => (
                      <span
                        key={color}
                        className="size-6 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-medium text-marketing-accent group-hover:underline">
                    Abrir vitrine demo
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-marketing-accent" aria-hidden />
                <p className="font-display text-lg font-semibold text-white">
                  Quer ver o painel por dentro?
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                O painel administrativo — estoque, central de contatos, equipe e integrações
                (conforme plano) — é exclusivo da sua concessionária. Solicite uma
                demonstração guiada ou trial Essencial: nossa equipe configura tudo e libera
                seu ambiente em até um dia útil.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
                asChild
              >
                <Link href="/contato">Solicitar demo do painel</Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/planos">Ver planos e preços</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
