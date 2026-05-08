"use client";

import Link from "next/link";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Button } from "@autopainel/shared/ui";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";

interface HomeHeroProps {
  layoutId: StorefrontLayoutTemplateId;
}

export function HomeHero({ layoutId }: HomeHeroProps) {
  const dealership = usePublicDealership();

  const titleStyle = { fontFamily: "var(--dealer-font-heading)" } as const;

  const stockLink = (
    <Button
      className="bg-[var(--dealer-accent)] text-white hover:opacity-95"
      asChild
    >
      <Link href="/#estoque">Ver estoque</Link>
    </Button>
  );

  if (layoutId === 2) {
    return (
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--dealer-bg)_92%,transparent)_0%,color-mix(in_srgb,var(--dealer-primary)_18%,var(--dealer-bg))_55%,var(--dealer-bg)_100%)]"
        />
        <div className="relative z-[1] max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--dealer-primary)]">
            Seminovos
          </p>
          <h1
            style={titleStyle}
            className="mt-4 text-3xl font-bold tracking-tight text-[var(--dealer-fg)] sm:text-4xl md:text-5xl"
          >
            {dealership?.name ?? "Nossa loja"}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--dealer-fg)]/85">
            Curadoria transparente: filtre o estoque, simule financiamento e fale com
            a equipe quando quiser.
          </p>
          <div className="mt-8 flex justify-center">{stockLink}</div>
        </div>
      </section>
    );
  }

  if (layoutId === 3) {
    return (
      <section className="relative overflow-hidden px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(360deg,var(--dealer-bg)_0%,color-mix(in_srgb,var(--dealer-primary)_12%,transparent)_45%,transparent_100%)]"
        />
        <div className="relative z-[1] mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-[var(--dealer-primary)]">
            Seminovos
          </p>
          <h1
            style={titleStyle}
            className="mt-5 text-3xl font-bold tracking-tight text-[var(--dealer-fg)] sm:text-4xl md:text-5xl"
          >
            {dealership?.name ?? "Nossa loja"}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--dealer-fg)]/85">
            Veículos selecionados com histórico claro e atendimento próximo. Explore o
            estoque em grade ampla logo abaixo.
          </p>
          <div className="mt-10 flex justify-center gap-4">{stockLink}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-black/5 px-4 py-12 dark:border-white/10 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--dealer-primary)]">
            Seminovos
          </p>
          <h1
            style={titleStyle}
            className="mt-2 text-3xl font-bold tracking-tight text-[var(--dealer-fg)] sm:text-4xl"
          >
            {dealership?.name ?? "Nossa loja"}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-[var(--dealer-fg)]/85">
            Transparência no estoque e no financiamento. Encontre o próximo carro e
            fale com a equipe em poucos cliques.
          </p>
          <div className="mt-6">{stockLink}</div>
        </div>
        <div
          aria-hidden
          className="relative hidden min-h-[220px] rounded-2xl md:block md:min-h-[280px]"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, var(--dealer-primary) 55%, var(--dealer-bg)) 0%, var(--dealer-accent) 100%)`,
          }}
        >
          <div className="absolute inset-3 rounded-xl bg-[var(--dealer-surface)]/25 backdrop-blur-sm" />
        </div>
      </div>
    </section>
  );
}
