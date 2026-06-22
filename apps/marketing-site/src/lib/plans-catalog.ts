export interface PlanModuleRow {
  key: string;
  label: string;
  description: string;
  starter: boolean;
  business: boolean;
  enterprise: boolean;
  /** Shown on marketing /planos when module is listed but not yet generally available. */
  comingSoon?: boolean;
}

/** Modules displayed with an «Em breve» badge on the public pricing table. */
export const MARKETING_MODULE_COMING_SOON_KEYS = new Set([
  "icarros_sync",
  "social_media_kit",
]);

export const BASE_INCLUDED_FEATURES = [
  "Vitrine whitelabel com domínio da loja",
  "Painel de estoque (fotos, preço, status) com vitrine sincronizada",
  "Central de contatos: leads da vitrine, simulador e formulários",
  "Atribuição de leads por vendedor e acompanhamento comercial",
  "Tema, logo e identidade visual",
  "Equipe com papéis (gestor, vendedor)",
] as const;

export const PLAN_MODULES: PlanModuleRow[] = [
  {
    key: "finance_simulator",
    label: "Simulador de financiamento",
    description: "Simulação na vitrine e ferramentas no painel.",
    starter: true,
    business: true,
    enterprise: true,
  },
  {
    key: "qr_generator",
    label: "QR Code por veículo",
    description: "QR vinculado ao anúncio para divulgação física e digital.",
    starter: true,
    business: true,
    enterprise: true,
  },
  {
    key: "olx_sync",
    label: "Integração OLX",
    description: "Publicação e baixa de anúncios via OAuth.",
    starter: false,
    business: false,
    enterprise: true,
  },
  {
    key: "webmotors_sync",
    label: "Integração WebMotors",
    description: "Sincronização com portal WebMotors (Sensedia).",
    starter: false,
    business: false,
    enterprise: true,
  },
  {
    key: "icarros_sync",
    label: "Integração iCarros",
    description: "Publicação no portal iCarros quando homologado.",
    starter: false,
    business: false,
    enterprise: true,
    comingSoon: true,
  },
  {
    key: "social_media_kit",
    label: "Kit redes sociais (Meta)",
    description: "Carrosséis e publicação Facebook/Instagram.",
    starter: false,
    business: false,
    enterprise: true,
    comingSoon: true,
  },
  {
    key: "advanced_metrics",
    label: "Métricas avançadas",
    description: "Indicadores extras no painel da loja.",
    starter: true,
    business: true,
    enterprise: true,
  },
  {
    key: "recibo_compra",
    label: "Recibo de compra/venda",
    description: "Emissão de recibo com dados da loja.",
    starter: false,
    business: true,
    enterprise: true,
  },
];

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Essencial",
    tagline: "Presença digital essencial — ideal para até 40 veículos",
    priceLabel: "R$ 197/mês",
  },
  {
    id: "business",
    name: "Profissional",
    tagline: "Recibo de compra/venda e operação média — de 41 a 80 veículos",
    priceLabel: "R$ 397/mês",
  },
  {
    id: "enterprise",
    name: "Completo",
    tagline: "Integrações e escala digital — acima de 80 veículos",
    priceLabel: "R$ 997/mês",
  },
] as const;
