"use client";

import {
  BODY_TRUCK_TYPE_OPTIONS,
  BRAKE_TYPE_OPTIONS,
  CAB_TYPE_OPTIONS,
  COOLING_TYPE_OPTIONS,
  FUEL_SYSTEM_OPTIONS,
  MOTORCYCLE_ENGINE_TYPE_OPTIONS,
  MOTORCYCLE_STYLE_OPTIONS,
  STARTER_TYPE_OPTIONS,
  TRACTION_OPTIONS,
  resolveVehicleTypeSpecCategory,
  type VehicleTypeSpecFields,
} from "@autopainel/shared/lib/vehicle/vehicle-type-spec-options";
import { Input, Label } from "@autopainel/shared/ui";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface VehicleTypeSpecFieldsProps {
  vehicleType: string;
  defaults?: Partial<VehicleTypeSpecFields>;
  disabled?: boolean;
}

function SelectField({
  id,
  name,
  label,
  options,
  defaultValue,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string | null;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className={selectClassName}
      >
        <option value="">Selecionar</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VehicleTypeSpecFields({
  vehicleType,
  defaults,
  disabled = false,
}: VehicleTypeSpecFieldsProps) {
  const category = resolveVehicleTypeSpecCategory(vehicleType);

  if (category === "light") {
    return null;
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Especificações por tipo</p>
        <p className="text-xs text-muted-foreground">
          Campos técnicos exibidos na vitrine conforme o tipo de veículo (motos, caminhões, vans,
          ônibus).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(category === "motorcycle" || category === "heavy" || category === "passenger_commercial") &&
        category !== "passenger_commercial" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="displacement_cc">Cilindrada (cc)</Label>
              <Input
                id="displacement_cc"
                name="displacement_cc"
                type="number"
                min={1}
                placeholder="Ex.: 250"
                defaultValue={defaults?.displacement_cc ?? ""}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gear_count">Marchas</Label>
              <Input
                id="gear_count"
                name="gear_count"
                type="number"
                min={1}
                max={18}
                placeholder="Ex.: 6"
                defaultValue={defaults?.gear_count ?? ""}
                disabled={disabled}
              />
            </div>
          </>
        ) : null}

        {category === "motorcycle" ? (
          <>
            <SelectField
              id="engine_type"
              name="engine_type"
              label="Tipo de motor"
              options={MOTORCYCLE_ENGINE_TYPE_OPTIONS}
              defaultValue={defaults?.engine_type}
              disabled={disabled}
            />
            <SelectField
              id="cooling_type"
              name="cooling_type"
              label="Refrigeração"
              options={COOLING_TYPE_OPTIONS}
              defaultValue={defaults?.cooling_type}
              disabled={disabled}
            />
            <SelectField
              id="motorcycle_style"
              name="motorcycle_style"
              label="Estilo"
              options={MOTORCYCLE_STYLE_OPTIONS}
              defaultValue={defaults?.motorcycle_style}
              disabled={disabled}
            />
            <SelectField
              id="starter_type"
              name="starter_type"
              label="Partida"
              options={STARTER_TYPE_OPTIONS}
              defaultValue={defaults?.starter_type}
              disabled={disabled}
            />
            <SelectField
              id="brake_front"
              name="brake_front"
              label="Freio dianteiro"
              options={BRAKE_TYPE_OPTIONS}
              defaultValue={defaults?.brake_front}
              disabled={disabled}
            />
            <SelectField
              id="brake_rear"
              name="brake_rear"
              label="Freio traseiro"
              options={BRAKE_TYPE_OPTIONS}
              defaultValue={defaults?.brake_rear}
              disabled={disabled}
            />
            <SelectField
              id="fuel_system"
              name="fuel_system"
              label="Alimentação"
              options={FUEL_SYSTEM_OPTIONS}
              defaultValue={defaults?.fuel_system}
              disabled={disabled}
            />
          </>
        ) : null}

        {category === "heavy" ? (
          <>
            <SelectField
              id="traction"
              name="traction"
              label="Tração"
              options={TRACTION_OPTIONS}
              defaultValue={defaults?.traction}
              disabled={disabled}
            />
            <div className="space-y-2">
              <Label htmlFor="axle_count">Quantidade de eixos</Label>
              <Input
                id="axle_count"
                name="axle_count"
                type="number"
                min={2}
                max={10}
                placeholder="Ex.: 3"
                defaultValue={defaults?.axle_count ?? ""}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gross_weight_kg">Peso bruto (kg)</Label>
              <Input
                id="gross_weight_kg"
                name="gross_weight_kg"
                type="number"
                min={1}
                placeholder="Ex.: 23000"
                defaultValue={defaults?.gross_weight_kg ?? ""}
                disabled={disabled}
              />
            </div>
            <SelectField
              id="cab_type"
              name="cab_type"
              label="Cabine"
              options={CAB_TYPE_OPTIONS}
              defaultValue={defaults?.cab_type}
              disabled={disabled}
            />
            <SelectField
              id="body_truck_type"
              name="body_truck_type"
              label="Tipo de carroceria"
              options={BODY_TRUCK_TYPE_OPTIONS}
              defaultValue={defaults?.body_truck_type}
              disabled={disabled}
            />
          </>
        ) : null}

        {category === "passenger_commercial" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="passenger_capacity">Lugares</Label>
              <Input
                id="passenger_capacity"
                name="passenger_capacity"
                type="number"
                min={1}
                placeholder="Ex.: 16"
                defaultValue={defaults?.passenger_capacity ?? ""}
                disabled={disabled}
              />
            </div>
            {vehicleType === "onibus" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displacement_cc_onibus">Cilindrada (cc)</Label>
                  <Input
                    id="displacement_cc_onibus"
                    name="displacement_cc"
                    type="number"
                    min={1}
                    placeholder="Ex.: 8900"
                    defaultValue={defaults?.displacement_cc ?? ""}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gear_count_onibus">Marchas</Label>
                  <Input
                    id="gear_count_onibus"
                    name="gear_count"
                    type="number"
                    min={1}
                    max={18}
                    placeholder="Ex.: 6"
                    defaultValue={defaults?.gear_count ?? ""}
                    disabled={disabled}
                  />
                </div>
              </>
            ) : null}
            <SelectField
              id="traction_pc"
              name="traction"
              label="Tração"
              options={TRACTION_OPTIONS}
              defaultValue={defaults?.traction}
              disabled={disabled}
            />
            {vehicleType === "van" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displacement_cc_van">Cilindrada (cc)</Label>
                  <Input
                    id="displacement_cc_van"
                    name="displacement_cc"
                    type="number"
                    min={1}
                    placeholder="Ex.: 2000"
                    defaultValue={defaults?.displacement_cc ?? ""}
                    disabled={disabled}
                  />
                </div>
                <SelectField
                  id="fuel_system_van"
                  name="fuel_system"
                  label="Alimentação"
                  options={FUEL_SYSTEM_OPTIONS}
                  defaultValue={defaults?.fuel_system}
                  disabled={disabled}
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
