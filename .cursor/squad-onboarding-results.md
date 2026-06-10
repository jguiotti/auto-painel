# Onboarding da Squad — AutoPainel

> Gerado a partir de `.cursor/squad-onboarding.md` (2026-05-27).  
> Fontes: código, migrações, `regras-de-negocio.md`, `documentacao-tecnica.md`, agentes de exploração.

---

## 1. O que é o AutoPainel

SaaS **multitenant** para concessionárias de veículos no Brasil. Cada loja tem vitrine whitelabel (`{slug}.domínio`), painel operacional (estoque, leads, integrações) e plano comercial com módulos opcionais (simulador, QR, classificados, Meta, métricas). A operadora AutoPainel gere tudo no **admin-master**.

---

## 2. Apps e audiências

| App | Porta dev | Audiência | Papel |
| --- | --- | --- | --- |
| `marketing-site` | 3000 | Prospect B2B | Landing, funcionalidades, contato comercial |
| `admin-master` | 3001 | `super_admin` | Concessionárias, planos, módulos, usuários, financeiro plataforma, docs internas |
| `dealership-panel` | 3002 | Owner/manager/seller | Estoque, contatos, dashboard, integrações, QR |
| `customer-site` | 3003 | Comprador final | Vitrine pública por host (3 templates, estoque, PDP, simulador) |

**Monorepo:** Turborepo + `packages/shared` (UI shadcn, Supabase, tipos, tema) + `supabase/migrations/`.

---

## 3. Stack e arquitetura

- **Frontend:** Next.js 16 (Turbopack), React 19, Tailwind v4, shadcn só em `packages/shared`
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Gating:** `saas_modules` → `pricing_plans` / `pricing_plan_modules` → `dealerships.pricing_plan_id` → RPC `effective_feature_keys_for_active_dealership`
- **Tenant:** resolução por `Host` (`resolve_dealership_id_by_host*`), cookie de fallback em dev
- **Idioma:** código em inglês; rotas e UI em pt-BR (`rules/naming-and-language.mdc`)
- **Deploy (planejado):** 4 projetos Vercel (um por app); ainda sem `vercel.json` nem CI no repo

---

## 4. Funcionalidades por app (resumo)

### admin-master
- Dashboard global, CRUD concessionárias (abas: Geral, Vitrine, Plano, Unidades, Equipe, Financeiro)
- Catálogo módulos + planos comerciais
- Provisionamento gestor (`owner`), taxa global simulador, billing operacional por loja
- Documentação interna viva (BZ + técnica)

### dealership-panel
- Auth tenant, dashboard (métricas avançadas gated)
- Estoque CRUD + specs por tipo de veículo + QR/share na visualização
- Contatos/leads com atribuição
- Integrações OLX/WebMotors + Meta (gated)
- Bloqueio `conta-inativa`, erro `/erro/concessionaria`

### customer-site
- Home (template 1/2/3), `/estoque` com filtros, PDP `/veiculo/[slug]`
- `/simular-financiamento` (gated)
- CTAs WhatsApp (sem `/contato`)

### marketing-site
- `/`, `/funcionalidades`, `/contato` (lead → `saas_prospects`)

---

## 5. Módulos SaaS (chaves)

| Chave | Gateia |
| --- | --- |
| `finance_simulator` | Simulador vitrine + fluxos associados |
| `qr_generator` | Lâmina QR no painel |
| `advanced_metrics` | Dashboard métricas no painel |
| `classifieds_sync` | Integrações OLX + WebMotors (uma chave; `olx_sync` removido) |
| `social_media_kit` | OAuth Meta + publicação social |

**Não é módulo de plano:** `layout_id` (templates vitrine), base da vitrine (sempre ativa se loja `active`).

---

## 6. Regras de negócio permanentes (amostra BR)

