import Image from "next/image";
import Link from "next/link";

import { VEHICLE_CONDITION_LABELS } from "@autopainel/shared/lib/vehicle/vehicle-catalog-options";
import { buildVehicleTypeSpecDisplayItems } from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";
import type { VehicleTypeSpecFields } from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";
import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";
import { Badge, Button, Separator } from "@autopainel/shared/ui";
import type { ClassifiedsProvider } from "@autopainel/shared/lib/dealership-features";

import { formatBrl } from "@/lib/format/format-brl";

import {
  VehicleClassifiedsPanel,
  type VehicleClassifiedListingStatus,
} from "./vehicle-classifieds-panel";
import {
  VehicleSocialSharePanel,
  type SocialPublicationJobSummary,
} from "./vehicle-social-share-panel";
import { SoldVehicleReceiptCard } from "./sold-vehicle-receipt-card";
import { MarkVehicleAsSoldButton } from "./mark-vehicle-as-sold-button";
import { UnmarkVehicleAsSoldButton } from "./unmark-vehicle-as-sold-button";

export interface VehicleDetailRecord {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  vehicle_type: string;
  vehicle_type_custom: string | null;
  public_slug: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  fipe_price: number | null;
  sale_price: number | null;
  price: number;
  description: string | null;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  images: string[] | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;
  body_style: string | null;
  accepts_trade: boolean;
  single_owner: boolean;
  all_revisions_done: boolean;
  factory_warranty: boolean;
  ipva_paid: boolean;
  is_licensed: boolean;
  features: string[] | null;
  unit_name?: string | null;
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

interface VehicleDetailPanelProps {
  vehicle: VehicleDetailRecord;
  storefrontUrl: string;
  socialShareEnabled: boolean;
  metaConnected: boolean;
  hasInstagramBusiness: boolean;
  artifactTemplateLabel: string;
  socialRecentJobs?: SocialPublicationJobSummary[];
  isQrGeneratorEnabled?: boolean;
  enabledClassifiedProviders?: ClassifiedsProvider[];
  classifiedsConnectedProviders?: ClassifiedsProvider[];
  classifiedsListings?: VehicleClassifiedListingStatus[];
  classifiedsRecentJobs?: Array<{
    provider: ClassifiedsProvider;
    action: "publish" | "delist";
    status: string;
    lastError: string | null;
  }>;
  isSaleReceiptEnabled?: boolean;
  hasSaleReceipt?: boolean;
}

function statusLabel(status: string, isActive: boolean): string {
  if (!isActive) {
    return "Inativo";
  }
  return status === "sold" ? "Vendido" : "Disponível";
}

export function VehicleDetailPanel({
  vehicle,
  storefrontUrl,
  socialShareEnabled,
  metaConnected,
  hasInstagramBusiness = false,
  artifactTemplateLabel,
  socialRecentJobs = [],
  isQrGeneratorEnabled = false,
  enabledClassifiedProviders = [],
  classifiedsConnectedProviders = [],
  classifiedsListings = [],
  classifiedsRecentJobs = [],
  isSaleReceiptEnabled = false,
  hasSaleReceipt = false,
}: VehicleDetailPanelProps) {
  const images = vehicle.images?.filter(Boolean) ?? [];
  const typeLabel = resolveVehicleTypeLabel(vehicle.vehicle_type, vehicle.vehicle_type_custom);
  const salePrice = Number(vehicle.sale_price ?? vehicle.price);
  const publicVehicleUrl = `${storefrontUrl.replace(/\/$/, "")}/veiculo/${vehicle.public_slug}`;

  const typeSpecItems = buildVehicleTypeSpecDisplayItems(vehicle.vehicle_type, {
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
    { label: "Tipo", value: typeLabel },
    vehicle.fuel_type ? { label: "Combustível", value: vehicle.fuel_type } : null,
    vehicle.transmission ? { label: "Câmbio", value: vehicle.transmission } : null,
    vehicle.color ? { label: "Cor", value: vehicle.color } : null,
    vehicle.body_style ? { label: "Carroceria", value: vehicle.body_style } : null,
    vehicle.fipe_price ? { label: "FIPE", value: formatBrl(Number(vehicle.fipe_price)) } : null,
    vehicle.unit_name ? { label: "Unidade", value: vehicle.unit_name } : null,
    ...typeSpecItems,
  ].filter((item): item is { label: string; value: string } => item !== null);

  const activeConditions = VEHICLE_CONDITION_LABELS.filter(({ key }) => vehicle[key]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Visualização</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {vehicle.brand} {vehicle.model}
            </h1>
            {vehicle.version ? (
              <p className="mt-1 text-sm text-muted-foreground">{vehicle.version}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{statusLabel(vehicle.status, vehicle.is_active)}</Badge>
              {vehicle.is_featured ? <Badge variant="secondary">Destaque</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {vehicle.status === "available" ? (
              <MarkVehicleAsSoldButton
                vehicleId={vehicle.id}
                vehicleLabel={`${vehicle.brand} ${vehicle.model}`}
                variant="default"
              />
            ) : (
              <>
                <Button variant="default" asChild>
                  <Link href={`/painel/estoque/${vehicle.id}/recibo`}>
                    {hasSaleReceipt ? "Imprimir recibo" : "Emitir recibo"}
                  </Link>
                </Button>
                <UnmarkVehicleAsSoldButton
                  vehicleId={vehicle.id}
                  vehicleLabel={`${vehicle.brand} ${vehicle.model}`}
                />
              </>
            )}
            <Button variant="outline" asChild>
              <Link href={`/painel/estoque/${vehicle.id}/editar`}>Editar</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={publicVehicleUrl} target="_blank" rel="noopener noreferrer">
                Ver na vitrine
              </a>
            </Button>
          </div>
        </div>

        {images.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((src, index) => (
              <li key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                <Image src={src} alt="" fill className="object-cover" sizes="240px" />
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma foto cadastrada.
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-2xl font-semibold text-primary">{formatBrl(salePrice)}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{vehicle.public_slug}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Principais informações</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-lg border border-border px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{spec.label}</dt>
                <dd className="mt-1 text-sm font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {activeConditions.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold">Condições</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {activeConditions.map(({ label }) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </ul>
          </div>
        ) : null}

        {vehicle.features && vehicle.features.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold">Itens do veículo</h2>
            <ul className="mt-3 columns-1 gap-x-6 sm:columns-2 lg:columns-3">
              {vehicle.features.map((feature) => (
                <li key={feature} className="mb-1 text-sm text-muted-foreground">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-semibold">Descrição</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {vehicle.description?.trim() ||
              "Sem descrição cadastrada. Edite o veículo para incluir detalhes adicionais."}
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <VehicleClassifiedsPanel
          vehicleId={vehicle.id}
          enabled={enabledClassifiedProviders.length > 0}
          enabledProviders={enabledClassifiedProviders}
          connectedProviders={classifiedsConnectedProviders}
          listings={classifiedsListings}
          recentJobs={classifiedsRecentJobs}
          showAutoDelistHint={vehicle.status === "available" && vehicle.is_active}
        />

        <VehicleSocialSharePanel
          vehicleId={vehicle.id}
          enabled={socialShareEnabled}
          metaConnected={metaConnected}
          hasInstagramBusiness={hasInstagramBusiness}
          artifactTemplateLabel={artifactTemplateLabel}
          imageCount={images.length}
          recentJobs={socialRecentJobs}
        />

        {vehicle.status === "sold" ? (
          <SoldVehicleReceiptCard
            vehicleId={vehicle.id}
            hasReceipt={hasSaleReceipt}
            isSaleReceiptEnabled={isSaleReceiptEnabled}
          />
        ) : null}

        {isQrGeneratorEnabled && vehicle.status === "available" && vehicle.is_active ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium">QR Code</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gere material impresso com link direto para a vitrine.
            </p>
            <Button className="mt-4 w-full" variant="outline" asChild>
              <Link href={`/painel/estoque/${vehicle.id}/qr`}>Gerar QR Code</Link>
            </Button>
          </div>
        ) : null}

        <Separator />

        <Button variant="ghost" className="w-full" asChild>
          <Link href="/painel/estoque">Voltar ao estoque</Link>
        </Button>
      </aside>
    </div>
  );
}
