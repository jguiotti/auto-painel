"use client";

import {
  VEHICLE_BODY_STYLE_OPTIONS,
  VEHICLE_CONDITION_LABELS,
  VEHICLE_FEATURE_OPTIONS,
  VEHICLE_FUEL_TYPE_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  type VehicleCatalogDetailFields,
} from "@autopainel/shared/lib/vehicle/vehicle-catalog-options";
import { Input, Label } from "@autopainel/shared/ui";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface VehicleCatalogFieldsProps {
  defaults?: Partial<VehicleCatalogDetailFields>;
  disabled?: boolean;
}

export function VehicleCatalogFields({ defaults, disabled = false }: VehicleCatalogFieldsProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Ficha técnica e condições</p>
        <p className="text-xs text-muted-foreground">
          Informações exibidas na vitrine pública (inspiradas em marketplaces como WebMotors).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="version">Versão / acabamento</Label>
          <Input
            id="version"
            name="version"
            placeholder="Ex.: GT SELECTSHIFT"
            defaultValue={defaults?.version ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel_type">Combustível</Label>
          <select
            id="fuel_type"
            name="fuel_type"
            defaultValue={defaults?.fuel_type ?? ""}
            disabled={disabled}
            className={selectClassName}
          >
            <option value="">Selecionar</option>
            {VEHICLE_FUEL_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Câmbio</Label>
          <select
            id="transmission"
            name="transmission"
            defaultValue={defaults?.transmission ?? ""}
            disabled={disabled}
            className={selectClassName}
          >
            <option value="">Selecionar</option>
            {VEHICLE_TRANSMISSION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Input
            id="color"
            name="color"
            placeholder="Ex.: Preto"
            defaultValue={defaults?.color ?? ""}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body_style">Carroceria</Label>
          <select
            id="body_style"
            name="body_style"
            defaultValue={defaults?.body_style ?? ""}
            disabled={disabled}
            className={selectClassName}
          >
            <option value="">Selecionar</option>
            {VEHICLE_BODY_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Condições de venda</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {VEHICLE_CONDITION_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-md border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={key}
                value="true"
                defaultChecked={Boolean(defaults?.[key])}
                disabled={disabled}
                className="size-4 rounded border-input"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Itens do veículo</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {VEHICLE_FEATURE_OPTIONS.map((feature) => (
            <label
              key={feature}
              className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={`feature_${feature}`}
                value="true"
                defaultChecked={defaults?.features?.includes(feature) ?? false}
                disabled={disabled}
                className="size-4 rounded border-input"
              />
              {feature}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
