"use client";

import { usePublicDealership } from "@/components/public/PublicDealershipProvider";

export function PublicHomeHero() {
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
        <a
          href="#estoque"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--dealer-accent)] px-6 text-sm font-semibold text-white shadow-md hover:opacity-95"
        >
          Ver estoque
        </a>
      </div>
    </section>
  );
}
