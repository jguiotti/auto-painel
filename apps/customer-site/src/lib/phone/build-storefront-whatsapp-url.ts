import { buildWhatsAppUrl } from "@/lib/phone/build-whatsapp-url";

export interface StorefrontWhatsAppLinkInput {
  phone: string;
  message: string;
  dealershipSlug: string;
  campaign: string;
  content?: string;
}

/**
 * Builds a WhatsApp deep link with prefilled message and UTM params for later marketing attribution.
 */
export function buildStorefrontWhatsAppUrl(input: StorefrontWhatsAppLinkInput): string {
  const baseHref = buildWhatsAppUrl(input.phone, input.message);
  if (baseHref === "#") {
    return baseHref;
  }

  const url = new URL(baseHref);
  url.searchParams.set("utm_source", "vitrine");
  url.searchParams.set("utm_medium", "whatsapp");
  url.searchParams.set("utm_campaign", input.campaign);
  url.searchParams.set("utm_content", input.dealershipSlug);
  if (input.content?.trim()) {
    url.searchParams.set("utm_term", input.content.trim());
  }

  return url.toString();
}
