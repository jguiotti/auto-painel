"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  digitsOnly,
  formatBrazilMobileMasked,
  formatCnpjMasked,
  formatCpfMasked,
} from "@autopainel/shared/lib/br/format-input-masks";
import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";
import { cn } from "@autopainel/shared/lib/utils";
import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import {
  firstOnboardingIntakeStep0Error,
  slugifyStoreName,
  validateOnboardingIntakeStep,
  validateOnboardingIntakeStep0Fields,
  type OnboardingIntakeStep0FieldErrors,
} from "@autopainel/shared/lib/dealership/validate-onboarding-intake-step";
import type {
  DealershipOnboardingIntakePayload,
  DealershipOnboardingUnitDraft,
  StorefrontHomeLayoutCopy,
  StorefrontHomeLayoutKey,
  StorefrontHomeTrustStat,
} from "@autopainel/shared/types";
import {
  ONBOARDING_BRAND_ASSET_SPEC,
  ONBOARDING_HERO_BANNER_SPEC,
} from "@autopainel/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FileUploadField,
  Input,
  KeyValueRepeater,
  Label,
  Stepper,
  StorefrontLayoutPicker,
  Textarea,
  type KeyValueRepeaterRow,
} from "@autopainel/shared/ui";
import { Loader2 } from "lucide-react";

import {
  submitTrialOnboardingAction,
  type SubmitTrialOnboardingState,
} from "@/actions/submit-trial-onboarding";
import { LegalDocumentLink } from "@/components/legal-document-link";
import {
  clearTrialOnboardingDraft,
  loadTrialOnboardingDraft,
  saveTrialOnboardingDraft,
} from "@/lib/trial-onboarding-draft-storage";
import { PRIVACY_POLICY_VERSION, PLATFORM_TERMS_VERSION } from "@/lib/legal/constants";
import { TRIAL_ADHESION_VERSION, TRIAL_DURATION_DAYS } from "@/lib/legal/trial-constants";

const WIZARD_STEPS = [
  { label: "Dados da loja", subtitle: "CNPJ, contato e endereço de cobrança" },
  { label: "Identidade visual", subtitle: "Cores, logos e tipografia" },
  { label: "Vitrine", subtitle: "Tema, layout e textos da homepage" },
  { label: "Institucional", subtitle: "Sobre a loja, redes e unidades" },
  { label: "Confirmação", subtitle: "Termos e envio" },
] as const;

const BRAND_ACCEPT = ONBOARDING_BRAND_ASSET_SPEC.acceptMime.join(",");
const HERO_ACCEPT = ONBOARDING_HERO_BANNER_SPEC.acceptMime.join(",");
const TRIAL_UPLOAD_FIELD_KEYS = [
  "logo_dark_file",
  "logo_light_file",
  "footer_logo_file",
  "favicon_file",
  "hero_background_file",
] as const;
type TrialUploadFieldKey = (typeof TRIAL_UPLOAD_FIELD_KEYS)[number];
const MARKETING_FILE_INPUT =
  "text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-marketing-accent/20 file:px-4 file:py-2 file:text-sm file:text-white";
const MARKETING_FIELD =
  "border-white/10 bg-zinc-900/80 text-white placeholder:text-zinc-500";

function trustStatsToRows(stats: StorefrontHomeTrustStat[]): KeyValueRepeaterRow[] {
  return stats.map((stat) => ({ key: stat.value, value: stat.label }));
}

function rowsToTrustStats(rows: KeyValueRepeaterRow[]): StorefrontHomeTrustStat[] {
  return rows.map((row) => ({ value: row.key, label: row.value }));
}

function ensureTrustStats(copy: StorefrontHomeLayoutCopy, count: number): StorefrontHomeTrustStat[] {
  const existing = copy.trust_stats ?? [];
  return Array.from({ length: count }, (_, index) => ({
    value: existing[index]?.value ?? "",
    label: existing[index]?.label ?? "",
  }));
}

function ensureHeritageStats(
  copy: StorefrontHomeLayoutCopy,
  count: number,
): StorefrontHomeTrustStat[] {
  const existing = copy.heritage_stats ?? [];
  return Array.from({ length: count }, (_, index) => ({
    value: existing[index]?.value ?? "",
    label: existing[index]?.label ?? "",
  }));
}

