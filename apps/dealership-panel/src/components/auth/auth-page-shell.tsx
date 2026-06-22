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
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-900 [color-scheme:light]">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        {logoSrc || logoCandidates.length > 0 ? (
          <DealershipBrandImage
            src={logoSrc}
            candidateUrls={logoCandidates}
            alt={logoAlt}
            className="h-12 w-auto max-w-[240px] object-contain sm:h-14"
            fallback={
              <p className="text-xl font-semibold tracking-tight text-zinc-900">
                {logoAlt}
              </p>
            }
          />
        ) : (
          <p className="text-xl font-semibold tracking-tight text-zinc-900">
            {logoAlt}
          </p>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Painel da concessionária
        </p>
      </div>
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>
        {children}
      </div>
      {footer ? <div className="mt-6 text-center">{footer}</div> : null}
    </main>
  );
}
