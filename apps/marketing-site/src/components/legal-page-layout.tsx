import type { ReactNode } from "react";

import { Separator } from "@autopainel/shared/ui";

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
      <div className="legal-prose space-y-6 text-base leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
