"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Textarea,
} from "@autopainel/shared/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createVehicleAction,
  updateVehicleAction,
} from "@/app/painel/estoque/actions";

import { RemoveImageButton } from "@/components/inventory/RemoveImageButton";
import {
  VehiclePromotionSection,
  isVehiclePromotionActionAvailable,
  type VehiclePromotionConfig,
} from "@/components/inventory/vehicle-promotion-section";
import { VehicleCatalogFields } from "@/components/inventory/vehicle-catalog-fields";
import { VehicleImageUploadPreview } from "@/components/inventory/vehicle-image-upload-preview";
import { VehicleTypeSpecFields } from "@/components/inventory/vehicle-type-spec-fields";
import type { VehicleTypeSpecFields as VehicleTypeSpecDefaults } from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export interface VehicleFormDefaultValues {
  brand: string;
  model: string;
  vehicle_type:
    | "automovel"
    | "motocicleta"
    | "caminhonete"
    | "van"
    | "suv"
    | "utilitario"
    | "caminhao"
    | "onibus"
    | "outro";
  vehicle_type_custom: string;
  public_slug: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  fipe_price: number | null;
  sale_price: number;
  price: number;
  description: string;
  status: "available" | "sold";
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  dealership_unit_id?: string;
  version?: string | null;
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
  features?: string[];
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

interface VehicleFormProps {
  mode: "create" | "edit";
  vehicleId?: string;
  defaultValues?: VehicleFormDefaultValues;
  units: { id: string; name: string }[];
  promotionConfig?: VehiclePromotionConfig;
}

interface VehicleQualityScore {
  score: number;
  totalChecks: number;
  completedChecks: number;
}

function computeVehicleQualityScore(input: {
  vehicleType: string;
  vehicleTypeCustom: string;
  fipePrice: string;
  salePrice: string;
  description: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  imageCount: number;
}): VehicleQualityScore {
  const checks = [
    input.vehicleType.length > 0,
    input.vehicleType !== "outro" || input.vehicleTypeCustom.trim().length > 0,
    input.fipePrice.trim().length > 0,
    input.salePrice.trim().length > 0,
    input.description.trim().length >= 40,
    input.status === "available",
    input.isActive,
    input.imageCount >= 3,
    input.isFeatured || input.imageCount >= 5,
  ];

  const completedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  const score = Math.round((completedChecks / totalChecks) * 100);

  return {
    score,
    totalChecks,
    completedChecks,
  };
}

export function VehicleForm({
  mode,
  vehicleId,
  defaultValues,
  units,
  promotionConfig,
}: VehicleFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoteInstagram, setPromoteInstagram] = useState(true);
  const [promoteFacebook, setPromoteFacebook] = useState(true);
  const [promoteOlx, setPromoteOlx] = useState(true);
  const [promoteWebmotors, setPromoteWebmotors] = useState(true);
  const promotionActionAvailable = promotionConfig
    ? isVehiclePromotionActionAvailable(promotionConfig)
    : false;
  const [vehicleTypeInput, setVehicleTypeInput] = useState<
    VehicleFormDefaultValues["vehicle_type"]
  >(defaultValues?.vehicle_type ?? "automovel");
  const [vehicleTypeCustomInput, setVehicleTypeCustomInput] = useState(
    defaultValues?.vehicle_type_custom ?? "",
  );
  const [fipePriceInput, setFipePriceInput] = useState(
    defaultValues?.fipe_price !== null && defaultValues?.fipe_price !== undefined
      ? String(defaultValues.fipe_price)
      : "",
  );
  const [salePriceInput, setSalePriceInput] = useState(
    defaultValues?.sale_price !== null && defaultValues?.sale_price !== undefined
      ? String(defaultValues.sale_price)
      : defaultValues?.price !== null && defaultValues?.price !== undefined
        ? String(defaultValues.price)
        : "",
  );
  const [descriptionInput, setDescriptionInput] = useState(
    defaultValues?.description ?? "",
  );
  const [statusInput, setStatusInput] = useState(defaultValues?.status ?? "available");
  const [isActiveInput, setIsActiveInput] = useState(
    defaultValues?.is_active !== false,
  );
  const [isFeaturedInput, setIsFeaturedInput] = useState(
    Boolean(defaultValues?.is_featured),
  );
  const [uploadedImageCount, setUploadedImageCount] = useState(0);

  const defaults = defaultValues;
  const currentImageCount = (defaults?.images?.length ?? 0) + uploadedImageCount;
  const quality = useMemo(
    () =>
      computeVehicleQualityScore({
        vehicleType: vehicleTypeInput,
        vehicleTypeCustom: vehicleTypeCustomInput,
        fipePrice: fipePriceInput,
        salePrice: salePriceInput,
        description: descriptionInput,
        status: statusInput,
        isActive: isActiveInput,
        isFeatured: isFeaturedInput,
        imageCount: currentImageCount,
      }),
    [
      vehicleTypeInput,
      vehicleTypeCustomInput,
      fipePriceInput,
      salePriceInput,
      descriptionInput,
      statusInput,
      isActiveInput,
      isFeaturedInput,
      currentImageCount,
    ],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result = await createVehicleAction(formData);
        if (result && "error" in result && result.error) {
          setErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }
        if (
          result &&
          "success" in result &&
          result.success &&
          "vehicleId" in result
        ) {
          router.push(`/painel/estoque/${result.vehicleId}/editar`);
          return;
        }
      }

      if (mode === "edit" && vehicleId) {
        const result = await updateVehicleAction(vehicleId, formData);
        if (result && "error" in result && result.error) {
          setErrorMessage(result.error);
          setIsSubmitting(false);
          return;
        }
        if (result && "success" in result && result.success) {
          router.push("/painel/estoque");
          router.refresh();
          return;
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const imageFieldName = mode === "create" ? "images" : "new_images";

  return (
    <Card className="mx-auto w-full max-w-4xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Novo veículo" : "Editar veículo"}</CardTitle>
        <CardDescription>
          Dados e fotos ficam restritos à sua loja. Envie as imagens na galeria abaixo (JPEG,
          PNG, WebP ou GIF).
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Qualidade do anúncio</p>
                <p className="text-xs text-muted-foreground">
                  {quality.completedChecks}/{quality.totalChecks} critérios atendidos
                </p>
              </div>
              <Badge variant={quality.score >= 80 ? "default" : "secondary"}>
                {quality.score}%
              </Badge>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-zinc-200">
              <div
                className="h-full rounded bg-primary transition-all"
                style={{ width: `${quality.score}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                required
                defaultValue={defaults?.brand}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                name="model"
                required
                defaultValue={defaults?.model}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vehicle_type">Tipo de veículo</Label>
              <select
                id="vehicle_type"
                name="vehicle_type"
                required
                disabled={isSubmitting}
                defaultValue={defaults?.vehicle_type ?? "automovel"}
                onChange={(event) =>
                  setVehicleTypeInput(
                    event.target.value as VehicleFormDefaultValues["vehicle_type"],
                  )
                }
                className={selectClassName}
              >
                <option value="automovel">Automóvel</option>
                <option value="motocicleta">Motocicleta</option>
                <option value="caminhonete">Caminhonete</option>
                <option value="van">Van</option>
                <option value="suv">SUV</option>
                <option value="utilitario">Utilitário</option>
                <option value="caminhao">Caminhão</option>
                <option value="onibus">Ônibus</option>
                <option value="outro">Outro (cadastrar)</option>
              </select>
            </div>
            {vehicleTypeInput === "outro" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vehicle_type_custom">Tipo personalizado</Label>
                <Input
                  id="vehicle_type_custom"
                  name="vehicle_type_custom"
                  required
                  placeholder="Ex.: micro-ônibus, buggy"
                  defaultValue={defaults?.vehicle_type_custom}
                  onChange={(event) => setVehicleTypeCustomInput(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            ) : null}
            <VehicleTypeSpecFields
              vehicleType={vehicleTypeInput}
              disabled={isSubmitting}
              defaults={
                {
                  gear_count: defaults?.gear_count,
                  displacement_cc: defaults?.displacement_cc,
                  engine_type: defaults?.engine_type,
                  cooling_type: defaults?.cooling_type,
                  motorcycle_style: defaults?.motorcycle_style,
                  starter_type: defaults?.starter_type,
                  brake_front: defaults?.brake_front,
                  brake_rear: defaults?.brake_rear,
                  fuel_system: defaults?.fuel_system,
                  traction: defaults?.traction,
                  axle_count: defaults?.axle_count,
                  gross_weight_kg: defaults?.gross_weight_kg,
                  passenger_capacity: defaults?.passenger_capacity,
                  cab_type: defaults?.cab_type,
                  body_truck_type: defaults?.body_truck_type,
                } satisfies Partial<VehicleTypeSpecDefaults>
              }
            />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="public_slug">Slug público (URL)</Label>
              <Input
                id="public_slug"
                name="public_slug"
                required
                placeholder="ex: civic-2018-preto"
                defaultValue={defaults?.public_slug}
                className="font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dealership_unit_id">Unidade (estoque)</Label>
              <select
                id="dealership_unit_id"
                name="dealership_unit_id"
                required
                disabled={isSubmitting}
                defaultValue={
                  defaultValues?.dealership_unit_id ?? units[0]?.id ?? ""
                }
                className={selectClassName}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                O veículo aparece na mesma vitrine; apenas o painel separa estoque por filial.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturing_year">Ano fabricação</Label>
              <Input
                id="manufacturing_year"
                name="manufacturing_year"
                type="number"
                required
                defaultValue={defaults?.manufacturing_year}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model_year">Ano modelo</Label>
              <Input
                id="model_year"
                name="model_year"
                type="number"
                required
                defaultValue={defaults?.model_year}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Quilometragem</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                min={0}
                required
                defaultValue={defaults?.mileage}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fipe_price">Valor FIPE (R$)</Label>
              <Input
                id="fipe_price"
                name="fipe_price"
                inputMode="decimal"
                defaultValue={defaults?.fipe_price ?? ""}
                onChange={(event) => setFipePriceInput(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Valor de venda (R$)</Label>
              <Input
                id="sale_price"
                name="sale_price"
                inputMode="decimal"
                required
                defaultValue={defaults?.sale_price ?? defaults?.price}
                onChange={(event) => setSalePriceInput(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="status">Status comercial</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={defaults?.status ?? "available"}
                disabled={isSubmitting}
                onChange={(event) =>
                  setStatusInput(event.target.value as "available" | "sold")
                }
                className={selectClassName}
              >
                <option value="available">Disponível</option>
                <option value="sold">Vendido</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Veículos vendidos saem da vitrine. Na listagem ou na ficha você também pode usar
                «Marcar como vendido».
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="is_active">Visibilidade do anúncio</Label>
              <select
                id="is_active"
                name="is_active"
                required
                defaultValue={defaults?.is_active === false ? "false" : "true"}
                disabled={isSubmitting}
                onChange={(event) => setIsActiveInput(event.target.value !== "false")}
                className={selectClassName}
              >
                <option value="true">Ativo (pode aparecer/acessar)</option>
                <option value="false">Inativo (oculto e sem acesso público)</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="flex items-center gap-3 rounded-lg border border-input px-3 py-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  value="true"
                  defaultChecked={Boolean(defaults?.is_featured)}
                  onChange={(event) => setIsFeaturedInput(event.target.checked)}
                  disabled={isSubmitting}
                  className="size-4 rounded border-input"
                />
                <span className="text-sm">
                  Marcar como destaque (uso futuro em vitrine e campanhas)
                </span>
              </label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={defaults?.description}
                onChange={(event) => setDescriptionInput(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <VehicleCatalogFields
            disabled={isSubmitting}
            defaults={{
              version: defaults?.version,
              fuel_type: defaults?.fuel_type,
              transmission: defaults?.transmission,
              color: defaults?.color,
              body_style: defaults?.body_style,
              accepts_trade: defaults?.accepts_trade,
              single_owner: defaults?.single_owner,
              all_revisions_done: defaults?.all_revisions_done,
              factory_warranty: defaults?.factory_warranty,
              ipva_paid: defaults?.ipva_paid,
              is_licensed: defaults?.is_licensed,
              features: defaults?.features,
            }}
          />

          {mode === "edit" && defaults?.images?.length ? (
            <div>
              <Label>Imagens atuais</Label>
              <ul className="mt-2 flex flex-wrap gap-3">
                {defaults.images.map((url) => (
                  <li key={url} className="flex flex-col">
                    <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-border">
                      <Image src={url} alt="" fill className="object-cover" sizes="128px" />
                    </div>
                    {vehicleId ? (
                      <RemoveImageButton vehicleId={vehicleId} imageUrl={url} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Separator />

          <VehicleImageUploadPreview
            inputId={imageFieldName}
            inputName={imageFieldName}
            label={
              mode === "create"
                ? "Fotos do veículo (galeria)"
                : "Adicionar novas fotos (opcional)"
            }
            description="Selecione várias imagens de uma vez. Elas compõem a galeria na vitrine e nas redes sociais."
            disabled={isSubmitting}
            onFilesChange={setUploadedImageCount}
          />

          {promotionActionAvailable && promotionConfig ? (
            <VehiclePromotionSection
              config={promotionConfig}
              instagram={promoteInstagram}
              facebook={promoteFacebook}
              olx={promoteOlx}
              webmotors={promoteWebmotors}
              onInstagramChange={setPromoteInstagram}
              onFacebookChange={setPromoteFacebook}
              onOlxChange={setPromoteOlx}
              onWebmotorsChange={setPromoteWebmotors}
            />
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
          <Button
            type="submit"
            name="submit_intent"
            value="save"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Salvando…"
              : mode === "create"
                ? "Cadastrar veículo"
                : "Salvar veículo"}
          </Button>
          {promotionActionAvailable ? (
            <Button
              type="submit"
              name="submit_intent"
              value="save_and_promote"
              variant="secondary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando…" : "Salvar e divulgar"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/painel/estoque">Cancelar</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
