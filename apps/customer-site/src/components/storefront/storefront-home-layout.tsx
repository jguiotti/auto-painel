"use client";

import { useMemo } from "react";

import {
  resolveStorefrontHomeCopy,
  sellsMotorcyclesFromContentConfig,
} from "@autopainel/shared/lib/dealership/storefront-home-copy";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";

import type { PublicVehicleCardModel } from "./vehicle-listing-grid";

import { HomeFeaturedBento } from "./home-featured-bento";
import { HomeFinancePromo } from "./home-finance-promo";
import { HomeHero } from "./home-hero";
import { HomeHeritageSection } from "./home-heritage-section";
import { HomeInventoryTeaser } from "./home-inventory-teaser";
import { HomeTrustStrip } from "./home-trust-strip";

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
  const dealership = usePublicDealership();
  const featuredVehicles = vehicles.filter((vehicle) => vehicle.is_featured);

  const copy = useMemo(
    () =>
      resolveStorefrontHomeCopy({
        contentConfig: dealership?.content_config as Record<string, unknown> | null | undefined,
        layoutId,
        context: {
          dealershipName: dealership?.name ?? "Nossa loja",
          sellsMotorcycles: sellsMotorcyclesFromContentConfig(
            dealership?.content_config as Record<string, unknown> | null | undefined,
            dealership?.slug,
          ),
        },
      }),
    [dealership?.content_config, dealership?.name, dealership?.slug, layoutId],
  );

  if (layoutId === 2) {
    return (
      <>
        <HomeHero layoutId={layoutId} />
        <HomeTrustStrip items={copy.trustStats} />
        <HomeFinancePromo copy={copy} />
        <HomeHeritageSection layoutId={layoutId} />
        <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      </>
    );
  }

  if (layoutId === 3) {
    return (
      <>
        <HomeHero layoutId={layoutId} />
        <HomeTrustStrip items={copy.trustStats} />
        <HomeFeaturedBento
          vehicles={featuredVehicles.length > 0 ? featuredVehicles : vehicles.slice(0, 3)}
        />
        <HomeFinancePromo copy={copy} />
        <HomeHeritageSection layoutId={layoutId} />
        <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      </>
    );
  }

  return (
    <>
      <HomeHero layoutId={layoutId} />
      <HomeTrustStrip items={copy.trustStats} />
      <HomeFinancePromo copy={copy} />
      <HomeInventoryTeaser layoutId={layoutId} vehicles={vehicles} totalCount={totalCount} />
      <HomeHeritageSection layoutId={layoutId} />
    </>
  );
}
