import type { NotificationCenterItem } from "../../components/notification-center";

export const STOREFRONT_LEAD_SOURCES = [
  "vehicle_page",
  "finance_simulator",
  "contact_page",
  "whatsapp_float",
] as const;

export type StorefrontLeadSource = (typeof STOREFRONT_LEAD_SOURCES)[number];

export function isStorefrontLeadSource(source: unknown): source is StorefrontLeadSource {
  return (
    typeof source === "string" &&
    (STOREFRONT_LEAD_SOURCES as readonly string[]).includes(source)
  );
}

const LEAD_SOURCE_LABELS: Record<StorefrontLeadSource, string> = {
  vehicle_page: "Página do veículo",
  finance_simulator: "Simulação de financiamento",
  contact_page: "Página de contato",
  whatsapp_float: "WhatsApp flutuante",
};

export function resolveLeadSourceLabel(source: unknown): string {
  if (isStorefrontLeadSource(source)) {
    return LEAD_SOURCE_LABELS[source];
  }
  return "Vitrine";
}

export function mapDealershipLeadNotification(row: {
  id?: string;
  client_name?: string | null;
  type?: string | null;
  source?: string | null;
  created_at?: string | null;
}): NotificationCenterItem | null {
  if (!isStorefrontLeadSource(row.source)) {
    return null;
  }

  const typeLabel = row.type === "simulation" ? "Simulação" : "Contato";
  const sourceLabel = resolveLeadSourceLabel(row.source);

  return {
    id: row.id ?? crypto.randomUUID(),
    title: row.client_name?.trim() || "Novo interessado",
    subtitle: `${typeLabel} · ${sourceLabel}`,
    href: "/painel/contatos",
    createdAt: row.created_at ?? undefined,
  };
}
