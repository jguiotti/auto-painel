import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { MarketingShowcase } from "@/components/marketing-showcase";
import {
  DIFFERENTIATORS,
  HERO_TRUST_POINTS,
  PILLARS,
  WORKFLOW_STEPS,
} from "@/lib/marketing-content";

export default function MarketingHomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-marketing-hero text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.08_195_/_0.25),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(to right, oklch(1 0 0 / 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(1 0 0 / 0.05) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 md:pb-28 md:pt-32">
          <Badge
            variant="secondary"
            className="font-slogan mb-6 border-white/10 bg-white/5 text-zinc-300 backdrop-blur-sm"
          >
            <Sparkles className="mr-1 size-3" aria-hidden />
            Plataforma completa para concessionárias
          </Badge>
          <h1 className="font-display max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Site exclusivo e painel de gestão — só da sua concessionária.
          </h1>
          <p className="font-slogan mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
            Venda mais com vitrine profissional, estoque atualizado e leads organizados.
            Cada loja opera no seu ambiente: ninguém de fora acessa seu estoque nem seus
            contatos.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-marketing-accent text-zinc-950 shadow-lg shadow-cyan-500/20 hover:bg-marketing-accent/90"
              asChild
            >
              <Link href="/contato">
                Agendar demonstração gratuita
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10"
              asChild
            >
              <Link href="/planos">Ver planos e módulos</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {HERO_TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <Check className="size-4 shrink-0 text-marketing-accent" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10 bg-zinc-950/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-slogan text-sm font-medium uppercase tracking-wider text-marketing-accent">
              Por que donos escolhem o AutoPainel
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Sua operação digital, fechada para o mundo — aberta para vender
            </h2>
            <p className="mt-4 text-muted-foreground">
              Chega de depender de agência para mudar preço ou foto. Você comanda site,
              equipe e leads com a mesma ferramenta que sua revenda usa no dia a dia.
            </p>
          </div>
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
              >
                <Icon className="size-9 text-marketing-accent" aria-hidden />
                <p className="font-display mt-4 text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingShowcase />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Marca forte, SEO de verdade, equipe alinhada
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Três temas de vitrine, personalização de cores e logo, posicionamento nos
            buscadores e gestão de pessoas — tudo pensado para gerar confiança e
            oportunidade comercial.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {DIFFERENTIATORS.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-white/10 bg-card/60 transition-shadow hover:border-marketing-accent/30 hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <CardHeader>
                <Icon className="size-10 text-marketing-accent" aria-hidden />
                <CardTitle className="font-display text-lg text-white">{title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-marketing-hero py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Do primeiro login à primeira venda
            </h2>
            <p className="mt-4 text-zinc-400">
              Onboarding enxuto: em dias, não meses, sua loja está no ar com identidade
              profissional e equipe treinada no painel.
            </p>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {WORKFLOW_STEPS.map(({ step, title, text }) => (
              <li key={step} className="relative">
                <span className="font-display text-4xl font-bold text-marketing-accent/40">
                  {step}
                </span>
                <p className="font-display mt-2 text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-marketing-accent/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent p-8 md:p-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                Veja como fica na sua concessionária
              </h2>
              <p className="mt-3 text-muted-foreground">
                Planos sob consulta — Starter, Business ou Enterprise conforme porte e
                módulos. Agende uma demo e receba proposta personalizada, sem compromisso.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
                asChild
              >
                <Link href="/contato">Quero uma demonstração</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/funcionalidades">Explorar funcionalidades</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
