"use client";

import type { ReactNode } from "react";

import { useAuthDealershipBranding } from "@/components/auth/auth-branding-provider";
import { DealershipBrandImage } from "@/components/branding/dealership-brand-image";

interface AuthPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  const branding = useAuthDealershipBranding();
  const logoSrc = branding?.logoUrl ?? null;
  const logoCandidates = branding?.logoCandidateUrls ?? [];
  const logoAlt = branding?.dealershipName ?? "Concessionária";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        {logoSrc || logoCandidates.length > 0 ? (
          <DealershipBrandImage
            src={logoSrc}
            candidateUrls={logoCandidates}
            alt={logoAlt}
            className="h-12 w-auto max-w-[240px] object-contain sm:h-14"
            fallback={
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {logoAlt}
              </p>
            }
          />
        ) : (
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {logoAlt}
          </p>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Painel da concessionária
        </p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </div>
      {footer ? <div className="mt-6 text-center">{footer}</div> : null}
    </main>
  );
}
