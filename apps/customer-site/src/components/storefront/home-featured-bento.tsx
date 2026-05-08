/**
 * Highlights strip used only with storefront layout template 3 (large card grid feel).
 */

export function HomeFeaturedBento() {
  return (
    <section
      aria-labelledby="featured-bento-heading"
      className="border-y border-black/5 bg-[var(--dealer-surface)] px-4 py-14 dark:border-white/10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 border-l-4 border-[var(--dealer-primary)] pl-4">
          <h2
            id="featured-bento-heading"
            className="text-xl font-semibold tracking-tight text-[var(--dealer-fg)]"
          >
            Destaques
          </h2>
          <p className="mt-1 text-sm text-[var(--dealer-fg)]/65">
            Veículos em preparação e novidades da loja — confira também o estoque
            completo abaixo.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-12 md:grid-rows-2 md:h-[280px]">
          <div className="rounded-xl border border-black/10 bg-[var(--dealer-bg)] p-6 md:col-span-7 md:row-span-2 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dealer-primary)]">
              Curadoria
            </p>
            <p className="mt-2 text-lg font-medium text-[var(--dealer-fg)]">
              Cada veículo revisado antes de ir para vitrine.
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[var(--dealer-bg)] p-5 md:col-span-5 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dealer-accent)]">
              Financiamento
            </p>
            <p className="mt-2 text-sm text-[var(--dealer-fg)]/80">
              Simule parcelas e fale com a equipe pelo WhatsApp.
            </p>
          </div>
          <div className="rounded-xl border border-black/10 bg-[var(--dealer-bg)] p-5 md:col-span-5 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--dealer-accent)]">
              Visita
            </p>
            <p className="mt-2 text-sm text-[var(--dealer-fg)]/80">
              Agende uma visita para ver o carro ao vivo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
