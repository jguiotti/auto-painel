"use client";

import { useMemo } from "react";

import {
  resolveStorefrontHomeCopy,
  sellsMotorcyclesFromContentConfig,
} from "@autopainel/shared/lib/dealership/storefront-home-copy";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";

import { StorefrontPageContainer } from "./storefront-page-container";

interface HomeHeritageSectionProps {
  layoutId: StorefrontLayoutTemplateId;
}

export function HomeHeritageSection({ layoutId }: HomeHeritageSectionProps) {
  const dealership = usePublicDealership();
  const dealershipName = dealership?.name ?? "Nossa loja";

  const copy = useMemo(
    () =>
      resolveStorefrontHomeCopy({
        contentConfig: dealership?.content_config as Record<string, unknown> | null | undefined,
        layoutId,
        context: {
          dealershipName,
          sellsMotorcycles: sellsMotorcyclesFromContentConfig(
            dealership?.content_config as Record<string, unknown> | null | undefined,
            dealership?.slug,
          ),
        },
      }),
    [dealership?.content_config, dealership?.slug, dealershipName, layoutId],
  );

  if (layoutId === 2) {
    return (
      <section className="bg-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_95%,black)] py-16 sm:py-20">
        <StorefrontPageContainer className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--secondary-color,var(--dealer-accent))]">
            {copy.heritageEyebrow}
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[var(--storefront-fg,var(--dealer-fg))] md:text-4xl"
            style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
          >
            {copy.heritageHeadline}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--storefront-fg,var(--dealer-fg))]/70">
            {copy.heritageBody}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {copy.heritageStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[140px] rounded-lg border border-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_35%,transparent)] px-6 py-4"
              >
                <p
                  className="text-2xl font-bold text-[var(--secondary-color,var(--dealer-accent))]"
                  style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--storefront-fg,var(--dealer-fg))]/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </StorefrontPageContainer>
      </section>
    );
  }

  if (layoutId === 3) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[color-mix(in_srgb,var(--dealer-bg)_90%,black)] py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 text-[12rem] font-black leading-none text-[color-mix(in_srgb,var(--dealer-primary)_12%,transparent)]"
        style={{ fontFamily: "var(--dealer-font-heading)" }}
      >
        {dealershipName.slice(0, 1) || "A"}
      </div>
      <StorefrontPageContainer className="relative z-[1]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--dealer-primary)]">
              {copy.heritageEyebrow}
            </p>
            <h2
              className="mt-4 text-3xl font-semibold leading-tight text-[var(--dealer-fg)] md:text-4xl"
              style={{ fontFamily: "var(--dealer-font-heading)" }}
            >
              {copy.heritageHeadline}
            </h2>
            <p className="mt-6 text-lg text-[var(--dealer-fg)]/70">{copy.heritageBody}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {copy.heritageStats.map((stat) => (
              <div
                key={stat.label}
                className="border border-[color-mix(in_srgb,var(--dealer-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--dealer-surface)_88%,black)] p-5"
              >
                <p
                  className="text-3xl font-semibold text-[var(--dealer-primary)]"
                  style={{ fontFamily: "var(--dealer-font-heading)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[var(--dealer-fg)]/55">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </StorefrontPageContainer>
    </section>
  );
}