const EMPTY_UNIT = (): DealershipOnboardingUnitDraft => ({
  name: "",
  whatsapp_number: "",
  address: {},
  is_primary: false,
});

function emptyPayload(): DealershipOnboardingIntakePayload {
  return {
    general: {
      store_name: "",
      cnpj: "",
      slug: "",
      wants_custom_domain: false,
      custom_domain: "",
      contact_email: "",
      whatsapp: "",
      legal_representative_name: "",
      legal_representative_cpf: "",
      billing_address: {},
    },
    branding: {
      primary_color: "#0f172a",
      primary_foreground_color: "#f8fafc",
      secondary_color: "#64748b",
      logo_dark_url: "",
      logo_light_url: "",
      footer_logo_url: "",
      favicon_url: "",
      google_font_heading: "",
      google_font_body: "",
    },
    storefront: {
      theme_mode: "light",
      layout_id: 1,
      hero_background_url: "",
      home_copy_by_layout: {},
    },
    institutional: {
      about_text: "",
      social_instagram: "",
      social_facebook: "",
      social_website: "",
    },
    units: [],
  };
}

function layoutKey(layoutId: number): StorefrontHomeLayoutKey {
  return String(layoutId) as StorefrontHomeLayoutKey;
}

const TRUST_STAT_COUNT = 4;
const HERITAGE_STAT_COUNT = 3;
const SIDECARD_ITEM_COUNT = 3;

interface TrialOnboardingFormProps {
  saasProspectId?: string | null;
  acceptsImmediateTrial?: boolean;
}

