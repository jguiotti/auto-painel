"use client";

import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";

export function HomeHero() {
  const dealership = usePublicDealership();

  return (
    <section className="border-b border-black/5 bg-[var(--dealer-primary)] px-4 py-12 text-white dark:border-white/10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium uppercase tracking-wide text-white/80">
          Seminovos
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {dealership?.name ?? "Nossa loja"}
        </h1>
        <p className="mt-3 max-w-xl text-lg text-white/90">
          Encontre o próximo carro com transparência. Filtre o estoque, simule o
          financiamento e fale com a equipe em poucos cliques.
        </p>
        <Button
          className="mt-6 bg-[var(--dealer-accent)] text-white hover:opacity-95"
          asChild
        >
          <Link href="/#estoque">Ver estoque</Link>
        </Button>
      </div>
    </section>
  );
}
