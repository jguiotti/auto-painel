"use client";

import type { BrazilianAddressFields } from "@autopainel/shared/types";
import { lookupBrazilAddressByPostalCode } from "@autopainel/shared/lib/viacep";
import { Button, Input, Label } from "@autopainel/shared/ui";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { digitsOnly, formatCepMasked } from "@/lib/br-format";
import type { DealershipUnitAdminRow } from "@/lib/data/dealership-units";

interface UnitDraft {
  clientKey: string;
  id?: string;
  name: string;
  address: BrazilianAddressFields;
}

/** Stable key for the default row — never use crypto.randomUUID() for SSR initial state (hydration mismatch). */
const DEFAULT_UNIT_CLIENT_KEY = "draft-unit-default";

function addressFromRecord(raw: Record<string, unknown>): BrazilianAddressFields {
  const read = (key: string): string =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  return {
    postal_code: read("postal_code"),
    state: read("state"),
    city: read("city"),
    district: read("district"),
    street: read("street"),
    number: read("number"),
    complement: read("complement"),
  };
}

function draftFromRows(rows: DealershipUnitAdminRow[]): UnitDraft[] {
  if (rows.length === 0) {
    return [
      {
        clientKey: DEFAULT_UNIT_CLIENT_KEY,
        name: "Matriz",
        address: {},
      },
    ];
  }
  return rows.map((row) => ({
    clientKey: row.id,
    id: row.id,
    name: row.name,
    address: addressFromRecord(row.address ?? {}),
  }));
}

export function DealershipUnitsEditor({
  initialRows,
  disabled,
}: {
  initialRows: DealershipUnitAdminRow[];
  disabled?: boolean;
}) {
  const [units, setUnits] = useState<UnitDraft[]>(() => draftFromRows(initialRows));

  const payloadJson = useMemo(() => {
    const serialized = units.map((unit) => ({
      id: unit.id,
      name: unit.name.trim(),
      address: {
        postal_code: digitsOnly(unit.address.postal_code ?? "").slice(0, 8),
        state: (unit.address.state ?? "").trim().toUpperCase().slice(0, 2),
        city: (unit.address.city ?? "").trim(),
        district: (unit.address.district ?? "").trim(),
        street: (unit.address.street ?? "").trim(),
        number: (unit.address.number ?? "").trim(),
        complement: (unit.address.complement ?? "").trim(),
      },
    }));
    return JSON.stringify(serialized);
  }, [units]);

  function updateUnit(clientKey: string, patch: Partial<UnitDraft>) {
    setUnits((prev) =>
      prev.map((u) => (u.clientKey === clientKey ? { ...u, ...patch } : u)),
    );
  }

  function updateUnitAddress(clientKey: string, patch: Partial<BrazilianAddressFields>) {
    setUnits((prev) =>
      prev.map((u) =>
        u.clientKey === clientKey
          ? { ...u, address: { ...u.address, ...patch } }
          : u,
      ),
    );
  }

  async function lookupCep(clientKey: string, cepRaw: string) {
    const result = await lookupBrazilAddressByPostalCode(cepRaw);
    if (!result.ok) {
      return;
    }
    updateUnitAddress(clientKey, {
      postal_code: formatCepMasked(result.data.postal_code),
      state: result.data.state,
      city: result.data.city,
      district: result.data.district,
      street: result.data.street,
      complement: result.data.complement_hint,
    });
  }

  function addUnit() {
    setUnits((prev) => [
      ...prev,
      {
        clientKey: crypto.randomUUID(),
        name: "",
        address: {},
      },
    ]);
  }

  function removeUnit(clientKey: string) {
    setUnits((prev) =>
      prev.length <= 1 ? prev : prev.filter((u) => u.clientKey !== clientKey),
    );
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="units_payload" value={payloadJson} readOnly />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Cada unidade tem estoque próprio no painel da loja; cores e templates continuam iguais para todo o tenant.
        </p>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={addUnit}>
          <Plus className="mr-1 size-4" aria-hidden />
          Adicionar unidade
        </Button>
      </div>

      <ul className="space-y-6">
        {units.map((unit, index) => (
          <li
            key={unit.clientKey}
            className="rounded-lg border border-border bg-muted/15 p-4"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Label htmlFor={`unit-name-${unit.clientKey}`}>
                  Nome da unidade {index + 1}
                </Label>
                <Input
                  id={`unit-name-${unit.clientKey}`}
                  placeholder="Ex.: Matriz · Filial Centro"
                  value={unit.name}
                  disabled={disabled}
                  className="max-w-md"
                  onChange={(event) =>
                    updateUnit(unit.clientKey, { name: event.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || units.length <= 1}
                className="text-destructive hover:text-destructive"
                title="Remover unidade"
                onClick={() => removeUnit(unit.clientKey)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-12">
              <div className="space-y-2 sm:col-span-4">
                <Label>CEP</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={formatCepMasked(unit.address.postal_code ?? "")}
                    disabled={disabled}
                    className="min-w-[140px] flex-1"
                    onChange={(event) =>
                      updateUnitAddress(unit.clientKey, {
                        postal_code: formatCepMasked(event.target.value),
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      void lookupCep(unit.clientKey, unit.address.postal_code ?? "")
                    }
                  >
                    Buscar CEP
                  </Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>UF</Label>
                <Input
                  maxLength={2}
                  className="uppercase"
                  value={unit.address.state ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, {
                      state: event.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-6">
                <Label>Cidade</Label>
                <Input
                  value={unit.address.city ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, { city: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-12">
                <Label>Bairro</Label>
                <Input
                  value={unit.address.district ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, {
                      district: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-8">
                <Label>Logradouro</Label>
                <Input
                  value={unit.address.street ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, { street: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label>Número</Label>
                <Input
                  value={unit.address.number ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, { number: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-12">
                <Label>Complemento</Label>
                <Input
                  value={unit.address.complement ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateUnitAddress(unit.clientKey, {
                      complement: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
