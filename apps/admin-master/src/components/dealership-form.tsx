"use client";

import type {
  BrazilianAddressFields,
  PricingPlanListRow,
  SaasModuleListRow,
  StorefrontLayoutTemplateId,
  StorefrontThemeMode,
} from "@autopainel/shared/types";
import {
  readStorefrontHomeConfig,
  sellsMotorcyclesFromContentConfig,
} from "@autopainel/shared/lib/dealership/storefront-home-copy";
import { mapOnboardingIntakeToDealershipPrefill } from "@autopainel/shared/lib/dealership/map-onboarding-intake-to-form";
import type { DealershipOnboardingIntakePayload } from "@autopainel/shared/types";
import {
  Badge,
  Button,
  Input,
  Label,
  Textarea,
  toast,
} from "@autopainel/shared/ui";
import { cn } from "@autopainel/shared/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { CommercialLeadDealershipPrefill } from "@/lib/data/platform-commercial-leads-shared";
import { BrazilianAddressFields as BrazilianAddressFieldsForm } from "@/components/brazilian-address-fields";
import { DealershipCollaboratorsPanel } from "@/components/dealership-collaborators-panel";
import { DealershipPlanModulesPreview } from "@/components/dealership-plan-modules-preview";
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

import {
  createDealershipAction,
  updateDealershipAction,
} from "@/actions/dealerships";
import { DealershipBrandUpload } from "./dealership-brand-upload";
import { DealershipUnitsEditor } from "./dealership-units-editor";
import { DealershipTemplatePicker } from "./dealership-template-picker";
import { StorefrontHomeContentFields } from "./storefront-home-content-fields";

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

type DealershipEditTab =
  | "geral"
  | "vitrine"
  | "plano"
  | "unidades"
  | "equipe"
  | "financeiro";

