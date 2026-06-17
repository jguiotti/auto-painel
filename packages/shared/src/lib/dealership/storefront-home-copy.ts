import type {
  DealershipContentConfig,
  StorefrontHomeConfig,
  StorefrontHomeLayoutCopy,
  StorefrontHomeLayoutKey,
  StorefrontHomeTrustStat,
} from "../../types/dealership-config";
import type { StorefrontLayoutTemplateId } from "../../types/dealership-storefront";

export const DEFAULT_STOREFRONT_HERO_BACKGROUND_URL =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80";

export const STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME = "{nome_loja}";

export interface StorefrontHomeResolveContext {
  dealershipName: string;
  sellsMotorcycles: boolean;
}

export interface ResolvedStorefrontHomeCopy {
  heroBackgroundUrl: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaStock: string;
  heroCtaWhatsapp: string;
  heroBrowseStock: string;
  heroSidecardTitle: string | null;
  heroSidecardItems: string[];
  heritageEyebrow: string;
  heritageHeadline: string;
  heritageBody: string;
  heritageStats: StorefrontHomeTrustStat[];
  financeTitle: string;
  financeSubtitle: string;
  financeCta: string;
  trustStats: StorefrontHomeTrustStat[];
}

function layoutKeyFromId(layoutId: StorefrontLayoutTemplateId): StorefrontHomeLayoutKey {
  return String(layoutId) as StorefrontHomeLayoutKey;
}

function vehicleNoun(sellsMotorcycles: boolean): string {
  return sellsMotorcycles ? "veículo" : "carro";
}

function inventoryLabel(sellsMotorcycles: boolean): string {
  return sellsMotorcycles ? "automóveis e motocicletas" : "veículos selecionados";
}

export function applyStorefrontHomePlaceholders(
  value: string,
  dealershipName: string,
): string {
  return value.split(STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME).join(dealershipName.trim());
}

function pickString(
  override: string | undefined,
  fallback: string,
  dealershipName: string,
): string {
  const raw = override?.trim() ? override.trim() : fallback;
  return applyStorefrontHomePlaceholders(raw, dealershipName);
}

