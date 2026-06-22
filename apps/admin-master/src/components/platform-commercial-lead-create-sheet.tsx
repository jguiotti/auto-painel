"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
  toast,
} from "@autopainel/shared/ui";

import { createPlatformCommercialLeadAction } from "@/actions/platform-commercial-leads";
import {
  PLATFORM_LEAD_MANUAL_CHANNELS,
  PLATFORM_LEAD_PIPELINE_LABELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
} from "@/lib/data/platform-commercial-leads-shared";

interface PlatformCommercialLeadCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatformCommercialLeadCreateSheet({
  open,
  onOpenChange,
}: PlatformCommercialLeadCreateSheetProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPlatformCommercialLeadAction(formData);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Lead cadastrado com sucesso.");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Novo lead comercial</SheetTitle>
          <SheetDescription>
            Cadastre prospect de prospecção ativa, indicação ou outro canal. O lead entra no mesmo
            pipeline e pode ser vinculado a contratos e novas lojas.
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="lead_full_name">Nome do contato</Label>
            <Input id="lead_full_name" name="full_name" required autoComplete="name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_email">E-mail</Label>
            <Input
              id="lead_email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead_phone">Telefone / WhatsApp</Label>
              <Input id="lead_phone" name="phone" autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_cnpj">CNPJ (opcional)</Label>
              <Input id="lead_cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_company_name">Nome da concessionária</Label>
            <Input id="lead_company_name" name="company_name" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead_channel">Canal</Label>
              <select
                id="lead_channel"
                name="lead_channel"
                defaultValue="outbound"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORM_LEAD_MANUAL_CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_pipeline_status">Estágio inicial</Label>
              <select
                id="lead_pipeline_status"
                name="pipeline_status"
                defaultValue="new"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORM_LEAD_PIPELINE_STATUSES.filter((status) => status !== "lost").map(
                  (status) => (
                    <option key={status} value={status}>
                      {PLATFORM_LEAD_PIPELINE_LABELS[status]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_message">Observações</Label>
            <Textarea
              id="lead_message"
              name="message"
              rows={4}
              placeholder="Contexto da prospecção, próximo passo, plano de interesse…"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Cadastrar lead"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
