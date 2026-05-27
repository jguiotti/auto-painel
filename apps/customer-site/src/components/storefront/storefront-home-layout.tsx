import Link from "next/link";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Button } from "@autopainel/shared/ui";

import type { PublicVehicleCardModel } from "./vehicle-listing-grid";

import { HomeFeaturedBento } from "./home-featured-bento";
import { HomeHero } from "./home-hero";
import { HomeHeritageSection } from "./home-heritage-section";
import { HomeInventoryTeaser } from "./home-inventory-teaser";
import { HomeTrustStrip } from "./home-trust-strip";
import { StorefrontPageContainer } from "./storefront-page-container";

interface StorefrontHomeLayoutProps {
  layoutId: StorefrontLayoutTemplateId;
  vehicles: PublicVehicleCardModel[];
  totalCount: number;
}

export function StorefrontHomeLayout({
  layoutId,
  vehicles,
  totalCount,
}: StorefrontHomeLayoutProps) {
  const featuredVehicles = vehicles.filter((vehicle) => vehicle.is_featured);

  if (layoutId === 2) {
    return (
      <>
        <HomeHero layoutId={layoutId} />
        <HomeTrustStrip
          items={[
            { value: "48h", label: "Resposta média" },
            { value: "100%", label: "Revisados" },
            { value: "15+", label: "Anos no mercado" },
            { value: "500+", label: "Clientes atendidos" },
          ]}
        />
        <HomeHeritageSection layoutId={layoutId} />
        <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      </>
    );
  }

  if (layoutId === 3) {
    return (
      <>
        <HomeHero layoutId={layoutId} />
        <HomeFeaturedBento
          vehicles={featuredVehicles.length > 0 ? featuredVehicles : vehicles.slice(0, 3)}
        />
        <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      </>
    );
  }

  return (
    <>
      <HomeHero layoutId={layoutId} />
      <section className="relative z-20 -mt-10 py-0">
        <StorefrontPageContainer>
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_25%,transparent)] bg-[color-mix(in_srgb,var(--storefront-surface,var(--dealer-surface))_92%,black)] p-6 shadow-2xl backdrop-blur md:flex md:items-center md:gap-8">
            <div className="flex-1">
              <h2
                className="text-xl font-semibold text-[var(--primary-color,var(--dealer-primary))]"
                style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
              >
                Simule o financiamento em segundos
              </h2>
              <p className="mt-1 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
                Descubra a parcela estimada e receba uma proposta personalizada da nossa equipe.
              </p>
            </div>
            <Button
              className="mt-4 bg-[var(--secondary-color,var(--dealer-accent))] px-8 text-white hover:opacity-95 md:mt-0"
              asChild
            >
              <Link href="/simular-financiamento">Quero minha proposta</Link>
            </Button>
          </div>
        </StorefrontPageContainer>
      </section>
      <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      <HomeHeritageSection layoutId={layoutId} />
    </>
  );
}
