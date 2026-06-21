"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import {
  billingAddressForStorage,
  billingAddressFromRecord,
  billingAddressToBrazilianFields,
} from "@autopainel/shared/lib/customer/format-billing-address";
import { parseHqAddressFromForm } from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";
import type { InventoryVehicleOption } from "@autopainel/shared/types/lead-crm";
import { Button, Input, Label } from "@autopainel/shared/ui";

import { updateLeadProfileAction } from "@/app/painel/contatos/actions";

import type { LeadListItem } from "@/components/leads/LeadList";

interface LeadProfileSectionProps {
  lead: LeadListItem;
  inventoryVehicles: InventoryVehicleOption[];
  disabled?: boolean;
}

function formatDocumentValue(lead: LeadListItem): string {
  return lead.customer?.document_cnpj ?? lead.customer?.document_cpf ?? "";
}

function resolveInitialInterestIds(lead: LeadListItem): string[] {
  if (lead.interest_vehicles && lead.interest_vehicles.length > 0) {
    return lead.interest_vehicles.map((vehicle) => vehicle.id);
  }
  if (lead.vehicle_id) {
    return [lead.vehicle_id];
  }
  return [];
}

export function LeadProfileSection({
  lead,
  inventoryVehicles,
  disabled,
}: LeadProfileSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [clientName, setClientName] = useState(lead.client_name);
  const [phone, setPhone] = useState(lead.phone);
  const [clientEmail, setClientEmail] = useState(lead.client_email ?? "");
  const [documentValue, setDocumentValue] = useState(() => formatDocumentValue(lead));
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(() =>
    resolveInitialInterestIds(lead),
  );

  const initialAddress = useMemo(
    () =>
      billingAddressToBrazilianFields(
        billingAddressFromRecord(lead.customer?.billing_address),
      ),
    [lead.customer?.billing_address],
  );

  const purchasedVehicle = useMemo(() => {
    if (!lead.converted_vehicle_id) {
      return null;
    }
    return inventoryVehicles.find((vehicle) => vehicle.id === lead.converted_vehicle_id);
  }, [inventoryVehicles, lead.converted_vehicle_id]);

  useEffect(() => {
    setClientName(lead.client_name);
    setPhone(lead.phone);
    setClientEmail(lead.client_email ?? "");
    setDocumentValue(formatDocumentValue(lead));
    setSelectedVehicleIds(resolveInitialInterestIds(lead));
    setError(null);
    setSaved(false);
  }, [
    lead.id,
    lead.client_name,
    lead.phone,
    lead.client_email,
    lead.customer,
    lead.vehicle_id,
    lead.interest_vehicles,
  ]);

  function toggleVehicle(vehicleId: string, checked: boolean) {
    setSelectedVehicleIds((current) => {
      if (checked) {
        if (current.includes(vehicleId)) {
          return current;
        }
        return [...current, vehicleId];
      }
      return current.filter((id) => id !== vehicleId);
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const formData = new FormData(event.currentTarget);
    const billingAddress = billingAddressForStorage(
      parseHqAddressFromForm(formData, "billing"),
    );

    startTransition(async () => {
      const res = await updateLeadProfileAction({
        leadId: lead.id,
        clientName,
        phone,
        clientEmail: clientEmail || undefined,
        document: documentValue || undefined,
        billingAddress,
        interestVehicleIds: selectedVehicleIds,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">Dados do cliente</p>
        <p className="text-xs text-muted-foreground">
          Enriqueça o cadastro para agilizar a venda e o recibo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`lead-profile-name-${lead.id}`}>Nome completo</Label>
          <Input
            id={`lead-profile-name-${lead.id}`}
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            required
            disabled={disabled || pending}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lead-profile-phone-${lead.id}`}>Telefone / WhatsApp</Label>
          <Input
            id={`lead-profile-phone-${lead.id}`}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            disabled={disabled || pending}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`lead-profile-email-${lead.id}`}>E-mail</Label>
          <Input
            id={`lead-profile-email-${lead.id}`}
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            disabled={disabled || pending}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`lead-profile-document-${lead.id}`}>CPF ou CNPJ</Label>
          <Input
            id={`lead-profile-document-${lead.id}`}
            value={documentValue}
            onChange={(event) => setDocumentValue(event.target.value)}
            disabled={disabled || pending}
            inputMode="numeric"
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <BrazilianAddressFields
        prefix="billing"
        legend="Endereço"
        initialAddress={initialAddress}
        disabled={disabled || pending}
      />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Veículos de interesse (estoque disponível)
          </p>
          <p className="text-xs text-muted-foreground">
            Selecione um ou mais veículos. Após a venda, o veículo sai desta lista e fica
            vinculado em «Venda concretizada».
          </p>
        </div>

        {inventoryVehicles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum veículo disponível no estoque para vincular.
          </p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border bg-card p-3">
            {inventoryVehicles.map((vehicle) => {
              const inputId = `lead-interest-${lead.id}-${vehicle.id}`;
              const checked = selectedVehicleIds.includes(vehicle.id);
              return (
                <li key={vehicle.id} className="flex items-start gap-2">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || pending}
                    onChange={(event) =>
                      toggleVehicle(vehicle.id, event.target.checked)
                    }
                    className="mt-1 size-4 rounded border border-input accent-primary"
                  />
                  <Label htmlFor={inputId} className="cursor-pointer font-normal leading-snug">
                    {vehicle.brand} {vehicle.model}
                    {vehicle.model_year ? ` (${vehicle.model_year})` : ""}
                  </Label>
                </li>
              );
            })}
          </ul>
        )}

        {(lead.interest_vehicles ?? []).length > 0 ? (
          <ul className="space-y-1 text-sm">
            {(lead.interest_vehicles ?? []).map((vehicle) => (
              <li key={vehicle.id}>
                <Link
                  href={`/painel/estoque/${vehicle.id}`}
                  className="text-primary underline"
                >
                  {vehicle.brand} {vehicle.model}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {lead.converted_vehicle_id ? (
          <p className="text-sm text-muted-foreground">
            Venda concretizada:{" "}
            <Link
              href={`/painel/estoque/${lead.converted_vehicle_id}/recibo`}
              className="font-medium text-primary underline"
            >
              abrir recibo
            </Link>
            {purchasedVehicle
              ? ` (${purchasedVehicle.brand} ${purchasedVehicle.model})`
              : ""}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved ? (
        <p className="text-sm text-emerald-700" role="status">
          Dados salvos.
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={disabled || pending}>
        {pending ? "Salvando…" : "Salvar dados do cliente"}
      </Button>
    </form>
  );
}
