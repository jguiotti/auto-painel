"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";

import type { PublicVehicleCardModel } from "./vehicle-listing-grid";

interface HomeInventoryCarouselProps {
  vehicles: PublicVehicleCardModel[];
}

const CARD_WIDTH = 300;
const CARD_GAP = 16;

export function HomeInventoryCarousel({ vehicles }: HomeInventoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, vehicles.length]);

  function scrollByPage(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const visibleCards = Math.max(1, Math.floor(track.clientWidth / (CARD_WIDTH + CARD_GAP)));
    track.scrollBy({
      left: direction * visibleCards * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  }

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {canScrollPrev ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--storefront-bg,var(--dealer-bg))] shadow-md sm:flex lg:-left-5"
          aria-label="Veículos anteriores"
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
      ) : null}

      <div
        ref={trackRef}
        className="-mx-4 touch-pan-x overflow-x-scroll overscroll-x-contain px-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:mx-0 sm:overflow-x-auto sm:px-0 sm:touch-auto [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max min-w-full gap-4">
          {vehicles.map((vehicle) => {
            const thumb = vehicle.images?.[0] ?? null;

            return (
              <li key={vehicle.id} className="w-[min(85vw,300px)] shrink-0 snap-start sm:w-[300px]">
                <Link
                  href={`/veiculo/${vehicle.public_slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--secondary-color,var(--dealer-accent))_30%,transparent)]"
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="300px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center bg-[var(--storefront-surface,var(--dealer-surface))] text-sm text-[var(--storefront-fg,var(--dealer-fg))]/45">
                      Sem foto
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--secondary-color,var(--dealer-accent))]">
                      {vehicle.manufacturing_year}/{vehicle.model_year}
                    </p>
                    <p
                      className="mt-1 text-lg font-semibold text-white"
                      style={{
                        fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))",
                      }}
                    >
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/90">
                      {formatBrl(Number(vehicle.price))}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {canScrollNext ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--storefront-bg,var(--dealer-bg))] shadow-md sm:flex lg:-right-5"
          aria-label="Próximos veículos"
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