function pickOptionalItems(
  override: string[] | undefined,
  fallback: string[],
): string[] {
  if (Array.isArray(override) && override.length > 0) {
    const cleaned = override.map((item) => item.trim()).filter(Boolean);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return fallback;
}

function pickStats(
  override: StorefrontHomeTrustStat[] | undefined,
  fallback: StorefrontHomeTrustStat[],
): StorefrontHomeTrustStat[] {
  if (!Array.isArray(override) || override.length === 0) {
    return fallback;
  }
  const cleaned = override
    .map((item) => ({
      value: item.value?.trim() ?? "",
      label: item.label?.trim() ?? "",
    }))
    .filter((item) => item.value && item.label)
    .slice(0, 4);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function readStorefrontHomeConfig(
  contentConfig: DealershipContentConfig | Record<string, unknown> | null | undefined,
): StorefrontHomeConfig | null {
  if (!contentConfig || typeof contentConfig !== "object" || Array.isArray(contentConfig)) {
    return null;
  }
  const raw = (contentConfig as DealershipContentConfig).storefront_home;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw;
}

export function defaultStorefrontHomeLayoutCopy(
  layoutId: StorefrontLayoutTemplateId,
  context: StorefrontHomeResolveContext,
): StorefrontHomeLayoutCopy {
  const name = context.dealershipName.trim() || "Nossa loja";
  const noun = vehicleNoun(context.sellsMotorcycles);
  const inventory = inventoryLabel(context.sellsMotorcycles);

  if (layoutId === 2) {
    return {
      hero_eyebrow: "Performance e procedência",
      hero_headline: name,
      hero_subheadline: context.sellsMotorcycles
        ? "Automóveis premium e motocicletas selecionadas — atendimento consultivo, revisão completa e condições transparentes."
        : `Encontre o ${noun} ideal com atendimento próximo, revisão completa e condições transparentes de compra.`,
      hero_cta_stock: `Encontre seu ${noun}`,
      hero_cta_whatsapp: "Agendar test drive no WhatsApp",
      hero_browse_stock: "Explorar estoque",
      heritage_eyebrow: "Nossa história",
      heritage_headline: "Uma herança forjada na busca pela perfeição.",
      heritage_body:
        "Experiência consultiva com histórico transparente e curadoria rigorosa.",
      trust_stats: [
        { value: "48h", label: "Resposta média" },
        { value: "100%", label: "Revisados" },
        { value: "15+", label: "Anos no mercado" },
        { value: "500+", label: "Clientes atendidos" },
      ],
    };
  }

  if (layoutId === 3) {
    return {
      hero_eyebrow: "Seminovos com procedência",
      hero_headline: `Seu próximo ${noun} está aqui`,
      hero_subheadline: `${STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME} — estoque atualizado, ${inventory} revisados e equipe pronta para ajudar você a decidir com segurança.`,
      hero_cta_stock: `Encontre seu ${noun}`,
      hero_cta_whatsapp: "Agendar test drive no WhatsApp",
      hero_browse_stock: "Explorar estoque",
    };
  }

  return {
    hero_eyebrow: "Compra com confiança",
    hero_headline: context.sellsMotorcycles
      ? "Automóveis e motocicletas com quem entende do mercado."
      : `Encontre seu ${noun} com quem entende do mercado.`,
    hero_subheadline: `${STOREFRONT_HOME_PLACEHOLDER_DEALERSHIP_NAME} — ${inventory} com garantia e atendimento personalizado do primeiro contato à entrega.`,
    hero_cta_stock: `Encontre seu ${noun}`,
    hero_cta_whatsapp: "Agendar test drive no WhatsApp",
    hero_browse_stock: "Explorar estoque",
    hero_sidecard_title: "Experiência premium",
    hero_sidecard_items: [
      "Curadoria rigorosa de cada unidade do estoque",
      "Financiamento com simulação rápida e transparente",
      "Atendimento consultivo do primeiro contato à entrega",
    ],
    heritage_eyebrow: "Nossa história",
    heritage_headline: "Mais de três décadas conectando pessoas e máquinas extraordinárias.",
    heritage_body:
      "Experiência consultiva com histórico transparente e curadoria rigorosa.",
    finance_title: "Simule o financiamento em segundos",
    finance_subtitle:
      "Descubra a parcela estimada e receba uma proposta personalizada da nossa equipe.",
    finance_cta: "Quero minha proposta",
    heritage_stats: [
      { value: "1,2k+", label: "Veículos entregues" },
      { value: "100%", label: "Procedência garantida" },
      { value: "VIP", label: "Atendimento dedicado" },
    ],
  };
}

export function resolveStorefrontHomeCopy(params: {
  contentConfig: DealershipContentConfig | Record<string, unknown> | null | undefined;
  layoutId: StorefrontLayoutTemplateId;
  context: StorefrontHomeResolveContext;
}): ResolvedStorefrontHomeCopy {
  const { layoutId, context } = params;
  const defaults = defaultStorefrontHomeLayoutCopy(layoutId, context);
  const layoutKey = layoutKeyFromId(layoutId);
  const homeConfig = readStorefrontHomeConfig(params.contentConfig);
  const overrides = homeConfig?.by_layout?.[layoutKey] ?? {};

  const contentRecord =
    params.contentConfig && typeof params.contentConfig === "object" && !Array.isArray(params.contentConfig)
      ? (params.contentConfig as DealershipContentConfig)
      : null;

  const aboutFallback =
    typeof contentRecord?.about_text === "string" && contentRecord.about_text.trim()
      ? contentRecord.about_text.trim()
      : defaults.heritage_body ?? "";

  const heroBackgroundUrl =
    homeConfig?.hero_background_url?.trim() || DEFAULT_STOREFRONT_HERO_BACKGROUND_URL;

  const heritageStatsDefault =
    layoutId === 2
      ? [
          { value: "15+", label: "Anos de história" },
          { value: "500+", label: "Sonhos entregues" },
        ]
      : (defaults.heritage_stats ?? []);

  return {
    heroBackgroundUrl,
    heroEyebrow: pickString(overrides.hero_eyebrow, defaults.hero_eyebrow ?? "", context.dealershipName),
    heroHeadline: pickString(overrides.hero_headline, defaults.hero_headline ?? "", context.dealershipName),
    heroSubheadline: pickString(
      overrides.hero_subheadline,
      defaults.hero_subheadline ?? "",
      context.dealershipName,
    ),
    heroCtaStock: pickString(overrides.hero_cta_stock, defaults.hero_cta_stock ?? "Explorar estoque", context.dealershipName),
    heroCtaWhatsapp: pickString(
      overrides.hero_cta_whatsapp,
      defaults.hero_cta_whatsapp ?? "Agendar test drive no WhatsApp",
      context.dealershipName,
    ),
    heroBrowseStock: pickString(
      overrides.hero_browse_stock,
      defaults.hero_browse_stock ?? "Explorar estoque",
      context.dealershipName,
    ),
    heroSidecardTitle:
      layoutId === 1
        ? pickString(
            overrides.hero_sidecard_title,
            defaults.hero_sidecard_title ?? "",
            context.dealershipName,
          )
        : null,
    heroSidecardItems:
      layoutId === 1
        ? pickOptionalItems(overrides.hero_sidecard_items, defaults.hero_sidecard_items ?? [])
        : [],
    heritageEyebrow: pickString(
      overrides.heritage_eyebrow,
      defaults.heritage_eyebrow ?? "Nossa história",
      context.dealershipName,
    ),
    heritageHeadline: pickString(
      overrides.heritage_headline,
      defaults.heritage_headline ?? "",
      context.dealershipName,
    ),
    heritageBody: pickString(overrides.heritage_body, aboutFallback, context.dealershipName),
    heritageStats: pickStats(overrides.heritage_stats, heritageStatsDefault),
    financeTitle: pickString(
      overrides.finance_title,
      defaults.finance_title ?? "Simule o financiamento em segundos",
      context.dealershipName,
    ),
    financeSubtitle: pickString(
      overrides.finance_subtitle,
      defaults.finance_subtitle ?? "",
      context.dealershipName,
    ),
    financeCta: pickString(
      overrides.finance_cta,
      defaults.finance_cta ?? "Quero minha proposta",
      context.dealershipName,
    ),
    trustStats: pickStats(overrides.trust_stats, defaults.trust_stats ?? []),
  };
}

export function parseStorefrontHomeJson(raw: string): Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>> {
  if (!raw.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>>;
  } catch {
    return {};
  }
}

export function sanitizeStorefrontHomeLayoutCopy(
  copy: StorefrontHomeLayoutCopy | undefined,
): StorefrontHomeLayoutCopy | undefined {
  if (!copy || typeof copy !== "object") {
    return undefined;
  }

  const out: StorefrontHomeLayoutCopy = {};
  const stringFields: (keyof StorefrontHomeLayoutCopy)[] = [
    "hero_eyebrow",
    "hero_headline",
    "hero_subheadline",
    "hero_cta_stock",
    "hero_cta_whatsapp",
    "hero_browse_stock",
    "hero_sidecard_title",
    "heritage_eyebrow",
    "heritage_headline",
    "heritage_body",
    "finance_title",
    "finance_subtitle",
    "finance_cta",
  ];

  for (const field of stringFields) {
    const value = copy[field];
    if (typeof value === "string" && value.trim()) {
      (out as Record<string, string>)[field] = value.trim();
    }
  }

  if (Array.isArray(copy.hero_sidecard_items)) {
    const items = copy.hero_sidecard_items.map((item) => item.trim()).filter(Boolean);
    if (items.length > 0) {
      out.hero_sidecard_items = items.slice(0, 5);
    }
  }

  if (Array.isArray(copy.trust_stats)) {
    const stats = copy.trust_stats
      .map((item) => ({
        value: item.value?.trim() ?? "",
        label: item.label?.trim() ?? "",
      }))
      .filter((item) => item.value && item.label)
      .slice(0, 4);
    if (stats.length > 0) {
      out.trust_stats = stats;
    }
  }

  if (Array.isArray(copy.heritage_stats)) {
    const stats = copy.heritage_stats
      .map((item) => ({
        value: item.value?.trim() ?? "",
        label: item.label?.trim() ?? "",
      }))
      .filter((item) => item.value && item.label)
      .slice(0, 4);
    if (stats.length > 0) {
      out.heritage_stats = stats;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function mergeStorefrontHomeConfig(params: {
  existing: StorefrontHomeConfig | null | undefined;
  byLayoutJson: Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>>;
  heroBackgroundUrl: string | null;
}): StorefrontHomeConfig | undefined {
  const mergedByLayout: Partial<Record<StorefrontHomeLayoutKey, StorefrontHomeLayoutCopy>> = {
    ...(params.existing?.by_layout ?? {}),
  };

  for (const key of ["1", "2", "3"] as StorefrontHomeLayoutKey[]) {
    const sanitized = sanitizeStorefrontHomeLayoutCopy(params.byLayoutJson[key]);
    if (sanitized) {
      mergedByLayout[key] = sanitized;
    } else {
      delete mergedByLayout[key];
    }
  }

  const heroUrl = params.heroBackgroundUrl?.trim() || params.existing?.hero_background_url?.trim() || "";

  const out: StorefrontHomeConfig = {};
  if (heroUrl) {
    out.hero_background_url = heroUrl;
  }
  if (Object.keys(mergedByLayout).length > 0) {
    out.by_layout = mergedByLayout;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function sellsMotorcyclesFromContentConfig(
  contentConfig: Record<string, unknown> | null | undefined,
  slug?: string | null,
): boolean {
  if (slug === "guiotti") {
    return true;
  }
  if (!contentConfig || typeof contentConfig !== "object") {
    return false;
  }
  return contentConfig.sells_motorcycles === true;
}
