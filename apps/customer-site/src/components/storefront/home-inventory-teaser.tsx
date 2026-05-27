import Link from "next/link";

import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Button } from "@autopainel/shared/ui";

import { HomeInventoryCarousel } from "./home-inventory-carousel";
import { StorefrontPageContainer } from "./storefront-page-container";
import type { PublicVehicleCardModel } from "./vehicle-listing-grid";
import { VehicleListingGrid } from "./vehicle-listing-grid";

interface HomeInventoryTeaserProps {
  layoutId: StorefrontLayoutTemplateId;
  vehicles: PublicVehicleCardModel[];
  totalCount: number;
}

export function HomeInventoryTeaser({
  layoutId,
  vehicles,
  totalCount,
}: HomeInventoryTeaserProps) {
  const preview = vehicles.slice(0, layoutId === 3 ? 4 : layoutId === 2 ? 8 : 6);

  const headerAccentClass =
    layoutId === 2
      ? "border-[var(--secondary-color,var(--dealer-accent))]"
      : "border-[var(--primary-color,var(--dealer-primary))]";

  const headerLabelClass =
    layoutId === 2
      ? "text-[var(--secondary-color,var(--dealer-accent))]"
      : "text-[var(--primary-color,var(--dealer-primary))]";

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <StorefrontPageContainer>
        <div
          className={`mb-8 flex flex-wrap items-end justify-between gap-4 border-l-4 pl-5 ${headerAccentClass}`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${headerLabelClass}`}>
              {layoutId === 2 ? "Seleção esportiva" : "Destaques do estoque"}
            </p>
            <h2
              className="mt-2 text-3xl font-semibold text-[var(--storefront-fg,var(--dealer-fg))]"
              style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
            >
              {layoutId === 2 ? "Deslize pelos destaques" : "Veículos selecionados para você"}
            </h2>
            <p className="mt-2 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
              {totalCount} opções disponíveis — use filtros avançados na página de estoque.
            </p>
          </div>
          <Button
            className="bg-[var(--secondary-color,var(--dealer-accent))] text-white hover:opacity-95"
            asChild
          >
            <Link href="/estoque">Ver estoque completo</Link>
          </Button>
        </div>

        {preview.length > 0 ? (
          layoutId === 2 ? (
            <HomeInventoryCarousel vehicles={preview} />
          ) : (
            <VehicleListingGrid vehicles={preview} layoutId={layoutId} />
          )
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
            Estoque em atualização. Volte em breve ou fale conosco pelo WhatsApp.
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/estoque">Explorar todos os veículos</Link>
          </Button>
        </div>
      </StorefrontPageContainer>
    </section>
  );
}
