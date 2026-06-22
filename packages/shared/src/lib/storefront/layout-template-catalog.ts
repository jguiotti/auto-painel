import type { StorefrontLayoutTemplateId } from "../../types/dealership-storefront";

export interface StorefrontLayoutTemplateMeta {
  id: StorefrontLayoutTemplateId;
  title: string;
  description: string;
  marketingTitle: string;
}

export const STOREFRONT_LAYOUT_TEMPLATES: StorefrontLayoutTemplateMeta[] = [
  {
    id: 1,
    title: "Template 1",
    marketingTitle: "Layout 1 — clássico",
    description:
      "Hero em banner com destaque à esquerda e chamadas para ação ao lado da área principal.",
  },
  {
    id: 2,
    title: "Template 2",
    marketingTitle: "Layout 2 — editorial",
    description:
      "Hero central em destaque; grade de veículos mais ampla em duas colunas no desktop.",
  },
  {
    id: 3,
    title: "Template 3",
    marketingTitle: "Layout 3 — compacto",
    description:
      "Hero central; vitrine em até quatro colunas e área de destaques tipo cards grandes.",
  },
];

export function getStorefrontLayoutTemplateMeta(
  id: StorefrontLayoutTemplateId,
): StorefrontLayoutTemplateMeta {
  return (
    STOREFRONT_LAYOUT_TEMPLATES.find((template) => template.id === id) ??
    STOREFRONT_LAYOUT_TEMPLATES[0]
  );
}
