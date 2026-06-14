"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import {
  digitsOnly,
  formatBrazilMobileMasked,
} from "@autopainel/shared/lib/br/format-input-masks";
import type { BrazilianAddressFields as BrazilianAddressShape } from "@autopainel/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@autopainel/shared/ui";

import { updateDealershipStoreSettingsAction } from "@/app/painel/loja/actions";

export interface DealershipStoreSettingsDefaults {
  contactEmail: string;
  whatsappNumber: string;
  hqAddress: BrazilianAddressShape;
}

interface DealershipStoreSettingsFormProps {
  defaults: DealershipStoreSettingsDefaults;
}

export function DealershipStoreSettingsForm({
  defaults,
}: DealershipStoreSettingsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [whatsapp, setWhatsapp] = useState(() =>
    formatBrazilMobileMasked(defaults.whatsappNumber),
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    formData.set("whatsapp_number", digitsOnly(whatsapp));

    startTransition(async () => {
      const result = await updateDealershipStoreSettingsAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contato na vitrine</CardTitle>
          <CardDescription>
            E-mail e WhatsApp exibidos na página de contato e usados pelos leads da
            vitrine.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contact_email">E-mail de contato</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              autoComplete="email"
              defaultValue={defaults.contactEmail}
              placeholder="contato@sualoja.com.br"
              disabled={pending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="whatsapp_number">WhatsApp da loja</Label>
            <Input
              id="whatsapp_number"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              placeholder="(11) 99999-9999"
              disabled={pending}
              onChange={(event) =>
                setWhatsapp(formatBrazilMobileMasked(event.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Apenas números com DDD. Usado no botão flutuante e na página de contato.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço da sede</CardTitle>
          <CardDescription>
            Aparece na vitrine em /contato e no mapa. Unidades adicionais continuam
            sendo cadastradas pela equipe AutoPainel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrazilianAddressFields
            prefix="hq"
            initialAddress={defaults.hqAddress}
            disabled={pending}
            legend="Endereço principal"
          />
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Dados salvos. As alterações já podem aparecer na vitrine.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar dados da loja"}
      </Button>
    </form>
  );
}
