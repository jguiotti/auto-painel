import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Lock,
  MessageCircle,
  Palette,
  Search,
  ShieldCheck,
  Store,
  Users,
  Car,
} from "lucide-react";

export interface MarketingHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const HERO_TRUST_POINTS = [
  "Site e painel exclusivos da sua loja",
  "Estoque e contatos incluídos em todos os planos — sem módulo extra",
  "3 vitrines demo ao vivo para comparar layout",
  "Loja configurada em até 1 dia útil após contratação",
] as const;

/** Core product capabilities included in every plan (not gated by module). */
export const CORE_OPERATION_HIGHLIGHTS: Array<
  MarketingHighlight & { badge: string; bullets: readonly string[] }
> = [
  {
    icon: Car,
    badge: "Incluso em todos os planos",
    title: "Estoque que alimenta a vitrine",
    description:
      "Cadastre veículos uma vez no painel: fotos, preço, status e ficha técnica. Alterou no estoque, o site reflete na hora — sem depender de agência ou planilha paralela.",
    bullets: [
      "Disponível ou vendido — controle claro do pátio",
      "Página pública por veículo com SEO amigável",
      "Dashboard com volume e valor em estoque",
      "Equipe publica no painel; vitrine sincroniza automaticamente",
    ],
  },
  {
    icon: MessageCircle,
    badge: "Incluso em todos os planos",
    title: "Contatos centralizados para escalar vendas",
    description:
      "Interessados da vitrine, simulador de financiamento e formulários chegam organizados no painel. Gestores distribuem; vendedores atendem com contexto do veículo e histórico.",
    bullets: [
      "Status comercial, notas e próximo follow-up",
      "Atribuição por vendedor ou «assumir lead» no time",
      "Tipo contato ou simulação — com veículo vinculado",
      "Menos lead perdido no WhatsApp solto ou planilha",
    ],
  },
];

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
      "Estoque, contatos e vitrine compartilham a mesma base. Módulos extras (simulador, QR, integrações) ampliam — o dia a dia comercial já vem pronto em qualquer plano.",
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

/** Public demo storefronts — one per layout template (layout_id 1–3). Order matches marketing showcase grid. */
export const DEMO_SHOWCASE_STORES = [
  {
    slug: "demo",
    url: "https://demo.autopainel.com.br",
    panelUrl: "https://demo.loja.autopainel.com.br",
    layoutId: 3 as const,
    name: "Layout Moderno",
    tagline: "Cards amplos, tipografia forte e experiência mobile-first.",
    swatches: ["#ffa501", "#f8fafc", "#a06a0e"] as const,
    themeLabel: "Tema escuro",
  },
  {
    slug: "demo-2",
    url: "https://demo-2.autopainel.com.br",
    panelUrl: "https://demo-2.loja.autopainel.com.br",
    layoutId: 1 as const,
    name: "Layout Premium",
    tagline: "Hero de impacto, filtros laterais e vitrine editorial.",
    swatches: ["#b32027", "#f8fafc", "#ca656a"] as const,
    themeLabel: "Tema escuro",
  },
  {
    slug: "demo-3",
    url: "https://demo-3.autopainel.com.br",
    panelUrl: "https://demo-3.loja.autopainel.com.br",
    layoutId: 2 as const,
    name: "Layout Clássico",
    tagline: "Navegação limpa, carrossel de destaques e foco em conversão.",
    swatches: ["#67927d", "#f8fafc", "#14c671"] as const,
    themeLabel: "Tema escuro",
  },
] as const;

export const SHOWCASE_LAYOUT_VARIANTS = DEMO_SHOWCASE_STORES.map((store) => ({
  id: store.layoutId,
  name: store.name,
  description: store.tagline,
  swatches: [...store.swatches],
  url: store.url,
  panelUrl: store.panelUrl,
  slug: store.slug,
  themeLabel: store.themeLabel,
}));
