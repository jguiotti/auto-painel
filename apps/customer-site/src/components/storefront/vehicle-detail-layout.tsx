"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { VEHICLE_CONDITION_LABELS } from "@autopainel/shared/lib/vehicle/vehicle-catalog-options";
import {
  buildVehicleTypeSpecDisplayItems,
  type VehicleTypeSpecFields,
} from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";
import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";
import { Badge, Button, Separator } from "@autopainel/shared/ui";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";
import { StorefrontWhatsAppLeadDialog } from "@/components/storefront/storefront-whatsapp-lead-dialog";
import { formatBrl } from "@/lib/format/format-brl";

import { VehicleEngagementSection } from "./vehicle-engagement-section";

export interface VehicleDetailModel {
  id: string;
  brand: string;
  model: string;
  version?: string | null;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  price: number;
  fipe_price?: number | null;
  description: string | null;
  images: string[] | null;
  public_slug: string;
  vehicle_type?: string;
  vehicle_type_custom?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  color?: string | null;
  body_style?: string | null;
  accepts_trade?: boolean;
  single_owner?: boolean;
  all_revisions_done?: boolean;
  factory_warranty?: boolean;
  ipva_paid?: boolean;
  is_licensed?: boolean;
  features?: string[] | null;
  gear_count?: number | null;
  displacement_cc?: number | null;
  engine_type?: string | null;
  cooling_type?: string | null;
  motorcycle_style?: string | null;
  starter_type?: string | null;
  brake_front?: string | null;
  brake_rear?: string | null;
  fuel_system?: string | null;
  traction?: string | null;
  axle_count?: number | null;
  gross_weight_kg?: number | null;
  passenger_capacity?: number | null;
  cab_type?: string | null;
  body_truck_type?: string | null;
}

interface VehicleDetailLayoutProps {
  vehicle: VehicleDetailModel;
  monthlyRatePercent: number;
}