const EDIT_TABS: Array<{ id: DealershipEditTab; label: string }> = [
  { id: "geral", label: "Geral" },
  { id: "vitrine", label: "Vitrine" },
  { id: "plano", label: "Plano" },
  { id: "unidades", label: "Unidades" },
  { id: "equipe", label: "Equipe" },
  { id: "financeiro", label: "Financeiro" },
];

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
  logo_light_url: string;
  logo_dark_url: string;
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
  intakePrefill?: DealershipOnboardingIntakePayload | null,
  leadPrefill?: CommercialLeadDealershipPrefill | null,
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
      logo_light_url: readStr(tc, "logo_light_url") || headerLogoUrlFromDealership(dealership),
      logo_dark_url: readStr(tc, "logo_dark_url"),
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
  if (mode === "create" && intakePrefill) {
    const mapped = mapOnboardingIntakeToDealershipPrefill(intakePrefill);
    return {
      name: mapped.name,
      slug: mapped.slug,
      cnpj: mapped.cnpj,
      custom_domain: mapped.custom_domain,
      contact_email: mapped.contact_email,
      whatsapp_number: mapped.whatsapp_number,
      pricing_plan_id: "",
      primary: mapped.primary,
      primaryForeground: mapped.primaryForeground,
      secondary: mapped.secondary,
      header_logo_url: mapped.logo_light_url || mapped.logo_dark_url,
      logo_light_url: mapped.logo_light_url,
      logo_dark_url: mapped.logo_dark_url,
      footer_logo_url: mapped.footer_logo_url,
      google_font_heading: mapped.google_font_heading,
      google_font_body: mapped.google_font_body,
      favicon_url: mapped.favicon_url,
      about_text: mapped.about_text,
      hq_address: mapped.hq_address,
      social_instagram: mapped.social_instagram,
      social_facebook: mapped.social_facebook,
      social_website: mapped.social_website,
      status: "pending_setup",
      layout_id: mapped.layout_id,
      storefront_theme_mode: mapped.storefront_theme_mode,
    };
  }
  if (mode === "create" && leadPrefill) {
    return {
      name: leadPrefill.storeName,
      slug: leadPrefill.slugSuggestion,
      cnpj: leadPrefill.cnpj,
      custom_domain: "",
      contact_email: leadPrefill.contactEmail,
      whatsapp_number: leadPrefill.whatsapp,
      pricing_plan_id: "",
      primary: "#0f172a",
      primaryForeground: "#f8fafc",
      secondary: "#64748b",
      header_logo_url: "",
      logo_light_url: "",
      logo_dark_url: "",
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
    logo_light_url: "",
    logo_dark_url: "",
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
  planModulesByPlanId,
  collaborators,
  operatorBilling,
  billingHistory,
  billingTablesUnavailable,
  intakePrefill,
  intakeId,
  leadPrefill,
  leadId,
}: {
  mode: "create" | "edit";
  dealership: DealershipAdminRow | null;
  initialUnits: DealershipUnitAdminRow[];
  pricingPlans: PricingPlanListRow[];
  planModulesByPlanId: Record<string, SaasModuleListRow[]>;
  collaborators?: DealershipCollaboratorRow[];
  operatorBilling?: DealershipBillingRow | null;
  billingHistory?: DealershipBillingHistoryRow[];
  billingTablesUnavailable?: boolean;
  intakePrefill?: DealershipOnboardingIntakePayload | null;
  intakeId?: string | null;
  leadPrefill?: CommercialLeadDealershipPrefill | null;
  leadId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaults = useMemo(() => {
    const base = getDefaults(mode, dealership, intakePrefill, leadPrefill);
    if ((intakePrefill || leadPrefill) && !base.pricing_plan_id) {
      const plan = pricingPlans.find(
        (item) => item.slug === "starter" || item.slug === "trial",
      );
      if (plan) {
        return { ...base, pricing_plan_id: plan.id };
      }
    }
    return base;
  }, [mode, dealership, intakePrefill, leadPrefill, pricingPlans]);

  const initialHomeConfig = useMemo(() => {
    if (intakePrefill) {
      return mapOnboardingIntakeToDealershipPrefill(intakePrefill).storefront_home_config;
    }
    return readStorefrontHomeConfig(dealership?.content_config ?? null);
  }, [dealership?.content_config, intakePrefill]);
  const [layoutId, setLayoutId] = useState<StorefrontLayoutTemplateId>(
    defaults.layout_id,
  );
  const [activeTab, setActiveTab] = useState<DealershipEditTab>("geral");
  const [selectedPlanIdOverride, setSelectedPlanIdOverride] = useState<string | null>(null);
  const selectedPlanId = selectedPlanIdOverride ?? defaults.pricing_plan_id ?? "";

  const planNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const plan of pricingPlans) {
      map[plan.id] = plan.name;
    }
    return map;
  }, [pricingPlans]);

  const isFormTab =
    mode === "create" ||
    activeTab === "geral" ||
    activeTab === "vitrine" ||
    activeTab === "plano" ||
    activeTab === "unidades";

  function editTabPanelClass(tab: DealershipEditTab): string {
    return cn(mode === "edit" && activeTab !== tab && "hidden");
  }

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
    mode === "create" ? "Nova concessionária" : dealership?.name ?? "Concessionária";

  return (
    <div
      className={
        mode === "edit"
          ? "mx-auto max-w-5xl pb-12 pt-6"
          : "mx-auto max-w-3xl pb-12 pt-6"
      }
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/concessionarias"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Voltar à lista
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            {mode === "edit" && dealership ? (
              <Badge className="capitalize">{defaults.status.replace("_", " ")}</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Cadastre a loja e escolha o plano comercial. As funcionalidades vêm do plano — não selecione módulos avulsos."
              : "Gerencie dados, vitrine, plano e equipe em abas separadas."}
          </p>
        </div>
      </div>

      {mode === "edit" ? (
        <nav
          className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1"
          aria-label="Seções da concessionária"
        >
          {EDIT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : null}

      {isFormTab ? (
      <form
        key={`${mode}-${dealership?.id ?? "new"}`}
        onSubmit={onSubmit}
        className="relative space-y-8"
        aria-busy={pending}
      >
        {intakeId ? (
          <input type="hidden" name="source_intake_id" value={intakeId} />
        ) : null}
        {leadId ? (
          <input type="hidden" name="source_saas_prospect_id" value={leadId} />
        ) : null}
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

        <div className={editTabPanelClass("geral")}>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Dados gerais</p>
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
          {mode === "create" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="d-pricing-plan">Plano comercial</Label>
                <select
                  id="d-pricing-plan"
                  name="pricing_plan_id"
                  required
                  className="flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={defaults.pricing_plan_id}
                  disabled={pending}
                  onChange={(event) => setSelectedPlanIdOverride(event.target.value)}
                >
                  <option value="" disabled>
                    Selecione um plano
                  </option>
                  {pricingPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {formatPlanPrice(plan.price_amount, plan.currency_code)}
                      {!plan.is_active ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <DealershipPlanModulesPreview
                pricingPlanId={selectedPlanId}
                planModulesByPlanId={planModulesByPlanId}
                planNameById={planNameById}
              />
            </>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="d-status">Status da conta</Label>
            <select
              id="d-status"
              name="status"
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaults.status}
              disabled={pending}
            >
              <option value="pending_setup">Configuração pendente</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
              <option value="churned">Encerrada</option>
            </select>
          </div>
        </div>
        </div>

        <div className={editTabPanelClass("vitrine")}>
        <div className="space-y-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
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
            description="Formato horizontal para o topo da vitrine. JPEG, PNG, WebP ou GIF até 2 MB."
            initialRemoteUrl={defaults.header_logo_url}
            disabled={pending}
          />

          <DealershipBrandUpload
            fileInputName="logo_dark_file"
            hiddenUrlName="logo_dark_url"
            label="Logo para fundo claro"
            description="Marca escura ou colorida para vitrine clara, painel e impressos. Se vazio, reutiliza o logo do cabeçalho."
            initialRemoteUrl={defaults.logo_dark_url || defaults.logo_light_url}
            disabled={pending}
          />

          <DealershipBrandUpload
            fileInputName="logo_light_file"
            hiddenUrlName="logo_light_url"
            label="Logo para fundo escuro"
            description="Marca clara ou branca para vitrine escura. Se vazio, reutiliza o logo do cabeçalho."
            initialRemoteUrl={defaults.logo_light_url || defaults.logo_dark_url}
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

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
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

        <StorefrontHomeContentFields
          layoutId={layoutId}
          initialConfig={initialHomeConfig}
          dealershipName={defaults.name}
          sellsMotorcycles={sellsMotorcyclesFromContentConfig(
            dealership?.content_config ?? null,
            defaults.slug,
          )}
          disabled={pending}
        />

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
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
        </div>
        </div>

        {mode === "edit" ? (
          <div className={editTabPanelClass("plano")}>
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Plano comercial</p>
              <p className="text-xs text-muted-foreground">
                A loja herda as funcionalidades do plano escolhido. Para mudar módulos,
                edite o plano em Planos comerciais ou troque o plano desta loja.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-pricing-plan-edit">Plano atribuído</Label>
              <select
                id="d-pricing-plan-edit"
                name="pricing_plan_id"
                required
                className="flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={defaults.pricing_plan_id}
                disabled={pending}
                onChange={(event) => setSelectedPlanIdOverride(event.target.value)}
              >
                <option value="" disabled>
                  Selecione um plano
                </option>
                {pricingPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {formatPlanPrice(plan.price_amount, plan.currency_code)}
                    {!plan.is_active ? " (inativo)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <DealershipPlanModulesPreview
              pricingPlanId={selectedPlanId}
              planModulesByPlanId={planModulesByPlanId}
              planNameById={planNameById}
            />
          </div>
          </div>
        ) : null}

        <div className={editTabPanelClass("unidades")}>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
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
      ) : null}

      {mode === "edit" && activeTab === "equipe" && dealership ? (
        <DealershipCollaboratorsPanel
          dealershipId={dealership.id}
          collaborators={collaborators ?? []}
        />
      ) : null}

      {mode === "edit" && activeTab === "financeiro" && dealership ? (
        <DealershipOperatorFinancePanel
          dealership={dealership}
          operatorBilling={operatorBilling ?? null}
          billingHistory={billingHistory ?? []}
          billingTablesUnavailable={billingTablesUnavailable ?? false}
        />
      ) : null}
    </div>
  );
}
