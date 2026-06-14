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
  "Estoque isolado — nenhuma outra concessionária acessa seus dados",
  "Demonstração gratuita em 15 minutos",
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
    title: "Configure a identidade",
    text: "Logo, cores, um dos três layouts e domínio — a vitrine já nasce com cara de marca forte.",
  },
  {
    step: "02",
    title: "Monte a equipe",
    text: "Convide vendedores e gestores. Cada um entra no painel com o acesso que você definir.",
  },
  {
    step: "03",
    title: "Publique e capture leads",
    text: "Estoque no ar, contatos centralizados e SEO trabalhando enquanto sua equipe foca em fechar negócio.",
  },
] as const;

export const GUIOTTI_STOREFRONT_URL = "https://guiotti.autopainel.com.br";

export const SHOWCASE_LAYOUT_VARIANTS = [
  {
    id: 1,
    name: "Layout Premium",
    description: "Hero destacado, filtros laterais e vitrine de alto impacto visual.",
    swatches: ["#C5A059", "#1a1a1a", "#f5f5f4"],
  },
  {
    id: 2,
    name: "Layout Clássico",
    description: "Navegação limpa, grid de veículos e foco na conversão de leads.",
    swatches: ["#2563eb", "#0f172a", "#e2e8f0"],
  },
  {
    id: 3,
    name: "Layout Moderno",
    description: "Cards amplos, tipografia forte e experiência mobile-first.",
    swatches: ["#0891b2", "#18181b", "#fafafa"],
  },
] as const;
