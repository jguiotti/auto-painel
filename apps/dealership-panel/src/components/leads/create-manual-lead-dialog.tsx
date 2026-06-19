"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import { parseHqAddressFromForm } from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
} from "@autopainel/shared/ui";

import { createManualLeadAction } from "@/app/painel/contatos/actions";

interface CreateManualLeadDialogProps {
  canCreate: boolean;
}

export function CreateManualLeadDialog({ canCreate }: CreateManualLeadDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [documentValue, setDocumentValue] = useState("");
  const [message, setMessage] = useState("");

  if (!canCreate) {
    return null;
  }

  function resetForm() {
    setClientName("");
    setPhone("");
    setClientEmail("");
    setDocumentValue("");
    setMessage("");
    setError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const billingAddress = parseHqAddressFromForm(formData, "billing");

    startTransition(async () => {
      const res = await createManualLeadAction({
        clientName,
        phone,
        clientEmail: clientEmail || undefined,
        message: message || undefined,
        document: documentValue || undefined,
        billingAddress,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus className="mr-2 size-4" aria-hidden />
          Novo contato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Cadastrar contato</DialogTitle>
            <DialogDescription>
              Registre um interessado que entrou por telefone, balcão ou indicação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[min(70vh,32rem)] gap-4 overflow-y-auto py-4 pr-1">
            <div className="space-y-2">
              <Label htmlFor="manual-lead-name">Nome</Label>
              <Input
                id="manual-lead-name"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-lead-phone">Telefone / WhatsApp</Label>
              <Input
                id="manual-lead-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-lead-email">E-mail (opcional)</Label>
              <Input
                id="manual-lead-email"
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-lead-document">CPF ou CNPJ (opcional)</Label>
              <Input
                id="manual-lead-document"
                value={documentValue}
                onChange={(event) => setDocumentValue(event.target.value)}
                autoComplete="off"
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
            </div>
            <BrazilianAddressFields prefix="billing" legend="Endereço (opcional)" />
            <div className="space-y-2">
              <Label htmlFor="manual-lead-message">Observação (opcional)</Label>
              <Textarea
                id="manual-lead-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar contato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
