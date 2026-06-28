const DEFAULT_PLATFORM_SUPPORT_WHATSAPP = "5513997435851";

function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return DEFAULT_PLATFORM_SUPPORT_WHATSAPP;
  }
  if (digits.length <= 11 && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  return digits;
}

export function resolvePlatformSupportWhatsAppDigits(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_WHATSAPP?.trim();
  if (fromEnv) {
    return normalizeWhatsAppDigits(fromEnv);
  }
  return DEFAULT_PLATFORM_SUPPORT_WHATSAPP;
}

export function buildPlatformSupportWhatsAppUrl(message: string): string {
  return buildWhatsAppUrlWithDigits(resolvePlatformSupportWhatsAppDigits(), message);
}

export function buildWhatsAppUrlWithDigits(digits: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsAppDigits(digits)}`;
  const trimmed = message?.trim();
  if (!trimmed) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(trimmed)}`;
}

export function buildPlanUpgradeWhatsAppMessage(params: {
  storeName: string;
  storeSlug: string;
  planName: string | null;
  eligibleCount: number;
  maxActiveVehicles: number | null;
  suggestedUpgradeName: string | null;
  optionalMessage?: string | null;
}): string {
  const lines = [
    "Olá! Sou titular/gestor de uma loja na AutoPainel e gostaria de solicitar *upgrade de plano*.",
    "",
    `*Loja:* ${params.storeName} (${params.storeSlug})`,
    `*Plano atual:* ${params.planName ?? "—"}`,
    `*Veículos disponíveis hoje:* ${params.eligibleCount}${
      params.maxActiveVehicles != null ? ` de ${params.maxActiveVehicles}` : ""
    }`,
  ];

  if (params.suggestedUpgradeName) {
    lines.push(`*Plano sugerido:* ${params.suggestedUpgradeName}`);
  }

  const note = params.optionalMessage?.trim();
  if (note) {
    lines.push("", `*Observações:* ${note}`);
  }

  return lines.join("\n");
}

export function buildDealershipSupportWhatsAppMessage(params: {
  storeName: string;
  storeSlug: string;
  categoryLabel: string;
  message: string;
}): string {
  return [
    "Olá! Preciso de suporte no painel AutoPainel.",
    "",
    `*Loja:* ${params.storeName} (${params.storeSlug})`,
    `*Assunto:* ${params.categoryLabel}`,
    "",
    params.message.trim(),
  ].join("\n");
}
