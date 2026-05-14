"use client";

import { DEALERSHIP_OPTIONAL_FEATURES } from "@autopainel/shared/lib/dealership-features";
import type {
  BrazilianAddressFields,
  PricingPlanListRow,
  StorefrontLayoutTemplateId,
  StorefrontThemeMode,
} from "@autopainel/shared/types";
import {
  Button,
  Input,
  Label,
  Textarea,
  toast,
} from "@autopainel/shared/ui";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createDealershipAction,
  updateDealershipAction,
} from "@/actions/dealerships";
import { BrazilianAddressFields as BrazilianAddressFieldsForm } from "@/components/brazilian-address-fields";
import { DealershipCollaboratorsPanel } from "@/components/dealership-collaborators-panel";
import { GoogleFontFamilyCombobox } from "@/components/google-font-family-combobox";
import { DealershipOperatorFinancePanel } from "@/components/dealership-operator-finance-panel";
import {
  CnpjMaskedInput,
  DomainMaskedInput,
  EmailCadastroInput,
  FacebookUrlMaskedInput,
  InstagramUrlMaskedInput,
  WebsiteUrlMaskedInput,
  WhatsappMaskedInput,
} from "@/components/dealership-masked-inputs";
import type { DealershipCollaboratorRow } from "@/lib/data/dealership-collaborators";
import type { DealershipUnitAdminRow } from "@/lib/data/dealership-units";
import type {
  DealershipBillingHistoryRow,
  DealershipBillingRow,
} from "@/lib/data/dealership-operator-billing";
import type { DealershipAdminRow } from "@/types/dealership-admin";

import { DealershipBrandUpload } from "./dealership-brand-upload";
import { DealershipUnitsEditor } from "./dealership-units-editor";
import { DealershipTemplatePicker } from "./dealership-template-picker";

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

function readHqAddress(content: Record<string, unknown>): BrazilianAddressFields {
  const hq = content.hq_address;
  if (hq && typeof hq === "object" && !Array.isArray(hq)) {
    const o = hq as Record<string, unknown>;
    return {
      postal_code: readStr(o, "postal_code"),
      state: readStr(o, "state"),
      city: readStr(o, "city"),
      district: readStr(o, "district"),
      street: readStr(o, "street"),
      number: readStr(o, "number"),
      complement: readStr(o, "complement"),
    };
  }
  const legacy = readStr(content, "address");
  return legacy.length > 0 ? { street: legacy } : {};
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
  const fromLegacyTheme = readStr(tc, "logo_url");
  if (fromLegacyTheme.length > 0) {
    return fromLegacyTheme;
  }
  return dealership.logo_url ?? "";
}

function faviconUrlFromDealership(dealership: DealershipAdminRow): string {
  return readStr(dealership.theme_config as Record<string, unknown>, "favicon_url");
}

function storefrontThemeModeFromDealership(
  dealership: DealershipAdminRow,
): StorefrontThemeMode {
  const mode = readStr(
    dealership.theme_config as Record<string, unknown>,
    "storefront_theme_mode",
  );
  return mode === "dark" ? "dark" : "light";
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
  pricing_plan_id: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  header_logo_url: string;
  footer_logo_url: string;
  google_font_heading: string;
  google_font_body: string;
  favicon_url: string;
  about_text: string;
  hq_address: BrazilianAddressFields;
  social_instagram: string;
  social_facebook: string;
  social_website: string;
  status: string;
  layout_id: StorefrontLayoutTemplateId;
  storefront_theme_mode: StorefrontThemeMode;
};

function getDefaults(
  mode: "create" | "edit",
  dealership: DealershipAdminRow | null,
): FormDefaults {
  if (mode === "edit" && dealership) {
    const c = colorsFromTheme(dealership.theme_settings);
    const cc = dealership.content_config;
    const tc = dealership.theme_config as Record<string, unknown>;
    return {
      name: dealership.name,
      slug: dealership.slug,
      cnpj: dealership.cnpj ?? "",
      custom_domain: dealership.custom_domain ?? "",
      contact_email: dealership.contact_email ?? "",
      whatsapp_number: dealership.whatsapp_number ?? "",
      pricing_plan_id: dealership.pricing_plan_id ?? "",
      primary: c.primary,
      primaryForeground: c.primaryForeground,
      secondary: secondaryFromDealership(dealership),
      header_logo_url: headerLogoUrlFromDealership(dealership),
      footer_logo_url: readStr(tc, "footer_logo_url"),
      google_font_heading: readStr(tc, "google_font_heading"),
      google_font_body: readStr(tc, "google_font_body"),
      favicon_url: faviconUrlFromDealership(dealership),
      about_text: readStr(cc, "about_text"),
      hq_address: readHqAddress(cc),
      social_instagram: readSocial(cc, "instagram"),
      social_facebook: readSocial(cc, "facebook"),
      social_website: readSocial(cc, "website"),
      status: dealership.status,
      layout_id: dealership.layout_id ?? 1,
      storefront_theme_mode: storefrontThemeModeFromDealership(dealership),
    };
  }
  return {
    name: "",
    slug: "",
    cnpj: "",
    custom_domain: "",
    contact_email: "",
    whatsapp_number: "",
    pricing_plan_id: "",
    primary: "#0f172a",
    primaryForeground: "#f8fafc",
    secondary: "#64748b",
    header_logo_url: "",
    footer_logo_url: "",
    google_font_heading: "",
    google_font_body: "",
    favicon_url: "",
    about_text: "",
    hq_address: {},
    social_instagram: "",
    social_facebook: "",
    social_website: "",
    status: "pending_setup",
    layout_id: 1,
    storefront_theme_mode: "light",
  };
}

