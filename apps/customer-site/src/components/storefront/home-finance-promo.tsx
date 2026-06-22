"use client";

import Link from "next/link";

import type { ResolvedStorefrontHomeCopy } from "@autopainel/shared/lib/dealership/storefront-home-copy";
import { Button } from "@autopainel/shared/ui";

import { StorefrontPageContainer } from "./storefront-page-container";

interface HomeFinancePromoProps {
  copy: ResolvedStorefrontHomeCopy;
}

export function HomeFinancePromo({ copy }: HomeFinancePromoProps) {
  return (
    <section className="relative z-20 -mt-10 py-0">
      <StorefrontPageContainer>
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] bg-[color-mix(in_srgb,var(--storefront-surface,var(--dealer-surface))_92%,black)] p-6 shadow-2xl backdrop-blur md:flex md:items-center md:gap-8">
          <div className="flex-1">
            <h2
              className="text-xl font-semibold text-[var(--primary-color,var(--dealer-primary))]"
              style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
            >
              {copy.financeTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
              {copy.financeSubtitle}
            </p>
          </div>
          <Button
            className="mt-4 bg-[var(--secondary-color,var(--dealer-accent))] px-8 text-[var(--dealer-accent-fg,#ffffff)] hover:opacity-95 md:mt-0"
            asChild
          >
            <Link href="/simular-financiamento">{copy.financeCta}</Link>
          </Button>
        </div>
      </StorefrontPageContainer>
    </section>
  );
}
