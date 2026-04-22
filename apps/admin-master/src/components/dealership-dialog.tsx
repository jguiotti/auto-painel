"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@autopainel/shared/ui";

import {
  createDealershipAction,
  updateDealershipAction,
} from "@/actions/dealerships";
import type { DealershipAdminRow } from "@/types/dealership-admin";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function colorsFromTheme(theme: Record<string, unknown>) {
  const p = theme.primary;
  const pf = theme.primaryForeground;
  return {
    primary: typeof p === "string" && HEX_RE.test(p) ? p : "#0f172a",
    primaryForeground:
      typeof pf === "string" && HEX_RE.test(pf) ? pf : "#f8fafc",
  };
}

type FormDefaults = {
  name: string;
  slug: string;
  custom_domain: string;
  contact_email: string;
  whatsapp_number: string;
  primary: string;
  primaryForeground: string;
  status: string;
};

function getDefaults(
  mode: "create" | "edit",
  dealership: DealershipAdminRow | null,
): FormDefaults {
  if (mode === "edit" && dealership) {
    const c = colorsFromTheme(dealership.theme_settings);
    return {
      name: dealership.name,
      slug: dealership.slug,
      custom_domain: dealership.custom_domain ?? "",
      contact_email: dealership.contact_email ?? "",
      whatsapp_number: dealership.whatsapp_number ?? "",
      primary: c.primary,
      primaryForeground: c.primaryForeground,
      status: dealership.status,
    };
  }
  return {
    name: "",
    slug: "",
    custom_domain: "",
    contact_email: "",
    whatsapp_number: "",
    primary: "#0f172a",
    primaryForeground: "#f8fafc",
    status: "pending_setup",
  };
}

export function DealershipDialog({
  open,
  onOpenChange,
  mode,
  dealership,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  dealership: DealershipAdminRow | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaults = getDefaults(mode, dealership);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result =
        mode === "edit" && dealership
          ? await updateDealershipAction(dealership.id, fd)
          : await createDealershipAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova concessionária" : "Editar concessionária"}
          </DialogTitle>
          <DialogDescription>
            O subdomínio define o endereço{" "}
            <span className="font-medium">slug.seudominio.com</span> na plataforma.
            As cores alimentam o tema da vitrine e do painel do cliente.
          </DialogDescription>
        </DialogHeader>
        <form
          key={`${mode}-${dealership?.id ?? "new"}`}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          {error ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="d-name">Nome da concessionária</Label>
            <Input
              id="d-name"
              name="name"
              required
              minLength={2}
              defaultValue={defaults.name}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-slug">Subdomínio (slug)</Label>
            <Input
              id="d-slug"
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="minha-loja"
              defaultValue={defaults.slug}
              readOnly={mode === "edit"}
              disabled={pending}
              title="Letras minúsculas, números e hífens"
            />
            {mode === "edit" ? (
              <p className="text-xs text-muted-foreground">
                O subdomínio não pode ser alterado após a criação.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-domain">Domínio personalizado (opcional)</Label>
            <Input
              id="d-domain"
              name="custom_domain"
              placeholder="www.minhaloja.com.br"
              defaultValue={defaults.custom_domain}
              disabled={pending}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="d-email">E-mail de contato</Label>
              <Input
                id="d-email"
                name="contact_email"
                type="email"
                defaultValue={defaults.contact_email}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-wa">WhatsApp</Label>
              <Input
                id="d-wa"
                name="whatsapp_number"
                defaultValue={defaults.whatsapp_number}
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="d-c1">Cor primária</Label>
              <Input
                id="d-c1"
                name="primary_color"
                type="color"
                defaultValue={defaults.primary}
                disabled={pending}
                className="h-10 w-full cursor-pointer py-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-c2">Texto sobre a primária</Label>
              <Input
                id="d-c2"
                name="primary_foreground"
                type="color"
                defaultValue={defaults.primaryForeground}
                disabled={pending}
                className="h-10 w-full cursor-pointer py-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-status">Status da conta</Label>
            <select
              id="d-status"
              name="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.status}
              disabled={pending}
            >
              <option value="pending_setup">Configuração pendente</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
              <option value="churned">Encerrada</option>
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
