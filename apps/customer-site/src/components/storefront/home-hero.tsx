"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DEFAULT_STOREFRONT_HERO_BACKGROUND_URL,
  resolveStorefrontHomeCopy,
  sellsMotorcyclesFromContentConfig,
} from "@autopainel/shared/lib/dealership/storefront-home-copy";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Button } from "@autopainel/shared/ui";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";
import { StorefrontWhatsAppLeadDialog } from "@/components/storefront/storefront-whatsapp-lead-dialog";

import { StorefrontPageContainer } from "./storefront-page-container";

interface HomeHeroProps {
  layoutId: StorefrontLayoutTemplateId;
}

function shouldUseUnoptimizedHeroImage(url: string): boolean {
  return url !== DEFAULT_STOREFRONT_HERO_BACKGROUND_URL;
}

export function HomeHero({ layoutId }: HomeHeroProps) {
  const dealership = usePublicDealership();
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const dealershipName = dealership?.name ?? "Nossa loja";

  const sellsMotorcycles = sellsMotorcyclesFromContentConfig(
    dealership?.content_config as Record<string, unknown> | null | undefined,
    dealership?.slug,
  );

  const copy = useMemo(
    () =>
      resolveStorefrontHomeCopy({
        contentConfig: dealership?.content_config as Record<string, unknown> | null | undefined,
        layoutId,
        context: {
          dealershipName,
          sellsMotorcycles,
        },
      }),
    [dealership?.content_config, dealershipName, layoutId, sellsMotorcycles],
  );

  const titleStyle = { fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" } as const;
  const heroImageUnoptimized = shouldUseUnoptimizedHeroImage(copy.heroBackgroundUrl);

  const showTestDriveCta = Boolean(dealership?.whatsapp_number && dealership.slug);

  const stockLink = (
    <Button
      className="bg-[var(--secondary-color,var(--dealer-accent))] px-8 text-[var(--dealer-accent-fg,#ffffff)] hover:opacity-95"
      asChild
    >
      <Link href="/estoque">{copy.heroCtaStock}</Link>
    </Button>
  );

  const testDriveButton = showTestDriveCta ? (
    <Button
      type="button"
      variant="outline"
      className="border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_35%,transparent)] px-8 text-[var(--storefront-fg,var(--dealer-fg))] hover:bg-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)]"
      onClick={() => setTestDriveOpen(true)}
    >
      {copy.heroCtaWhatsapp}
    </Button>
  ) : null;

  const testDriveDialog =
    showTestDriveCta && dealership ? (
      <StorefrontWhatsAppLeadDialog
        open={testDriveOpen}
        onOpenChange={setTestDriveOpen}
        dealershipName={dealership.name}
        dealershipSlug={dealership.slug}
        whatsappNumber={dealership.whatsapp_number!}
        source="whatsapp_float"
        campaign="test_drive"
        defaultWhatsAppMessage={`Olá! Gostaria de agendar um test drive na ${dealership.name}.`}
        title="Agendar test drive"
        description={`Informe seus dados para registrar o interesse e abrir o WhatsApp com a equipe da ${dealership.name}.`}
        submitLabel="Continuar no WhatsApp"
      />
    ) : null;

  const heroImage = (
    <Image
      src={copy.heroBackgroundUrl}
      alt=""
      fill
      className="object-cover"
      priority
      unoptimized={heroImageUnoptimized}
    />
  );

  if (layoutId === 2) {
    return (
      <>
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-20 sm:min-h-[88vh]">
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 [&_img]:opacity-35">{heroImage}</div>
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_70%,transparent)] to-[var(--storefront-bg,var(--dealer-bg))]" />
            <div className="absolute inset-y-0 right-0 w-1/3 skew-x-[-12deg] translate-x-1/4 bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_18%,transparent)]" />
          </div>
          <StorefrontPageContainer className="relative z-[1] text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[var(--secondary-color,var(--dealer-accent))]">
              {copy.heroEyebrow}
            </p>
            <h1
              style={titleStyle}
              className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {copy.heroHeadline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--storefront-fg,var(--dealer-fg))]/80">
              {copy.heroSubheadline}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {stockLink}
              {testDriveButton}
            </div>
          </StorefrontPageContainer>
        </section>
        {testDriveDialog}
      </>
    );
  }

  if (layoutId === 3) {
    return (
      <>
        <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-4 py-20">
          <div aria-hidden className="absolute inset-0">
            {heroImage}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_35%,transparent)] to-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_40%,transparent)]" />
          </div>
          <div className="relative z-[1] max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--primary-color,var(--dealer-primary))]">
              {copy.heroEyebrow}
            </p>
            <h1
              style={titleStyle}
              className="mt-6 text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl md:text-6xl"
            >
              {copy.heroHeadline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/80">
              {copy.heroSubheadline}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {stockLink}
              {testDriveButton}
            </div>
          </div>
        </section>
        {testDriveDialog}
      </>
    );
  }

  return (
    <>
      <section className="relative flex min-h-[82vh] items-center overflow-hidden py-16 lg:min-h-[88vh]">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 [&_img]:brightness-[0.4]">{heroImage}</div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_55%,transparent)] to-transparent lg:via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_35%,transparent)]" />
        </div>
        <StorefrontPageContainer className="relative z-[1]">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary-color,var(--dealer-primary))]">
                {copy.heroEyebrow}
              </p>
              <h1
                style={titleStyle}
                className="mt-4 text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl lg:text-6xl"
              >
                {copy.heroHeadline}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-[var(--storefront-fg,var(--dealer-fg))]/80">
                {copy.heroSubheadline}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                {stockLink}
                {testDriveButton}
              </div>
            </div>
            {copy.heroSidecardTitle ? (
              <div className="hidden lg:col-span-5 lg:block">
                <div className="space-y-4 border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] bg-[color-mix(in_srgb,var(--storefront-surface,var(--dealer-surface))_85%,black)] p-8 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary-color,var(--dealer-primary))]">
                    {copy.heroSidecardTitle}
                  </p>
                  <ul className="space-y-4 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/75">
                    {copy.heroSidecardItems.map((item) => (
                      <li
                        key={item}
                        className="border-b border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] pb-3 last:border-0 last:pb-0"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </StorefrontPageContainer>
      </section>
      {testDriveDialog}
    </>
  );
}
