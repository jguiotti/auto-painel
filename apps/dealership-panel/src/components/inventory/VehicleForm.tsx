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

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const fileInputClassName =
  "flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90";

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
}

interface VehicleFormProps {
  mode: "create" | "edit";
  vehicleId?: string;
  defaultValues?: VehicleFormDefaultValues;
  units: { id: string; name: string }[];
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
}: VehicleFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          Dados e fotos ficam restritos à sua concessionária (RLS no Supabase). Imagens
          aceitas: JPEG, PNG, WebP ou GIF.
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={defaults?.status ?? "available"}
                disabled={isSubmitting}
                onChange={(event) => setStatusInput(event.target.value)}
                className={selectClassName}
              >
                <option value="available">Disponível</option>
                <option value="sold">Vendido</option>
              </select>
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

          <div className="space-y-3 rounded-lg border border-dashed border-input bg-muted/30 p-4">
            <div>
              <Label htmlFor={imageFieldName}>
                {mode === "create"
                  ? "Fotos do veículo"
                  : "Adicionar novas fotos (opcional)"}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Envie uma ou mais imagens. Elas serão armazenadas na sua pasta segura no
                Supabase Storage.
              </p>
            </div>
            <Input
              id={imageFieldName}
              name={imageFieldName}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className={fileInputClassName}
              disabled={isSubmitting}
              onChange={(event) =>
                setUploadedImageCount(event.currentTarget.files?.length ?? 0)
              }
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando…"
              : mode === "create"
                ? "Cadastrar veículo"
                : "Salvar alterações"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={isSubmitting}>
            <Link href="/painel/estoque">Cancelar</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
