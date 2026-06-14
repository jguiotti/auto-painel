import type { ReactNode } from "react";
import { ArrowUpRight, ExternalLink, LayoutTemplate, Monitor, PanelLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import {
  GUIOTTI_STOREFRONT_URL,
  SHOWCASE_LAYOUT_VARIANTS,
} from "@/lib/marketing-content";

export function MarketingShowcase() {
  return (
    <section className="border-y border-white/10 bg-zinc-950/80 py-20" aria-labelledby="showcase-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-slogan text-sm font-medium uppercase tracking-wider text-marketing-accent">
            Caso real em produção
          </p>
          <h2
            id="showcase-heading"
            className="font-display mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            Veja como a Guiotti Multimarcas vende com a própria marca
          </h2>
          <p className="mt-4 text-muted-foreground">
            Site exclusivo, painel de gestão e identidade visual premium — tudo no ambiente
            isolado da loja. Sem template genérico e sem risco de outra revenda acessar o
            estoque.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <ShowcaseBrowserMockLink
            label="Vitrine pública"
            title="Site da concessionária"
            description="Layout premium, filtros de estoque, páginas de veículo otimizadas para SEO e contato direto com a loja."
            href={GUIOTTI_STOREFRONT_URL}
            accentClass="from-amber-500/20 via-amber-900/10 to-zinc-950"
            eyebrow="customer-site · layout 1"
          />
          <ShowcaseBrowserMockPreview
            label="Painel administrativo"
            title="Gestão de vendas e leads"
            description="Estoque, equipe, contatos e integrações no mesmo painel — acesso restrito só para colaboradores autorizados."
            accentClass="from-cyan-500/20 via-cyan-900/10 to-zinc-950"
            eyebrow="dealership-panel · acesso privado"
            icon={PanelLeft}
          />
        </div>

        <div className="mt-12">
          <h3 className="font-display text-xl font-semibold text-white md:text-2xl">
            Três layouts elegantes para posicionar sua marca
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Escolha o modelo estrutural da vitrine e combine com cores, logos e tema claro ou
            escuro — efeito de marketing profissional sem refazer o site do zero.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {SHOWCASE_LAYOUT_VARIANTS.map((variant) => (
              <li
                key={variant.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="size-5 text-marketing-accent" aria-hidden />
                  <p className="font-display font-semibold text-white">{variant.name}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{variant.description}</p>
                <div className="mt-4 flex gap-2" aria-hidden>
                  {variant.swatches.map((color) => (
                    <span
                      key={color}
                      className="size-6 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
            asChild
          >
            <a href={GUIOTTI_STOREFRONT_URL} target="_blank" rel="noopener noreferrer">
              Abrir vitrine Guiotti
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </Button>
          <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href="/contato">Quero o mesmo para minha loja</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ShowcaseBrowserMockLink({
  label,
  title,
  description,
  href,
  accentClass,
  eyebrow,
  icon: Icon = Monitor,
}: {
  label: string;
  title: string;
  description: string;
  href: string;
  accentClass: string;
  eyebrow: string;
  icon?: typeof Monitor;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 transition hover:border-marketing-accent/30 hover:shadow-lg hover:shadow-cyan-500/5"
    >
      <ShowcaseBrowserChrome
        address={href.replace("https://", "")}
        trailing={<ArrowUpRight className="size-4 text-zinc-500 transition group-hover:text-marketing-accent" aria-hidden />}
      />
      <ShowcaseBrowserBody
        label={label}
        title={title}
        description={description}
        accentClass={accentClass}
        eyebrow={eyebrow}
        icon={Icon}
      />
    </a>
  );
}

function ShowcaseBrowserMockPreview({
  label,
  title,
  description,
  accentClass,
  eyebrow,
  icon: Icon = Monitor,
}: {
  label: string;
  title: string;
  description: string;
  accentClass: string;
  eyebrow: string;
  icon?: typeof Monitor;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
      <ShowcaseBrowserChrome address="painel privado · acesso restrito" />
      <ShowcaseBrowserBody
        label={label}
        title={title}
        description={description}
        accentClass={accentClass}
        eyebrow={eyebrow}
        icon={Icon}
      />
    </div>
  );
}

function ShowcaseBrowserChrome({
  address,
  trailing,
}: {
  address: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
      <span className="size-2.5 rounded-full bg-red-500/80" aria-hidden />
      <span className="size-2.5 rounded-full bg-amber-400/80" aria-hidden />
      <span className="size-2.5 rounded-full bg-emerald-400/80" aria-hidden />
      <span className="ml-2 truncate font-mono text-xs text-zinc-500">{address}</span>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </div>
  );
}

function ShowcaseBrowserBody({
  label,
  title,
  description,
  accentClass,
  eyebrow,
  icon: Icon,
}: {
  label: string;
  title: string;
  description: string;
  accentClass: string;
  eyebrow: string;
  icon: typeof Monitor;
}) {
  return (
    <div className={`relative min-h-[220px] bg-gradient-to-br ${accentClass} p-6 md:min-h-[260px]`}>
      <div className="absolute inset-0 opacity-30" aria-hidden>
        <div className="grid h-full grid-cols-6 gap-2 p-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="rounded bg-white/5" />
          ))}
        </div>
      </div>
      <div className="relative">
        <p className="font-slogan text-xs uppercase tracking-wider text-zinc-400">{eyebrow}</p>
        <div className="mt-3 flex items-start gap-3">
          <Icon className="size-8 shrink-0 text-marketing-accent" aria-hidden />
          <div>
            <p className="text-xs font-medium text-marketing-accent">{label}</p>
            <p className="font-display mt-1 text-lg font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