export function TrialOnboardingForm({
  saasProspectId = null,
  acceptsImmediateTrial = true,
}: TrialOnboardingFormProps) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<OnboardingIntakeStep0FieldErrors>({});
  const [payload, setPayload] = useState<DealershipOnboardingIntakePayload>(emptyPayload);
  const [units, setUnits] = useState<DealershipOnboardingUnitDraft[]>([]);
  const [trialAccepted, setTrialAccepted] = useState(false);
  const [platformTermsAccepted, setPlatformTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<Partial<Record<TrialUploadFieldKey, File>>>({});

  const [state, formAction, pending] = useActionState<
    SubmitTrialOnboardingState | null,
    FormData
  >(submitTrialOnboardingAction, null);
  const conversionTrackedRef = useRef(false);
  const stepErrorRef = useRef<HTMLParagraphElement | null>(null);
  const draftHydratedRef = useRef(false);

  function setUploadFile(key: TrialUploadFieldKey, file: File | null) {
    setUploadFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[key] = file;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  async function submitWithUploads(formData: FormData) {
    for (const key of TRIAL_UPLOAD_FIELD_KEYS) {
      const file = uploadFiles[key];
      if (file && file.size > 0) {
        formData.set(key, file);
      }
    }
    return formAction(formData);
  }

  useEffect(() => {
    const draft = loadTrialOnboardingDraft();
    if (draft) {
      // Restore session draft after mount (client-only storage; avoids SSR hydration mismatch).
      /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage draft restore */
      setPayload(draft.payload);
      setUnits(draft.units);
      setStep(draft.step);
      setTrialAccepted(draft.trialAccepted);
      setPlatformTermsAccepted(draft.platformTermsAccepted);
      setPrivacyAccepted(draft.privacyAccepted);
      setMarketingConsent(draft.marketingConsent);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    draftHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!draftHydratedRef.current || state?.success) {
      return;
    }

    saveTrialOnboardingDraft({
      payload,
      units,
      step,
      trialAccepted,
      platformTermsAccepted,
      privacyAccepted,
      marketingConsent,
    });
  }, [
    payload,
    units,
    step,
    trialAccepted,
    platformTermsAccepted,
    privacyAccepted,
    marketingConsent,
    state?.success,
  ]);

  useEffect(() => {
    if (!state?.success || conversionTrackedRef.current) {
      return;
    }
    clearTrialOnboardingDraft();
    conversionTrackedRef.current = true;
    pushAutopainelAnalyticsEvent({
      ap_event: "trial_onboarding_submit",
      ap_event_category: "conversion",
      ap_event_label: saasProspectId ? "adesao_trial_linked_lead" : "adesao_trial",
    });
  }, [state?.success, saasProspectId]);

  const layoutId = payload.storefront.layout_id;
  const activeLayoutKey = layoutKey(layoutId);
  const activeHomeCopy: StorefrontHomeLayoutCopy =
    payload.storefront.home_copy_by_layout[activeLayoutKey] ?? {};

  const payloadJson = useMemo(
    () => JSON.stringify({ ...payload, units }),
    [payload, units],
  );

  function patchHomeCopy(field: keyof StorefrontHomeLayoutCopy, value: string) {
    setPayload((prev) => ({
      ...prev,
      storefront: {
        ...prev.storefront,
        home_copy_by_layout: {
          ...prev.storefront.home_copy_by_layout,
          [activeLayoutKey]: {
            ...prev.storefront.home_copy_by_layout[activeLayoutKey],
            [field]: value,
          },
        },
      },
    }));
  }

  function ensureSidecardItems(copy: StorefrontHomeLayoutCopy): string[] {
    const existing = copy.hero_sidecard_items ?? [];
    return Array.from({ length: SIDECARD_ITEM_COUNT }, (_, index) => existing[index] ?? "");
  }

  function patchTrustStatsRows(rows: KeyValueRepeaterRow[]) {
    setPayload((prev) => {
      const current = prev.storefront.home_copy_by_layout[activeLayoutKey] ?? {};
      return {
        ...prev,
        storefront: {
          ...prev.storefront,
          home_copy_by_layout: {
            ...prev.storefront.home_copy_by_layout,
            [activeLayoutKey]: { ...current, trust_stats: rowsToTrustStats(rows) },
          },
        },
      };
    });
  }

  function patchHeritageStatsRows(rows: KeyValueRepeaterRow[]) {
    setPayload((prev) => {
      const current = prev.storefront.home_copy_by_layout[activeLayoutKey] ?? {};
      return {
        ...prev,
        storefront: {
          ...prev.storefront,
          home_copy_by_layout: {
            ...prev.storefront.home_copy_by_layout,
            [activeLayoutKey]: { ...current, heritage_stats: rowsToTrustStats(rows) },
          },
        },
      };
    });
  }

  function patchSidecardItem(index: number, value: string) {
    setPayload((prev) => {
      const current = prev.storefront.home_copy_by_layout[activeLayoutKey] ?? {};
      const items = ensureSidecardItems(current);
      items[index] = value;
      return {
        ...prev,
        storefront: {
          ...prev.storefront,
          home_copy_by_layout: {
            ...prev.storefront.home_copy_by_layout,
            [activeLayoutKey]: { ...current, hero_sidecard_items: items },
          },
        },
      };
    });
  }

  function clearFieldError(field: keyof OnboardingIntakeStep0FieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleContinue() {
    setStepError(null);

    if (step === 0) {
      const nextPayload: DealershipOnboardingIntakePayload = {
        ...payload,
        general: {
          ...payload.general,
          slug: payload.general.slug.trim() || slugifyStoreName(payload.general.store_name),
        },
      };

      if (nextPayload.general.slug !== payload.general.slug) {
        setPayload(nextPayload);
      }

      const errors = validateOnboardingIntakeStep0Fields(nextPayload);
      setFieldErrors(errors);

      const message = firstOnboardingIntakeStep0Error(errors);
      if (message) {
        setStepError(message);
        stepErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      setFieldErrors({});
    } else {
      const message = validateOnboardingIntakeStep(step, payload);
      if (message) {
        setStepError(message);
        stepErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    setStep((current) => current + 1);
  }

  const sidecardItems = ensureSidecardItems(activeHomeCopy);
  const trustStatRows = trustStatsToRows(
    ensureTrustStats(activeHomeCopy, TRUST_STAT_COUNT),
  );
  const heritageStatRows = trustStatsToRows(
    ensureHeritageStats(activeHomeCopy, HERITAGE_STAT_COUNT),
  );

  if (state?.success) {
    return (
      <Card
        className={
          state.waitlisted
            ? "border-amber-500/30 bg-amber-500/5 text-center"
            : "border-emerald-500/30 bg-emerald-500/5 text-center"
        }
      >
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold text-white">
            {state.waitlisted ? "Você entrou na fila de espera!" : "Adesão recebida!"}
          </h2>
          <p className="text-muted-foreground">
            {state.waitlisted ? (
              <>
                Registramos seu interesse no trial. As vagas imediatas com setup isento estão
                preenchidas — entraremos em contato pelo e-mail informado quando abrirmos novas
                vagas para ativar seu trial de {TRIAL_DURATION_DAYS} dias no plano Essencial.
              </>
            ) : (
              <>
                Recebemos seus dados. Nossa equipe revisa o cadastro e entra em contato em até 1
                dia útil para ativar seu trial de {TRIAL_DURATION_DAYS} dias no plano Essencial,
                com taxa de setup isenta nesta campanha.
              </>
            )}
          </p>
          {state.intakeId ? (
            <p className="font-mono text-xs text-zinc-500">Protocolo: {state.intakeId}</p>
          ) : null}
          <Button className="mt-2" asChild variant="outline">
            <Link href="/planos">Ver planos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      action={submitWithUploads}
      encType="multipart/form-data"
      className="space-y-8"
      aria-busy={pending ? "true" : undefined}
    >
      <input type="hidden" name="payload_json" value={payloadJson} readOnly />
      <input type="hidden" name="trial_accepted" value={trialAccepted ? "true" : "false"} readOnly />
      <input
        type="hidden"
        name="platform_terms_accepted"
        value={platformTermsAccepted ? "true" : "false"}
        readOnly
      />
      <input type="hidden" name="privacy_accepted" value={privacyAccepted ? "true" : "false"} readOnly />
      <input
        type="hidden"
        name="marketing_consent"
        value={marketingConsent ? "true" : "false"}
        readOnly
      />
      {saasProspectId ? (
        <input type="hidden" name="saas_prospect_id" value={saasProspectId} readOnly />
      ) : null}

      <Stepper steps={[...WIZARD_STEPS]} currentIndex={step} variant="marketing" />

      {stepError || state?.error ? (
        <p
          ref={stepErrorRef}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {stepError ?? state?.error}
        </p>
      ) : null}

      {step === 0 ? (
        <Card className="border-white/10 bg-card/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Dados gerais da concessionária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <Field
            label="Nome comercial da loja"
            hint="Como aparece na vitrine e nos documentos."
            value={payload.general.store_name}
            error={fieldErrors.store_name}
            onChange={(v) => {
              clearFieldError("store_name");
              setPayload((p) => ({
                ...p,
                general: {
                  ...p.general,
                  store_name: v,
                  slug: p.general.slug.trim() ? p.general.slug : slugifyStoreName(v),
                },
              }));
            }}
          />
          <Field
            label="CNPJ"
            hint="14 dígitos — usado no contrato e faturamento."
            optional
            value={formatCnpjMasked(payload.general.cnpj)}
            error={fieldErrors.cnpj}
            inputMode="numeric"
            onChange={(v) => {
              clearFieldError("cnpj");
              setPayload((p) => ({
                ...p,
                general: { ...p.general, cnpj: digitsOnly(v).slice(0, 14) },
              }));
            }}
          />
          <Field
            label="Subdomínio desejado (slug)"
            hint="Ex.: minhaloja → minhaloja.autopainel.com.br (letras minúsculas, números e hífens)."
            value={payload.general.slug}
            error={fieldErrors.slug}
            onChange={(v) => {
              clearFieldError("slug");
              setPayload((p) => ({
                ...p,
                general: { ...p.general, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "") },
              }));
            }}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="size-4 rounded border-white/20"
              checked={payload.general.wants_custom_domain}
              onChange={(event) =>
                setPayload((p) => ({
                  ...p,
                  general: { ...p.general, wants_custom_domain: event.target.checked },
                }))
              }
            />
            Quero domínio personalizado (ex.: www.minhaloja.com.br)
          </label>
          {payload.general.wants_custom_domain ? (
            <Field
              label="Domínio personalizado"
              hint="Configuramos DNS após aprovação comercial."
              value={payload.general.custom_domain}
              onChange={(v) =>
                setPayload((p) => ({ ...p, general: { ...p.general, custom_domain: v } }))
              }
            />
          ) : null}
          <Field
            label="E-mail de contato comercial"
            value={payload.general.contact_email}
            error={fieldErrors.contact_email}
            type="email"
            autoComplete="email"
            onChange={(v) => {
              clearFieldError("contact_email");
              setPayload((p) => ({ ...p, general: { ...p.general, contact_email: v } }));
            }}
          />
          <Field
            label="WhatsApp comercial"
            hint="Com DDD — usado nos botões da vitrine."
            value={formatBrazilMobileMasked(payload.general.whatsapp)}
            error={fieldErrors.whatsapp}
            inputMode="tel"
            autoComplete="tel"
            onChange={(v) => {
              clearFieldError("whatsapp");
              setPayload((p) => ({ ...p, general: { ...p.general, whatsapp: v } }));
            }}
          />
          <Field
            label="Representante legal"
            value={payload.general.legal_representative_name}
            error={fieldErrors.legal_representative_name}
            autoComplete="name"
            onChange={(v) => {
              clearFieldError("legal_representative_name");
              setPayload((p) => ({
                ...p,
                general: { ...p.general, legal_representative_name: v },
              }));
            }}
          />
          <Field
            label="CPF do representante legal"
            value={formatCpfMasked(payload.general.legal_representative_cpf)}
            error={fieldErrors.legal_representative_cpf}
            inputMode="numeric"
            onChange={(v) => {
              clearFieldError("legal_representative_cpf");
              setPayload((p) => ({
                ...p,
                general: {
                  ...p.general,
                  legal_representative_cpf: digitsOnly(v).slice(0, 11),
                },
              }));
            }}
          />
          <BrazilianAddressFields
            legend="Endereço de cobrança"
            omitHiddenInputs
            value={payload.general.billing_address}
            onChange={(billing_address) =>
              setPayload((p) => ({
                ...p,
                general: { ...p.general, billing_address },
              }))
            }
          />
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="border-white/10 bg-card/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Identidade visual da vitrine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Suas cores e logos personalizam o site whitelabel. Campos vazios usam padrões da
            plataforma.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Cor primária"
              hint="Hexadecimal (#000000)"
              value={payload.branding.primary_color}
              onChange={(v) =>
                setPayload((p) => ({ ...p, branding: { ...p.branding, primary_color: v } }))
              }
            />
            <Field
              label="Cor do texto sobre primária"
              value={payload.branding.primary_foreground_color}
              onChange={(v) =>
                setPayload((p) => ({
                  ...p,
                  branding: { ...p.branding, primary_foreground_color: v },
                }))
              }
            />
            <Field
              label="Cor secundária (destaques)"
              value={payload.branding.secondary_color}
              onChange={(v) =>
                setPayload((p) => ({ ...p, branding: { ...p.branding, secondary_color: v } }))
              }
            />
          </div>
          <FileUploadField
            name="logo_dark_file"
            label="Logo fundo escuro"
            hint="PNG ou JPG até 2 MB — cabeçalho em tema escuro."
            accept={BRAND_ACCEPT}
            inputClassName={MARKETING_FILE_INPUT}
            onFileSelected={(file) => setUploadFile("logo_dark_file", file)}
          />
          <FileUploadField
            name="logo_light_file"
            label="Logo fundo claro"
            hint="PNG ou JPG até 2 MB — vitrine clara, painel e impressos."
            accept={BRAND_ACCEPT}
            inputClassName={MARKETING_FILE_INPUT}
            onFileSelected={(file) => setUploadFile("logo_light_file", file)}
          />
          <FileUploadField
            name="footer_logo_file"
            label="Logo rodapé"
            hint="Versão compacta para o rodapé do site."
            accept={BRAND_ACCEPT}
            inputClassName={MARKETING_FILE_INPUT}
            onFileSelected={(file) => setUploadFile("footer_logo_file", file)}
          />
          <FileUploadField
            name="favicon_file"
            label="Favicon"
            hint="Ícone quadrado — 32×32 ou 64×64 px."
            accept={BRAND_ACCEPT}
            inputClassName={MARKETING_FILE_INPUT}
            onFileSelected={(file) => setUploadFile("favicon_file", file)}
          />
          <Field
            label="Fonte dos títulos"
            hint="Nome exato da Google Font (ex.: Montserrat)."
            value={payload.branding.google_font_heading}
            onChange={(v) =>
              setPayload((p) => ({ ...p, branding: { ...p.branding, google_font_heading: v } }))
            }
          />
          <Field
            label="Fonte do corpo de texto"
            value={payload.branding.google_font_body}
            onChange={(v) =>
              setPayload((p) => ({ ...p, branding: { ...p.branding, google_font_body: v } }))
            }
          />
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="border-white/10 bg-card/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Aparência e homepage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Escolha o visual do site. Os textos abaixo valem para o layout selecionado.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tema da vitrine</Label>
              <select
                className={`flex h-10 w-full rounded-md px-3 text-sm ${MARKETING_FIELD}`}
                value={payload.storefront.theme_mode}
                onChange={(e) =>
                  setPayload((p) => ({
                    ...p,
                    storefront: {
                      ...p.storefront,
                      theme_mode: e.target.value === "dark" ? "dark" : "light",
                    },
                  }))
                }
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Modelo de layout</Label>
            <StorefrontLayoutPicker
              value={layoutId}
              labelMode="marketing"
              onChange={(next) =>
                setPayload((p) => ({
                  ...p,
                  storefront: { ...p.storefront, layout_id: next },
                }))
              }
              className="[&_button]:border-white/10 [&_button]:bg-zinc-900/50 [&_span]:text-white [&_.text-muted-foreground]:text-zinc-400"
            />
          </div>
          <FileUploadField
            name="hero_background_file"
            label="Imagem do banner principal (hero)"
            hint={`Recomendado ${ONBOARDING_HERO_BANNER_SPEC.width}×${ONBOARDING_HERO_BANNER_SPEC.height} px · JPG/PNG/WebP até 5 MB.`}
            accept={HERO_ACCEPT}
            inputClassName={MARKETING_FILE_INPUT}
            onFileSelected={(file) => setUploadFile("hero_background_file", file)}
          />
          <Field
            label="Destaque acima do título (eyebrow)"
            hint="Frase curta acima do H1 — ex.: «Há 20 anos no mercado»."
            value={activeHomeCopy.hero_eyebrow ?? ""}
            onChange={(v) => patchHomeCopy("hero_eyebrow", v)}
          />
          <Field
            label="Título principal (H1)"
            hint="Headline do banner — use {nome_loja} para inserir o nome automaticamente."
            value={activeHomeCopy.hero_headline ?? ""}
            onChange={(v) => patchHomeCopy("hero_headline", v)}
          />
          <div className="space-y-2">
            <Label>Subtítulo do banner</Label>
            <Textarea
              rows={3}
              className={MARKETING_FIELD}
              value={activeHomeCopy.hero_subheadline ?? ""}
              onChange={(e) => patchHomeCopy("hero_subheadline", e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              Complemento do título — proposta de valor em 1–2 frases.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Texto do botão — Ver estoque"
              hint="Ex.: «Ver estoque completo»."
              value={activeHomeCopy.hero_cta_stock ?? ""}
              onChange={(v) => patchHomeCopy("hero_cta_stock", v)}
            />
            <Field
              label="Texto do botão — WhatsApp"
              hint="Ex.: «Falar no WhatsApp»."
              value={activeHomeCopy.hero_cta_whatsapp ?? ""}
              onChange={(v) => patchHomeCopy("hero_cta_whatsapp", v)}
            />
          </div>
          <Field
            label="Texto do link secundário"
            hint="Ex.: «Explorar veículos»."
            value={activeHomeCopy.hero_browse_stock ?? ""}
            onChange={(v) => patchHomeCopy("hero_browse_stock", v)}
          />
          {layoutId === 1 ? (
            <div className="space-y-3 rounded-lg border border-white/10 p-4">
              <p className="text-sm font-medium text-white">Card lateral (layout 1)</p>
              <Field
                label="Título do card lateral"
                hint="Ex.: «Por que comprar conosco?»"
                value={activeHomeCopy.hero_sidecard_title ?? ""}
                onChange={(v) => patchHomeCopy("hero_sidecard_title", v)}
              />
              {sidecardItems.map((item, index) => (
                <Field
                  key={`sidecard-${index}`}
                  label={`Item do card ${index + 1}`}
                  hint="Bullet curto — garantia, revisão, troca facilitada."
                  value={item}
                  onChange={(v) => patchSidecardItem(index, v)}
                />
              ))}
            </div>
          ) : null}
          <div className="space-y-3 rounded-lg border border-white/10 p-4">
            <p className="text-sm font-medium text-white">Faixa de confiança (abaixo do banner)</p>
            <p className="text-xs text-zinc-500">
              Indicadores de credibilidade — ex.: valor «15+», rótulo «Anos de mercado».
            </p>
            <KeyValueRepeater
              rows={trustStatRows}
              keyLabel="Valor"
              valueLabel="Rótulo"
              minRows={TRUST_STAT_COUNT}
              maxRows={TRUST_STAT_COUNT}
              rowLegendPrefix="Indicador"
              inputClassName={MARKETING_FIELD}
              onChange={patchTrustStatsRows}
            />
          </div>
          <Field
            label="Destaque «Nossa história»"
            hint="Ex.: «Tradição e confiança»."
            value={activeHomeCopy.heritage_eyebrow ?? ""}
            onChange={(v) => patchHomeCopy("heritage_eyebrow", v)}
          />
          <Field
            label="Título da seção «Nossa história»"
            value={activeHomeCopy.heritage_headline ?? ""}
            onChange={(v) => patchHomeCopy("heritage_headline", v)}
          />
          <div className="space-y-2">
            <Label>Texto institucional da homepage</Label>
            <Textarea
              rows={4}
              className={MARKETING_FIELD}
              value={activeHomeCopy.heritage_body ?? ""}
              onChange={(e) => patchHomeCopy("heritage_body", e.target.value)}
            />
            <p className="text-xs text-zinc-500">
              Se vazio, usamos o campo «Sobre a loja» do passo 4.
            </p>
          </div>
          <div className="space-y-3 rounded-lg border border-white/10 p-4">
            <p className="text-sm font-medium text-white">Indicadores institucionais</p>
            <KeyValueRepeater
              rows={heritageStatRows}
              keyLabel="Valor"
              valueLabel="Rótulo"
              minRows={HERITAGE_STAT_COUNT}
              maxRows={HERITAGE_STAT_COUNT}
              rowLegendPrefix="Indicador"
              inputClassName={MARKETING_FIELD}
              onChange={patchHeritageStatsRows}
            />
          </div>
          <Field
            label="Título do bloco de financiamento"
            value={activeHomeCopy.finance_title ?? ""}
            onChange={(v) => patchHomeCopy("finance_title", v)}
          />
          <Field
            label="Subtítulo do financiamento"
            hint="Ex.: «Parcelas estimadas em segundos, sem compromisso»."
            value={activeHomeCopy.finance_subtitle ?? ""}
            onChange={(v) => patchHomeCopy("finance_subtitle", v)}
          />
          <Field
            label="Botão do simulador"
            hint="Ex.: «Simular agora»."
            value={activeHomeCopy.finance_cta ?? ""}
            onChange={(v) => patchHomeCopy("finance_cta", v)}
          />
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="border-white/10 bg-card/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Conteúdo institucional e unidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sobre a loja (página institucional)</Label>
            <Textarea
              rows={5}
              className={MARKETING_FIELD}
              value={payload.institutional.about_text}
              onChange={(e) =>
                setPayload((p) => ({
                  ...p,
                  institutional: { ...p.institutional, about_text: e.target.value },
                }))
              }
            />
            <p className="text-xs text-zinc-500">
              História, diferenciais e tom da marca — aparece na vitrine e alimenta textos vazios da
              homepage.
            </p>
          </div>
          <Field
            label="Instagram"
            value={payload.institutional.social_instagram}
            onChange={(v) =>
              setPayload((p) => ({
                ...p,
                institutional: { ...p.institutional, social_instagram: v },
              }))
            }
          />
          <Field
            label="Facebook"
            value={payload.institutional.social_facebook}
            onChange={(v) =>
              setPayload((p) => ({
                ...p,
                institutional: { ...p.institutional, social_facebook: v },
              }))
            }
          />
          <Field
            label="Site atual (se houver)"
            value={payload.institutional.social_website}
            onChange={(v) =>
              setPayload((p) => ({
                ...p,
                institutional: { ...p.institutional, social_website: v },
              }))
            }
          />
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Unidades e filiais</p>
            <p className="text-xs text-zinc-500">
              Cadastre matriz e filiais. Cada unidade pode ter WhatsApp e endereço próprios na
              vitrine.
            </p>
            {units.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-zinc-400">
                <p className="font-medium text-white">Só uma unidade?</p>
                <p className="mt-1">
                  Se você opera em um único endereço, pode pular esta etapa. Nossa equipe usa o
                  endereço de cobrança como referência.
                </p>
              </div>
            ) : null}
            {units.map((unit, index) => (
              <div key={`unit-${index}`} className="space-y-3 rounded-lg border border-white/10 p-4">
                <Field
                  label={`Nome da unidade ${index + 1}`}
                  value={unit.name}
                  onChange={(v) => {
                    const next = [...units];
                    next[index] = { ...next[index], name: v };
                    setUnits(next);
                  }}
                />
                <Field
                  label="WhatsApp da unidade"
                  value={formatBrazilMobileMasked(unit.whatsapp_number)}
                  onChange={(v) => {
                    const next = [...units];
                    next[index] = { ...next[index], whatsapp_number: v };
                    setUnits(next);
                  }}
                />
                <BrazilianAddressFields
                  legend="Endereço da unidade"
                  omitHiddenInputs
                  value={unit.address}
                  onChange={(address) => {
                    const next = [...units];
                    next[index] = { ...next[index], address };
                    setUnits(next);
                  }}
                />
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-white/20"
                    checked={unit.is_primary}
                    onChange={(event) => {
                      const next = units.map((row, rowIndex) => ({
                        ...row,
                        is_primary: rowIndex === index ? event.target.checked : false,
                      }));
                      setUnits(next);
                    }}
                  />
                  Esta é a unidade principal (matriz)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUnits((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remover unidade
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setUnits((prev) => [...prev, EMPTY_UNIT()])}
            >
              Adicionar unidade
            </Button>
          </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="border-white/10 bg-card/40">
          <CardHeader>
            <CardTitle className="text-lg text-white">Confirmação e termos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Plano Essencial · trial gratuito por {TRIAL_DURATION_DAYS} dias · Simulador, QR Code e
            Métricas avançadas inclusos.
            {acceptsImmediateTrial ? (
              <>
                {" "}
                Nesta campanha, a taxa de setup de R$ 497 é isenta para vagas imediatas. Após o
                trial, a continuidade exige contratação do plano pago.
              </>
            ) : (
              <>
                {" "}
                Você está solicitando entrada na fila de espera — entraremos em contato quando
                abrirem novas vagas com setup isento.
              </>
            )}
          </p>
          <label className="flex items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-white/20"
              checked={trialAccepted}
              onChange={(event) => setTrialAccepted(event.target.checked)}
            />
            <span>
              Li e aceito o{" "}
              <LegalDocumentLink document="trial-adhesion">
                Termo de Adesão ao Trial
              </LegalDocumentLink>{" "}
              (versão {TRIAL_ADHESION_VERSION}), incluindo autorização para a AutoPainel tratar e{" "}
              <strong> deter</strong> os dados pessoais de clientes e leads captados na vitrine, na
              qualidade de operadora e detentora conforme LGPD.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-white/20"
              checked={platformTermsAccepted}
              onChange={(event) => setPlatformTermsAccepted(event.target.checked)}
            />
            <span>
              Li e aceito os{" "}
              <LegalDocumentLink document="platform-terms">Termos de Uso</LegalDocumentLink> da
              plataforma AutoPainel (versão {PLATFORM_TERMS_VERSION}). *
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-white/20"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
            />
            <span>
              Li e aceito a{" "}
              <LegalDocumentLink document="privacy-policy">Política de Privacidade</LegalDocumentLink>{" "}
              da AutoPainel (versão {PRIVACY_POLICY_VERSION}). *
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-zinc-400">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border-white/20"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
            />
            <span>Quero receber novidades comerciais da AutoPainel (opcional).</span>
          </label>
          </CardContent>
        </Card>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-3 border-t border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setStepError(null);
              setFieldErrors({});
              setStep(step - 1);
            }}
          >
            Voltar
          </Button>
        ) : null}
        {step < WIZARD_STEPS.length - 1 ? (
          <Button type="button" disabled={pending} onClick={handleContinue}>
            Continuar
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={pending || !trialAccepted || !platformTermsAccepted || !privacyAccepted}
            className="bg-marketing-accent text-zinc-950 hover:bg-marketing-accent/90"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enviando…
              </>
            ) : acceptsImmediateTrial ? (
              "Enviar adesão ao trial"
            ) : (
              "Entrar na fila de espera"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  error,
  optional = false,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {optional ? <span className="font-normal text-zinc-500"> (opcional)</span> : null}
      </Label>
      <Input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(MARKETING_FIELD, error ? "border-red-500/50 focus-visible:ring-red-500/40" : null)}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
