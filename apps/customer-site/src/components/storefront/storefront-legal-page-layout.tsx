import type { ReactNode } from "react";

import { Separator } from "@autopainel/shared/ui";

interface StorefrontLegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}

export function StorefrontLegalPageLayout({
  title,
  description,
  lastUpdated,
  children,
}: StorefrontLegalPageLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--dealer-primary)]">
          Documento legal
        </p>
        <h1
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--dealer-font-heading)" }}
        >
          {title}
        </h1>
        <p className="text-lg text-[var(--dealer-fg)]/70">{description}</p>
        <p className="text-sm text-[var(--dealer-fg)]/60">Última atualização: {lastUpdated}</p>
      </header>
      <Separator className="my-10 bg-[var(--dealer-fg)]/10" />
      <div className="space-y-6 text-base leading-relaxed text-[var(--dealer-fg)]/80 [&_a]:text-[var(--dealer-primary)] [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--dealer-fg)] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-[var(--dealer-fg)] [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_strong]:font-medium [&_strong]:text-[var(--dealer-fg)] [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
