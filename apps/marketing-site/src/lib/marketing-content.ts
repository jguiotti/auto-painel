import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Lock,
  Palette,
  Search,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

export interface MarketingHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const HERO_TRUST_POINTS = [
  "Site e painel exclusivos da sua loja",
  "3 vitrines demo ao vivo para comparar layout",
  "Loja configurada em até 1 dia útil após contratação",
] as const;

export const PILLARS: MarketingHighlight[] = [
  {
    icon: Store,
    title: "Site + painel, só da sua loja",
    description:
      "Cada concessionária recebe vitrine pública e painel de gestão próprios. Você administra vendas, estoque e leads em um único lugar — sem compartilhar ambiente com outras revendas.",
  },
  {
    icon: ShieldCheck,
    title: "Estoque blindado por loja",
    description:
      "Arquitetura multitenant com isolamento de dados em cada camada. Sua equipe enxerga apenas o que pertence à sua operação — preços, fotos e contatos ficam protegidos.",
  },
  {
    icon: Users,
    title: "Equipe no seu controle",
    description:
      "O dono cadastra vendedores e gestores com papéis definidos: quem publica veículos, quem atende leads, quem configura a loja. Permissões claras, sem surpresa.",
  },
];

export const DIFFERENTIATORS: MarketingHighlight[] = [
  {
    icon: Palette,
    title: "3 layouts elegantes + sua marca",
    description:
      "Escolha entre três modelos de vitrine, combine tema claro ou escuro, cores, logos e tipografia. O cliente final vê a sua concessionária — não um template genérico de agência.",
  },
  {
    icon: Search,
    title: "SEO pensado para vender carros",
    description:
      "Páginas de veículo com URLs amigáveis, metadados e estrutura preparada para Google. Sua loja compete de igual para igual com quem investe pesado em marketing digital.",
  },
  {
    icon: Globe,
    title: "Domínio próprio ou subdomínio",
    description:
      "Use seu endereço na web (ex.: loja.suaconcessionaria.com.br) ou subdomínio na plataforma. Resolução segura por host — cada visitante cai na vitrine certa.",
  },
  {
    icon: Lock,
    title: "Operação sem planilha solta",
    description:
      "Cadastre veículos uma vez: site, painel e integrações (conforme plano) refletem a mesma informação. Menos retrabalho, menos lead perdido no caminho.",
  },
];

export const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Entre em contato",
    text: "Escolha o plano, confirme o setup e envie logo e cores — nossa equipe assume daqui.",
  },
  {
    step: "02",
    title: "Configuração em 1 dia",
    text: "Montamos vitrine, painel, domínio e importação inicial do estoque. Você recebe acesso treinado.",
  },
  {
    step: "03",
    title: "Publique e venda",
    text: "Estoque no ar, leads centralizados e SEO trabalhando enquanto sua equipe foca em fechar negócio.",
  },
] as const;

/** Public demo storefronts — one per layout template (layout_id 1–3). */
export const DEMO_SHOWCASE_STORES = [
  {
    slug: "demo-2",
    url: "https://demo-2.autopainel.com.br",
    layoutId: 1 as const,
    name: "Layout Premium",
    tagline: "Hero de impacto, filtros laterais e vitrine editorial.",
    swatches: ["#dc2626", "#18181b", "#fafafa"] as const,
    themeLabel: "Tema escuro",
  },
  {
    slug: "demo-3",
    url: "https://demo-3.autopainel.com.br",
    layoutId: 2 as const,
    name: "Layout Clássico",
    tagline: "Navegação limpa, grid de veículos e foco em conversão.",
    swatches: ["#0d9488", "#0f172a", "#e2e8f0"] as const,
    themeLabel: "Tema escuro",
  },
  {
    slug: "demo",
    url: "https://demo.autopainel.com.br",
    layoutId: 3 as const,
    name: "Layout Moderno",
    tagline: "Cards amplos, tipografia forte e experiência mobile-first.",
    swatches: ["#818cf8", "#0f172a", "#111827"] as const,
    themeLabel: "Tema escuro",
  },
] as const;

export const SHOWCASE_LAYOUT_VARIANTS = DEMO_SHOWCASE_STORES.map((store) => ({
  id: store.layoutId,
  name: store.name,
  description: store.tagline,
  swatches: [...store.swatches],
  url: store.url,
  slug: store.slug,
  themeLabel: store.themeLabel,
}));
