interface HomeTrustStripProps {
  items: Array<{ value: string; label: string }>;
}

export function HomeTrustStrip({ items }: HomeTrustStripProps) {
  return (
    <section
      aria-label="Indicadores da loja"
      className="border-y border-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_35%,transparent)] bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_12%,var(--storefront-bg,var(--dealer-bg)))]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_25%,transparent)] sm:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={`${index}-${item.value}-${item.label}`}
            className="bg-[var(--storefront-bg,var(--dealer-bg))] px-4 py-6 text-center sm:px-6"
          >
            <p
              className="text-2xl font-bold tracking-tight text-[var(--secondary-color,var(--dealer-accent))] sm:text-3xl"
              style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
            >
              {item.value}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--storefront-fg,var(--dealer-fg))]/60">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
