"use client";

import type {
  StorefrontHomeConfig,
  StorefrontHomeLayoutCopy,
  StorefrontHomeLayoutKey,
  StorefrontHomeTrustStat,
} from "@autopainel/shared/types";
import {
  STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME,
  defaultStorefrontHomeLayoutCopy,
} from "@autopainel/shared/lib/dealership/storefront-home-copy";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import { Input, Label, Textarea } from "@autopainel/shared/ui";
import { useEffect, useMemo, useState } from "react";

import { DealershipBrandUpload } from "./dealership-brand-upload";

interface StorefrontHomeContentFieldsProps {
  layoutId: StorefrontLayoutTemplateId;
  initialConfig: StorefrontHomeConfig | null;
  dealershipName: string;
  sellsMotorcycles: boolean;
  disabled?: boolean;
}

function layoutKey(layoutId: StorefrontLayoutTemplateId): StorefrontHomeLayoutKey {
  return String(layoutId) as StorefrontHomeLayoutKey;
}

function emptyTrustStats(count: number): StorefrontHomeTrustStat[] {
  return Array.from({ length: count }, () => ({ value: "", label: "" }));
}

function mergeTrustStats(
  current: StorefrontHomeTrustStat[] | undefined,
  count: number,
): StorefrontHomeTrustStat[] {
  const base = emptyTrustStats(count);
  if (!Array.isArray(current)) {
    return base;
  }
  return base.map((slot, index) => ({
    value: current[index]?.value ?? "",
    label: current[index]?.label ?? "",
  }));
}

function mergeSidecardItems(current: string[] | undefined): string[] {
  const base = ["", "", ""];
  if (!Array.isArray(current)) {
    return base;
  }
  return base.map((_, index) => current[index] ?? "");
}

