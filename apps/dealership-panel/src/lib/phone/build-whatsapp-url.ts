/**
 * Builds a wa.me link for Brazilian-style numbers when country code is omitted.
 * Optional `message` becomes the prefilled chat text (URL-encoded).
 */
export function buildWhatsAppUrl(rawPhone: string, message?: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) {
    return "#";
  }

  const withCountry =
    digits.length <= 11 && !digits.startsWith("55") ? `55${digits}` : digits;

  const base = `https://wa.me/${withCountry}`;
  const trimmed = message?.trim();
  if (!trimmed) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(trimmed)}`;
}

/**
 * Default outreach copy for dealership staff (Portuguese UI).
 */
export function buildLeadWhatsAppMessage(params: {
  clientName: string;
  vehicleLabel: string | null;
}): string {
  const vehicle = params.vehicleLabel?.trim();
  if (vehicle) {
    return `Olá ${params.clientName}! Vi seu interesse no ${vehicle} na nossa loja. Posso ajudar com mais detalhes?`;
  }
  return `Olá ${params.clientName}! Vi seu contato pela nossa loja. Posso ajudar?`;
}
