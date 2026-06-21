"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import { billingAddressForStorage, billingAddressFromRecord, billingAddressToBrazilianFields } from "@autopainel/shared/lib/customer/format-billing-address";
import { parseHqAddressFromForm } from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";
import type { InventoryVehicleOption } from "@autopainel/shared/types/lead-crm";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";

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
  const [interestVehicleId, setInterestVehicleId] = useState(
    lead.vehicle_id ?? "__none__",
  );

  const initialAddress = useMemo(
    () => billingAddressToBrazilianFields(billingAddressFromRecord(lead.customer?.billing_address)),
    [lead.customer?.billing_address],
  );

  useEffect(() => {
    setClientName(lead.client_name);
    setPhone(lead.phone);
    setClientEmail(lead.client_email ?? "");
    setDocumentValue(formatDocumentValue(lead));
    setInterestVehicleId(lead.vehicle_id ?? "__none__");
    setError(null);
    setSaved(false);
  }, [lead.id, lead.client_name, lead.phone, lead.client_email, lead.customer, lead.vehicle_id]);

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
        interestVehicleId:
          interestVehicleId === "__none__" ? null : interestVehicleId,
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
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
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

      <div className="space-y-2">
        <Label htmlFor={`lead-interest-vehicle-${lead.id}`}>Veículo de interesse (estoque)</Label>
        <Select
          value={interestVehicleId}
          onValueChange={setInterestVehicleId}
          disabled={disabled || pending}
        >
          <SelectTrigger id={`lead-interest-vehicle-${lead.id}`}>
            <SelectValue placeholder="Selecione um veículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Nenhum —</SelectItem>
            {inventoryVehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model}
                {vehicle.model_year ? ` (${vehicle.model_year})` : ""}
                {vehicle.status === "sold" ? " · vendido" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Vincule o contato a um veículo do estoque. Ao marcar a venda, use «Venda concretizada»
          abaixo para gerar o recibo com estes dados.
        </p>
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
