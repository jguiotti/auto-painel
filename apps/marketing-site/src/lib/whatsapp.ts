const WHATSAPP_DIGITS = "5511974274416";

const DEFAULT_MESSAGE =
  "Olá! Gostaria de saber mais sobre o AutoPainel para minha concessionária.";

export function buildMarketingWhatsAppUrl(message = DEFAULT_MESSAGE): string {
  const base = `https://wa.me/${WHATSAPP_DIGITS}`;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

export const MARKETING_WHATSAPP_DISPLAY = "+55 11 97427-4416";