function formatPlanPrice(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) {
    return `${amount} ${currency}`;
  }
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.length === 3 ? currency : "BRL",
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function DealershipForm({
  mode,
  dealership,
  initialUnits,
  pricingPlans,
  commercialPlanLabel,
  collaborators,
  operatorBilling,
  billingHistory,
  billingTablesUnavailable,
}: {
  mode: "create" | "edit";
  dealership: DealershipAdminRow | null;
  initialUnits: DealershipUnitAdminRow[];
  pricingPlans: PricingPlanListRow[];
  commercialPlanLabel?: string;
  collaborators?: DealershipCollaboratorRow[];
  operatorBilling?: DealershipBillingRow | null;
  billingHistory?: DealershipBillingHistoryRow[];
  billingTablesUnavailable?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaults = getDefaults(mode, dealership);
  const [layoutId, setLayoutId] = useState<StorefrontLayoutTemplateId>(
    defaults.layout_id,
  );

  function finishAfterSuccess() {
    router.push("/painel/concessionarias");
    router.refresh();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result =
        mode === "edit" && dealership
          ? await updateDealershipAction(dealership.id, fd)
          : await createDealershipAction(fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "create"
          ? "Concessionária criada com sucesso."
          : "Alterações guardadas com sucesso.",
      );
      finishAfterSuccess();
    });
  }

  const heading =
    mode === "create" ? "Nova concessionária" : "Editar concessionária";

  return (
    <div
      className={
        mode === "edit"
          ? "mx-auto max-w-5xl pb-12 pt-6"
          : "mx-auto max-w-3xl pb-12 pt-6"
      }
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/concessionarias"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Voltar à lista
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            O subdomínio define o endereço{" "}
            <span className="font-medium text-foreground">
              slug.seudominio.com
            </span>
            . Identidade visual e template definem a vitrine multitenant.
          </p>
        </div>
      </div>

      <form
        key={`${mode}-${dealership?.id ?? "new"}`}
        onSubmit={onSubmit}
        className="relative space-y-8"
        aria-busy={pending}
      >
        {pending ? (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-label={
              mode === "create"
                ? "Criando concessionária, aguarde"
                : "Salvando alterações, aguarde"
            }
          >
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-6 shadow-lg">
              <Loader2
                className="size-10 animate-spin text-primary"
                aria-hidden
              />
              <p className="text-center text-sm font-medium text-foreground">
                {mode === "create"
                  ? "Criando concessionária…"
                  : "Salvando alterações…"}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Envio de imagens e sincronização de unidades pode demorar alguns
                segundos.
              </p>
            </div>
          </div>
        ) : null}
        <input type="hidden" name="layout_id" value={String(layoutId)} />

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <p className="font-medium">Não foi possível concluir o pedido</p>
            <p className="mt-1 text-destructive/95">{error}</p>
          </div>
        ) : null}

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Dados básicos</p>
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
            <CnpjMaskedInput defaultValue={defaults.cnpj} disabled={pending} />
            <p className="text-xs text-muted-foreground">
              Formato com 14 dígitos: 00.000.000/0001-00 (inclua os dois números
              depois do hífen).
            </p>
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
            <DomainMaskedInput defaultValue={defaults.custom_domain} disabled={pending} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="d-email">E-mail de contato</Label>
              <EmailCadastroInput defaultValue={defaults.contact_email} disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-wa">WhatsApp</Label>
              <WhatsappMaskedInput defaultValue={defaults.whatsapp_number} disabled={pending} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-pricing-plan">Plano comercial (opcional)</Label>
            <select
              id="d-pricing-plan"
              name="pricing_plan_id"
              className="flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.pricing_plan_id}
              disabled={pending}
            >
              <option value="">Legado — sem plano dinâmico</option>
              {pricingPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.slug}) —{" "}
                  {formatPlanPrice(plan.price_amount, plan.currency_code)}
                  {!plan.is_active ? " — inativo" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Com plano definido, vitrine e site público da loja usam os módulos
              ligados a esse plano (via servidor). Os toggles em «Módulos no painel
              da loja» mantêm o campo legado quando não há plano.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
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

          <DealershipBrandUpload
            fileInputName="header_logo_file"
            hiddenUrlName="header_logo_url"
            label="Logo do cabeçalho da vitrine"
            description="Formato mais horizontal entra bem no topo (à esquerda, altura até ~40px). JPEG, PNG, WebP ou GIF até 2 MB."
            initialRemoteUrl={defaults.header_logo_url}
            disabled={pending}
          />

          <DealershipBrandUpload
            fileInputName="footer_logo_file"
            hiddenUrlName="footer_logo_url"
            label="Logo do rodapé (opcional)"
            description="Use o logótipo empilhado ou vertical quando o do cabeçalho for largo demais. Se não enviar, o rodapé reutiliza o logo do cabeçalho."
            initialRemoteUrl={defaults.footer_logo_url}
            disabled={pending}
          />

          <DealershipBrandUpload
            fileInputName="favicon_file"
            hiddenUrlName="favicon_url"
            label="Favicon"
            description="Ícone curto para separadores do navegador; mesmo formato e limite que os logos."
            initialRemoteUrl={defaults.favicon_url}
            disabled={pending}
          />

          <div className="grid gap-6 sm:grid-cols-1">
            <GoogleFontFamilyCombobox
              key={`gf-heading-${dealership?.id ?? "new"}-${defaults.google_font_heading}`}
              idPrefix={`gf-heading-${dealership?.id ?? "new"}`}
              formFieldName="google_font_heading"
              label="Fonte dos títulos da vitrine"
              description='Lista gratuita das Google Fonts. Deixe em branco («Limpar») para usar o par de fontes pré-definido pela plataforma.'
              initialFamily={defaults.google_font_heading}
              disabled={pending}
            />
            <GoogleFontFamilyCombobox
              key={`gf-body-${dealership?.id ?? "new"}-${defaults.google_font_body}`}
              idPrefix={`gf-body-${dealership?.id ?? "new"}`}
              formFieldName="google_font_body"
              label="Fonte dos textos corridos da vitrine"
              description='Aplica-se aos parágrafos e navegação. Deixe vazio para o par pré-definido ou para espelhar a fonte dos títulos quando só definir uma família.'
              initialFamily={defaults.google_font_body}
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Aparência do site
            </p>
            <p className="text-xs text-muted-foreground">
              Escolha o modelo da vitrine. Cores e imagens acima aplicam-se a
              qualquer template.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-storefront-theme-mode">Tema base da vitrine</Label>
            <select
              id="d-storefront-theme-mode"
              name="storefront_theme_mode"
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.storefront_theme_mode}
              disabled={pending}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Define o fundo base da vitrine da loja. O modo escuro usa superfícies escuras;
              o modo claro usa superfícies claras.
            </p>
          </div>
          <DealershipTemplatePicker
            value={layoutId}
            onChange={setLayoutId}
            disabled={pending}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
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
          <BrazilianAddressFieldsForm
            key={`hq-${dealership?.id ?? "create"}`}
            prefix="hq"
            legend="Endereço da sede (institucional)"
            initialAddress={defaults.hq_address}
            disabled={pending}
          />
          <div className="grid gap-4 sm:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="d-ig">Instagram</Label>
              <InstagramUrlMaskedInput
                id="d-ig"
                name="social_instagram"
                placeholder="https://instagram.com/sua-loja ou @sua-loja"
                defaultValue={defaults.social_instagram}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-fb">Facebook</Label>
              <FacebookUrlMaskedInput
                id="d-fb"
                name="social_facebook"
                placeholder="https://facebook.com/sua-loja"
                defaultValue={defaults.social_facebook}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-site">Site</Label>
              <WebsiteUrlMaskedInput
                defaultValue={defaults.social_website}
                disabled={pending}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Unidades da concessionária
            </p>
            <p className="text-xs text-muted-foreground">
              Defina filiais com endereço próprio. O estoque no painel da loja será
              vinculado à unidade; o site público mantém o mesmo visual para todas.
            </p>
          </div>
          <DealershipUnitsEditor
            key={dealership?.id ?? "create-units"}
            initialRows={initialUnits}
            disabled={pending}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            Módulos no painel da loja
          </p>
          <p className="text-xs text-muted-foreground">
            Se nenhum item estiver marcado, o comportamento legado mantém todos
            os módulos opcionais ativos.
          </p>
          <ul className="space-y-2">
            {DEALERSHIP_OPTIONAL_FEATURES.map(({ key, label: featureLabel }) => (
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
                  {featureLabel}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-card p-6 shadow-sm">
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

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={pending} className="min-w-[9rem]">
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : mode === "create" ? (
              "Criar"
            ) : (
              "Salvar"
            )}
          </Button>
          <Button type="button" variant="outline" asChild disabled={pending}>
            <Link href="/painel/concessionarias">Cancelar</Link>
          </Button>
        </div>
      </form>

      {mode === "edit" && dealership ? (
        <div className="mt-12 space-y-10">
          <DealershipCollaboratorsPanel
            dealershipId={dealership.id}
            collaborators={collaborators ?? []}
          />
          <DealershipOperatorFinancePanel
            dealership={dealership}
            commercialPlanLabel={commercialPlanLabel ?? "—"}
            operatorBilling={operatorBilling ?? null}
            billingHistory={billingHistory ?? []}
            billingTablesUnavailable={billingTablesUnavailable ?? false}
          />
        </div>
      ) : null}
    </div>
  );
}