| ID | Regra |
| --- | --- |
| BR-001 | Gating por módulo: UI e APIs só expõem features presentes em `effective_feature_keys_for_active_dealership` |
| BR-002 | Fluxo comercial: Módulos → Planos → Plano na loja; sem módulos avulsos por concessionária (BZ-CAT-001–006) |
| BR-003 | Vitrine só para `dealerships.status = active` (BZ-TERR-002) |
| BR-004 | Erro de tenant em `/erro/concessionaria` (PT), não 404 genérico (BZ-TERR-001) |
| BR-005 | Dev local: `{slug}.localhost` com `NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN=localhost` |
| BR-006 | Classificados: OAuth popup, tokens cifrados, uma chave `classifieds_sync` para ambos portais |
| BR-007 | Demo: 3 lojas (`guiotti`/`autoprime`/`ecodrive`) com planos e templates distintos (BZ-DEMO-001–012) |
| BR-008 | Contato vitrine via WhatsApp + UTM; sem rota `/contato` no customer-site |

Lista completa: `apps/admin-master/content/internal-docs/regras-de-negocio.md`.

---

## 7. Dívida técnica priorizada

### Crítica
1. Sem CI/CD (lint/build/E2E em PR)
2. Workers assíncronos incompletos (`classifieds_sync_jobs`, `social_publication_jobs`)
3. Tipos Supabase manuais/parciais (sem `gen types`)

### Alta
4. Host resolver fragmentado (muitas migrações de repair)
5. Dual OAuth classificados (platform vs per-dealership apps)
6. Vercel wildcard DNS / produção multi-tenant não validado no repo

### Média
7. Colunas legacy (`enabled_features`, `subscription_plan` vs `pricing_plan_id`)
8. `dealership_units` sem CRUD tenant JWT
9. README raiz desatualizado (usar `AGENTS.md`)
10. 4× `next dev` exige RAM; usar `npm run dev:lite`

---

## 8. Riscos segurança / tenant isolation

- **RLS** presente nas tabelas core; credenciais OAuth com deny-all para JWT
- **RPCs** de vitrine usam implementações `private.*_impl` (hardening parcial)
- **Gap:** E2E não valida cross-tenant (loja A não vê dados de B)
- **Gap:** super_admin bypass amplo — documentado, requer disciplina operacional
- **Checklist:** ver §8.4 em `squad-onboarding.md` — migrations OK, CI ausente, internal-docs vivo

---

## 9. Setup local (novo dev)

```bash
git clone <repo> && cd auto-painel
npm install
cp .env.example .env.local   # preencher Supabase (local ou remoto)
npm run sync:env
npm run supabase:start         # Docker + CLI
npm run supabase:reset         # migrações + seed
npm run seed:demo-users
npm run seed:admin-user        # operador@autopainel.demo
npm run dev:lite               # admin + painel + vitrine (recomendado em 16GB RAM)
npm run dev:warm:lite          # outro terminal, após Ready
```

**URLs demo:** admin `localhost:3001`, painel `guiotti.localhost:3002`, vitrine `guiotti.localhost:3003`.

**E2E:** `npx playwright install chromium` → `E2E_DEALERSHIP_SLUG=guiotti npm run test:e2e`

---

## 10. Próximas fases do onboarding (pendentes de aprofundamento)

| Fase | Agente | Status |
| --- | --- | --- |
| 1 PM | Negócio e produto | ✅ Consolidado acima |
| 2 UX Writer | Inventário de copy por app | ⏳ Rodar em sessão dedicada |
| 3 UX | Mapa de rotas + estados UI | ⏳ Parcial (rotas listadas na Fase 1) |
| 4 Arquiteto | Schema + RPCs | ✅ Ver agente explore (26 tabelas, RPCs listados) |
| 5 Backend | Server actions | ⏳ 12 action files mapeados; auditoria tenant pendente |
| 6 Frontend | Design system compliance | ✅ shadcn só em `packages/shared` (19 componentes) |
| 7 DevOps | Vercel + env + CI | ✅ Documentado; CI ausente |
| 8 QA | E2E + riscos | ✅ 5 specs Playwright; admin CRUD sem E2E |

---

## Referências obrigatórias da squad

- `AGENTS.md` — entrada do monorepo
- `rules/squad-agent-workflow.mdc` — PM → UX → Arch → Frontend → QA
- `rules/internal-docs-living.mdc` — docs vivos com cada entrega
- `packages/shared/docs/` — design system, Supabase, PRD planos/módulos
- `apps/admin-master/content/internal-docs/` — BZ + técnica
