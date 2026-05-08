"use client";

import { DEALERSHIP_OPTIONAL_FEATURES } from "@autopainel/shared/lib/dealership-features";
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
  Textarea,
} from "@autopainel/shared/ui";

import {
  createDealershipAction,
  updateDealershipAction,
} from "@/actions/dealerships";
import type { DealershipAdminRow } from "@/types/dealership-admin";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function readStr(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

function readSocial(
  content: Record<string, unknown>,
  network: string,
): string {
  const links = content.social_links;
  if (links && typeof links === "object" && !Array.isArray(links)) {
    const v = (links as Record<string, unknown>)[network];
    return typeof v === "string" ? v : "";
  }
  return "";
}

function colorsFromTheme(theme: Record<string, unknown>) {
  const p = theme.primary;
  const pf = theme.primaryForeground;
  return {
    primary: typeof p === "string" && HEX_RE.test(p) ? p : "#0f172a",
    primaryForeground:
      typeof pf === "string" && HEX_RE.test(pf) ? pf : "#f8fafc",
  };
}

function secondaryFromDealership(dealership: DealershipAdminRow): string {
  const sec = readStr(dealership.theme_config, "secondary_color");
  if (HEX_RE.test(sec)) {
    return sec;
  }
  const accent = dealership.theme_settings.accent;
  if (typeof accent === "string" && HEX_RE.test(accent)) {
    return accent;
  }
  return "#64748b";
}

function headerLogoUrlFromDealership(dealership: DealershipAdminRow): string {
  const tc = dealership.theme_config as Record<string, unknown>;
  const fromHeader = readStr(tc, "header_logo_url");
  if (fromHeader.length > 0) {
    return fromHeader;
  }
  const legacy = readStr(tc, "logo_url");
  if (legacy.length > 0) {
    return legacy;
  }
  return dealership.logo_url ?? "";
}

function faviconUrlFromDealership(dealership: DealershipAdminRow): string {
  return readStr(dealership.theme_config, "favicon_url");
}

function isOptionalFeatureChecked(
  dealership: DealershipAdminRow | null,
  key: string,
): boolean {
  if (!dealership) {
    return true;
  }
  const ef = dealership.enabled_features;
  if (!ef || ef.length === 0) {
    return true;
  }
  return ef.includes(key);
}

type FormDefaults = {
  name: string;
  slug: string;
  cnpj: string;
  custom_domain: string;
  contact_email: string;
  whatsapp_number: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  header_logo_url: string;
  favicon_url: string;
  about_text: string;
  address: string;
  social_instagram: string;
  social_facebook: string;
  social_website: string;
  status: string;
};

function getDefaults(
  mode: "create" | "edit",
  dealership: DealershipAdminRow | null,
): FormDefaults {
  if (mode === "edit" && dealership) {
    const c = colorsFromTheme(dealership.theme_settings);
    const cc = dealership.content_config;
    return {
      name: dealership.name,
      slug: dealership.slug,
      cnpj: dealership.cnpj ?? "",
      custom_domain: dealership.custom_domain ?? "",
      contact_email: dealership.contact_email ?? "",
      whatsapp_number: dealership.whatsapp_number ?? "",
      primary: c.primary,
      primaryForeground: c.primaryForeground,
      secondary: secondaryFromDealership(dealership),
      header_logo_url: headerLogoUrlFromDealership(dealership),
      favicon_url: faviconUrlFromDealership(dealership),
      about_text: readStr(cc, "about_text"),
      address: readStr(cc, "address"),
      social_instagram: readSocial(cc, "instagram"),
      social_facebook: readSocial(cc, "facebook"),
      social_website: readSocial(cc, "website"),
      status: dealership.status,
    };
  }
  return {
    name: "",
    slug: "",
    cnpj: "",
    custom_domain: "",
    contact_email: "",
    whatsapp_number: "",
    primary: "#0f172a",
    primaryForeground: "#f8fafc",
    secondary: "#64748b",
    header_logo_url: "",
    favicon_url: "",
    about_text: "",
    address: "",
    social_instagram: "",
    social_facebook: "",
    social_website: "",
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
            <span className="font-medium">slug.seudominio.com</span>. Cores e
            logos alimentam a vitrine e o painel da loja.
          </DialogDescription>
        </DialogHeader>
        <form
          key={`${mode}-${dealership?.id ?? "new"}`}
          onSubmit={onSubmit}
          className="space-y-6"
        >
          {error ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Dados básicos
            </p>
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
              <Label htmlFor="d-cnpj">CNPJ (opcional)</Label>
              <Input
                id="d-cnpj"
                name="cnpj"
                placeholder="00.000.000/0001-00"
                defaultValue={defaults.cnpj}
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
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">
              Identidade visual (whitelabel)
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="space-y-2">
                <Label htmlFor="d-csec">Cor secundária</Label>
                <Input
                  id="d-csec"
                  name="secondary_color"
                  type="color"
                  defaultValue={defaults.secondary}
                  disabled={pending}
                  className="h-10 w-full cursor-pointer py-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-logo">URL do logo (cabeçalho)</Label>
              <Input
                id="d-logo"
                name="header_logo_url"
                type="url"
                placeholder="https://…"
                defaultValue={defaults.header_logo_url}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-favicon">URL do favicon</Label>
              <Input
                id="d-favicon"
                name="favicon_url"
                type="url"
                placeholder="https://…"
                defaultValue={defaults.favicon_url}
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">
              Conteúdo institucional
            </p>
            <div className="space-y-2">
              <Label htmlFor="d-about">Sobre a loja</Label>
              <Textarea
                id="d-about"
                name="about_text"
                rows={3}
                defaultValue={defaults.about_text}
                disabled={pending}
                placeholder="Texto da página institucional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-address">Endereço</Label>
              <Textarea
                id="d-address"
                name="address"
                rows={2}
                defaultValue={defaults.address}
                disabled={pending}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="d-ig">Instagram (URL)</Label>
                <Input
                  id="d-ig"
                  name="social_instagram"
                  type="url"
                  placeholder="https://instagram.com/…"
                  defaultValue={defaults.social_instagram}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-fb">Facebook (URL)</Label>
                <Input
                  id="d-fb"
                  name="social_facebook"
                  type="url"
                  placeholder="https://facebook.com/…"
                  defaultValue={defaults.social_facebook}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-site">Site (URL)</Label>
                <Input
                  id="d-site"
                  name="social_website"
                  type="url"
                  placeholder="https://…"
                  defaultValue={defaults.social_website}
                  disabled={pending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">
              Módulos no painel da loja
            </p>
            <p className="text-xs text-muted-foreground">
              Se nenhum item estiver marcado, o comportamento legado mantém todos
              os módulos opcionais ativos.
            </p>
            <ul className="space-y-2">
              {DEALERSHIP_OPTIONAL_FEATURES.map(({ key, label }) => (
                <li key={key} className="flex items-start gap-2">
                  <input
                    id={`feat-${key}`}
                    name={`feature_${key}`}
                    type="checkbox"
                    defaultChecked={isOptionalFeatureChecked(dealership, key)}
                    disabled={pending}
                    className="mt-1 size-4 rounded border border-input"
                  />
                  <label
                    htmlFor={`feat-${key}`}
                    className="text-sm leading-tight text-foreground"
                  >
                    {label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
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
