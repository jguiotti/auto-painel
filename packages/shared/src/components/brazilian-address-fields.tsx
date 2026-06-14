"use client";

import { useState } from "react";

import {
  digitsOnly,
  formatBrazilMobileMasked,
  formatCepMasked,
} from "@autopainel/shared/lib/br/format-input-masks";
import { lookupBrazilAddressByPostalCode } from "@autopainel/shared/lib/viacep";
import type { BrazilianAddressFields as BrazilianAddressShape } from "@autopainel/shared/types";
import { Button, Input, Label } from "@autopainel/shared/ui";

function readInitial(addr: BrazilianAddressShape | undefined): BrazilianAddressShape {
  return {
    postal_code: addr?.postal_code ?? "",
    state: addr?.state ?? "",
    city: addr?.city ?? "",
    district: addr?.district ?? "",
    street: addr?.street ?? "",
    number: addr?.number ?? "",
    complement: addr?.complement ?? "",
  };
}

interface BrazilianAddressFieldsProps {
  prefix: string;
  initialAddress?: BrazilianAddressShape;
  disabled?: boolean;
  legend?: string;
}

export function BrazilianAddressFields({
  prefix,
  initialAddress,
  disabled,
  legend,
}: BrazilianAddressFieldsProps) {
  const [address, setAddress] = useState(() => readInitial(initialAddress));
  const [cepLookupMessage, setCepLookupMessage] = useState<string | null>(null);
  const [cepPending, setCepPending] = useState(false);

  async function onLookupCep() {
    setCepLookupMessage(null);
    setCepPending(true);
    try {
      const result = await lookupBrazilAddressByPostalCode(address.postal_code ?? "");
      if (!result.ok) {
        setCepLookupMessage(result.message);
        return;
      }
      setAddress((prev) => ({
        ...prev,
        postal_code: formatCepMasked(result.data.postal_code),
        state: result.data.state,
        city: result.data.city,
        district: result.data.district,
        street: result.data.street || prev.street,
        complement:
          result.data.complement_hint && !prev.complement
            ? result.data.complement_hint
            : prev.complement,
      }));
    } finally {
      setCepPending(false);
    }
  }

  function hiddenName<K extends keyof BrazilianAddressShape>(key: K): string {
    return `${prefix}_${key}`;
  }

  return (
    <fieldset className="space-y-3">
      {legend ? (
        <legend className="text-sm font-medium text-foreground">{legend}</legend>
      ) : null}
      <input
        type="hidden"
        name={hiddenName("postal_code")}
        value={digitsOnly(address.postal_code ?? "").slice(0, 8)}
        readOnly
      />
      <input type="hidden" name={hiddenName("state")} value={address.state ?? ""} readOnly />
      <input type="hidden" name={hiddenName("city")} value={address.city ?? ""} readOnly />
      <input type="hidden" name={hiddenName("district")} value={address.district ?? ""} readOnly />
      <input type="hidden" name={hiddenName("street")} value={address.street ?? ""} readOnly />
      <input type="hidden" name={hiddenName("number")} value={address.number ?? ""} readOnly />
      <input type="hidden" name={hiddenName("complement")} value={address.complement ?? ""} readOnly />

      <div className="grid gap-4 sm:grid-cols-12">
        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor={`${prefix}-postal_code`}>CEP</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={`${prefix}-postal_code`}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={formatCepMasked(address.postal_code ?? "")}
              disabled={disabled}
              className="min-w-[140px] flex-1"
              onChange={(event) =>
                setAddress((prev) => ({
                  ...prev,
                  postal_code: formatCepMasked(event.target.value),
                }))
              }
            />
            <Button
              type="button"
              variant="secondary"
              disabled={disabled || cepPending}
              onClick={() => void onLookupCep()}
            >
              {cepPending ? "Buscando…" : "Buscar CEP"}
            </Button>
          </div>
          {cepLookupMessage ? (
            <p className="text-xs text-destructive">{cepLookupMessage}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Consulta via ViaCEP (base oficial dos Correios).
            </p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${prefix}-state`}>Estado (UF)</Label>
          <Input
            id={`${prefix}-state`}
            maxLength={2}
            placeholder="SP"
            value={address.state ?? ""}
            disabled={disabled}
            className="uppercase"
            onChange={(event) =>
              setAddress((prev) => ({
                ...prev,
                state: event.target.value.toUpperCase().slice(0, 2),
              }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-6">
          <Label htmlFor={`${prefix}-city`}>Cidade</Label>
          <Input
            id={`${prefix}-city`}
            autoComplete="address-level2"
            value={address.city ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setAddress((prev) => ({ ...prev, city: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-12">
          <Label htmlFor={`${prefix}-district`}>Bairro</Label>
          <Input
            id={`${prefix}-district`}
            autoComplete="address-level3"
            value={address.district ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setAddress((prev) => ({ ...prev, district: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-8">
          <Label htmlFor={`${prefix}-street`}>Logradouro</Label>
          <Input
            id={`${prefix}-street`}
            autoComplete="street-address"
            value={address.street ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setAddress((prev) => ({ ...prev, street: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor={`${prefix}-number`}>Número</Label>
          <Input
            id={`${prefix}-number`}
            autoComplete="address-line2"
            value={address.number ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setAddress((prev) => ({ ...prev, number: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-12">
          <Label htmlFor={`${prefix}-complement`}>Complemento</Label>
          <Input
            id={`${prefix}-complement`}
            value={address.complement ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setAddress((prev) => ({
                ...prev,
                complement: event.target.value,
              }))
            }
          />
        </div>
      </div>
    </fieldset>
  );
}
