"use client";

import {
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
import { useState } from "react";

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
  public_slug: string;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  price: number;
  description: string;
  status: "available" | "sold";
  images: string[];
  dealership_unit_id?: string;
}

interface VehicleFormProps {
  mode: "create" | "edit";
  vehicleId?: string;
  defaultValues?: VehicleFormDefaultValues;
  units: { id: string; name: string }[];
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

  const defaults = defaultValues;

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
    <Card className="mx-auto max-w-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Novo veículo" : "Editar veículo"}</CardTitle>
        <CardDescription>
          Dados e fotos ficam restritos à sua concessionária (RLS no Supabase). Imagens
          aceitas: JPEG, PNG, WebP ou GIF.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
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
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                inputMode="decimal"
                required
                defaultValue={defaults?.price}
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
                className={selectClassName}
              >
                <option value="available">Disponível</option>
                <option value="sold">Vendido</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={defaults?.description}
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
