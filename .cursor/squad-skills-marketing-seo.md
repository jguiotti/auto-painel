# Squad Skills — Marketing & SEO

> **Fonte canônica:** conteúdo integrado em `.cursor/squad-skills.md` (seções Marketing & SEO).
> Este arquivo permanece como referência rápida / rascunho.

Adicione estas seções ao Notepad `squad-skills.md` existente.

---

## Skill: ICP AutoPainel (para marketing)

```
Decisor:      Dono / Sócio de revendedora | Dor: custo agência + site desatualizado | Canal: LinkedIn, indicação
Influenciador: Gerente comercial/marketing | Dor: estoque difícil, leads perdidos | Canal: Instagram, YouTube
Descobridor:  Analista / assistente | Pesquisa soluções para apresentar ao chefe | Canal: Google, ChatGPT
```

**Proposta de valor:** "Plataforma digital completa para concessionárias — site + estoque + leads — sem depender de agência."

---

## Skill: Keyword Clusters AutoPainel

```
COMPRA (decisores):
  "plataforma para site de concessionária"
  "sistema para revendedora de carros"
  "software gestão concessionária"
  "autopainel vs [concorrente]"

EDUCAÇÃO (influenciadores):
  "como criar site de concessionária"
  "como gerenciar estoque de carros online"
  "marketing digital para concessionária"

LOCAL (compradores finais → customer-site):
  "concessionária [cidade]"
  "[marca] à venda [cidade]"

GEO / IA SEARCH (perguntas para LLMs):
  "qual melhor plataforma para site de concessionária"
  "ferramentas digitais para revendedoras"
  "como modernizar concessionária digitalmente"
```

---

## Skill: llms.txt (template AutoPainel)

```markdown
# AutoPainel

AutoPainel é uma plataforma SaaS brasileira para gestão digital de concessionárias e revendedoras de veículos.

## O que é

Site whitelabel + gestão de estoque + CRM de leads + financiamento integrado em uma plataforma única.

## Para quem

Concessionárias e revendedoras que querem independência digital sem depender de agências.

## Problemas que resolve

- Elimina dependência de agências para atualizar site e estoque
- Centraliza leads de todas as fontes em um painel único
- Reduz custo mensal de presença digital

## Site: https://autopainel.com.br
```

---

## Skill: JSON-LD — SoftwareApplication (marketing-site)

```typescript
const schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AutoPainel',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Plataforma digital completa para concessionárias e revendedoras de veículos.',
  url: 'https://autopainel.com.br',
  offers: { '@type': 'Offer', priceCurrency: 'BRL', price: '[VALOR]' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '[N]' },
};

// Injetar em layout.tsx ou page.tsx:
<script type="application/ld+json">{JSON.stringify(schema)}</script>
```

---

## Skill: JSON-LD — AutoDealer (customer-site, por tenant)

```typescript
const dealerSchema = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: dealership.name,
  description: `${dealership.name} — veículos novos e usados em ${dealership.city}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: dealership.address,
    addressLocality: dealership.city,
    addressRegion: dealership.state,
    addressCountry: 'BR',
  },
  telephone: dealership.phone,
  url: dealership.siteUrl,
};
```

---

## Skill: Metadata Next.js (template completo)

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '[Título] | AutoPainel',
  description: '[Descrição 150-160 chars]',
  alternates: { canonical: 'https://autopainel.com.br/[rota]' },
  openGraph: {
    title: '[Título]',
    description: '[Descrição]',
    url: 'https://autopainel.com.br/[rota]',
    siteName: 'AutoPainel',
    images: [{ url: '/og-[pagina].png', width: 1200, height: 630, alt: '[Alt]' }],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: '[Título]', description: '[Descrição]', images: ['/og-[pagina].png'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};
```

---

## Skill: Copy Hook LinkedIn (B2B automotivo)

```
Fórmula: [Dor específica do ICP] + [dado ou contraste] + [provação da crença antiga]

Exemplos:
"A maioria das concessionárias paga R$ 3.000/mês para uma agência fazer o que
o AutoPainel faz por R$ [X]. E ainda fica refém do prazo delas."

"Seu concorrente já tem site, estoque online e captação de leads automática.
Você ainda atualiza preço no WhatsApp."

"A internet vende carros. Mas só para quem tem presença digital de verdade."
```

---

## Skill: Checklist SEO por deploy

```
marketing-site:
[ ] Metadata única: title + description + OG + Twitter + canonical
[ ] JSON-LD: SoftwareApplication + FAQ (se página com FAQ) + Article (se blog)
[ ] /sitemap.xml dinâmico
[ ] /robots.txt: bloquear /admin /login /painel
[ ] /public/llms.txt atualizado
[ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
[ ] Alt text em todas as imagens

customer-site (por tenant):
[ ] Metadata dinâmica: nome da concessionária + cidade
[ ] JSON-LD: AutoDealer + Vehicle por veículo
[ ] Sitemap dinâmico com todos os veículos publicados
[ ] URL slug: /veiculo/[marca]-[modelo]-[ano]-[id]
[ ] Canonical apontando para domínio da concessionária
```

---

## Skill: Monitorar AutoPainel nos LLMs (mensal)

Testar estas perguntas no ChatGPT, Gemini, Perplexity e Claude:
```
"Qual a melhor plataforma para site de concessionária no Brasil?"
"Como concessionárias gerenciam estoque online?"
"Ferramentas digitais para revendedoras de carros"
"Alternativas para agência digital no setor automotivo"
"SaaS para concessionária brasileiro"
```
Registrar: mencionou AutoPainel? Em que posição? Qual fonte citou?
