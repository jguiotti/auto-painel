import type { ReactNode } from "react";

import { Separator } from "@autopainel/shared/ui";

import { LEGAL_PROSE_CLASS } from "@/components/legal/legal-prose-class";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-marketing-accent">
          Documento legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
        <p className="text-sm text-muted-foreground">Última atualização: {lastUpdated}</p>
      </header>
      <Separator className="my-10 bg-border/60" />
      <div className={LEGAL_PROSE_CLASS}>
        {children}
      </div>
    </article>
  );
}