export function VehicleDetailLayout({
  vehicle,
  monthlyRatePercent,
}: VehicleDetailLayoutProps) {
  const dealership = usePublicDealership();
  const images = vehicle.images?.filter(Boolean) ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const activeImage = images[activeIndex] ?? null;

  const typeLabel = vehicle.vehicle_type
    ? resolveVehicleTypeLabel(vehicle.vehicle_type, vehicle.vehicle_type_custom)
    : null;

  const whatsappVehicleMessage = `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""} (${vehicle.model_year}) anunciado no site.`;
  const showWhatsAppCta = Boolean(dealership?.whatsapp_number && dealership.slug);

  const typeSpecItems = buildVehicleTypeSpecDisplayItems(vehicle.vehicle_type ?? "automovel", {
    gear_count: vehicle.gear_count ?? null,
    displacement_cc: vehicle.displacement_cc ?? null,
    engine_type: vehicle.engine_type ?? null,
    cooling_type: vehicle.cooling_type ?? null,
    motorcycle_style: vehicle.motorcycle_style ?? null,
    starter_type: vehicle.starter_type ?? null,
    brake_front: vehicle.brake_front ?? null,
    brake_rear: vehicle.brake_rear ?? null,
    fuel_system: vehicle.fuel_system ?? null,
    traction: vehicle.traction ?? null,
    axle_count: vehicle.axle_count ?? null,
    gross_weight_kg: vehicle.gross_weight_kg ?? null,
    passenger_capacity: vehicle.passenger_capacity ?? null,
    cab_type: vehicle.cab_type ?? null,
    body_truck_type: vehicle.body_truck_type ?? null,
  } satisfies Partial<VehicleTypeSpecFields>);

  const specs = [
    { label: "Ano", value: `${vehicle.manufacturing_year}/${vehicle.model_year}` },
    { label: "Quilometragem", value: `${vehicle.mileage.toLocaleString("pt-BR")} km` },
    typeLabel ? { label: "Tipo", value: typeLabel } : null,
    vehicle.fuel_type ? { label: "Combustível", value: vehicle.fuel_type } : null,
    vehicle.transmission ? { label: "Câmbio", value: vehicle.transmission } : null,
    vehicle.color ? { label: "Cor", value: vehicle.color } : null,
    vehicle.body_style ? { label: "Carroceria", value: vehicle.body_style } : null,
    ...typeSpecItems,
  ].filter((item): item is { label: string; value: string } => item !== null);

  const activeConditions = useMemo(
    () =>
      VEHICLE_CONDITION_LABELS.filter(({ key }) => Boolean(vehicle[key])).map(
        ({ label }) => label,
      ),
    [vehicle],
  );

  const featureList = vehicle.features?.filter(Boolean) ?? [];

  function showPreviousImage() {
    if (images.length === 0) {
      return;
    }
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    if (images.length === 0) {
      return;
    }
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <article className="py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/60">
          <Link href="/" className="hover:text-[var(--primary-color,var(--dealer-primary))]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link href="/estoque" className="hover:text-[var(--primary-color,var(--dealer-primary))]">
            Estoque
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--storefront-fg,var(--dealer-fg))]">
            {vehicle.brand} {vehicle.model}
          </span>
        </nav>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
          <div className="min-w-0">
            <div className="relative">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--dealer-bg)_90%,black)]">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 65vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--dealer-fg)]/45">
                    Sem foto
                  </div>
                )}
              </div>

              {images.length > 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90"
                    aria-label="Foto anterior"
                    onClick={showPreviousImage}
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90"
                    aria-label="Próxima foto"
                    onClick={showNextImage}
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                  <p className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                    {activeIndex + 1} / {images.length}
                  </p>
                </>
              ) : null}
            </div>

            {images.length > 1 ? (
              <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {images.slice(0, 12).map((src, index) => (
                  <li key={src}>
                    <button
                      type="button"
                      className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border-2 transition ${
                        activeIndex === index
                          ? "border-[var(--primary-color,var(--dealer-primary))]"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 xl:hidden">
              <div className="rounded-2xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] p-5">
                <p className="text-3xl font-bold text-[var(--primary-color,var(--dealer-primary))]">
                  {formatBrl(Number(vehicle.price))}
                </p>
                {vehicle.fipe_price ? (
                  <p className="mt-1 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
                    FIPE: {formatBrl(Number(vehicle.fipe_price))}
                  </p>
                ) : null}
                {showWhatsAppCta ? (
                  <Button
                    type="button"
                    className="mt-4 w-full bg-[var(--secondary-color,var(--dealer-accent))] text-white"
                    onClick={() => setWhatsappOpen(true)}
                  >
                    Falar no WhatsApp
                  </Button>
                ) : null}
              </div>
            </div>

            <section className="mt-8">
              <h2
                className="text-2xl font-semibold text-[var(--storefront-fg,var(--dealer-fg))]"
                style={{ fontFamily: "var(--storefront-font-heading, var(--dealer-font-heading))" }}
              >
                {vehicle.brand} {vehicle.model}
              </h2>
              {vehicle.version ? (
                <p className="mt-2 text-base text-[var(--storefront-fg,var(--dealer-fg))]/75">
                  {vehicle.version}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {typeLabel ? <Badge variant="outline">{typeLabel}</Badge> : null}
                <Badge variant="secondary">
                  {vehicle.manufacturing_year}/{vehicle.model_year}
                </Badge>
                <Badge variant="secondary">{vehicle.mileage.toLocaleString("pt-BR")} km</Badge>
              </div>
            </section>

            <section className="mt-8">
              <h3 className="text-lg font-semibold text-[var(--storefront-fg,var(--dealer-fg))]">
                Principais informações
              </h3>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_10%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] px-4 py-3"
                  >
                    <dt className="text-xs uppercase tracking-wide text-[var(--storefront-fg,var(--dealer-fg))]/55">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[var(--storefront-fg,var(--dealer-fg))]">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {activeConditions.length > 0 ? (
              <section className="mt-8">
                <h3 className="text-lg font-semibold text-[var(--storefront-fg,var(--dealer-fg))]">
                  Condições
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {activeConditions.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </ul>
              </section>
            ) : null}

            {featureList.length > 0 ? (
              <section className="mt-8">
                <h3 className="text-lg font-semibold text-[var(--storefront-fg,var(--dealer-fg))]">
                  Itens do veículo
                </h3>
                <ul className="mt-4 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
                  {featureList.map((feature) => (
                    <li
                      key={feature}
                      className="mb-2 text-sm text-[var(--storefront-fg,var(--dealer-fg))]/80"
                    >
                      • {feature}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="mt-8">
              <h3 className="text-lg font-semibold text-[var(--storefront-fg,var(--dealer-fg))]">
                Sobre este veículo
              </h3>
              {vehicle.description ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/80">
                  {vehicle.description}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/75">
                  Veículo revisado, documentação em dia e pronto para transferência. Fale com nossa
                  equipe e receba uma proposta personalizada hoje mesmo.
                </p>
              )}
            </section>

            <Separator className="my-10" />

            <VehicleEngagementSection
              vehicleId={vehicle.id}
              vehiclePrice={Number(vehicle.price)}
              monthlyRatePercent={monthlyRatePercent}
            />
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-28 space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_15%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] p-6 shadow-sm">
              <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/60">Preço anunciado</p>
              <p className="text-3xl font-bold text-[var(--primary-color,var(--dealer-primary))]">
                {formatBrl(Number(vehicle.price))}
              </p>
              {vehicle.fipe_price ? (
                <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/65">
                  FIPE: {formatBrl(Number(vehicle.fipe_price))}
                </p>
              ) : null}
              <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
                Agende um test drive ou solicite uma proposta sem compromisso.
              </p>
              {showWhatsAppCta ? (
                <Button
                  type="button"
                  className="w-full bg-[var(--secondary-color,var(--dealer-accent))] text-white"
                  onClick={() => setWhatsappOpen(true)}
                >
                  Quero este veículo no WhatsApp
                </Button>
              ) : null}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/estoque">Ver mais veículos</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {showWhatsAppCta && dealership ? (
        <StorefrontWhatsAppLeadDialog
          open={whatsappOpen}
          onOpenChange={setWhatsappOpen}
          dealershipName={dealership.name}
          dealershipSlug={dealership.slug}
          whatsappNumber={dealership.whatsapp_number!}
          source="vehicle_page"
          vehicleId={vehicle.id}
          campaign="vehicle_interest"
          content={vehicle.public_slug}
          defaultWhatsAppMessage={whatsappVehicleMessage}
          title="Falar no WhatsApp"
          description={`Informe seus dados para registrar interesse no ${vehicle.brand} ${vehicle.model} e abrir o WhatsApp com a equipe.`}
          submitLabel="Continuar no WhatsApp"
        />
      ) : null}
    </article>
  );
}
