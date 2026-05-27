"use client";

import Image from "next/image";
import Link from "next/link";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Button } from "@autopainel/shared/ui";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";
import { buildStorefrontWhatsAppUrl } from "@/lib/phone/build-storefront-whatsapp-url";

import { StorefrontPageContainer } from "./storefront-page-container";

interface HomeHeroProps {
  layoutId: StorefrontLayoutTemplateId;
}

export function HomeHero({ layoutId }: HomeHeroProps) {
  const dealership = usePublicDealership();

  const titleStyle = { fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" } as const;
  const heroImage =
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80";

  const sellsMotorcycles =
    dealership?.slug === "guiotti" ||
    (dealership?.content_config as { sells_motorcycles?: boolean } | null)?.sells_motorcycles ===
      true;

  const vehicleNoun = sellsMotorcycles ? "veículo" : "carro";
  const inventoryLabel = sellsMotorcycles ? "automóveis e motocicletas" : "veículos selecionados";

  const testDriveHref =
    dealership?.whatsapp_number && dealership.slug
      ? buildStorefrontWhatsAppUrl({
          phone: dealership.whatsapp_number,
          message: `Olá! Gostaria de agendar um test drive na ${dealership.name}.`,
          dealershipSlug: dealership.slug,
          campaign: "test_drive",
        })
      : null;

  const browseStock = (
    <Button
      className="mt-8 bg-[var(--secondary-color,var(--dealer-accent))] px-8 text-white hover:opacity-95"
      asChild
    >
      <Link href="/estoque">Explorar estoque</Link>
    </Button>
  );

  const stockLink = (
    <Button
      className="bg-[var(--secondary-color,var(--dealer-accent))] px-8 text-white hover:opacity-95"
      asChild
    >
      <Link href="/estoque">{`Encontre seu ${vehicleNoun}`}</Link>
    </Button>
  );

  const testDriveLink = testDriveHref ? (
    <Button variant="outline" className="px-8" asChild>
      <a href={testDriveHref} target="_blank" rel="noopener noreferrer">
        Agendar test drive no WhatsApp
      </a>
    </Button>
  ) : null;

  if (layoutId === 2) {
    return (
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden pb-16 pt-28">
        <div aria-hidden className="absolute inset-0">
          <Image src={heroImage} alt="" fill className="object-cover opacity-35" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_70%,transparent)] to-[var(--storefront-bg,var(--dealer-bg))]" />
          <div className="absolute inset-y-0 right-0 w-1/3 skew-x-[-12deg] translate-x-1/4 bg-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_18%,transparent)]" />
        </div>
        <StorefrontPageContainer className="relative z-[1] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[var(--secondary-color,var(--dealer-accent))]">
            Performance e procedência
          </p>
          <h1
            style={titleStyle}
            className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {dealership?.name ?? "Nossa loja"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--storefront-fg,var(--dealer-fg))]/80">
            {sellsMotorcycles
              ? "Automóveis premium e motocicletas selecionadas — atendimento consultivo, revisão completa e condições transparentes."
              : `Encontre o ${vehicleNoun} ideal com atendimento próximo, revisão completa e condições transparentes de compra.`}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {stockLink}
            {testDriveLink}
          </div>
          <div className="flex justify-center">{browseStock}</div>
        </StorefrontPageContainer>
      </section>
    );
  }

  if (layoutId === 3) {
    return (
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-4 py-20">
        <div aria-hidden className="absolute inset-0">
          <Image src={heroImage} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_35%,transparent)] to-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_40%,transparent)]" />
        </div>
        <div className="relative z-[1] max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--primary-color,var(--dealer-primary))]">
            Seminovos com procedência
          </p>
          <h1
            style={titleStyle}
            className="mt-6 text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl md:text-6xl"
          >
            {`Seu próximo ${vehicleNoun} está aqui`}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/80">
            {dealership?.name ?? "Nossa loja"} — estoque atualizado, {inventoryLabel} revisados e equipe
            pronta para ajudar você a decidir com segurança.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {stockLink}
            {testDriveLink}
          </div>
          <div className="flex justify-center">{browseStock}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden py-16 lg:min-h-[88vh]">
      <div aria-hidden className="absolute inset-0">
        <Image src={heroImage} alt="" fill className="object-cover brightness-[0.4]" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--storefront-bg,var(--dealer-bg))] via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_55%,transparent)] to-transparent lg:via-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_35%,transparent)]" />
      </div>
      <StorefrontPageContainer className="relative z-[1]">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary-color,var(--dealer-primary))]">
              Compra com confiança
            </p>
            <h1
              style={titleStyle}
              className="mt-4 text-4xl font-semibold tracking-tight text-[var(--storefront-fg,var(--dealer-fg))] sm:text-5xl lg:text-6xl"
            >
              {sellsMotorcycles
                ? "Automóveis e motocicletas com quem entende do mercado."
                : `Encontre seu ${vehicleNoun} com quem entende do mercado.`}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--storefront-fg,var(--dealer-fg))]/80">
              {dealership?.name ?? "Nossa loja"} — {inventoryLabel} com garantia e atendimento
              personalizado do primeiro contato à entrega.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {stockLink}
              {testDriveLink}
            </div>
            {browseStock}
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="space-y-4 border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] bg-[color-mix(in_srgb,var(--storefront-surface,var(--dealer-surface))_85%,black)] p-8 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary-color,var(--dealer-primary))]">
                Experiência premium
              </p>
              <ul className="space-y-4 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/75">
                <li className="border-b border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] pb-3">
                  Curadoria rigorosa de cada unidade do estoque
                </li>
                <li className="border-b border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] pb-3">
                  Financiamento com simulação rápida e transparente
                </li>
                <li>Atendimento consultivo do primeiro contato à entrega</li>
              </ul>
            </div>
          </div>
        </div>
      </StorefrontPageContainer>
    </section>
  );
}