export function StorefrontHomeContentFields({
  layoutId,
  initialConfig,
  dealershipName,
  sellsMotorcycles,
  disabled,
}: StorefrontHomeContentFieldsProps) {
  const [byLayout, setByLayout] = useState<
    Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>>
  >(initialConfig?.by_layout ?? {});

  useEffect(() => {
    setByLayout(initialConfig?.by_layout ?? {});
  }, [initialConfig]);

  const layoutDefaults = useMemo(
    () =>
      defaultStorefrontHomeLayoutCopy(layoutId, {
        dealershipName: dealershipName || "Nossa loja",
        sellsMotorcycles,
      }),
    [dealershipName, layoutId, sellsMotorcycles],
  );

  const activeKey = layoutKey(layoutId);
  const activeCopy = byLayout[activeKey] ?? {};

  function patchActiveCopy(patch: Partial<StorefrontHomeLayoutCopy>) {
    setByLayout((prev) => ({
      ...prev,
      [activeKey]: {
        ...(prev[activeKey] ?? {}),
        ...patch,
      },
    }));
  }

  function updateTrustStat(
    field: "trust_stats" | "heritage_stats",
    index: number,
    key: "value" | "label",
    value: string,
  ) {
    const count = field === "trust_stats" ? 4 : layoutId === 2 ? 2 : 3;
    const current = mergeTrustStats(activeCopy[field], count);
    current[index] = { ...current[index], [key]: value };
    patchActiveCopy({ [field]: current });
  }

  const trustStats = mergeTrustStats(activeCopy.trust_stats, 4);
  const heritageStats = mergeTrustStats(activeCopy.heritage_stats, layoutId === 2 ? 2 : 3);
  const sidecardItems = mergeSidecardItems(activeCopy.hero_sidecard_items);

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">Homepage da vitrine</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Personalize textos e banner da homepage para o layout selecionado. Use{" "}
          <code className="rounded bg-muted px-1">{STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME}</code>{" "}
          onde quiser inserir o nome da loja. Campos vazios usam o texto padrão da plataforma.
        </p>
      </div>

      <DealershipBrandUpload
        fileInputName="hero_background_file"
        hiddenUrlName="hero_background_url"
        label="Imagem de fundo do banner principal"
        description="Envie uma foto (até 5 MB) ou informe uma URL HTTPS pública. Recomendado: 1800×900 px ou similar."
        initialRemoteUrl={initialConfig?.hero_background_url ?? ""}
        disabled={disabled}
      />

      <input
        type="hidden"
        name="storefront_home_json"
        value={JSON.stringify(byLayout)}
        readOnly
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="home-hero-eyebrow"
          label="Destaque acima do título"
          placeholder={layoutDefaults.hero_eyebrow ?? ""}
          value={activeCopy.hero_eyebrow ?? ""}
          onChange={(value) => patchActiveCopy({ hero_eyebrow: value })}
          disabled={disabled}
        />
        <Field
          id="home-hero-headline"
          label="Título principal (H1)"
          placeholder={layoutDefaults.hero_headline ?? ""}
          value={activeCopy.hero_headline ?? ""}
          onChange={(value) => patchActiveCopy({ hero_headline: value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="home-hero-subheadline">Subtítulo do banner</Label>
        <Textarea
          id="home-hero-subheadline"
          rows={3}
          placeholder={layoutDefaults.hero_subheadline ?? ""}
          value={activeCopy.hero_subheadline ?? ""}
          disabled={disabled}
          onChange={(event) => patchActiveCopy({ hero_subheadline: event.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="home-hero-cta-stock"
          label="Botão — estoque"
          placeholder={layoutDefaults.hero_cta_stock ?? ""}
          value={activeCopy.hero_cta_stock ?? ""}
          onChange={(value) => patchActiveCopy({ hero_cta_stock: value })}
          disabled={disabled}
        />
        <Field
          id="home-hero-cta-whatsapp"
          label="Botão — WhatsApp"
          placeholder={layoutDefaults.hero_cta_whatsapp ?? ""}
          value={activeCopy.hero_cta_whatsapp ?? ""}
          onChange={(value) => patchActiveCopy({ hero_cta_whatsapp: value })}
          disabled={disabled}
        />
        <Field
          id="home-hero-browse"
          label="Link secundário — explorar"
          placeholder={layoutDefaults.hero_browse_stock ?? ""}
          value={activeCopy.hero_browse_stock ?? ""}
          onChange={(value) => patchActiveCopy({ hero_browse_stock: value })}
          disabled={disabled}
        />
      </div>

      {layoutId === 1 ? (
        <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Card lateral (layout clássico)</p>
          <Field
            id="home-sidecard-title"
            label="Título do card"
            placeholder={layoutDefaults.hero_sidecard_title ?? ""}
            value={activeCopy.hero_sidecard_title ?? ""}
            onChange={(value) => patchActiveCopy({ hero_sidecard_title: value })}
            disabled={disabled}
          />
          {sidecardItems.map((item, index) => (
            <Field
              key={`sidecard-${index}`}
              id={`home-sidecard-item-${index}`}
              label={`Item ${index + 1}`}
              placeholder={layoutDefaults.hero_sidecard_items?.[index] ?? ""}
              value={item}
              onChange={(value) => {
                const next = [...sidecardItems];
                next[index] = value;
                patchActiveCopy({ hero_sidecard_items: next });
              }}
              disabled={disabled}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
        <p className="text-sm font-medium text-foreground">Seção «Nossa história»</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="home-heritage-eyebrow"
            label="Destaque"
            placeholder={layoutDefaults.heritage_eyebrow ?? ""}
            value={activeCopy.heritage_eyebrow ?? ""}
            onChange={(value) => patchActiveCopy({ heritage_eyebrow: value })}
            disabled={disabled}
          />
          <Field
            id="home-heritage-headline"
            label="Título"
            placeholder={layoutDefaults.heritage_headline ?? ""}
            value={activeCopy.heritage_headline ?? ""}
            onChange={(value) => patchActiveCopy({ heritage_headline: value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="home-heritage-body">Texto</Label>
          <Textarea
            id="home-heritage-body"
            rows={3}
            placeholder={layoutDefaults.heritage_body ?? ""}
            value={activeCopy.heritage_body ?? ""}
            disabled={disabled}
            onChange={(event) => patchActiveCopy({ heritage_body: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, a vitrine usa o campo «Sobre a loja» abaixo como fallback.
          </p>
        </div>
        {layoutId !== 3 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {heritageStats.map((stat, index) => (
              <div key={`heritage-stat-${index}`} className="grid grid-cols-2 gap-2">
                <Field
                  id={`heritage-stat-value-${index}`}
                  label={`Indicador ${index + 1}`}
                  placeholder={
                    defaultStorefrontHomeLayoutCopy(layoutId, {
                      dealershipName: dealershipName || "Nossa loja",
                      sellsMotorcycles,
                    }).heritage_stats?.[index]?.value ?? ""
                  }
                  value={stat.value}
                  onChange={(value) => updateTrustStat("heritage_stats", index, "value", value)}
                  disabled={disabled}
                />
                <Field
                  id={`heritage-stat-label-${index}`}
                  label="Rótulo"
                  placeholder={
                    defaultStorefrontHomeLayoutCopy(layoutId, {
                      dealershipName: dealershipName || "Nossa loja",
                      sellsMotorcycles,
                    }).heritage_stats?.[index]?.label ?? ""
                  }
                  value={stat.label}
                  onChange={(value) => updateTrustStat("heritage_stats", index, "label", value)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {layoutId === 1 ? (
        <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Bloco financiamento</p>
          <Field
            id="home-finance-title"
            label="Título"
            placeholder={layoutDefaults.finance_title ?? ""}
            value={activeCopy.finance_title ?? ""}
            onChange={(value) => patchActiveCopy({ finance_title: value })}
            disabled={disabled}
          />
          <div className="space-y-2">
            <Label htmlFor="home-finance-subtitle">Subtítulo</Label>
            <Textarea
              id="home-finance-subtitle"
              rows={2}
              placeholder={layoutDefaults.finance_subtitle ?? ""}
              value={activeCopy.finance_subtitle ?? ""}
              disabled={disabled}
              onChange={(event) => patchActiveCopy({ finance_subtitle: event.target.value })}
            />
          </div>
          <Field
            id="home-finance-cta"
            label="Botão"
            placeholder={layoutDefaults.finance_cta ?? ""}
            value={activeCopy.finance_cta ?? ""}
            onChange={(value) => patchActiveCopy({ finance_cta: value })}
            disabled={disabled}
          />
        </div>
      ) : null}

      {layoutId === 2 ? (
        <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Faixa de indicadores</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustStats.map((stat, index) => (
              <div key={`trust-stat-${index}`} className="grid grid-cols-2 gap-2">
                <Field
                  id={`trust-stat-value-${index}`}
                  label={`Indicador ${index + 1}`}
                  placeholder={layoutDefaults.trust_stats?.[index]?.value ?? ""}
                  value={stat.value}
                  onChange={(value) => updateTrustStat("trust_stats", index, "value", value)}
                  disabled={disabled}
                />
                <Field
                  id={`trust-stat-label-${index}`}
                  label="Rótulo"
                  placeholder={layoutDefaults.trust_stats?.[index]?.label ?? ""}
                  value={stat.label}
                  onChange={(value) => updateTrustStat("trust_stats", index, "label", value)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
