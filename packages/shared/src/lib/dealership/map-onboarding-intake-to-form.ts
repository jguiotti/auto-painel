import type {
  BrazilianAddressFields,
  StorefrontHomeConfig,
  StorefrontHomeLayoutKey,
  StorefrontThemeMode,
} from "../../types/dealership-config";
import type {
  DealershipOnboardingIntakePayload,
  DealershipOnboardingUnitDraft,
} from "../../types/dealership-onboarding-intake";
import type { StorefrontLayoutTemplateId } from "../../types/dealership-storefront";

export interface DealershipCreatePrefillFromIntake {
  name: string;
  slug: string;
  cnpj: string;
  custom_domain: string;
  contact_email: string;
  whatsapp_number: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  logo_light_url: string;
  logo_dark_url: string;
  footer_logo_url: string;
  favicon_url: string;
  google_font_heading: string;
  google_font_body: string;
  about_text: string;
  hq_address: BrazilianAddressFields;
  social_instagram: string;
  social_facebook: string;
  social_website: string;
  layout_id: StorefrontLayoutTemplateId;
  storefront_theme_mode: StorefrontThemeMode;
  storefront_home_config: StorefrontHomeConfig | null;
  hero_background_url: string;
  units: DealershipOnboardingUnitDraft[];
  pricing_plan_slug: "starter" | "trial";
}

function layoutKey(layoutId: StorefrontLayoutTemplateId): StorefrontHomeLayoutKey {
  return String(layoutId) as StorefrontHomeLayoutKey;
}

export function mapOnboardingIntakeToDealershipPrefill(
  payload: DealershipOnboardingIntakePayload,
): DealershipCreatePrefillFromIntake {
  const layoutId = payload.storefront.layout_id ?? 1;
  const layoutCopy = payload.storefront.home_copy_by_layout?.[layoutKey(layoutId)];

  const storefrontHome: StorefrontHomeConfig = {
    hero_background_url: payload.storefront.hero_background_url || undefined,
    by_layout: payload.storefront.home_copy_by_layout ?? {},
  };

  if (layoutCopy) {
    storefrontHome.by_layout = {
      ...storefrontHome.by_layout,
      [layoutKey(layoutId)]: layoutCopy,
    };
  }

  return {
    name: payload.general.store_name,
    slug: payload.general.slug,
    cnpj: payload.general.cnpj,
    custom_domain: payload.general.wants_custom_domain ? payload.general.custom_domain : "",
    contact_email: payload.general.contact_email,
    whatsapp_number: payload.general.whatsapp,
    primary: payload.branding.primary_color || "#0f172a",
    primaryForeground: payload.branding.primary_foreground_color || "#f8fafc",
    secondary: payload.branding.secondary_color || "#64748b",
    logo_light_url: payload.branding.logo_light_url,
    logo_dark_url: payload.branding.logo_dark_url,
    footer_logo_url: payload.branding.footer_logo_url,
    favicon_url: payload.branding.favicon_url,
    google_font_heading: payload.branding.google_font_heading,
    google_font_body: payload.branding.google_font_body,
    about_text: payload.institutional.about_text,
    hq_address: payload.general.billing_address ?? {},
    social_instagram: payload.institutional.social_instagram,
    social_facebook: payload.institutional.social_facebook,
    social_website: payload.institutional.social_website,
    layout_id: layoutId,
    storefront_theme_mode: payload.storefront.theme_mode ?? "light",
    storefront_home_config: storefrontHome,
    hero_background_url: payload.storefront.hero_background_url,
    units: payload.units ?? [],
    pricing_plan_slug: "starter",
  };
}
